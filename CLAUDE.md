# samuel.tech — contexto para o Claude

Portal familiar com os jogos que o papai cria para o **Samuel**. Publicado em **https://samuel.tech**.
Idioma: **português do Brasil**, sempre. O briefing visual original está em `kit/` (leia `kit/PROMPT-PARA-CLAUDE.md`).

## Plano em andamento: Hordas dos Blocos → Dungeons dos Blocos
- Antes de mexer: [`docs/samuel-tech/README.md`](docs/samuel-tech/README.md) (fila no Notion, protocolo de sessão),
  [`docs/samuel-tech/STATE.md`](docs/samuel-tech/STATE.md) (último estado e NEXT) e
  [`docs/samuel-tech/DECISOES.md`](docs/samuel-tech/DECISOES.md).
- Material de desenvolvimento e procedência de código de terceiros: [`desenvolvimento/`](desenvolvimento/README.md) (não publicado).
- Antes de commitar um jogo: `python3 ferramentas/verificar_jogo.py <slug>` (recusa CDN, caminho absoluto, analytics, arquivo que o `jogo.php` não entrega).
- Sem PHP no Mac: portal pelo Docker (`php:8.3-cli`), comando em `desenvolvimento/README.md`.

## Stack
- **PHP puro (7.4+/8.x), sem framework, sem banco, sem build.** Roda na hospedagem compartilhada da Hostinger.
- Testar localmente:
  `SAMUEL_CONFIG=/tmp/samuel-config.php php -S 127.0.0.1:8770 ferramentas/roteador-local.php`
  (o roteador imita o `.htaccess`; `SAMUEL_CONFIG` aponta a config privada para um lugar de teste).

## Estrutura
```
index.php                Home pública (fiel ao kit)
entrar/  conta/          Rotas antigas (redirecionam para /jogos/ e /admin/)
exploradores/            Escolha do explorador (Samuel / Player 2) — cookie simples
jogos/                   Biblioteca: busca, filtro, favoritos por explorador   [livre]
jogar/?jogo=<slug>       Player: iframe + voltar, recomeçar, tela cheia        [livre]
jogo.php                 “Porteiro”: /jogo/<slug>/<arquivo> → entrega arquivos de _privado/jogos/ (rascunho só p/ responsável)
admin/                   Área do responsável: ativar (código+senha), catálogo, status   [senha, 30 min]
admin/jogo/              Cadastrar/editar jogo: .zip + capa + instruções + status
capa.php                 Capas dos jogos do responsável (públicas só se o jogo estiver visível)
sair/  404.php  robots.txt  .htaccess
_app/                    Núcleo PHP (bloqueado na web)
  inicio.php             config, sessão assinada, proteção de senha, catálogo (site + responsável)
  admin.php              importar .zip com segurança, capa 1200×675, slug
  layout.php             cabeçalho/rodapé/card (HTML do kit)
  jogos.json             CATÁLOGO DE JOGOS
  perfis.php             perfis (apelido + avatar SVG)
  config-publica.php     só o SHA-256 do código de primeiro acesso
_privado/jogos/<slug>/   Arquivos dos jogos (bloqueado na web; só via jogo.php)
  turbo-dos-blocos/      Corrida 3D (Three.js 0.170 local, licença MIT em three-LICENSE.txt; import map relativo).
                         `window.__turbo` expõe o estado só para os testes automáticos.
  caca-as-estrelas/      “Missão Constelação”: voo 3D com bloom (Three.js + EffectComposer/UnrealBloomPass em lib/).
                         6 constelações → Mapa do Céu (localStorage `estrelas3d:*`). `window.__estrelas` p/ testes.
  reino-dos-blocos/      Plataforma 2D em canvas (pixel art gerada em código, 3 fases montadas por funções em FASES).
                         Física: coiote 0,1 s, pulo guardado 0,13 s, corte 0,45, queda mais forte, correção de quina.
                         `window.__reino` p/ testes (robô de teste: anda e pula obstáculos).
assets/css/samuel.css    Bloco 1 = CSS original do kit; bloco 2 = páginas novas
assets/js/site.js        Favoritos, busca, filtro, diálogos, player
assets/img/              Artes do kit otimizadas (.webp) + capas
kit/                     Kit original: PNGs, brand kit, tokens, docs (NÃO publicado)
ferramentas/             empacotar.sh, roteador-local.php, novo_codigo.py (NÃO publicado)
```

## Acesso (decisão do responsável: jogos abertos, sem senha)
- **Jogar é livre:** home → “Jogar” → `/jogos/` direto. Sem código, sem senha da família.
  `/entrar/` só redireciona para `/jogos/`; `/conta/` vai para `/admin/`.
- Explorador (Samuel / Player 2): cookie simples `samuel_perfil` (só separa favoritos; não é proteção).
  Troca na própria biblioteca ou em `/exploradores/`.
- Os arquivos dos jogos continuam fora do acesso direto (`_privado/` bloqueado), mas `jogo.php` entrega
  jogos `pronto` para qualquer visitante. Rascunho/arquivado só no modo responsável.
- **A área do responsável (`/admin`) continua protegida** (ela aceita upload de arquivos):
  - Primeira vez: `/admin` pede o **código de configuração** + cria a senha do responsável
    (hash bcrypt em `/home/u401945237/domains/samuel.tech/samuel-config.php`, fora da pasta pública).
  - Depois: senha → `adm` no cookie assinado (HMAC) por 30 min; formulários com CSRF; 8 erros/15 min bloqueiam.
  - Esqueceu? Apagar `samuel-config.php` no Gerenciador de Arquivos e ativar de novo. Novo código: `python3 ferramentas/novo_codigo.py`.
- **Nunca** colocar senha, segredo ou o código de configuração em arquivo do repositório (ele é público).

## Catálogo: dois lugares
- **Jogos do site** (vêm do repositório): `_app/jogos.json` + arquivos em `_privado/jogos/<slug>/`.
- **Jogos do responsável** (cadastrados em `/admin`): ficam FORA da pasta pública, em
  `/home/u401945237/domains/samuel.tech/samuel-dados/` → `catalogo.json`, `jogos/<slug>/`, `capas/<slug>.webp`.
  Sobrevivem às publicações. `status_site` nesse JSON guarda o status trocado de jogos do site.
- Status: `pronto` (família joga) · `em-breve` (selo, sem jogar) · `rascunho` (só no modo responsável) · `arquivado` (escondido).
- Import do .zip: rejeita `..`/caminho absoluto, ignora ocultos e `__MACOSX`, só extensões de `EXTENSOES_JOGO`
  (nunca `.php`/`.htaccess`), máx. 3000 arquivos/300 MB, achata pasta única no topo, troca de versão atômica.
- Área do responsável: senha do responsável → `adm` no cookie por 30 min; formulários com token CSRF.

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
**Jeito fácil (sem código):** `/admin` → Novo jogo → envia o `.zip` (com `index.html`) e a capa → “Rascunho” → Testar → “Publicado”.
O jogo deve usar caminhos relativos e sair com `<a href="/jogos/" target="_top">`.

**Jeito pelo repositório (jogos fixos do site):**
1. Colocar os arquivos em `_privado/jogos/<slug>/` (arquivo inicial normalmente `index.html`; caminhos **relativos**).
2. Links de saída do jogo: `<a href="/jogos/" target="_top">← Voltar aos jogos</a>`.
3. Adicionar no `_app/jogos.json`: `slug, title, category, description, cover, entry, instructions[], input[], status:"pronto", novo, version`.
4. Capa 1200×675 em `assets/img/<slug>.webp` (original em `kit/originais/` se vier do kit).
5. Testar: home → Jogar → biblioteca → jogo → recomeçar → voltar. Conferir: `/_privado/jogos/<slug>/index.html` = 403.
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
