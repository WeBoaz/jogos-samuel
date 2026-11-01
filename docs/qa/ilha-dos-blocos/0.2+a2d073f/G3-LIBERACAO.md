# G3 — Liberação de ilha-dos-blocos@0.2+a2d073f (controles de toque)

- **Decisão (ORQ-01):** liberada, 2026-11-01, a pedido do Boaz ("fazer para mobile/iPad/celular … e depois publicar").
- **Pacote:** `samuel-site.zip` SHA-256 `0a8e541664594e35dcc6fcad829dbefba546175ac4e46fbc39c7db2e285848b1` (= `git archive 91acf90`).
- **Servidor liberado junto:** binário do commit `04d916f` (código do servidor igual ao da candidata): relógio parado de manhã
  no Criativo e sem gravar `stats.json` a cada tick.
- **Histórico de G2:** rodada 1 (`b736b1d`) reprovada — REV-01 2 P1, QA-UX 4 P1; rodada 2 (`92e749c`) reprovada — 1 P1 (REV-01)
  e 2 P1 (QA-UX); rodada 3 (esta) **REV-01 Aprovado e QA-UX Aprovado**, 0 P0/P1.
- **Medido (emulação WebKit/Chromium):** andar 4,4 blocos/s; voo 12,5 horizontal, +6,5/−6,5 vertical; olhar ~0,34°/px;
  vagas 44–48 px; tocar na barra não quebra bloco; voo segue o motor; volta ao meio sem encalhar; computador igual.

## P2 aceitos para a 0.2.1

Velocidade vertical do voo depende da taxa de quadros (≈13 blocos/s a 120 Hz) → escalar `flyImpulse` pelo tempo do quadro;
polegar colado (≤ 3 px) na borda do joystick ainda anda; `teleport(0, 50, 0)` não olha torres acima de y 50; avisos de 2–3
linhas cobrem o topo do 🪽 no celular em pé; robôs com caminho absoluto do Playwright.

## Não executado

Aparelho real (iPhone/iPad/Android), Safari real, 120 Hz, playtest com o Samuel.
