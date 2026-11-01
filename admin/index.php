<?php
require dirname(__DIR__) . '/_app/inicio.php';
require dirname(__DIR__) . '/_app/admin.php';
$sess = exigir_familia();
$erro = '';
$avisos = [
    'salvo' => 'Jogo salvo!', 'status' => 'Status atualizado.', 'excluido' => 'Jogo excluído.',
    'site' => 'Jogos que vieram com o site só mudam de status aqui; o resto é editado no código.',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = (string) ($_POST['acao'] ?? '');
    if ($acao === 'entrar') {
        // Confirma a senha para liberar a área do responsável por 30 minutos
        if (bloqueado()) {
            $erro = 'Muitas tentativas. Espere 15 minutos.';
        } elseif (password_verify((string) ($_POST['senha'] ?? ''), config()['senha_hash'])) {
            registrar_tentativa(true);
            gravar_sessao($sess['p'] ?? null, time() + 1800);
            redirecionar('/admin/');
        } else {
            registrar_tentativa(false);
            usleep(400000);
            $erro = 'Senha errada.';
        }
    } elseif (modo_responsavel() && conferir_csrf()) {
        $slug = (string) ($_POST['slug'] ?? '');
        $g = jogo($slug);
        $cat = catalogo_responsavel();
        if ($acao === 'sair') {
            gravar_sessao($sess['p'] ?? null, 0);
            redirecionar('/jogos/');
        } elseif ($g && $acao === 'status' && in_array($_POST['status'] ?? '', STATUS_TODOS, true)) {
            if ($g['origem'] === 'responsavel') {
                foreach ($cat['games'] as &$x) {
                    if ($x['slug'] === $slug) {
                        $x['status'] = $_POST['status'];
                    }
                }
                unset($x);
            } else {
                $cat['status_site'][$slug] = $_POST['status'];
            }
            salvar_catalogo_responsavel($cat);
            redirecionar('/admin/?ok=status');
        } elseif ($g && $acao === 'excluir' && $g['origem'] === 'responsavel') {
            $cat['games'] = array_values(array_filter($cat['games'], function ($x) use ($slug) {
                return $x['slug'] !== $slug;
            }));
            salvar_catalogo_responsavel($cat);
            apagar_pasta(pasta_dados() . '/jogos/' . $slug);
            foreach (['webp', 'jpg'] as $ext) {
                @unlink(pasta_dados() . '/capas/' . $slug . '.' . $ext);
            }
            redirecionar('/admin/?ok=excluido');
        }
    } else {
        $erro = 'A sessão do responsável expirou. Confirme a senha de novo.';
    }
}

$rotulos = ['rascunho' => 'Rascunho (só você vê)', 'pronto' => 'Publicado', 'em-breve' => 'Em breve', 'arquivado' => 'Arquivado'];
cabecalho(['titulo' => 'Área do responsável — Samuel.tech', 'privado' => true]);

if (!modo_responsavel()): ?>
<div class="page-narrow">
  <div class="window">
    <div class="titlebar"><span>area_do_responsavel.exe</span><a class="close" href="/jogos/" aria-label="Fechar" style="display:grid;place-items:center;text-decoration:none">×</a></div>
    <div class="dialog-body">
      <span class="kicker">Só para o responsável</span>
      <h1>Confirme a senha</h1>
      <p>A área de jogos fica aberta por 30 minutos neste aparelho. Assim as crianças não mexem no catálogo sem querer.</p>
<?php if ($erro): ?>      <p class="alert" role="alert"><?= e($erro) ?></p>
<?php endif; ?>
      <form class="form" method="post" action="/admin/">
        <input type="hidden" name="acao" value="entrar">
        <div class="field"><label for="senha">Senha da família</label><input id="senha" name="senha" type="password" autocomplete="current-password" required autofocus></div>
        <button class="btn full" type="submit">Abrir a área do responsável</button>
      </form>
    </div>
  </div>
</div>
<?php rodape(); exit; endif;

$csrf = e(token_csrf());
?>
<section class="wrap page">
  <div class="section-head">
    <div><span class="kicker">Área do responsável / catálogo</span><h1 style="font-size:clamp(34px,5vw,54px)">Os mundos da família</h1></div>
    <div class="player-tools">
      <a class="btn" href="/admin/jogo/">＋ Novo jogo</a>
      <form method="post" action="/admin/"><input type="hidden" name="csrf" value="<?= $csrf ?>"><button class="btn secondary" name="acao" value="sair" type="submit">Fechar área</button></form>
    </div>
  </div>
<?php if (isset($avisos[$_GET['ok'] ?? ''])): ?>  <p class="alert ok" role="status"><?= e($avisos[$_GET['ok']]) ?></p>
<?php endif; ?>
<?php if ($erro): ?>  <p class="alert" role="alert"><?= e($erro) ?></p>
<?php endif; ?>
  <div class="admin-lista">
<?php foreach (jogos_todos() as $g):
    $st = $g['status'] ?? 'rascunho';
    $temArquivos = is_file(pasta_jogo($g) . '/' . ($g['entry'] ?? 'index.html')); ?>
    <article class="admin-item window">
      <img src="<?= e(capa_url($g)) ?>" alt="" width="240" height="135" loading="lazy">
      <div class="admin-info">
        <div class="card-meta"><?= e(strtoupper((string) ($g['category'] ?? ''))) ?> · <?= $g['origem'] === 'site' ? 'VEIO COM O SITE' : 'CADASTRADO POR VOCÊ' ?><?= !empty($g['version']) ? ' · v' . e($g['version']) : '' ?></div>
        <h3><?= e($g['title']) ?></h3>
        <p><span class="selo-status st-<?= e($st) ?>"><?= e($rotulos[$st] ?? $st) ?></span><?php if (!$temArquivos && $st !== 'em-breve'): ?> <span class="selo-status st-erro">Sem arquivos do jogo</span><?php endif; ?></p>
      </div>
      <div class="admin-acoes">
<?php if ($temArquivos): ?>        <a class="btn small secondary" href="/jogar/?jogo=<?= e($g['slug']) ?>">▶ Testar</a>
<?php endif; ?>
<?php if ($g['origem'] === 'responsavel'): ?>        <a class="btn small secondary" href="/admin/jogo/?slug=<?= e($g['slug']) ?>">✎ Editar</a>
<?php endif; ?>
        <form method="post" action="/admin/" class="admin-status">
          <input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="acao" value="status"><input type="hidden" name="slug" value="<?= e($g['slug']) ?>">
          <label class="so-leitor" for="st-<?= e($g['slug']) ?>">Status de <?= e($g['title']) ?></label>
          <select id="st-<?= e($g['slug']) ?>" name="status">
<?php foreach ($rotulos as $v => $r): ?>            <option value="<?= $v ?>"<?= $v === $st ? ' selected' : '' ?>><?= e($r) ?></option>
<?php endforeach; ?>
          </select>
          <button class="btn small" type="submit">Salvar</button>
        </form>
<?php if ($g['origem'] === 'responsavel'): ?>
        <form method="post" action="/admin/" data-confirmar="Excluir “<?= e($g['title']) ?>” para sempre?">
          <input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="acao" value="excluir"><input type="hidden" name="slug" value="<?= e($g['slug']) ?>">
          <button class="plain-btn" type="submit">Excluir</button>
        </form>
<?php endif; ?>
      </div>
    </article>
<?php endforeach; ?>
  </div>
  <p class="section-note">Publicado = a família vê e joga · Em breve = aparece com selo, sem jogar · Rascunho = só você testa · Arquivado = some da biblioteca.</p>
</section>
<?php rodape();
