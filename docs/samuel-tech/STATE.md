# Estado — Samuel.tech

Atualizado ao fim de cada sessão (ST-090). Um bloco por sessão, o mais novo em cima.
Vale o que está aqui e no Notion, não a memória do chat.

## 2026-11-01 — Claude (EXP-01 Minigolfe dos Pets)

- **Pedido do Boaz:** executar o Minigolfe dos Pets (documento "12 jogos 2D/3D") no automático, com várias
  rodadas de QA, e publicar.
- **Commits:** `1235b79` (MVP), `8b3e383` (correções de QA + capa), `040829f` (manifesto). PR
  https://github.com/WeBoaz/jogos-samuel/pull/1 (fork AndaimeOS — a conta não tem escrita no WeBoaz).
- **Deploy:** **em produção** desde 2026-11-01 12:47 (-03:00), upload TUS + `deploy-static-site-archive` pela API
  da Hostinger. Registro: https://app.notion.com/p/40b0a726d05581d69440cf9fa623464f. Sinal
  `SAMUEL_TECH_DEPLOY_READY` no PR #1.
- **Testes:** vitest 43/43; 4 QAs independentes com P0/P1 corrigidos (`desenvolvimento/jogos/minigolfe-dos-pets/qa/`);
  circuito completo por robô local e em produção; layout em 3 tamanhos; produção = bytes do Git; 4 jogos antigos idênticos.
- **Não executado:** aparelho real/FPS no celular, Safari, playtest com o Samuel.
- **Pendência de processo:** branch `publicacao` desatualizada até o merge do PR #1.
- **NEXT:** ler o parecer de EXP-01-F; corrigir P0/P1 se houver. Estado detalhado em `docs/jogos/minigolfe-dos-pets/ESTADO.md`.
  (Fila do plano principal continua em HO-010.)

## 2026-11-01 — Claude (ST-030)

- **Tarefa atual:** ST-030 — Definir interface e identidade dos dois jogos. **Concluída.**
- **Branch e commit:** `main` local, sem push (ver `git log`; commits ST-010, ST-020, ST-030).
- **Concluído:** `desenvolvimento/compartilhado/ui-blocos.css` (tokens do kit + componentes),
  `desenvolvimento/compartilhado/controles-toque.js` (joystick + ações com multitoque),
  `desenvolvimento/interface/prototipo.html` (15 telas de Hordas e Dungeons),
  `docs/samuel-tech/INTERFACE.md` (decisões, telas, cores do mundo, validação, skills).
- **Testes executados:** auditoria automática das 15 telas em 815×881, 375×812 e 812×375
  (rolagem, alvos ≥ 64 px, sobreposição HUD/controles) — tudo ok depois de 5 correções;
  contraste ≥ 6:1 em todos os pares; multitoque simulado com 3 dedos; blur solta tudo;
  `destruir()` remove ouvintes; P/Esc/1-2-3 no teclado; console limpo.
- **Não executado:** toque real em aparelho, iPhone/Android, leitor de tela, teste com criança.
- **Deploy e release:** nenhum. **Bloqueio real:** nenhum.
- **NEXT:** HO-010 — copiar `ui-blocos.css` e `controles-toque.js` para
  `_privado/jogos/hordas-dos-blocos/`, montar a arena com 1 herói, 1 arma, 1 inimigo a partir de
  `desenvolvimento/jogos/hordas-dos-blocos/upstream-voxel-survivors/` (sem GA, Three.js com
  versão exata), entrada `rascunho` no `jogos.json`, provar 90 s jogáveis e passar no
  `verificar_jogo.py`. ST-040 (manifesto de release + `release.json` no roteador local)
  continua Pronta e pode ser feita antes da publicação (HO-050).

## 2026-11-01 — Claude (ST-000, ST-010, ST-020)

- **Tarefa atual:** ST-020 — Preparar fonte, build e retomada de contexto.
- **Branch e commit:** `main`, à frente do `origin/main` (c6938cb) com os commits desta
  sessão; **sem push**. O site estático antigo está só na branch local `site-estatico` (0555a19).
- **Concluído nesta sessão:**
  - ST-000: inventário de rotas e publicação; produção = c6938cb; portal rodou em PHP 8.3
    (Docker) e os 4 jogos passaram no smoke local e em samuel.tech.
  - ST-010: DEC-007 (portal PHP é a linha canônica), DEC-008 (Hordas adapta
    voxel-survivors cf9f1fc, MIT), DEC-009 (Dungeons usa torchline-dungeon só como
    referência; sala de masmorra sobre o núcleo de blocos de Hordas).
  - ST-020: `desenvolvimento/` fora do pacote (README, `hordas-dos-blocos/ORIGEM.md`,
    cópia de referência do upstream), `ferramentas/verificar_jogo.py`, este arquivo,
    `README.md` desta pasta, links no `CLAUDE.md`, roteador local bloqueando `docs/` e
    `desenvolvimento/`.
- **Testes executados:** `verificar_jogo.py --todos` → 4 jogos ok; caso falso com CDN,
  `fetch` externo, caminho absoluto, `gtag`, oculto, link e `.exe` → 8 erros e saída 1;
  `demos/play` original do voxel-survivors → recusado por GA. Portal local: rotas 200,
  `_privado`/`_app`/`docs`/`desenvolvimento` = 403.
- **Não executado:** toque real e multitoque, iPhone/Safari, Android, tela cheia, som,
  FPS no aparelho de referência; wild-haggis-survivors (plano B) não foi rodado.
- **Deploy e release:** nenhum. **Revisão:** nenhuma pendente.
- **Bloqueio real:** nenhum.
- **Pendências conhecidas:**
  - `ferramentas/roteador-local.php` dá 403 para qualquer `.json`, então
    `/jogo/<slug>/release.json` falha localmente (resolver na ST-040).
  - A `nota` do `_app/jogos.json` ainda fala em "família logada" (acesso é livre).
- **NEXT:** ST-030 — definir menu, HUD, pausa e fim de Hordas e Dungeons com os tokens
  de `kit/brand/tokens.json`, só nas superfícies necessárias. Em paralelo possível: ST-040
  (manifesto de release + permitir `release.json` no roteador local).

## Outbox (sincronização pendente com o Notion)

Nada pendente.
