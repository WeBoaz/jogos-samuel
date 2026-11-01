<?php
require dirname(__DIR__) . '/_app/inicio.php';
sem_cache();
$voltar = destino_seguro($_GET['voltar'] ?? $_POST['voltar'] ?? null);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $p = perfil((string) ($_POST['perfil'] ?? ''));
    if ($p) {
        escolher_perfil($p['id']);
    }
    redirecionar($voltar);
}

$atual = perfil_atual();
cabecalho(['titulo' => 'Quem vai explorar? — Samuel.tech', 'privado' => true]);
?>
<div class="page-narrow">
  <div class="window">
    <div class="titlebar"><span>escolher_explorador.exe</span><a class="close" href="/jogos/" aria-label="Fechar" style="display:grid;place-items:center;text-decoration:none">×</a></div>
    <div class="dialog-body">
      <span class="kicker">Portal da família</span>
      <h1>Quem vai explorar?</h1>
      <p>Toque no seu explorador. Cada um tem os seus favoritos.</p>
      <form method="post" action="/exploradores/">
        <input type="hidden" name="voltar" value="<?= e($voltar) ?>">
        <div class="profiles">
<?php foreach (perfis() as $p): ?>
          <button class="profile" type="submit" name="perfil" value="<?= e($p['id']) ?>" style="background:<?= $p['cor'] ?>"<?= $p['id'] === $atual['id'] ? ' aria-current="true"' : '' ?>><?= $p['svg'] ?><?= e($p['nome']) ?></button>
<?php endforeach; ?>
        </div>
      </form>
    </div>
  </div>
</div>
<?php rodape();
