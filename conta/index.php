<?php
require dirname(__DIR__) . '/_app/inicio.php';
exigir_familia();
$c = config();
$msg = '';
$ok = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $atual = (string) ($_POST['atual'] ?? '');
    $nova = (string) ($_POST['nova'] ?? '');
    if (bloqueado()) {
        $msg = 'Muitas tentativas. Espere 15 minutos.';
    } elseif (!password_verify($atual, $c['senha_hash'])) {
        registrar_tentativa(false);
        $msg = 'A senha atual está errada.';
    } elseif (mb_strlen($nova) < 8) {
        $msg = 'A nova senha precisa ter pelo menos 8 caracteres.';
    } elseif ($nova !== (string) ($_POST['confirmar'] ?? '')) {
        $msg = 'As duas senhas novas estão diferentes.';
    } else {
        registrar_tentativa(true);
        $c['senha_hash'] = password_hash($nova, PASSWORD_DEFAULT);
        $c['versao'] = ($c['versao'] ?? 1) + 1;          // desconecta os outros aparelhos
        if (salvar_config($c)) {
            config(true);
            gravar_sessao((string) (sessao()['p'] ?? '') ?: null);
            $ok = true;
            $msg = 'Senha trocada! Os outros aparelhos vão precisar entrar de novo.';
        } else {
            $msg = 'Não consegui salvar a nova senha no servidor.';
        }
    }
}

cabecalho(['titulo' => 'Senha da família — Samuel.tech', 'privado' => true]);
?>
<div class="page-narrow">
  <div class="window">
    <div class="titlebar"><span>senha_da_familia.exe</span><a class="close" href="/exploradores/" aria-label="Fechar" style="display:grid;place-items:center;text-decoration:none">×</a></div>
    <div class="dialog-body">
      <span class="kicker">Só para o responsável</span>
      <h1>Trocar a senha</h1>
      <p>Ao trocar, todos os outros aparelhos saem e precisam da senha nova.</p>
<?php if ($msg): ?>      <p class="alert<?= $ok ? ' ok' : '' ?>" role="<?= $ok ? 'status' : 'alert' ?>"><?= e($msg) ?></p>
<?php endif; ?>
      <form class="form" method="post" action="/conta/">
        <div class="field"><label for="atual">Senha atual</label><input id="atual" name="atual" type="password" autocomplete="current-password" required></div>
        <div class="field"><label for="nova">Nova senha</label><input id="nova" name="nova" type="password" autocomplete="new-password" minlength="8" required></div>
        <div class="field"><label for="confirmar">Repita a nova senha</label><input id="confirmar" name="confirmar" type="password" autocomplete="new-password" minlength="8" required></div>
        <button class="btn full" type="submit">Salvar nova senha</button>
      </form>
      <p class="fine login-note"><a href="/exploradores/">← Voltar</a></p>
    </div>
  </div>
</div>
<?php rodape();
