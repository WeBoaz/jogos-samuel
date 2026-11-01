# Estado — Samuel.tech

Atualizado ao fim de cada sessão (ST-090). Um bloco por sessão, o mais novo em cima.
Vale o que está aqui e no Notion, não a memória do chat.

## 2026-11-01 — Claude (Ilha dos Blocos 0.1.1)

- **Publicado:** `ilha-dos-blocos@0.1.1+479f2f1` desde 2026-11-01 17:57 (-03:00); pacote `1244fa66…6629` (= `git archive
  17a48f1`); produção = zip (30/30); sessão real em samuel.tech com o código (entrou, colocou e tirou um bloco).
- **O que mudou:** P2 da 0.1 — `?servidor`/`?codigo` só no dev; código guardado não some numa recusa; Enter respeita o
  aviso de tablet; servidor recusa código fraco em produção (`ILHA_PRODUCAO=1`, sem reinício em laço); nginx 60r/m;
  avisos das crates do wasm. REV-01 Aprovado; G3 em `docs/qa/ilha-dos-blocos/0.1.1+479f2f1/`.
- **VPS:** binário 0.1.1 instalado (0.1 guardado em `/opt/ilha/bin/ilha-dos-blocos-servidor.0.1` para voltar atrás).
- **NEXT:** BLK-030 incremento 2 (porta que abre, girar blocos, exportar/importar, mundos por código) e BLK-040 (toque).
  P2 restantes listados na G3 da 0.1.1.

## 2026-11-01 — Claude (Ilha dos Blocos 0.1 — prévia publicada)

- **Pedido do Boaz:** "Publicar não apareceu no site" → publicar a Ilha. DEC-013.
- **VPS:** chave SSH dedicada (`~/.ssh/samuel_tech_vps`) cadastrada pela API; servidor da Ilha compilado na VPS,
  systemd com usuário `ilha`, nginx :8443 (certificado existente; painel de jogos intacto), backup de hora em hora.
- **REV-01 rodada 1:** reprovado (P1 mundo aberto; P1 avisos de licença) → código da ilha fora do Git/JS + Origin +
  limites no nginx; avisos gerados do bundle real. Mais P2: logs sem IP, `/info` fechado, volta do vazio, aviso de
  reconexão, fallback do pointer lock, backup robusto.
- **Publicado:** `ilha-dos-blocos@0.1+ed6a828` em samuel.tech desde 2026-11-01 16:43 (-03:00); pacote `af544fc4…f9ba`
  (= `git archive b8a4f47`); produção = zip (30/30 arquivos de jogos); REV-01 rodada 2 Aprovado; G3 em
  `docs/qa/ilha-dos-blocos/0.1+ed6a828/`. Sessão real em samuel.tech com o código: entrou, colocou e tirou um bloco.
- **NEXT:** Ilha 0.1.1 com os P2 da G3 (servidor só em dev pelo `?debug`, 503 não apagar código, Enter no tablet,
  avisos das crates do wasm, segredo vazio recusado) → depois BLK-030 incremento 2 e BLK-040 (toque).

## 2026-11-01 — Claude (BLK-030 — Ilha dos Blocos, incremento 1)

- **Feito (local):** servidor Rust da Ilha (32 blocos + água, ilha por seed 2026, save, 127.0.0.1, sem chat) e
  cliente (telas da casa, céu do kit, texturas próprias em código, barra de 9, catálogo de 32, quebrar/colocar).
  Estado detalhado: `docs/jogos/ilha-dos-blocos/ESTADO.md`.
- **Testes:** `cargo test` 5/5, `vitest` 12/12, `tsc` ok; sessão no navegador: quebrar tronco, colocar 3 blocos
  trocando vaga, servidor parado → "a ilha está dormindo" → tentar de novo → tudo persistido.
- **Decisão:** dependências = par publicado `@voxelize/core` 3.0.0 + crate `voxelize` =3.0.0 (ADR atualizada).
- **Não executado:** toque, celular, build de produção/orçamento, VPS.
- **NEXT:** BLK-030 incremento 2 — porta que abre, girar blocos, exportar/importar mundo, mundos por código,
  build ≤ 450 KB gzip, robô da casa de referência.

## 2026-11-01 — Claude (BLK-020 — decisão da base)

- **Decisão:** DEC-012 / `docs/blocos/ADR-001-base.md` — Voxelize `7ae1c20` aceito **com condições** (servidor na VPS
  com `wss://` no iframe; celular real com toque e 30 FPS). Critérios: Recursos, Save, Gameplay e Sustentação aprovados;
  Navegador móvel e Hostinger/infra **inconclusivos por falta de ambiente**.
- **Novos documentos:** `docs/blocos/RECURSOS.md` (licenças; assets do Voxelize não entram), `TESTES.md` (automáticos,
  sessões, orçamento: JS ≤ 450 KB gzip, 30 FPS, ≤ 5 s até jogar, 4 jogadores na VPS), `MATRIZ-FIDELIDADE.md`.
- **Bloqueio real para a condição 1:** acesso SSH/TLS na VPS ainda não configurado (cartão de sessão "Infra da VPS e
  Rust" proposto; Rust já instalado nesta máquina).
- **NEXT:** BLK-030 — esqueleto `desenvolvimento/jogos/ilha-dos-blocos/{cliente,servidor}`, catálogo de 32 blocos com
  texturas próprias, regras de inventário em TS, primeiro trecho jogável local (seed, árvores, quebrar madeira, colocar,
  barra, salvar/reabrir).

## 2026-11-01 — Claude (BLK-010 — provas da base de blocos)

- **Resultado:** Voxelize `7ae1c20` **aprovado como base** (com ressalvas); zardoy **reprovado** para publicação
  (`mc-assets` = recursos extraídos do Minecraft); noa não executado (não foi preciso). Relatório:
  `docs/blocos/BLK-010-PROVAS.md`.
- **Provado:** build servidor Rust + cliente WASM; seed determinística; quebrar/colocar; 2 clientes sincronizados;
  persistência após parada abrupta; reconexão automática; build estático em outra origem; WebKit 26.6 iPad/iPhone;
  API de toque (`MobileRigidControls`); porteiro já entrega `.wasm`.
- **Instalado nesta máquina:** Rust 1.99.1 (rustup, `~/.cargo`, sem mexer no perfil do shell), wasm-pack 0.15.1,
  protoc 36.2 (brew). Clone em `desenvolvimento/provas/` (ignorado pelo Git).
- **Não executado:** aparelho real, VPS/`wss://`, Safari iOS real.
- **NEXT:** BLK-020 (ADR-001, RECURSOS, TESTES, matriz de fidelidade).

## 2026-11-01 — Claude (Minigolfe 1.0.1 — RV-MG-001/003)

- **Publicado:** `minigolfe-dos-pets@1.0.1+c0b67d9` em produção desde 2026-11-01 14:04 (-03:00); pacote SHA-256
  `eb76b122…4473` (= `git archive 752744b`); produção conferida byte a byte (23/23 arquivos de jogos) e rotas 403 ok.
- **O que mudou:** medidor `?fps` (média, p95, quedas, travadas, aparelho/GPU, resumo após 5 min, nada sai do aparelho),
  recordes mesclados entre abas (RV-MG-003), `release.json` com SHA-256 por arquivo (identidade pública verificável).
- **QA:** rodada 1 (`c3c2f99`) reprovada pelo REV-01 (P1: medidor ordenava o histórico) → corrigido; rodada 2 aprovada
  por REV-01 e QA-PERF; G3 em `docs/qa/minigolfe-dos-pets/1.0.1+c0b67d9/G3-LIBERACAO.md`. vitest 53/53.
- **Não executado:** celular real (toque nativo, 30 FPS) — roteiro para o Boaz; iOS Simulator indisponível (sem Xcode
  completo; WebKit 26.6 via Playwright usado como apoio); playtest com o Samuel.
- **NEXT:** resultado do celular → RV-MG-001 → EXP-01-F. Programa de blocos: BLK-010 (Voxelize) depende de Rust + VPS.

## 2026-11-01 — Claude (BLK-000 — programa de blocos)

- **Pedido do Boaz:** programa "Minecraft no navegador, mods, Roblox e arenas de blocos" (v1.1, protocolo de QA G0–G5),
  começando pela BLK-000. Plano aprovado: Voxelize primeiro (noa alternativa, Colyseus para salas); VPS liberada para
  Arena online + servidor família.
- **Checkpoint:** `main` = `dc7628c`, árvore limpa; EXP-01 (Minigolfe) em EXP-01-E publicado, aguardando EXP-01-F;
  revisão RV-MG-001 (P1: identidade pública verificável, toque/30 FPS em aparelho real) vira Minigolfe 1.0.1 antes de
  conteúdo novo. Slug `ilha-dos-blocos` confirmado em `_app/jogos.json`.
- **BLK-000:** Concluída no Notion. BLK-010 Pronta (Voxelize principal; zardoy só auditoria — `mc-assets` são texturas
  extraídas, não publicáveis; noa só se Voxelize reprovar).
- **Bloqueio real para BLK-010:** Rust não instalado; acesso SSH à VPS não configurado (etapa de infra proposta como
  sessão separada).
- **NEXT:** Minigolfe 1.0.1 (`?fps` + página de evidências) → REV-01 + QA-PERF → publicação → BLK-010.

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
