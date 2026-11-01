<?php
/* ==========================================================================
   samuel.tech — núcleo do servidor (PHP 7.4+ / 8.x, sem dependências)
   --------------------------------------------------------------------------
   • Senha da família: hash bcrypt num arquivo FORA da pasta pública
     (…/domains/samuel.tech/samuel-config.php), criado no primeiro acesso.
   • Sessão: cookie HttpOnly assinado com HMAC-SHA256 (segredo do arquivo
     acima). Vale 180 dias no aparelho. Trocar a senha derruba todas.
   • Páginas privadas e arquivos dos jogos só respondem com sessão válida.
   ========================================================================== */
declare(strict_types=1);
define('SAMUEL', true);
define('RAIZ', dirname(__DIR__));          // pasta pública (public_html)

require __DIR__ . '/config-publica.php';

const COOKIE_SESSAO = 'samuel_sessao';
const DIAS_SESSAO = 180;
const MAX_TENTATIVAS = 8;                  // erros de senha por IP…
const JANELA_TENTATIVAS = 900;             // …a cada 15 minutos

/* ---------- Configuração privada ---------------------------------------- */
function caminho_config(): string
{
    $env = getenv('SAMUEL_CONFIG');
    return $env ?: dirname(RAIZ) . '/samuel-config.php';
}

function config(bool $recarregar = false): ?array
{
    static $c = false;
    if ($c === false || $recarregar) {
        $f = caminho_config();
        $c = is_file($f) ? (include $f) : null;
        if (!is_array($c) || empty($c['senha_hash']) || empty($c['segredo'])) {
            $c = null;
        }
    }
    return $c;
}

function salvar_config(array $c): bool
{
    $f = caminho_config();
    $php = "<?php\n// samuel.tech — configuração PRIVADA (fora da pasta pública). Não compartilhe.\n"
         . "// Apagar este arquivo libera de novo o primeiro acesso (com o código de configuração).\n"
         . 'return ' . var_export($c, true) . ";\n";
    $ok = @file_put_contents($f, $php, LOCK_EX) !== false;
    if ($ok) {
        @chmod($f, 0600);
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($f, true);
        }
    }
    return $ok;
}

/* ---------- Utilidades --------------------------------------------------- */
function e($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');
}

function redirecionar(string $para): void
{
    header('Location: ' . $para, true, 303);
    exit;
}

/** Só aceita caminhos internos (evita redirecionar para outro site). */
function destino_seguro(?string $v, string $padrao = '/jogos/'): string
{
    $v = (string) $v;
    if ($v === '' || $v[0] !== '/' || strpos($v, '//') === 0 || strpbrk($v, "\\\r\n") !== false) {
        return $padrao;
    }
    return $v;
}

function sem_cache(): void
{
    header('Cache-Control: no-store, private');
    header('X-Robots-Tag: noindex, nofollow');
}

function b64u(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64u_dec(string $s): string
{
    return (string) base64_decode(strtr($s, '-_', '+/'));
}

/* ---------- Sessão assinada ---------------------------------------------- */
function sessao(): ?array
{
    $c = config();
    $t = $_COOKIE[COOKIE_SESSAO] ?? '';
    if (!$c || !is_string($t) || substr_count($t, '.') !== 1) {
        return null;
    }
    [$p, $s] = explode('.', $t);
    $esperado = b64u(hash_hmac('sha256', $p, $c['segredo'], true));
    if (!hash_equals($esperado, $s)) {
        return null;
    }
    $d = json_decode(b64u_dec($p), true);
    if (!is_array($d) || ($d['exp'] ?? 0) < time() || ($d['v'] ?? -1) !== ($c['versao'] ?? 1)) {
        return null;
    }
    return $d;
}

/**
 * @param ?string $perfil  explorador escolhido (ou null)
 * @param ?int    $adm     validade do “modo responsável” (timestamp); null = mantém o atual
 */
function gravar_sessao(?string $perfil, ?int $adm = null): void
{
    $c = config();
    if ($adm === null) {
        $atual = sessao();
        $adm = (int) ($atual['adm'] ?? 0);
    }
    $d = ['f' => 1, 'p' => $perfil, 'v' => $c['versao'] ?? 1, 'exp' => time() + DIAS_SESSAO * 86400];
    if ($adm > time()) {
        $d['adm'] = $adm;
    }
    $p = b64u((string) json_encode($d));
    $token = $p . '.' . b64u(hash_hmac('sha256', $p, $c['segredo'], true));
    setcookie(COOKIE_SESSAO, $token, [
        'expires' => $d['exp'], 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    $_COOKIE[COOKIE_SESSAO] = $token;
}

/** O responsável confirmou a senha há menos de 30 minutos? */
function modo_responsavel(): bool
{
    $s = sessao();
    return $s && (int) ($s['adm'] ?? 0) > time();
}

/** Token contra envio de formulário por outro site (área do responsável). */
function token_csrf(): string
{
    $c = config();
    $s = sessao();
    return hash_hmac('sha256', 'csrf|' . ($s['exp'] ?? 0) . '|' . ($s['adm'] ?? 0), $c['segredo'] ?? '');
}

function conferir_csrf(): bool
{
    return hash_equals(token_csrf(), (string) ($_POST['csrf'] ?? ''));
}

function encerrar_sessao(): void
{
    setcookie(COOKIE_SESSAO, '', [
        'expires' => time() - 3600, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    unset($_COOKIE[COOKIE_SESSAO]);
}

/* ---------- Acesso da família: livre (sem senha) ------------------------
   Os jogos abrem direto. A senha só existe para a área do responsável (/admin).
   O explorador (Samuel / Player 2) fica num cookie simples: serve só para
   separar os favoritos, não é proteção de nada. */
const COOKIE_PERFIL = 'samuel_perfil';

function perfil_escolhido(): ?array
{
    return perfil((string) ($_COOKIE[COOKIE_PERFIL] ?? ''));
}

function perfil_atual(): array
{
    return perfil_escolhido() ?: perfis()[0];
}

function escolher_perfil(string $id): void
{
    setcookie(COOKIE_PERFIL, $id, [
        'expires' => time() + 365 * 86400, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    $_COOKIE[COOKIE_PERFIL] = $id;
}

/** Antes exigia a senha da família; agora o acesso aos jogos é livre. */
function exigir_familia(): array
{
    sem_cache();
    return sessao() ?: [];
}

function exigir_perfil(): array
{
    sem_cache();
    return perfil_atual();
}

/* ---------- Proteção contra tentativa e erro de senha -------------------- */
function arquivo_tentativas(): string
{
    return dirname(caminho_config()) . '/samuel-tentativas.json';
}

function chave_ip(): string
{
    return substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '?') . (config()['segredo'] ?? 'x')), 0, 16);
}

function bloqueado(): bool
{
    $t = json_decode((string) @file_get_contents(arquivo_tentativas()), true) ?: [];
    $r = $t[chave_ip()] ?? null;
    return $r && $r['n'] >= MAX_TENTATIVAS && time() - $r['t'] < JANELA_TENTATIVAS;
}

function registrar_tentativa(bool $acertou): void
{
    $f = arquivo_tentativas();
    $t = json_decode((string) @file_get_contents($f), true) ?: [];
    foreach ($t as $k => $r) {                       // limpa registros velhos
        if (time() - ($r['t'] ?? 0) > JANELA_TENTATIVAS) {
            unset($t[$k]);
        }
    }
    $k = chave_ip();
    if ($acertou) {
        unset($t[$k]);
    } else {
        $t[$k] = ['n' => ($t[$k]['n'] ?? 0) + 1, 't' => $t[$k]['t'] ?? time()];
    }
    @file_put_contents($f, json_encode($t), LOCK_EX);
}

/* ---------- Catálogo e perfis -------------------------------------------- */
// Dois catálogos somados:
//  • “site”: _app/jogos.json + arquivos em _privado/jogos/ (vem do repositório)
//  • “responsável”: cadastrados em /admin. Ficam em samuel-dados/ FORA da pasta
//    pública (ao lado do samuel-config.php), então sobrevivem às publicações.
const STATUS_VISIVEIS = ['pronto', 'em-breve'];
const STATUS_TODOS = ['rascunho', 'pronto', 'em-breve', 'arquivado'];
const EXTENSOES_JOGO = [
    'html' => 'text/html; charset=utf-8', 'htm' => 'text/html; charset=utf-8',
    'js' => 'text/javascript; charset=utf-8', 'mjs' => 'text/javascript; charset=utf-8',
    'css' => 'text/css; charset=utf-8', 'json' => 'application/json', 'txt' => 'text/plain; charset=utf-8',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
    'webp' => 'image/webp', 'svg' => 'image/svg+xml', 'ico' => 'image/x-icon',
    'mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg', 'wav' => 'audio/wav', 'm4a' => 'audio/mp4',
    'mp4' => 'video/mp4', 'webm' => 'video/webm',
    'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
    'wasm' => 'application/wasm', 'data' => 'application/octet-stream', 'bin' => 'application/octet-stream',
    'pck' => 'application/octet-stream', 'glb' => 'model/gltf-binary', 'gltf' => 'model/gltf+json',
    'atlas' => 'text/plain; charset=utf-8', 'fnt' => 'text/plain; charset=utf-8', 'xml' => 'application/xml',
];

function pasta_dados(): string
{
    return dirname(caminho_config()) . '/samuel-dados';
}

function catalogo_responsavel(): array
{
    $d = json_decode((string) @file_get_contents(pasta_dados() . '/catalogo.json'), true);
    return [
        'games' => is_array($d['games'] ?? null) ? $d['games'] : [],
        'status_site' => is_array($d['status_site'] ?? null) ? $d['status_site'] : [],   // status trocado dos jogos do site
    ];
}

function salvar_catalogo_responsavel(array $d): bool
{
    $dir = pasta_dados();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        return false;
    }
    $ok = @file_put_contents($dir . '/catalogo.json', json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) !== false;
    jogos_todos(true);
    return $ok;
}

/** Todos os jogos, de qualquer status. Cada um ganha 'origem' => 'site' | 'responsavel'. */
function jogos_todos(bool $recarregar = false): array
{
    static $j = null;
    if ($j === null || $recarregar) {
        $d = json_decode((string) @file_get_contents(__DIR__ . '/jogos.json'), true);
        $site = is_array($d['games'] ?? null) ? $d['games'] : [];
        $resp = catalogo_responsavel();
        $j = [];
        $vistos = [];
        foreach ($resp['games'] as $g) {             // os do responsável aparecem primeiro (mais novos)
            $g['origem'] = 'responsavel';
            $j[] = $g;
            $vistos[$g['slug']] = true;
        }
        foreach ($site as $g) {
            if (isset($vistos[$g['slug']])) {
                continue;
            }
            $g['origem'] = 'site';
            if (isset($resp['status_site'][$g['slug']]) && in_array($resp['status_site'][$g['slug']], STATUS_TODOS, true)) {
                $g['status'] = $resp['status_site'][$g['slug']];
            }
            $j[] = $g;
        }
    }
    return $j;
}

/** Jogos que a família vê (pronto + em breve). */
function jogos(): array
{
    return array_values(array_filter(jogos_todos(), function ($g) {
        return in_array($g['status'] ?? '', STATUS_VISIVEIS, true);
    }));
}

function jogo(string $slug): ?array
{
    foreach (jogos_todos() as $g) {
        if (($g['slug'] ?? '') === $slug) {
            return $g;
        }
    }
    return null;
}

/** Pasta dos arquivos do jogo no servidor. */
function pasta_jogo(array $g): string
{
    return ($g['origem'] ?? 'site') === 'responsavel'
        ? pasta_dados() . '/jogos/' . $g['slug']
        : RAIZ . '/_privado/jogos/' . $g['slug'];
}

/** A família pode abrir este jogo agora? (rascunho/arquivado só no modo responsável) */
function jogo_jogavel(array $g): bool
{
    $st = $g['status'] ?? '';
    $existe = is_file(pasta_jogo($g) . '/' . ($g['entry'] ?? 'index.html'));
    return $existe && ($st === 'pronto' || (in_array($st, ['rascunho', 'arquivado'], true) && modo_responsavel()));
}

/** Arquivo da capa de um jogo do responsável (.webp ou .jpg), ou null. */
function capa_arquivo(string $slug): ?string
{
    foreach (['webp', 'jpg'] as $ext) {
        $f = pasta_dados() . '/capas/' . $slug . '.' . $ext;
        if (is_file($f)) {
            return $f;
        }
    }
    return null;
}

function capa_url(array $g): string
{
    if (($g['origem'] ?? 'site') === 'responsavel') {
        $f = capa_arquivo($g['slug']);
        return $f ? '/capa.php?j=' . rawurlencode($g['slug']) . '&v=' . filemtime($f) : '/assets/img/ilha-dos-blocos.webp';
    }
    return !empty($g['cover']) ? '/assets/img/' . $g['cover'] : '/assets/img/ilha-dos-blocos.webp';
}

function perfis(): array
{
    return require __DIR__ . '/perfis.php';
}

function perfil(string $id): ?array
{
    foreach (perfis() as $p) {
        if ($p['id'] === $id) {
            return $p;
        }
    }
    return null;
}

require __DIR__ . '/layout.php';
