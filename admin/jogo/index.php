<?php
require dirname(__DIR__, 2) . '/_app/inicio.php';
require dirname(__DIR__, 2) . '/_app/admin.php';
exigir_responsavel();

$slugEdit = (string) ($_GET['slug'] ?? $_POST['slug_original'] ?? '');
$atual = $slugEdit !== '' ? jogo($slugEdit) : null;
if ($slugEdit !== '' && (!$atual || $atual['origem'] !== 'responsavel')) {
    redirecionar('/admin/?ok=site');
}
$novo = !$atual;
$v = $atual ?: ['title' => '', 'category' => '', 'description' => '', 'instructions' => [], 'input' => ['touch', 'mouse', 'keyboard'], 'status' => 'rascunho', 'novo' => true, 'version' => '1.0', 'entry' => 'index.html'];
$erros = [];
$resultadoZip = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!conferir_csrf()) {
        $erros[] = 'A sessão do responsável expirou. Abra a área de novo.';
    }
    $limpa = function ($s, int $max) {
        return mb_substr(trim(preg_replace('/\s+/u', ' ', (string) $s)), 0, $max);
    };
    $v['title'] = $limpa($_POST['title'] ?? '', 60);
    $v['category'] = $limpa($_POST['category'] ?? '', 30) ?: 'Aventura';
    $v['description'] = $limpa($_POST['description'] ?? '', 200);
    $v['instructions'] = array_slice(array_values(array_filter(array_map(function ($l) use ($limpa) {
        return $limpa($l, 160);
    }, preg_split('/\R/u', (string) ($_POST['instructions'] ?? ''))))), 0, 8);
    $v['input'] = array_values(array_intersect(['touch', 'mouse', 'keyboard'], (array) ($_POST['input'] ?? [])));
    $v['status'] = in_array($_POST['status'] ?? '', STATUS_TODOS, true) ? $_POST['status'] : 'rascunho';
    $v['novo'] = !empty($_POST['novo']);
    $v['version'] = $limpa($_POST['version'] ?? '', 20);
    $entryPref = preg_replace('/[^A-Za-z0-9._\/-]/', '', (string) ($_POST['entry'] ?? 'index.html')) ?: 'index.html';

    if ($v['title'] === '') {
        $erros[] = 'Dê um nome para o jogo.';
    }
    if ($novo) {
        $v['slug'] = slug_de($v['title']);
        $base = $v['slug'];
        for ($n = 2; jogo($v['slug']); $n++) {
            $v['slug'] = $base . '-' . $n;
        }
    }

    $zip = $_FILES['zip'] ?? null;
    $temZip = $zip && ($zip['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    if ($temZip && $zip['error'] !== UPLOAD_ERR_OK) {
        $erros[] = 'O envio do .zip falhou (código ' . (int) $zip['error'] . '). Tente de novo.';
        $temZip = false;
    }
    $capa = $_FILES['capa'] ?? null;
    $temCapa = $capa && ($capa['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;

    $instalado = !$novo && is_file(pasta_jogo($atual) . '/' . ($atual['entry'] ?? 'index.html'));
    if (!$temZip && !$instalado && $v['status'] !== 'em-breve') {
        $erros[] = 'Envie o .zip com os arquivos do jogo (ou marque o status “Em breve”).';
    }

    if (!$erros) {
        if (!is_dir(pasta_dados() . '/jogos') && !@mkdir(pasta_dados() . '/jogos', 0700, true)) {
            $erros[] = 'Não consegui criar a pasta de dados no servidor.';
        }
    }
    if (!$erros && $temZip) {
        $resultadoZip = importar_zip($zip['tmp_name'], pasta_dados() . '/jogos/' . $v['slug'], $entryPref);
        if (!$resultadoZip['ok']) {
            $erros[] = $resultadoZip['erro'];
        } else {
            $v['entry'] = $resultadoZip['entry'];
        }
    }
    if (!$erros && $temCapa) {
        $r = salvar_capa($capa['tmp_name'], $v['slug']);
        if (!$r['ok']) {
            $erros[] = $r['erro'];
        }
    }
    if (!$erros) {
        $cat = catalogo_responsavel();
        $registro = [
            'slug' => $v['slug'], 'title' => $v['title'], 'category' => $v['category'], 'description' => $v['description'],
            'entry' => $v['entry'] ?? 'index.html', 'instructions' => $v['instructions'], 'input' => $v['input'],
            'status' => $v['status'], 'novo' => $v['novo'], 'version' => $v['version'], 'atualizado_em' => date('c'),
        ];
        if ($novo) {
            array_unshift($cat['games'], $registro);
        } else {
            foreach ($cat['games'] as &$x) {
                if ($x['slug'] === $v['slug']) {
                    $x = $registro;
                }
            }
            unset($x);
        }
        if (salvar_catalogo_responsavel($cat)) {
            redirecionar('/admin/?ok=salvo');
        }
        $erros[] = 'Não consegui salvar o catálogo no servidor.';
    }
}

$csrf = e(token_csrf());
cabecalho(['titulo' => ($novo ? 'Novo jogo' : 'Editar jogo') . ' — Samuel.tech', 'privado' => true]);
?>
<div class="page-narrow" style="width:min(720px,calc(100% - 36px))">
  <div class="window">
    <div class="titlebar"><span><?= $novo ? 'novo_jogo.exe' : e($v['slug']) . '.exe' ?></span><a class="close" href="/admin/" aria-label="Fechar" style="display:grid;place-items:center;text-decoration:none">×</a></div>
    <div class="dialog-body">
      <span class="kicker">Área do responsável</span>
      <h1><?= $novo ? 'Novo jogo' : 'Editar “' . e($v['title']) . '”' ?></h1>
      <p>Envie o jogo como <b>.zip</b> com um <code>index.html</code> e os arquivos dele (JS, imagens, sons). Os arquivos ficam guardados fora da pasta pública e só abrem para a família logada.</p>
<?php foreach ($erros as $er): ?>      <p class="alert" role="alert"><?= e($er) ?></p>
<?php endforeach; ?>
      <form class="form" method="post" action="/admin/jogo/<?= $novo ? '' : '?slug=' . e($v['slug']) ?>" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="<?= $csrf ?>">
<?php if (!$novo): ?>        <input type="hidden" name="slug_original" value="<?= e($v['slug']) ?>">
<?php endif; ?>
        <div class="field"><label for="title">Nome do jogo</label><input id="title" name="title" maxlength="60" required value="<?= e($v['title']) ?>"></div>
        <div class="field"><label for="category">Categoria</label><input id="category" name="category" maxlength="30" placeholder="Aventura, Descobertas, Criatividade…" value="<?= e($v['category']) ?>"></div>
        <div class="field"><label for="description">Frase do cartão</label><input id="description" name="description" maxlength="200" placeholder="Fale com a criança: “Ajude o dragão a…”" value="<?= e($v['description']) ?>"></div>
        <div class="field"><label for="instructions">Como jogar (uma dica por linha)</label><textarea id="instructions" name="instructions" rows="4" class="campo-texto"><?= e(implode("\n", (array) $v['instructions'])) ?></textarea></div>
        <fieldset class="field campo-grupo"><legend>Controles</legend>
<?php foreach (['touch' => 'Toque', 'mouse' => 'Mouse', 'keyboard' => 'Teclado'] as $k => $r): ?>          <label class="check"><input type="checkbox" name="input[]" value="<?= $k ?>"<?= in_array($k, (array) $v['input'], true) ? ' checked' : '' ?>> <?= $r ?></label>
<?php endforeach; ?>
        </fieldset>
        <div class="field"><label for="zip">Arquivos do jogo (.zip)<?= $novo ? '' : ' — envie só se for trocar a versão' ?></label><input id="zip" name="zip" type="file" accept=".zip,application/zip"></div>
        <div class="field"><label for="entry">Arquivo inicial</label><input id="entry" name="entry" value="<?= e($v['entry'] ?? 'index.html') ?>"><small>Quase sempre <code>index.html</code>. Se não achar, uso o único .html do zip.</small></div>
        <div class="field"><label for="capa">Capa (imagem larga)<?= $novo ? '' : ' — opcional' ?></label><input id="capa" name="capa" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><small>Recorto no centro em 1200×675.</small>
<?php if (!$novo && capa_arquivo($v['slug'])): ?>          <img src="<?= e(capa_url($v)) ?>" alt="Capa atual" class="capa-atual">
<?php endif; ?>
        </div>
        <div class="field"><label for="status">Status</label><select id="status" name="status" class="campo-texto">
<?php foreach (['rascunho' => 'Rascunho — só eu testo', 'pronto' => 'Publicado — a família joga', 'em-breve' => 'Em breve — aparece com selo', 'arquivado' => 'Arquivado — escondido'] as $k => $r): ?>          <option value="<?= $k ?>"<?= $k === $v['status'] ? ' selected' : '' ?>><?= $r ?></option>
<?php endforeach; ?>
        </select></div>
        <label class="check"><input type="checkbox" name="novo" value="1"<?= !empty($v['novo']) ? ' checked' : '' ?>> Mostrar selo “Novo!”</label>
        <div class="field"><label for="version">Versão</label><input id="version" name="version" maxlength="20" value="<?= e($v['version'] ?? '') ?>"></div>
        <button class="btn full" type="submit"><?= $novo ? '＋ Cadastrar jogo' : 'Salvar alterações' ?></button>
      </form>
      <p class="fine login-note"><a href="/admin/">← Voltar ao catálogo</a></p>
    </div>
  </div>
</div>
<?php rodape();
