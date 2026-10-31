<?php
require __DIR__ . '/_app/inicio.php';
http_response_code(404);
cabecalho(['titulo' => 'Mundo não encontrado — Samuel.tech', 'privado' => true]);
?>
<section class="wrap state">
  <span class="kicker">erro_404.exe</span>
  <h1>Esse mundo ainda não foi descoberto.</h1>
  <p>O caminho que você seguiu não leva a lugar nenhum… ainda!</p>
  <a class="btn" href="/">← Voltar ao início</a>
</section>
<?php rodape();
