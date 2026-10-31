<?php
require dirname(__DIR__) . '/_app/inicio.php';
$p = exigir_perfil();
$g = jogo((string) ($_GET['jogo'] ?? ''));

if (!$g || ($g['status'] ?? '') !== 'pronto' || !is_file(RAIZ . '/_privado/jogos/' . $g['slug'] . '/' . ($g['entry'] ?? 'index.html'))) {
    http_response_code(404);
    cabecalho(['titulo' => 'Mundo não encontrado — Samuel.tech', 'privado' => true]);
    echo '<section class="wrap state"><span class="kicker">erro_404.exe</span><h1>Esse mundo ainda não foi descoberto.</h1>'
       . '<p>Talvez ele ainda esteja sendo construído. Que tal escolher outro?</p><a class="btn" href="/jogos/">← Voltar à biblioteca</a></section>';
    rodape();
    exit;
}

$src = '/jogo/' . rawurlencode($g['slug']) . '/' . ($g['entry'] ?? 'index.html');
cabecalho(['titulo' => $g['title'] . ' — Samuel.tech', 'privado' => true]);
?>
<section class="wrap player">
  <div class="player-bar">
    <div><span class="kicker"><?= e(strtoupper((string) $g['category'])) ?> / jogando como <?= e($p['nome']) ?></span><h1><?= e($g['title']) ?></h1></div>
    <div class="player-tools">
      <a class="btn secondary small" href="/jogos/">← Biblioteca</a>
      <button class="btn secondary small" type="button" data-recomecar>↻ Recomeçar</button>
      <button class="btn small" type="button" data-tela-cheia hidden>⛶ Tela cheia</button>
    </div>
  </div>
  <div class="player-frame" id="moldura">
    <div class="titlebar"><span><?= e($g['slug']) ?>.exe</span><span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span></div>
    <iframe id="jogo" src="<?= e($src) ?>" title="<?= e($g['title']) ?>" allow="fullscreen; autoplay" allowfullscreen></iframe>
  </div>
<?php if (!empty($g['instructions'])): ?>
  <div class="player-help"><strong>Como jogar</strong><ul>
<?php foreach ($g['instructions'] as $i): ?>    <li><?= e($i) ?></li>
<?php endforeach; ?>
  </ul></div>
<?php endif; ?>
</section>
<?php rodape();
