<?php
/* Entrega os arquivos dos jogos (que ficam em _privado/jogos/) SOMENTE
   para quem está com a sessão da família. URL: /jogo/<slug>/<arquivo>
   (o .htaccess reescreve para jogo.php?f=<slug>/<arquivo>). */
require __DIR__ . '/_app/inicio.php';

$caminho = (string) ($_GET['f'] ?? ($_SERVER['PATH_INFO'] ?? ''));
$caminho = ltrim($caminho, '/');

function negar(int $codigo, string $texto): void
{
    http_response_code($codigo);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo '<!doctype html><meta charset="utf-8"><body style="font:18px Arial,sans-serif;padding:32px;background:#f5f2e8;color:#193337">'
       . $texto . ' <a href="/entrar/" target="_top" style="color:#326344">Entrar para jogar</a></body>';
    exit;
}

if (!sessao()) {
    negar(403, 'Este mundo é só para a família.');
}

$partes = explode('/', $caminho);
$slug = array_shift($partes);
if (!preg_match('/^[a-z0-9-]+$/', (string) $slug) || !jogo($slug) || (jogo($slug)['status'] ?? '') !== 'pronto') {
    negar(404, 'Esse mundo ainda não foi descoberto.');
}
foreach ($partes as $p) {
    if ($p === '' || $p === '.' || $p === '..' || $p[0] === '.') {
        negar(404, 'Arquivo não encontrado.');
    }
}

$base = realpath(RAIZ . '/_privado/jogos/' . $slug);
$arq = $partes ? realpath($base . '/' . implode('/', $partes)) : false;
if (!$base || !$arq || strpos($arq, $base . DIRECTORY_SEPARATOR) !== 0 || !is_file($arq)) {
    negar(404, 'Arquivo não encontrado.');
}

$tipos = [
    'html' => 'text/html; charset=utf-8', 'htm' => 'text/html; charset=utf-8',
    'js' => 'text/javascript; charset=utf-8', 'mjs' => 'text/javascript; charset=utf-8',
    'css' => 'text/css; charset=utf-8', 'json' => 'application/json', 'txt' => 'text/plain; charset=utf-8',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
    'webp' => 'image/webp', 'svg' => 'image/svg+xml', 'ico' => 'image/x-icon',
    'mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg', 'wav' => 'audio/wav', 'm4a' => 'audio/mp4',
    'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf',
    'wasm' => 'application/wasm', 'data' => 'application/octet-stream', 'bin' => 'application/octet-stream',
    'glb' => 'model/gltf-binary', 'gltf' => 'model/gltf+json',
];
$ext = strtolower(pathinfo($arq, PATHINFO_EXTENSION));
if (!isset($tipos[$ext])) {
    negar(404, 'Arquivo não encontrado.');   // .php e desconhecidos nunca são entregues
}

header('Content-Type: ' . $tipos[$ext]);
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: ' . (in_array($ext, ['html', 'htm'], true) ? 'private, no-cache' : 'private, max-age=3600'));
header('Content-Length: ' . filesize($arq));
readfile($arq);
