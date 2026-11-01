# Decisões técnicas — Hordas dos Blocos e Dungeons dos Blocos

Registro curto das decisões de execução. A fila e o estado vivem no Notion
("Tarefas — Samuel.tech"); este arquivo guarda o que precisa estar junto do código.
Não apagar decisões antigas: acrescentar uma nova com alternativa, motivo e efeito.

## DEC-007 — Linha canônica do repositório (2026-11-01)

- **Decisão:** `origin/main` (portal PHP publicado em samuel.tech) é a linha de trabalho.
- **Alternativa descartada:** o `main` antigo do computador do Boaz (site estático com
  `aventura-pula-pula`, `bichos-contra-a-gosma`, `lab/` e skills em `.claude/`).
  Ele foi preservado na branch local `site-estatico` (0555a19) e não foi apagado.
- **Efeito:** novos jogos seguem o `CLAUDE.md` do portal (`_privado/jogos/<slug>/`,
  `_app/jogos.json`, empacotar → `publicacao` → Hostinger).

## DEC-008 — Base de Hordas dos Blocos (ST-010, 2026-11-01)

- **Decisão:** adaptar **ken-fs/voxel-survivors**, commit
  `cf9f1fccbcb73487ff45b8e3a6619a19b000be86` (2026-10-13), licença MIT
  (© 2026 BubuAi; manter o `LICENSE`). Reaproveitar o núcleo, não a apresentação.
- **Prova executável:** `demos/play/` rodou como arquivos estáticos (sem build), Three.js r186
  já incluído em `vendor/three` (arquivos reais, sem link simbólico). Simulação fixa de 60 Hz
  (`simStep`), level-up pausa a simulação, chefe aos 41 s, morte → Retry zera a partida,
  recorde em `localStorage` (`vs-best`). Joystick de toque move o herói (`?touch=1`).
  Nenhum 404, nenhuma requisição externa na execução local. Ganchos `__stats()` e `__test`.
- **O que entra:** `lib/voxel.js`, `lib/rng.js`, `lib/crowd.js`, `lib/view.js`, `lib/hitfx.js`,
  `lib/events.js` e o laço/sistemas de `demos/play/` (upgrades 1 de 3, ondas, chefe, drops).
- **O que sai ou muda (obrigatório antes de publicar):**
  - Remover o Google Analytics com banner de consentimento (`gtag`, `__GA_ID__`), o artigo
    de SEO, o JSON-LD e os scripts de site/itch/Cloudflare (`scripts/`, `wrangler.jsonc`,
    `.build-env` com ID do GA, `.indexnow-key`, `dist/itch`).
  - Trocar o tema "exército escuro com bandeiras de caveira" por mundo de blocos claro do kit;
    textos em pt-BR; personagens próprios.
  - Ataque é em arco à frente (precisa virar para o inimigo): avaliar mira automática no
    modo Explorador.
  - Dificuldade atual é alta (robô parado morreu aos 50 s; 300+ soldados na tela):
    criar Explorador (3 min, dano reduzido) e limitar a horda para leitura e desempenho.
  - Em 375×812 os botões de habilidade saem da tela e a câmera fica próxima demais.
  - Não há pausa em `visibilitychange`: acrescentar.
  - `demos/play/` tem 7,1 MB por causa de capturas PNG: não copiar as imagens.
- **Versão do Three.js:** r186 isolado no build de Hordas; Turbo e Caça às Estrelas
  continuam com 0.170 (sem tarefa para trocar).
- **Alternativa:** Giftedx/wild-haggis-survivors (Phaser 4, 2D) — **não executada** nesta
  rodada; fica como plano B se o 3D falhar no teste de toque/desempenho (HO-040).

## DEC-009 — Base de Dungeons dos Blocos (ST-010, 2026-11-01)

- **Decisão:** **não** usar cedrickchee/torchline-dungeon como base visual nem copiar seus
  recursos. Usar como **referência de arquitetura** (MIT, commit
  `cf050b9ef0cfa4ebd5015574c19f179b47bffee1`, 2026-06-26): separação `core/` × `render/`,
  `persistence`, `navigation`, cena autorada, gancho de QA com `advance(ms)`. Trechos de
  código podem ser adaptados mantendo o aviso MIT.
- **Motivo:**
  - Recursos: 40 MB de atlas/sprites góticos e áudio `.ogg`; `docs/assets.md` pede para
    confirmar a origem, mas o repositório não documenta a licença/origem das folhas de
    sprites (`assets/source/*`). Visual escuro (caveiras, cripta) e em inglês.
  - Toque: só "tocar para andar" (pointer); sem joystick nem botões de ação.
  - Exige build (Vite 7 + TypeScript); o portal aceita, mas a apresentação teria de ser
    refeita inteira de qualquer forma.
- **Prova executável:** `bun install --frozen-lockfile --ignore-scripts` + `vite build --base ./`
  → `dist/` estático (19 MB) abriu sem 404 nem requisição externa. Combate (Bone Warden,
  Ash Chanter), morte (`killPlayer`) e `R` reinicia com 8 monstros e HP cheio. 120 FPS médios
  no desktop (238 draw calls), `__torchlineQa.metrics()`.
- **Efeito no plano:** DU-010 constrói a sala de masmorra sobre o núcleo de blocos de Hordas
  (`voxel.js` para paredes/chão, mesmo herói, mesmo combate), como o plano já sugeria
  ("compartilhar o núcleo de combate de Hordas"). carlesvallve/voxel-engine continua
  reservado (sem `LICENSE` na raiz).
