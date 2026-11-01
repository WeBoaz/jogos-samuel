# Resolução — candidata 1.0.1+c3c2f99 (rodada 1)

**G2: Reprovada** (REV-01 Reprovado com 1 P1; QA-PERF Aprovado no Mac com 3 P2). A candidata não foi publicada.

| Achado | Origem | Correção na candidata seguinte |
|---|---|---|
| P1-01 medidor ordena todo o histórico a cada 500 ms e pesa no que mede | REV-01 (= QA-PERF P2-1) | `Acumulador` com soma, contadores e histograma fixo de 0,25 ms; anel de 120 quadros para o FPS recente; custo constante (teste com 108 mil amostras) |
| P2-01 quadros ≥ 1 s descartados | REV-01 / QA-PERF P2-2 | todo intervalo com aba visível conta; nova linha "travadas (≥ 1 s)"; p95 acima de 250 ms sai exato |
| P2-02 manifesto lia o disco, zip sai do `git archive` | REV-01 | `release_jogo.py` usa `git ls-files` da pasta do jogo |
| P2-3 resumo abre no meio da tacada e cobre 52% deitado | QA-PERF | resultado congela no fim do tempo; a faixa diz "RESUMO PRONTO: toque em II"; o painel só abre em pausa/menu/placar/fim; deitado ocupa ≤ 52vw (36% medido no WebKit) |

Nova candidata: ver pasta `1.0.1+<commit>` seguinte.
