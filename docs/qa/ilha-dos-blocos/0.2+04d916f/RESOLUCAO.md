# Resolução — candidata 0.2+04d916f (rodada 2): Reprovada

| Achado | Origem | Correção |
|---|---|---|
| P1 subir/descer voando ~23 blocos/s (`flyForce` só limita a horizontal) | REV-01 e QA-UX | `flyImpulse` 0,7 → medido +5,9 / −5,4 blocos/s |
| P1 voltar ao meio voando encalhava (regressão do `flyForce: 60`) | QA-UX | `flyForce` volta ao padrão; voo desligado e `teleport(0, 50, 0)` (cai do alto; `teleportToTop` esperava chunk e errava a altura). Medido: anda 3,9 blocos/s depois da volta |
| P2 pausa reabria por cima do catálogo (timer de 600 ms) | REV-01 | `clearTimeout` em `sairDoJogo` e a cada volta |
| P2 com o dedo encostado na borda não andava na direção dela | REV-01 | centro lógico a ≥ 16 px da borda da zona — parado: 0 bloco; puxando para a borda: 2,6 blocos |
| P2 aviso por cima do nome do bloco / da mira | QA-UX | no toque o aviso fica logo abaixo da mira; 15 px em pé, 14 px deitado |
| P2 aviso "(E)" no toque; catálogo deitado sem "Pronto"; nomes 12 px | QA-UX | texto do toque com ▦; grade rola com altura limitada; nomes 13 px |

Observação: o "boneco preso" visto também no mundo LOCAL de teste era um buraco no nascimento cavado pelos robôs
(y = 30 faltando em (0,0)); o mundo local foi reparado. O mundo de produção não tem esse buraco.
Robô: `tests/robo-rodada3-0.2.cjs` (física medida com o rAF real).
