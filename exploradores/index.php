<?php
require dirname(__DIR__) . '/_app/inicio.php';
exigir_familia();
$voltar = destino_seguro($_GET['voltar'] ?? $_POST['voltar'] ?? null);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $p = perfil((string) ($_POST['perfil'] ?? ''));
    if ($p) {
        gravar_sessao($p['id']);
        redirecionar($voltar);
    }
}

cabecalho(['titulo' => 'Quem vai explorar? — Samuel.tech', 'privado' => true]);
?>
<div class="page-narrow">
  <div class="window">
    <div class="titlebar"><span>escolher_explorador.exe</span><span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span></div>
    <div class="dialog-body">
      <span class="kicker">Portal da família</span>
      <h1>Quem vai explorar?</h1>
      <p>Toque no seu explorador. Cada um tem os seus favoritos.</p>
      <form method="post" action="/exploradores/">
        <input type="hidden" name="voltar" value="<?= e($voltar) ?>">
        <div class="profiles">
<?php foreach (perfis() as $p): ?>
          <button class="profile" type="submit" name="perfil" value="<?= e($p['id']) ?>" style="background:<?= $p['cor'] ?>"><?= $p['svg'] ?><?= e($p['nome']) ?></button>
<?php endforeach; ?>
        </div>
      </form>
      <p class="fine login-note"><a href="/conta/">Trocar a senha da família</a> · <a href="/sair/">Sair deste aparelho</a></p>
    </div>
  </div>
</div>
<?php rodape();
