<?php
// Cabeçalho e rodapé compartilhados (mesmo HTML do kit).
defined('SAMUEL') or exit;

const LOGO_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="#b9ed80" stroke="#193337" stroke-width="2" d="M1 1h38v38H1z"/><path fill="#193337" d="M9 9h22v6H15v3h16v13H9v-6h16v-3H9z"/></svg>';

/**
 * @param array $o titulo, descricao, privado (bool), home (bool)
 */
function cabecalho(array $o = []): void
{
    $titulo = $o['titulo'] ?? 'Samuel.tech — Aperte o play na imaginação';
    $desc = $o['descricao'] ?? 'Um pequeno universo de jogos e grandes aventuras. Bem-vindo ao Samuel.tech.';
    $s = sessao();
    $p = $s ? perfil((string) ($s['p'] ?? '')) : null;
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    if (!headers_sent() && !preg_grep('/^Cache-Control:/i', headers_list())) {
        header('Cache-Control: private, no-cache');
    }
    ?><!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#F5F2E8">
<title><?= e($titulo) ?></title>
<meta name="description" content="<?= e($desc) ?>">
<?php if (!empty($o['privado'])): ?><meta name="robots" content="noindex,nofollow">
<?php else: ?><meta property="og:title" content="Samuel.tech — Aperte o play na imaginação">
<meta property="og:description" content="<?= e($desc) ?>">
<meta property="og:image" content="https://samuel.tech/assets/img/og-samuel-tech.jpg">
<meta property="og:url" content="https://samuel.tech/">
<meta name="twitter:card" content="summary_large_image">
<?php endif; ?>
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/icone-180.png">
<link rel="stylesheet" href="/assets/css/samuel.css?v=5">
</head>
<body>
<a class="skip" href="#main">Pular para o conteúdo</a>
<div class="systembar"><div class="wrap"><span><i class="statusdot"></i>SAMUEL.TECH / IMAGINAÇÃO LIGADA</span><span class="right-status">PEQUENO UNIVERSO. GRANDES AVENTURAS. ✦</span></div></div>
<header class="wrap nav">
  <a href="/" class="brand" aria-label="Samuel.tech, início"><?= LOGO_SVG ?><span>samuel<em>.tech</em></span></a>
  <nav class="navlinks" aria-label="Principal">
<?php if (!empty($o['home'])): ?>
    <a href="#mundos">Os jogos</a><a href="#universo">Nosso universo</a>
<?php endif; ?>
<?php if ($s && $p): ?>
    <a class="userchip" href="/exploradores/" title="Trocar explorador"><?= $p['svg'] ?><span><?= e($p['nome']) ?></span></a>
    <a class="btn small" href="/jogos/">Meus mundos <span aria-hidden="true">↗</span></a>
    <a class="plain-btn" href="/sair/">Sair</a>
<?php elseif ($s): ?>
    <a class="btn small" href="/exploradores/">Escolher explorador <span aria-hidden="true">↗</span></a>
    <a class="plain-btn" href="/sair/">Sair</a>
<?php else: ?>
    <a class="btn small" href="/entrar/">Entrar para jogar <span aria-hidden="true">↗</span></a>
<?php endif; ?>
  </nav>
</header>
<main id="main">
<?php
}

function rodape(): void
{
    ?>
</main>
<footer class="footer"><div class="wrap footer-inner"><span class="footer-brand">samuel.tech <span aria-hidden="true">▣</span></span><span>Feito com amor e alguns pixels. © <?= date('Y') ?></span><button class="plain-btn" type="button" data-open="#info-dialog">Sobre este portal</button></div></footer>
<dialog id="info-dialog" aria-labelledby="info-title"><div class="titlebar"><span>sobre_o_portal.txt</span><button class="close" type="button" data-close aria-label="Fechar">×</button></div><div class="dialog-body"><h2 id="info-title">Um universo em construção.</h2><p>Um cantinho da família para guardar os jogos que o papai cria para o Samuel. A biblioteca é privada: só entra quem tem a senha da família.</p><p>Os favoritos ficam guardados neste aparelho. Não há anúncios, chat nem dados pessoais das crianças.</p><p>Os personagens usam roupas de aventura inventadas. Nenhuma foto original faz parte do site.</p></div></dialog>
<div class="toast" id="toast" role="status" hidden></div>
<script src="/assets/js/site.js?v=4" defer></script>
</body>
</html>
<?php
}

/** Card de jogo no formato do kit. $modo: 'home' | 'biblioteca' */
function card_jogo(array $g, string $modo, bool $logado): string
{
    $pronto = ($g['status'] ?? '') === 'pronto';
    $slug = e($g['slug']);
    $tag = $pronto ? (!empty($g['novo']) ? 'Novo!' : 'Jogável') : 'Em breve';
    $meta = strtoupper((string) ($g['category'] ?? '')) . ' / ' . ($pronto ? 'PRONTO PARA JOGAR' : 'EM CONSTRUÇÃO');
    $capa = e(capa_url($g));
    $link = $logado ? '/jogar/?jogo=' . $slug : '/entrar/?voltar=' . rawurlencode('/jogar/?jogo=' . $g['slug']);

    if ($modo === 'home') {
        $acao = $pronto
            ? '<a class="plain-btn" href="' . e($link) . '">Conhecer o mundo <span aria-hidden="true">↗</span></a>'
            : '<span class="status-soon">O papai está construindo ✦</span>';
    } else {
        $acao = $pronto
            ? '<a class="btn play" href="/jogar/?jogo=' . $slug . '"><span aria-hidden="true">▶</span> Jogar</a>'
              . '<button class="star-btn" type="button" aria-pressed="false" aria-label="Adicionar ' . e($g['title']) . ' aos favoritos" data-favorite="' . $slug . '">☆</button>'
            : '<span class="status-soon">Em breve ✦</span>';
    }
    return '<article class="game-card' . ($pronto ? '' : ' soon') . '" data-card="' . $slug . '" data-title="' . e(mb_strtolower((string) $g['title'], 'UTF-8')) . '">'
        . '<div class="game-cover"><img src="' . $capa . '" alt="" loading="lazy" width="1200" height="675"><span class="tag">' . e($tag) . '</span></div>'
        . '<div class="card-body"><div class="card-meta">' . e($meta) . '</div><h3>' . e($g['title']) . '</h3><p>' . e($g['description'] ?? '') . '</p>'
        . '<div class="card-action">' . $acao . '</div></div></article>';
}
