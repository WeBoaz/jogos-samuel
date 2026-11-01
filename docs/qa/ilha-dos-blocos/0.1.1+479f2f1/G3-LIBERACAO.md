# G3 — Liberação de ilha-dos-blocos@0.1.1+479f2f1

- **Decisão (ORQ-01):** liberada, 2026-11-01. Pacote `samuel-site.zip` SHA-256
  `1244fa66ee31b1595d19fb2935c528f01dc2466e58265cd5a07be2a2b4f06629` (= `git archive 17a48f1`).
- **Parecer:** REV-01 Aprovado (0 P0/P1). P2 da 0.1 corrigidos: P2-1 (essencial), P2-2, P2-3, P2-4, P2-6.
- **C2 (servidor na VPS):** binário do commit `479f2f1` instalado (anterior guardado como `.0.1`), systemd com
  `ILHA_PRODUCAO=1` e `RestartPreventExitStatus=2`, nginx 60r/m burst 20. Prova: em produção o binário recusa o código
  de teste (saída 2); serviço real ativo.
- **Força bruta (aceito):** código da família com ~7×10⁷ combinações; no limite por IP (~86 mil tentativas/dia) a média
  passa de 1 ano. Rever se a ilha sair do círculo da família.

## P2 que ficam para a próxima

`window.__ilha` com `?debug` em produção (P2-A, sem exploração prática); código digitado com servidor fora vira
"guardado" no tentar de novo (P2-B) e falta "trocar o código" na tela de conexão; `conferir_segredo` sem trava de
caixa/espaços/40 caracteres (P2-C); aviso "Voltando…" sem fim (P2-E); backup duas vezes na mesma hora (P2-G);
`dlmalloc`/`hashbrown` da std nomeados nos avisos.
