# G3 — Liberação da candidata minigolfe-dos-pets@1.0.1+c0b67d9

- **Decisão (ORQ-01):** **Liberada para publicação**, 2026-11-01.
- **Pacote liberado:** `samuel-site.zip` SHA-256 `eb76b1220f6eae07e097ed59a4becc98214e04bf434b078958ccb605c9204473`
  (= `git archive` do commit `752744b`). Publicar **esta cópia congelada**, não um zip regerado (o `git archive` de
  outro commit muda as datas dentro do zip e, com elas, o hash).
- **Pareceres G2 desta candidata:** REV-01 Aprovado (0 P0/P1/P2) · QA-PERF Aprovado no escopo Mac (0 P0/P1, 1 P2).
- **Rodada anterior:** `1.0.1+c3c2f99` reprovada (P1 do medidor) — ver `../1.0.1+c3c2f99/RESOLUCAO.md`.

## P2 aceitos (não bloqueiam; fila para a próxima versão)

- QA-PERF P2: com `?fps`, o painel do resumo cobre os botões da pausa até tocar em Fechar (só no modo de teste).
- REV-01 obs.: p95 exato de 40,000 ms aparece como 40,25 (viés pessimista); `release_jogo.py` deve usar `git ls-files -z`.

## Continua não executado (não liberado por este gate)

Toque nativo e meta de 30 FPS no celular de referência (`ROTEIRO-CELULAR.md`, Boaz) e playtest com o Samuel.
RV-MG-001 só fecha com esse resultado.
