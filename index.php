<?php
require __DIR__ . '/_app/inicio.php';
$logado = true;   // acesso livre: todo mundo vai direto para os jogos
$cta = '/jogos/';
$ctaTexto = 'Jogar agora';
cabecalho(['home' => true]);
?>
<section class="wrap hero">
  <div>
    <div class="eyebrow badge"><span aria-hidden="true">✦</span> Feito em família. Jogado com alegria.</div>
    <h1>Aperte o play<br>na <span class="highlight">imaginação.</span></h1>
    <p class="lead">Um mundo de blocos, descobertas e jogos feitos pelo papai. A próxima aventura começa com você.</p>
    <div class="hero-actions">
      <a class="btn" href="<?= $cta ?>"><span aria-hidden="true">▶</span> <?= $ctaTexto ?></a>
      <a class="textlink" href="#mundos">Espiar os mundos ↓</a>
    </div>
    <p class="little-note"><span aria-hidden="true">♡</span> Criado com carinho, um bloco de cada vez.</p>
  </div>
  <div class="hero-art">
    <div class="window">
      <div class="titlebar"><span>nosso_universo.exe</span><span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span></div>
      <img src="/assets/img/universo.webp" srcset="/assets/img/universo-960.webp 960w, /assets/img/universo.webp 1536w" sizes="(max-width:760px) 100vw, 55vw" alt="Samuel e sua irmã como exploradores de blocos, com um Jack Russell e um gato amarelo em uma ilha flutuante." width="1536" height="1024" fetchpriority="high">
      <div class="window-foot"><span><span class="green">●</span> MODO AVENTURA: ON</span><span>100% imaginação</span></div>
    </div>
    <span class="sticker">PLAYER 1 + PLAYER 2 + PETS!</span>
  </div>
</section>

<div class="ticker" aria-hidden="true"><div class="wrap"><span>✦ Mundos para explorar</span><b>·</b><span>▣ Ideias para construir</span><b>·</b><span>♡ Memórias para guardar</span></div></div>

<section class="wrap section" id="mundos">
  <div class="section-head">
    <div><span class="kicker">Seleção de mundos / prévia</span><h2>Qual vai ser a<br>aventura de hoje?</h2></div>
    <p>Uma espiadinha no que este universo guarda. Escolha e jogue!</p>
  </div>
  <div class="game-grid">
<?php
$lista = array_slice(jogos(), 0, 3);
if (!$lista) {
    echo '<div class="empty"><h3>O papai está preparando os primeiros mundos.</h3></div>';
}
foreach ($lista as $g) {
    echo card_jogo($g, 'home', $logado), "\n";
}
?>
  </div>
  <p class="section-note">* Mundos marcados como “em breve” ainda estão sendo construídos pelo papai.</p>
</section>

<section class="about" id="universo">
  <div class="wrap about-inner">
    <div class="mascot-space"><span class="mascot-label">NOSSA TURMA.EXE</span><img src="/assets/img/turma.webp" alt="A dupla de exploradores com seu Jack Russell e seu gato amarelo." width="800" height="800" loading="lazy"></div>
    <div>
      <span class="kicker">Uma ideia do papai. Um universo nosso.</span>
      <h2>Os melhores mundos<br>a gente inventa junto.</h2>
      <p>Tudo começou com uma vontade: criar jogos para brincar com o Samuel. Aí vieram os blocos, as aventuras, a irmã, os bichinhos… e um cantinho só nosso na internet.</p>
      <p>Aqui, cada jogo é um convite para descobrir, tentar de novo e soltar a imaginação.</p>
      <div class="about-sign"><span class="heart" aria-hidden="true">♥</span><span>Feito pelo papai.<br>Para os nossos pequenos exploradores.</span></div>
    </div>
  </div>
</section>

<section class="wrap section">
  <span class="kicker">Manual do pequeno explorador</span>
  <h2>Pronto? É só dar o play.</h2>
  <div class="steps">
    <div class="step"><span class="num">01</span><h3>Entre no seu universo</h3><p>Abra o portal e escolha seu explorador: Samuel ou Player 2.</p></div>
    <div class="step"><span class="num">02</span><h3>Escolha um mundo</h3><p>Encontre uma aventura que combine com a sua curiosidade.</p></div>
    <div class="step"><span class="num">03</span><h3>Brinque do seu jeito</h3><p>Descubra, invente e divirta-se. A graça é explorar!</p></div>
  </div>
</section>

<div class="wrap"><section class="final-cta"><div><span class="kicker">Seu próximo mundo está te esperando</span><h2>Vamos nessa, explorador?</h2><p>Uma nova aventura começa com um clique.</p></div><a class="btn secondary" href="<?= $cta ?>">Vamos jogar <span aria-hidden="true">▶</span></a></section></div>
<?php rodape();
