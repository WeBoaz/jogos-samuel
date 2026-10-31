<?php
// Só para testar no computador: php -S localhost:8770 ferramentas/roteador-local.php
// Imita as regras do .htaccess (o servidor embutido do PHP não lê .htaccess).
$u = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$raiz = dirname(__DIR__);
if (preg_match('#^/(_app|_privado|kit|ferramentas)(/|$)#', $u) || preg_match('#/\.#', $u) || preg_match('#\.(md|json|sh|py)$#', $u)) {
    http_response_code(403); echo 'Proibido'; return true;
}
if (preg_match('#^/jogo/(.+)$#', $u, $m)) { $_GET['f'] = urldecode($m[1]); require $raiz . '/jogo.php'; return true; }
if (preg_match('#^/dragoes-e-blocos/?$#', $u)) { header('Location: /jogar/?jogo=dragoes-e-blocos', true, 301); return true; }
$f = $raiz . $u;
if (is_dir($f) && is_file(rtrim($f, '/') . '/index.php')) { chdir($f); require rtrim($f, '/') . '/index.php'; return true; }
if (is_file($f)) { return false; }
require $raiz . '/404.php'; return true;
