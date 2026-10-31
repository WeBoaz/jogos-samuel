# samuel.tech — contexto para o Claude

Portal familiar com os jogos que o papai cria para o **Samuel**. Publicado em **https://samuel.tech**.
Idioma: **português do Brasil**, sempre. O briefing visual original está em `kit/` (leia `kit/PROMPT-PARA-CLAUDE.md`).

## Stack
- **PHP puro (7.4+/8.x), sem framework, sem banco, sem build.** Roda na hospedagem compartilhada da Hostinger.
- Testar localmente:
  `SAMUEL_CONFIG=/tmp/samuel-config.php php -S 127.0.0.1:8770 ferramentas/roteador-local.php`
  (o roteador imita o `.htaccess`; `SAMUEL_CONFIG` aponta a config privada para um lugar de teste).

## Estrutura
```
index.php                Home pública (fiel ao kit)
entrar/                  Primeiro acesso (cria a senha) + login da família
exploradores/            Escolha do perfil (Samuel / Player 2)
jogos/                   Biblioteca: busca, filtro, favoritos por perfil   [privado]
jogar/?jogo=<slug>       Player: iframe + voltar, recomeçar, tela cheia    [privado]
jogo.php                 “Porteiro”: /jogo/<slug>/<arquivo> → entrega arquivos de _privado/jogos/ só com sessão
conta/                   Trocar a senha da família                        [privado]
sair/  404.php  robots.txt  .htaccess
_app/                    Núcleo PHP (bloqueado na web)
  inicio.php             config, sessão assinada, proteção de senha, catálogo
  layout.php             cabeçalho/rodapé/card (HTML do kit)
  jogos.json             CATÁLOGO DE JOGOS
  perfis.php             perfis (apelido + avatar SVG)
  config-publica.php     só o SHA-256 do código de primeiro acesso
_privado/jogos/<slug>/   Arquivos dos jogos (bloqueado na web; só via jogo.php)
assets/css/samuel.css    Bloco 1 = CSS original do kit; bloco 2 = páginas novas
assets/js/site.js        Favoritos, busca, filtro, diálogos, player
assets/img/              Artes do kit otimizadas (.webp) + capas
kit/                     Kit original: PNGs, brand kit, tokens, docs (NÃO publicado)
ferramentas/             empacotar.sh, roteador-local.php, novo_codigo.py (NÃO publicado)
```

## Login e segurança (não enfraquecer)
- Senha da família: hash bcrypt em `samuel-config.php` **fora da pasta pública**
  (`/home/u401945237/domains/samuel.tech/samuel-config.php`), criado no primeiro acesso em `/entrar/`
  com o **código de configuração** (só o SHA-256 dele está no repo; o código foi entregue ao responsável).
- Sessão: cookie `samuel_sessao` HttpOnly + SameSite=Lax + Secure, assinado com HMAC-SHA256 (180 dias).
  Trocar a senha (`/conta/`) incrementa `versao` e derruba todos os outros aparelhos.
- Esqueceu a senha? Apagar `samuel-config.php` pelo Gerenciador de Arquivos da Hostinger e refazer o primeiro acesso.
  Novo código: `python3 ferramentas/novo_codigo.py` (grava só o hash).
- 8 senhas erradas por IP em 15 min → bloqueio temporário.
- Páginas privadas chamam `exigir_familia()` / `exigir_perfil()`. Arquivos de jogo só saem por `jogo.php`
  (lista branca de extensões, nunca `.php`, sem `..`, `realpath` dentro da pasta do jogo).
- **Nunca** colocar senha, segredo ou o código de configuração em arquivo do repositório (ele é público).
- **Nunca** proteger nada só com JavaScript/localStorage. Favoritos no localStorage são só conveniência.

## Regras do kit (resumo — ver `kit/brand/brand-kit.html` e `kit/brand/tokens.json`)
- Retrô anos 90 + mundo voxel. Papel `#F5F2E8`, tinta `#193337`, verde play `#B9ED80`, laranja `#FF9D52`, lilás `#CEB7EF`.
- Borda 2px tinta, sombra sólida deslocada, **raio 0**, janelas com barra `.exe`, títulos em Courier New 900.
- Alvos de toque ≥ 44px, foco visível (roxo `#9956E0`), sem rolagem horizontal em 360/390/768/1366.
- Personagens: Samuel (jaqueta laranja, camiseta amarela, calça azul-petróleo) e **Player 2** (jardineira lilás),
  Jack Russell branco/marrom e gato amarelo tigrado. **Sem panda.**
- **Proibido:** fotos reais, uniforme/nome/símbolo da escola, sobrenomes, idades, localização, rotina,
  anúncios, chat, ranking com dados pessoais, contadores falsos (“online agora”, visitas).
- Jogos “em breve” são conceitos: não linkar para nada inventado.

## Como publicar um jogo novo
1. Colocar os arquivos em `_privado/jogos/<slug>/` (arquivo inicial normalmente `index.html`; caminhos **relativos**).
2. Links de saída do jogo: `<a href="/jogos/" target="_top">← Voltar aos jogos</a>`.
3. Adicionar no `_app/jogos.json`: `slug, title, category, description, cover, entry, instructions[], input[], status:"pronto", novo, version`.
4. Capa 1200×675 em `assets/img/<slug>.webp` (original em `kit/originais/` se vier do kit).
5. Testar: home → entrar → perfil → biblioteca → jogo → recomeçar → voltar. Conferir sem sessão: `/jogo/<slug>/index.html` = 403.
6. Publicar (abaixo).

## Publicação (Hostinger)
Conta `u401945237`, site `samuel.tech`, pasta `public_html`. O app do GitHub da Hostinger não enxerga
`WeBoaz/jogos-samuel`, então **não há deploy automático**. Para publicar:
1. Juntar as mudanças na `main`.
2. `ferramentas/empacotar.sh` → `samuel-site.zip` (só arquivos do site; sem `kit/` e `ferramentas/`).
3. Atualizar a branch órfã **`publicacao`** com o novo `samuel-site.zip` (+ `LEIA-ME.md`) e dar push.
4. Hostinger (MCP): `hosting_git_deploy-website-repository` — `https://github.com/WeBoaz/jogos-samuel.git`,
   branch `publicacao`, directory `_publicacao` (se a pasta existir, faz pull).
5. Hostinger: `hosting_websites_deploy-static-site-archive` com `archive_path: "_publicacao/samuel-site.zip"`.
   (Substitui só `public_html`; o `samuel-config.php` fica fora e sobrevive.)
6. Conferir com `hosting_files_list-website-and-directories` (deve haver `.htaccess`, `_app/.htaccess`, `_privado/.htaccess`).
Alternativa definitiva: conectar a conta GitHub WeBoaz no hPanel (Sites → samuel.tech → Avançado → Git)
e usar `hosting_deploy` com `type: static` (o PHP roda normalmente).
