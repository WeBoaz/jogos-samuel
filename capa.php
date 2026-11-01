<?php
/* Capas dos jogos cadastrados pelo responsável (guardadas fora da pasta pública).
   Públicas só quando o jogo aparece para a família (pronto/em breve). */
require __DIR__ . '/_app/inicio.php';

$slug = (string) ($_GET['j'] ?? '');
$g = preg_match('/^[a-z0-9-]+$/', $slug) ? jogo($slug) : null;
$f = $g ? (string) capa_arquivo($slug) : '';
if (!$g || ($g['origem'] ?? '') !== 'responsavel' || !is_file($f)
    || (!in_array($g['status'] ?? '', STATUS_VISIVEIS, true) && !modo_responsavel())) {
    http_response_code(404);
    exit;
}
header('Content-Type: ' . (substr($f, -4) === 'webp' ? 'image/webp' : 'image/jpeg'));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=86400');
header('Content-Length: ' . filesize($f));
readfile($f);
