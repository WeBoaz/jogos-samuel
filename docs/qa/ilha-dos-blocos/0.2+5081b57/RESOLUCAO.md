# Resolução — candidata 0.2+5081b57 (rodada 1): Reprovada

| Achado | Origem | Correção |
|---|---|---|
| P1 tocar na barra/▦/II quebrava o bloco mirado (mousedown sintético depois do toque) | REV-01 | no toque não há `inputs.click`; quebrar/colocar só pelos botões ⛏ 🧱 |
| P1 voo invertido depois de pousar (motor desliga sozinho) | REV-01 | estado do voo lido do motor a cada quadro (`gravityMultiplier === 0`); tecla F e botão só chamam `toggleFly` |
| P1 aviso gigante sobre a mira e cortado | QA-UX | `#toast` sem `bottom`, quebra linha, largura máxima; 13 px em tela estreita |
| P1 vagas < 44 px | QA-UX | 48 px (em pé: 2 fileiras 5+4), 44 px deitado; barra deitada à esquerda |
| P1 voo rápido demais | QA-UX | `flySpeed` 12 e `flyForce` 60 (medido 8,1 blocos/s); andar no toque `maxSpeed` 4,5 (medido 4,3) |
| P1 polegar parado na borda andava sozinho | QA-UX | `controles-toque.js` (fonte única + cópia): centro lógico = onde o dedo encostou (medido 0 blocos) |
| P2 servidor gravava `stats.json` ~60×/s com relógio parado | REV-01 | `stats.tick |= 1` ao iniciar (tick ímpar nunca é múltiplo de 300); conferido: arquivo intocado |
| P2 dedo do olhar preso ao pausar / blur | REV-01, QA-UX | `soltarOlhar()` em `sairDoJogo` e no `blur` |
| P2 "Continuar" sem plano B no computador | REV-01 | fallback da pausa vale para toda volta ao jogo |
| P2 `aria-hidden` com botões focáveis | REV-01 | removido |

Conferido no WebKit (iPhone 13 em pé/deitado, iPad deitado): `tests/robo-correcoes-0.2.cjs`.
