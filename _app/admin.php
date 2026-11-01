<?php
/* Área do responsável: importação de jogos (.zip) e capas. Incluído só por /admin/. */
defined('SAMUEL') or exit;

const ZIP_MAX_ARQUIVOS = 3000;
const ZIP_MAX_BYTES = 300 * 1024 * 1024;    // 300 MB descompactado

/** Exige família logada + senha confirmada há menos de 30 min. */
function exigir_responsavel(): void
{
    exigir_familia();
    if (!modo_responsavel()) {
        redirecionar('/admin/');
    }
}

function slug_de(string $titulo): string
{
    $t = $titulo;
    if (class_exists('Normalizer')) {
        $t = preg_replace('/\p{Mn}+/u', '', Normalizer::normalize($t, Normalizer::FORM_D));
    } else {
        $t = strtr($t, ['á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'é' => 'e', 'ê' => 'e', 'í' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ç' => 'c',
                        'Á' => 'a', 'À' => 'a', 'Â' => 'a', 'Ã' => 'a', 'É' => 'e', 'Ê' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ô' => 'o', 'Õ' => 'o', 'Ú' => 'u', 'Ç' => 'c']);
    }
    $t = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $t), '-'));
    return substr($t, 0, 48) ?: 'jogo';
}

function apagar_pasta(string $dir): void
{
    if (!is_dir($dir) || is_link($dir)) {
        @unlink($dir);
        return;
    }
    foreach (scandir($dir) ?: [] as $f) {
        if ($f !== '.' && $f !== '..') {
            apagar_pasta($dir . '/' . $f);
        }
    }
    @rmdir($dir);
}

/**
 * Importa um .zip de jogo para $destino com segurança:
 * sem caminhos com "..", sem arquivos ocultos, só extensões da lista branca
 * (nunca .php/.htaccess), limite de tamanho e de quantidade.
 * Se tudo estiver na mesma pasta dentro do zip, essa pasta é “achatada”.
 * @return array{ok:bool, erro?:string, entry?:string, arquivos?:int, ignorados?:array}
 */
function importar_zip(string $zipTmp, string $destino, string $entryPreferido = 'index.html'): array
{
    if (!class_exists('ZipArchive')) {
        return ['ok' => false, 'erro' => 'O servidor não tem suporte a .zip (extensão zip do PHP).'];
    }
    $z = new ZipArchive();
    if ($z->open($zipTmp) !== true) {
        return ['ok' => false, 'erro' => 'Não consegui abrir o arquivo. Ele é mesmo um .zip?'];
    }
    $lista = [];
    $ignorados = [];
    $total = 0;
    for ($i = 0; $i < $z->numFiles; $i++) {
        $st = $z->statIndex($i);
        $nome = str_replace('\\', '/', (string) $st['name']);
        if ($nome === '' || substr($nome, -1) === '/') {
            continue;                                   // pasta
        }
        $partes = explode('/', $nome);
        if ($nome[0] === '/' || strpos($nome, ':') !== false || in_array('..', $partes, true) || in_array('.', $partes, true)) {
            $z->close();
            return ['ok' => false, 'erro' => 'O .zip tem um caminho perigoso (' . $nome . ').'];
        }
        $oculto = false;
        foreach ($partes as $pt) {
            if ($pt === '' || $pt[0] === '.' || $pt === '__MACOSX') {
                $oculto = true;
            }
        }
        if ($oculto) {
            continue;
        }
        $ext = strtolower(pathinfo($nome, PATHINFO_EXTENSION));
        if (!isset(EXTENSOES_JOGO[$ext])) {
            $ignorados[] = $nome;
            continue;
        }
        $total += (int) $st['size'];
        $lista[$i] = $nome;
    }
    if (!$lista) {
        $z->close();
        return ['ok' => false, 'erro' => 'O .zip não tem arquivos de jogo (HTML, JS, imagens, sons…).'];
    }
    if (count($lista) > ZIP_MAX_ARQUIVOS || $total > ZIP_MAX_BYTES) {
        $z->close();
        return ['ok' => false, 'erro' => 'O jogo é grande demais (máximo 3000 arquivos e 300 MB).'];
    }

    // Achata uma pasta única no topo (ex.: meu-jogo/index.html → index.html)
    $prefixo = null;
    foreach ($lista as $n) {
        $p = strpos($n, '/') === false ? '' : substr($n, 0, strpos($n, '/') + 1);
        $prefixo = $prefixo === null ? $p : ($prefixo === $p ? $p : '');
    }
    $prefixo = (string) $prefixo;

    $tmp = $destino . '.novo-' . bin2hex(random_bytes(4));
    if (!@mkdir($tmp, 0700, true)) {
        $z->close();
        return ['ok' => false, 'erro' => 'Não consegui criar a pasta do jogo no servidor.'];
    }
    $rel = [];
    foreach ($lista as $i => $n) {
        $r = $prefixo !== '' ? substr($n, strlen($prefixo)) : $n;
        $alvo = $tmp . '/' . $r;
        if (!is_dir(dirname($alvo))) {
            @mkdir(dirname($alvo), 0700, true);
        }
        $in = $z->getStream($n);
        $out = @fopen($alvo, 'wb');
        if (!$in || !$out) {
            $z->close();
            apagar_pasta($tmp);
            return ['ok' => false, 'erro' => 'Falha ao extrair ' . $n . '.'];
        }
        stream_copy_to_stream($in, $out);
        fclose($in);
        fclose($out);
        $rel[] = $r;
    }
    $z->close();

    // Arquivo inicial: o preferido, senão index.html, senão o único .html da raiz
    $entry = null;
    foreach ([$entryPreferido, 'index.html', 'index.htm'] as $cand) {
        if ($cand !== '' && in_array($cand, $rel, true)) {
            $entry = $cand;
            break;
        }
    }
    if (!$entry) {
        $htmls = array_values(array_filter($rel, function ($r) {
            return strpos($r, '/') === false && preg_match('/\.html?$/i', $r);
        }));
        $entry = count($htmls) === 1 ? $htmls[0] : null;
    }
    if (!$entry) {
        apagar_pasta($tmp);
        return ['ok' => false, 'erro' => 'Não achei o arquivo inicial do jogo (index.html) no .zip.'];
    }

    // Troca a versão antiga pela nova de uma vez só
    $velho = $destino . '.velho-' . bin2hex(random_bytes(4));
    if (is_dir($destino) && !@rename($destino, $velho)) {
        apagar_pasta($tmp);
        return ['ok' => false, 'erro' => 'Não consegui substituir a versão anterior.'];
    }
    if (!@rename($tmp, $destino)) {
        if (is_dir($velho)) {
            @rename($velho, $destino);
        }
        apagar_pasta($tmp);
        return ['ok' => false, 'erro' => 'Não consegui instalar o jogo.'];
    }
    apagar_pasta($velho);
    return ['ok' => true, 'entry' => $entry, 'arquivos' => count($rel), 'ignorados' => $ignorados];
}

/** Recorta no centro para 16:9 e grava 1200×675 (WebP, ou JPEG se o servidor não tiver WebP). */
function salvar_capa(string $tmp, string $slug): array
{
    $info = @getimagesize($tmp);
    if (!$info || !in_array($info[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG, IMAGETYPE_WEBP, IMAGETYPE_GIF], true)) {
        return ['ok' => false, 'erro' => 'A capa precisa ser uma imagem PNG, JPG, WebP ou GIF.'];
    }
    if (!function_exists('imagecreatefromstring')) {
        return ['ok' => false, 'erro' => 'O servidor não tem suporte a imagens (GD).'];
    }
    $img = @imagecreatefromstring((string) file_get_contents($tmp));
    if (!$img) {
        return ['ok' => false, 'erro' => 'Não consegui ler a imagem da capa.'];
    }
    [$w, $h] = [imagesx($img), imagesy($img)];
    $alvoR = 1200 / 675;
    if ($w / $h > $alvoR) {
        $cw = (int) round($h * $alvoR);
        $ch = $h;
        $cx = (int) (($w - $cw) / 2);
        $cy = 0;
    } else {
        $cw = $w;
        $ch = (int) round($w / $alvoR);
        $cx = 0;
        $cy = (int) (($h - $ch) / 2);
    }
    $nova = imagecreatetruecolor(1200, 675);
    imagecopyresampled($nova, $img, 0, 0, $cx, $cy, 1200, 675, $cw, $ch);
    $dir = pasta_dados() . '/capas';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    @unlink($dir . '/' . $slug . '.webp');
    @unlink($dir . '/' . $slug . '.jpg');
    $ok = function_exists('imagewebp')
        ? imagewebp($nova, $dir . '/' . $slug . '.webp', 82)
        : imagejpeg($nova, $dir . '/' . $slug . '.jpg', 85);
    imagedestroy($img);
    imagedestroy($nova);
    return $ok ? ['ok' => true] : ['ok' => false, 'erro' => 'Não consegui salvar a capa.'];
}
