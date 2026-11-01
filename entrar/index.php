<?php
// O acesso aos jogos é livre: quem vinha para cá vai direto para a biblioteca.
require dirname(__DIR__) . '/_app/inicio.php';
redirecionar(destino_seguro($_GET['voltar'] ?? null, '/jogos/'));
