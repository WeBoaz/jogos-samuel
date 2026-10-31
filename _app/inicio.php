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

function gravar_sessao(?string $perfil): void
{
    $c = config();
    $d = ['f' => 1, 'p' => $perfil, 'v' => $c['versao'] ?? 1, 'exp' => time() + DIAS_SESSAO * 86400];
    $p = b64u((string) json_encode($d));
    $token = $p . '.' . b64u(hash_hmac('sha256', $p, $c['segredo'], true));
    setcookie(COOKIE_SESSAO, $token, [
        'expires' => $d['exp'], 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    $_COOKIE[COOKIE_SESSAO] = $token;
}

function encerrar_sessao(): void
{
    setcookie(COOKIE_SESSAO, '', [
        'expires' => time() - 3600, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    unset($_COOKIE[COOKIE_SESSAO]);
}

/** Página privada: exige a família logada. */
function exigir_familia(): array
{
    sem_cache();
    $s = sessao();
    if (!$s) {
        redirecionar('/entrar/?voltar=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/jogos/'));
    }
    return $s;
}

/** Página privada que também precisa de um explorador escolhido. */
function exigir_perfil(): array
{
    $s = exigir_familia();
    $p = perfil((string) ($s['p'] ?? ''));
    if (!$p) {
        redirecionar('/exploradores/?voltar=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/jogos/'));
    }
    return $p;
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
function jogos(): array
{
    static $j = null;
    if ($j === null) {
        $d = json_decode((string) @file_get_contents(__DIR__ . '/jogos.json'), true);
        $j = is_array($d['games'] ?? null) ? $d['games'] : [];
    }
    return $j;
}

function jogo(string $slug): ?array
{
    foreach (jogos() as $g) {
        if (($g['slug'] ?? '') === $slug) {
            return $g;
        }
    }
    return null;
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
