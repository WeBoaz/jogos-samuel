# G3 — Liberação da prévia ilha-dos-blocos@0.1+ed6a828

- **Decisão (ORQ-01):** Liberada para publicação como prévia (DEC-013), 2026-11-01, a pedido do Boaz.
- **Pacote:** `samuel-site.zip` SHA-256 `af544fc4849d4b1ee66c23634297864cb35b0f3af37217f5226a5efdcebff9ba` (= `git archive b8a4f47`).
  Publicar a cópia congelada.
- **Pareceres:** REV-01 rodada 1 (commit `6bc1d8c`) Reprovado — 2 P1; REV-01 rodada 2 (esta candidata) **Aprovado**, 0 P0/P1.
  Condição C1 (código da ilha sem maiúsculas/espaços e ≤ 40 caracteres) conferida pelo executor sem expor o código: ok.
- **Servidor liberado junto:** binário compilado na VPS do commit `fbaf6ae` (código do servidor igual ao da candidata),
  nginx/systemd de `desenvolvimento/infra/vps/` como estão nesta candidata. Backup corrigido depois (fora do zip):
  não apaga cópias antigas se a nova falhar.
- **Proporcionalidade (14.4):** prévia de um jogo novo de construção, sem dados pessoais nem compras; rodaram REV-01 (2×)
  e as sessões do executor (WebKit contra a VPS com 2 clientes, fluxo do código, servidor fora). QA-UX/QA-PERF/QA-NET
  completos ficam para a release da BLK-065.

## P2 aceitos para a 0.1.1

`?debug&servidor=` só em dev (P2-2); 503 do limite não apagar o código guardado (P2-3); servidor recusar
`ILHA_SEGREDO` vazio ou padrão em produção (P2-4); Enter do código não furar a proteção de tablet (P2-6); avisos de
licença das crates no wasm do mesh-worker (P2-1); aviso "Reconectando…" mais claro; `*.env` no `.gitignore`.

## Não executado

Celular/tablet (fora do escopo da prévia), Safari real, QA-PERF no aparelho, playtest com o Samuel.
