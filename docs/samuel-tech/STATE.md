# Estado — Samuel.tech

Atualizado ao fim de cada sessão (ST-090). Um bloco por sessão, o mais novo em cima.
Vale o que está aqui e no Notion, não a memória do chat.

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
