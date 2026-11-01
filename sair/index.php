<?php
// Esquece o explorador escolhido e fecha a área do responsável neste aparelho.
require dirname(__DIR__) . '/_app/inicio.php';
sem_cache();
encerrar_sessao();
setcookie(COOKIE_PERFIL, '', ['expires' => time() - 3600, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax']);
redirecionar('/');
