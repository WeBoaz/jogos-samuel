<?php
require dirname(__DIR__) . '/_app/inicio.php';
$p = exigir_perfil();
cabecalho(['titulo' => 'Meus mundos — Samuel.tech', 'privado' => true]);
$lista = jogos();
?>
<section class="wrap" data-biblioteca data-perfil="<?= e($p['id']) ?>">
  <div class="library-head">
    <span class="kicker">Meu cantinho / biblioteca</span>
    <h1 style="font-size:clamp(34px,5vw,58px)">Olá, <?= e($p['nome']) ?>!</h1>
    <p>Escolha um mundo. A imaginação faz o resto.</p>
    <div class="library-bar">
      <div class="filters" aria-label="Filtrar jogos"><button class="filter" type="button" data-filter="all" aria-pressed="true">Todos os mundos</button><button class="filter" type="button" data-filter="favorite" aria-pressed="false">★ Favoritos</button></div>
      <input id="search" class="search" type="search" aria-label="Buscar jogos" placeholder="Buscar um mundo…">
    </div>
  </div>
  <div class="library-content">
    <div id="library-games" class="game-grid">
<?php if (!$lista): ?>
      <div class="empty"><h3>O papai está preparando os primeiros mundos.</h3><p>Volte logo para ver as novidades!</p></div>
<?php endif; ?>
<?php foreach ($lista as $g) { echo card_jogo($g, 'biblioteca', true), "\n"; } ?>
      <div class="empty" id="vazio" hidden><h3>Nenhum mundo por aqui ainda.</h3><p>Experimente outra busca ou marque um jogo com a estrela.</p></div>
    </div>
    <p class="section-note">Mundos “em breve” ainda estão sendo construídos pelo papai.</p>
  </div>
</section>
<?php rodape();
