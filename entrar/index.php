<?php
require dirname(__DIR__) . '/_app/inicio.php';
sem_cache();

$voltar = destino_seguro($_GET['voltar'] ?? $_POST['voltar'] ?? null);
$c = config();
$erro = '';

// Já está dentro? Segue em frente.
if ($c && sessao()) {
    redirecionar('/exploradores/?voltar=' . rawurlencode($voltar));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $senha = (string) ($_POST['senha'] ?? '');

    if (!$c) {
        // ---------- Primeiro acesso: o responsável cria a senha da família ----------
        $codigo = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($_POST['codigo'] ?? '')));
        $conf = (string) ($_POST['confirmar'] ?? '');
        if (!hash_equals(CODIGO_CONFIG_SHA256, hash('sha256', $codigo))) {
            usleep(400000);
            $erro = 'Esse código de configuração não confere. Confira e tente de novo.';
        } elseif (mb_strlen($senha) < 8) {
            $erro = 'A senha precisa ter pelo menos 8 caracteres.';
        } elseif ($senha !== $conf) {
            $erro = 'As duas senhas estão diferentes.';
        } else {
            $nova = [
                'senha_hash' => password_hash($senha, PASSWORD_DEFAULT),
                'segredo' => bin2hex(random_bytes(32)),
                'versao' => 1,
                'criado_em' => date('c'),
            ];
            if (salvar_config($nova)) {
                config(true);                 // relê o arquivo recém-criado
                gravar_sessao(null);          // e já entra
                redirecionar('/exploradores/?voltar=' . rawurlencode($voltar));
            }
            $erro = 'Não consegui salvar a configuração no servidor. Avise o Claude: a pasta acima de public_html precisa permitir escrita.';
        }
    } else {
        // ---------- Login da família ----------
        if (bloqueado()) {
            $erro = 'Muitas tentativas. Espere 15 minutos e tente de novo.';
        } elseif (password_verify($senha, $c['senha_hash'])) {
            registrar_tentativa(true);
            gravar_sessao(null);
            redirecionar('/exploradores/?voltar=' . rawurlencode($voltar));
        } else {
            registrar_tentativa(false);
            usleep(400000);
            $erro = 'Senha errada. Tente de novo (peça ajuda para um adulto).';
        }
    }
}

$primeiro = !$c;
cabecalho(['titulo' => 'Entrar — Samuel.tech', 'privado' => true]);
?>
<div class="page-narrow">
  <div class="window">
    <div class="titlebar"><span>portal_de_aventuras.exe</span><a class="close" href="/" aria-label="Fechar" style="display:grid;place-items:center;text-decoration:none">×</a></div>
    <div class="dialog-body">
<?php if ($primeiro): ?>
      <span class="kicker">Primeiro acesso · só para o responsável</span>
      <h1>Crie a senha da família.</h1>
      <p>Use o código de configuração que você recebeu e escolha a senha que a família vai usar para entrar. Ela fica guardada no servidor, protegida, fora da pasta pública.</p>
<?php else: ?>
      <span class="kicker">Portal da família</span>
      <h1>Senha da família</h1>
      <p>Peça para um adulto digitar a senha. Este aparelho fica lembrado por 180 dias.</p>
<?php endif; ?>
<?php if ($erro): ?>
      <p class="alert" role="alert"><?= e($erro) ?></p>
<?php endif; ?>
      <form class="form" method="post" action="/entrar/">
        <input type="hidden" name="voltar" value="<?= e($voltar) ?>">
<?php if ($primeiro): ?>
        <div class="field"><label for="codigo">Código de configuração</label><input id="codigo" name="codigo" autocomplete="off" autocapitalize="characters" spellcheck="false" required placeholder="XXXXX-XXXXX-XXXXX-XXXXX"></div>
        <div class="field"><label for="senha">Nova senha da família</label><input id="senha" name="senha" type="password" autocomplete="new-password" minlength="8" required><small>Pelo menos 8 caracteres.</small></div>
        <div class="field"><label for="confirmar">Repita a senha</label><input id="confirmar" name="confirmar" type="password" autocomplete="new-password" minlength="8" required></div>
        <button class="btn full" type="submit">Salvar senha <span aria-hidden="true">▶</span></button>
<?php else: ?>
        <div class="field"><label for="senha">Senha</label><input id="senha" name="senha" type="password" autocomplete="current-password" required autofocus></div>
        <button class="btn full" type="submit"><span aria-hidden="true">▶</span> Entrar</button>
<?php endif; ?>
      </form>
      <p class="fine login-note">Nenhum dado pessoal das crianças é pedido ou guardado.</p>
    </div>
  </div>
</div>
<?php rodape();
