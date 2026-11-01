# REV-01 — Revisão de código de `ilha-dos-blocos@0.2+a2d073f` (rodada 3)

- **Revisor:** REV-01 (independente), protocolo de QA v1.1 · 2026-11-01
- **Candidata:** commit `91acf90` (manifesto) sobre `a2d073f` (código). Diff da correção: `git diff 92e749c 91acf90`.
- **Pacote:** `cand-ilha-02c/samuel-site.zip`, SHA-256 `0a8e541664594e35dcc6fcad829dbefba546175ac4e46fbc39c7db2e285848b1`
- **Rodada 2:** `92e749c`, reprovada (`docs/qa/ilha-dos-blocos/0.2+04d916f/REV-01.md`, `QA-UX.md`, `RESOLUCAO.md`).
- **Limites:** sem navegador, sem SSH e sem o arquivo do código da ilha. Os achados vêm da leitura do código do jogo, do
  `@voxelize/core` 3.0.0 (`cliente/node_modules/@voxelize/core/dist/index.mjs`) e do `@voxelize/physics-engine`
  (`cliente/node_modules/@voxelize/physics-engine/dist/index.js`). Nada foi reproduzido em aparelho nem em navegador.

## Resultado: **Aprovado** (0 P0 · 0 P1 · 7 P2)

Os dois P1 da rodada 2 estão resolvidos no código. O voo vertical agora vem de `flyImpulse: 0.7`, que é o parâmetro
certo. A volta ao meio desliga o voo e cai do alto, e não há laço. Os P2 tratados também estão certos: o timer da pausa,
o aviso abaixo da mira, o texto do aviso no toque e o catálogo deitado (este, só em parte). Não achei regressão que
reprove. Ficam registrados sete P2. Os dois que pesam mais:
- o voo vertical depende da taxa de quadros: ≈ 12 blocos/s a 120 Hz e ≈ 3 a 30 Hz;
- a folga de 16 px do joystick faz o polegar parado a menos de ~2,5 px de uma borda da zona andar sozinho.

Pacote, build reproduzível, testes e servidor estão em ordem.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npx vitest run` (cliente) | 2 arquivos, **12/12** passaram |
| `npx tsc --noEmit` (cliente) | saída 0, sem erros |
| `cargo test --release` (servidor, `CARGO_TARGET_DIR` no scratchpad) | **6/6** passaram, saída 0 |
| servidor × rodada 2 | `git diff 04d916f 91acf90 -- servidor` vazio: servidor igual |
| `python3 ferramentas/verificar_jogo.py --todos` | todos ✓ (ilha: 7 arquivos, 2,1 MB) |
| zip = `git archive 91acf90` (mesmos caminhos do `empacotar.sh`) | zip de referência com o **mesmo SHA-256** `0a8e5416…48b1`; `diff -r` sem diferença, 68 arquivos |
| hashes de `files` no `release.json` × pacote | **6/6 OK**. O `release.json` fica fora da lista, como nas rodadas anteriores |
| build reproduzível: `git archive a2d073f` do cliente no scratchpad + `vite build` com `VITE_ILHA_SERVIDOR=https://srv2114451.hstgr.cloud:8443/` | os 6 arquivos saem com os **mesmos hashes** do `release.json`. O bundle corresponde ao fonte de `a2d073f` (`flyImpulse:.7`, `teleport(0,50,0)` e "catálogo ▦" estão no `index-ByPRRX1C.js`) |
| manifesto | `release_id` `ilha-dos-blocos@0.2+a2d073f.producao`, `source_commit` `a2d073f0…`. `_app/jogos.json`: `pronto` |
| `git diff a2d073f 91acf90` | só o `release.json` (o commit de código o apaga e o de manifesto o recria; o resultado é o esperado) |
| módulo da casa | `cliente/src/controles-toque.js` e `ui-blocos.css` **idênticos** (`cmp`) aos de `desenvolvimento/compartilhado/` |
| árvore do repositório depois da revisão | `git status` limpo |

---

## Status dos P1 da rodada 2

### P1-1 (REV) / P1-A (QA-UX) · subir e descer a ~23 blocos/s → **Resolvido**
- `main.ts:44`: `flyImpulse: 0.7`. Esse é o parâmetro que o motor usa para subir e descer: `applyImpulse([0, ±flyImpulse, 0])`
  em todo quadro com ⤒ ou ⤓ apertado (`index.mjs:8023-8028`), contra o amortecimento `v -= v·flyInertia·dt`
  (`:8020-8022`). Com `flyInertia 6`, a 60 Hz a velocidade-limite teórica é 0,7 / (6/60) = 7 blocos/s. O robô mediu
  +5,9 / −5,4 com o rAF real, e a diferença é o arrasto do ar. Fica na faixa que o QA-UX pediu (6–8).
- `flyForce` voltou ao padrão (80). Com ele, o QA-UX já tinha visto que o boneco não encalha (tabela do P1-B, coluna 80/40).
- O `flyImpulse` só é usado no ramo do voo. Andar, pular (`jumpImpulse`), nadar e o empurrão de 8 do `toggleFly`
  (`:7633`) não mudam.
- Regressão de taxa de quadros: ver P2-1.

### P1-B (QA-UX) · voando, a volta ao meio prendia a criança → **Resolvido**
`main.ts:355-361`: `controls.body.gravityMultiplier = 1` e depois `controls.teleport(0, 50, 0)`, no lugar do
`teleportToTop`. Conferi no motor:
- **O motor não religa o voo sozinho.** `gravityMultiplier = 0` só aparece no `toggleFly` (`:7636`, depois de
  `setTimeout(100)`) e no fantasma (`:7626`, que a ilha não usa). O desligar automático ao pousar (`:7743-7745`) só vai
  de 0 para 1. Resta uma corrida: se a criança toca 🪽 para ligar o voo nos 100 ms antes da volta, o timeout liga o voo
  depois do teleporte. Ela fica voando a y≈52 no meio da ilha. Não prende: ⤓ desce a ~5 blocos/s, e 🪽 desliga. Sem
  defeito prático.
- **Não há laço.** O `teleport` zera velocidade, forças e impulsos e põe o corpo em y = 50 + 1,55/2 + 1 ≈ 51,8
  (`:7505-7516`). Com `positionLerp 1`, `controls.object.position` chega lá no quadro seguinte (x = z = 0,5), e nenhuma
  das condições (`y < −8`, `|x|`/`|z| > 90`) fica verdadeira. Se um degrau automático deixou o `stepLerp 0,6` ativo, a
  posição leva um quadro a mais para passar de 90. Aí o teleporte se repete uma vez para o mesmo ponto, o que é
  inofensivo.
- **Não cai pelo chão se o chunk do meio não estiver carregado.** `World.updatePhysics` não move corpos que estão num chunk
  dentro do mundo e ainda não pronto (`:16424-16436`). O boneco fica parado no alto até o chunk (0,0) chegar e depois
  cai uns 20 blocos (no Criativo não há dano). Esse é justamente o caso que o `teleportToTop` errava (`:7517-7537`: com o
  chunk ausente, ele espera e calcula a altura depois). Com o joystick apertado durante a espera, as forças se acumulam
  (`applyForce` sem passo de física). No primeiro passo sai um empurrão horizontal: ≈ 0,35 bloco/s por quadro
  congelado, que o próprio controle freia em ~0,3 s. É imperceptível.
- **O botão segue o motor.** No quadro seguinte, `passo()` lê `gravityMultiplier === 1`, tira `.voando` e esconde o ⤓
  (`main.ts:340-341`). `movements.down` volta a `false`.
- Vale para o computador (F) também, porque o código está em `passo()`.
- Efeito colateral: ver P2-3 (torre no meio).

## Status dos P2 tratados na rodada 2

| Achado | Status | Como conferi |
|---|---|---|
| REV P2-1 · pausa reabria por cima do catálogo (timer de 600 ms) | **Resolvido** | `main.ts:135-136` (`clearTimeout` + novo id a cada volta) e `:139` (`clearTimeout` em `sairDoJogo`). Percorri todos os caminhos. Sair do jogo para o catálogo ou para a pausa passa por `sairDoJogo` (`abrirCatalogo` `:126`, `pausar` `:143`, `KeyE` `:144`, `bCatalogoPausa` `:294`). Esc ou `blur` no computador geram `unlock` e mostram a pausa pelo ouvinte (`:281-285`); aí o timer pendente só mostra a mesma pausa de novo. O timer não age em `tInicio`/`tConexao` porque exige `conectado`. No toque, `voltarAoJogo` sai antes de armar o timer. `clearTimeout(0)` no início é inofensivo |
| REV P2-2 · joystick encostado na borda não andava na direção dela | **Resolvido em parte** | `controles-toque.js:48` (fonte e cópia idênticas). Encostar a ≥ ~6 px da borda e puxar para ela agora anda. Ficaram dois efeitos: o polegar parado a menos de ~2,5 px de uma borda anda sozinho (P2-2), e a base continua desenhada longe do dedo (`:43-45`) |
| REV P2-5 / QA-UX P2-2 · aviso com 13 px em pé | **Resolvido** | 15 px em pé (`ilha.css:108`). Deitado caiu de 16 para 14 px (ver P2-5) |
| REV P2-7 / QA-UX P2-1 · aviso por cima do nome do bloco | **Resolvido** | `ilha.css:123`: no toque, `top: calc(50% + 30px) !important`. A mira tem 26 px (`:76`), então sobram 17 px entre a mira e o aviso. O nome do bloco fica em +200 px (em pé) e +72 px (deitado), longe do aviso. O `.toast` tem `pointer-events: none` (`ui-blocos.css:116`), então o aviso não rouba toque do joystick nem do olhar |
| QA-UX P2-3 · "(E)" no aviso do toque | **Resolvido** | `main.ts:165` |
| QA-UX P2-5 · catálogo deitado sem "Pronto" à vista, nomes 12 px | **Parcial** | nomes com 13 px (`ilha.css:27`). Grade com `max-height: calc(100vh − 190px)` (`:117`). A minha conta indica que o Pronto ainda fica em parte fora da tela (ver P2-4) |
| `!important` do `#toast` no computador | **Sem efeito no computador** | Todas as regras novas são `body.ilha-toque …`, e a classe só entra com `MODO_TOQUE` (`main.ts:298`). Um notebook com tela de toque e ponteiro fino não ganha a classe. No computador o aviso fica no topo (`ilha.css:32`). Só o `#toast { font-size: 15px }` de `:108` vale também para janelas de computador ≤ 560 px, como já valia o de 13 px. Isso é inofensivo |

---

## P2 — pode seguir; registrar

**P2-1 · O voo vertical depende da taxa de quadros (registro pedido).** `main.ts:44`, `index.mjs:8020-8028`,
`physics-engine/dist/index.js:289-291`.
- **Mecanismo:** o motor soma o impulso `flyImpulse` em todo quadro, e a física dá um passo por quadro, com o `delta`
  real (`World.update`, `:18351` → `updatePhysics`). Já o amortecimento é proporcional a `dt`. A velocidade-limite fica
  em v ≈ `flyImpulse` / (`dt`·(`flyInertia` + arrasto)), ou seja, cresce com a taxa de quadros.
- **Valores**, calibrados pelos 5,9 blocos/s medidos a 60 Hz:

  | Taxa de quadros | Subir/descer |
  |---|---|
  | 120 Hz (Android de 120 Hz) | **≈ 12 blocos/s** |
  | 90 Hz | ≈ 9 blocos/s |
  | 30 Hz (iPhone no modo Pouca Energia, aparelho fraco) | ≈ 3 blocos/s |

- **Por que é P2:** 12 blocos/s é a metade do que reprovou e igual ao `flySpeed` horizontal já aceito. O Safari do iOS
  costuma limitar o rAF a 60 Hz.
- **Correção de uma linha** (o motor lê `this.options` em todo quadro, `:7901-7923`): em `passo()`, antes de
  `controls.update()`, fazer `controls.options.flyImpulse = 0.7 * 60 * Math.min(0.1, dtDoQuadro)`.
- O robô só mede a 60 Hz.

**P2-2 · Joystick: polegar parado a menos de ~2,5 px de uma borda da zona anda sozinho (efeito da folga de 16 px).**
`controles-toque.js:48` (fonte única e cópia).
- **Conta:** `centro` fica a pelo menos 16 px da borda, e o dedo parado fica a e px dela. A distância em repouso é 16 − e.
  O motor só anda com o eixo acima de 0,1 (`index.mjs:8314-8320`), e o eixo vale (d/52 − 0,18)/0,82. Isso passa de 0,1
  com d > 13,6 px, isto é, com e < **2,4 px**. Uma tremidinha de 3 px para o lado da borda alarga a faixa para e < ~5 px.
  Como o joystick é digital, ali o boneco anda na **velocidade máxima** (4,5 blocos/s) para o lado da borda.
- **Quando acontece:** o eixo só é calculado no `pointermove`, então basta o dedo tremer.
- **Quais bordas:** a esquerda da tela (anda para a esquerda) e a de baixo (anda para trás). A folga também vale nas
  bordas internas da zona, o topo (40 % da altura) e a direita (46 % da largura). Ali ela não é necessária, porque o dedo
  pode passar da zona (há captura). Encostar a menos de 2,4 px do topo da zona faz andar **para frente** parado.
- **O que o robô testou:** só e = 6 px, sem tremida. O QA-UX da rodada 2 testou pontos a ≥ 12 px.
- **Por que é P2:** a faixa é estreita. Na borda da tela, o sistema muitas vezes fica com o toque (gesto de voltar, barra
  de início).
- **É uma troca inevitável:** com qualquer folga C, parar a e = 0 dá d = C, e puxar para a borda também dá no máximo
  d = C. Não dá para ter "parado não anda" e "puxar até a borda anda" nos dois extremos.
- **Sugestões:**
  - aplicar a folga só nas bordas da tela (esquerda e baixo, não no topo e na direita da zona);
  - usar C ≈ 13 px, com que o polegar parado nunca anda e puxar até a borda fica no limite;
  - ou tratar dedo a ≤ 2 px da borda da tela como "puxando até o fim".

  QA-UX: testar e = 0–4 px com tremida de ±3 px, nas quatro bordas da zona.

**P2-3 · A volta ao meio vai para y = 50 fixo e pode pôr a criança dentro de uma construção (regressão pequena).**
`main.ts:359`. O `teleportToTop` olhava a altura do chão, e o novo `teleport(0, 50, 0)` não olha.
- **Cenário:** no Criativo, o Samuel constrói uma torre bem no meio, (0, 0), passando de y = 50 (o chão ali fica em
  ~31). Depois ele cai da ilha. A volta põe o corpo dentro dos blocos da torre e ele fica preso, sem voo, até quebrar os
  blocos em volta.
- O nascimento tem o mesmo limite (`initialPosition [0.5, 48, 0.5]`, `:44`), então o risco já existia na entrada. A
  volta antes não tinha.
- **Correção:** usar `Math.max(50, world.getMaxHeightAt(0, 0) + 1)` quando o chunk (0,0) estiver pronto, e 50 quando não
  estiver.

**P2-4 · Catálogo deitado: o "✓ Pronto" ainda deve ficar em parte abaixo da tela nos celulares baixos.** `ilha.css:117`.
- **Conta para 667×375:**

  | Parte | Altura |
  |---|---|
  | margens da `.tela` | 24 |
  | bordas | 4 |
  | barra `.exe` | ≈ 33 |
  | padding do corpo | 24 |
  | título | 30 |
  | dica | ≈ 27 |
  | grade (`100vh − 190`) | 185 |
  | ações (`margin-top 8` + `.btn` com `min-height: var(--alvo)` = **64 px**) | 72 |
  | **total** | **≈ 399 px** |

- Isso dá cerca de 24 px a mais que a tela. No iPhone 13 deitado, a área segura de baixo soma mais ~9.
- A `.tela` rola (`overflow: auto`), e tocar num bloco fecha o catálogo, então nada trava. A `RESOLUCAO` diz "o Pronto
  fica à vista", mas não consegui medir sem navegador.
- **Sugestão:** `calc(100vh − 240px)`, ou o Pronto ao lado do título quando deitado. **QA-UX: medir.**

**P2-5 · Aviso deitado caiu de 16 para 14 px; texto longo encosta em botões nos menores.** `ilha.css:124`, `:123`.
- **Fonte:** o QA-UX tinha dito que deitado já estava bom com 16 px. Agora, com `max-width: 44vw`, ficou com 14 px.
- **Em pé (375×667):** o aviso começa em y≈364. Os avisos com duas linhas ou mais vão até y≈415–433, e o `.acoes-voo`
  (⤒ 🪽) começa em y≈403 (`:95`). Exemplos: "Esse é o fundo da ilha: não dá para quebrar." e o aviso de conexão. O aviso
  cobre ~12–30 px do alto desses botões por 1,8 s.
- **Deitado em 568×320:** o aviso longo cobre ~17 px da borda esquerda do ⛏.
- Pelas minhas contas, os avisos de uma linha não encostam.
- **Por que é P2:** é só visual (`pointer-events: none`), e o toque passa por baixo.
- **Código morto:** o `!important` deixa sem efeito as regras de `top` do `#toast` em `:75`, `:84`, `:107` e `:115`.
  Dá para tirá-las.

**P2-6 · Robô da rodada 3.** `tests/robo-rodada3-0.2.cjs:1` carrega o `playwright-core` por caminho absoluto de outro
projeto (`02_ANDAIME/Andaime-Gestao-V2`) e não roda no `vitest` (é o P2-8 da rodada 2, que continua).
- **O que ele já cobre:** agora mede subir e descer, a volta ao meio, a borda a 6 px e o catálogo no computador.
- **O que falta:**
  - borda a 0–2 px com tremida (P2-2);
  - toque em II com a mira num bloco;
  - ⤓ segurado com toque real;
  - medida a 120 Hz.
- No teste do computador, `isLocked = true` é posto à mão. Ele confere o timer, mas não o fluxo real de trava do mouse.

**P2-7 · Continuam abertos da rodada 2 / 1 (sem mudança no código).**

| Achado | Onde | Situação |
|---|---|---|
| ⤓ some debaixo do dedo ao pousar (REV P2-3 R2) | `ilha.css:66-67` | conferir `pointerup` no WebKit do iOS |
| `stats.tick \|= 1` (REV P2-4 R2) | servidor, igual | lembrete de operação: o binário novo precisa estar na VPS |
| barra deitada × ▦ em 568×320 (REV P2-6 R2) | `ilha.css:111` | sem mudança, ~36 px de sobreposição |
| base do joystick longe do dedo (QA-UX P2-7 R2) | `controles-toque.js:43-45` | sem mudança |
| girar com o dedo no joystick (REV P2-4 R1) | — | sem mudança |
| 🪽 é Unicode 15 (REV P2-9 R1) | `index.html:31` | sem mudança |
| tela inicial deitada, `-webkit-touch-callout`, pinça, `blur` sem pausa, toque de 0 ms em ⤒ (QA-UX R2) | — | sem mudança |

**Observação, sem defeito:** `flyImpulse 0.7` e `flySpeed 12` valem também no computador. Subir com Espaço no voo
passou de ~23 para ~6 blocos/s. É coerente com o pedido, mas é uma mudança de comportamento no computador e vale ir para
o changelog.

---

## Pontos conferidos sem defeito

- **Ordem do quadro:** `passo()` lê o voo do motor antes de aplicar o toque e só depois chama `controls.update()`. A
  volta ao meio roda depois de `controls.update()`, e o teleporte vale no `update` do quadro seguinte. `world.update` usa
  a posição antiga por um quadro, o que é inofensivo.
- **`controls.body`** sempre existe depois do construtor (`index.mjs:8219`). O `if (controls.body)` é só defesa.
- **Timer da pausa:** ver a tabela acima. Nenhum caminho deixa o timer vivo depois de sair do jogo.
- **Folga do joystick:** o `centro` é limitado pelo `getBoundingClientRect()` da própria zona, então não depende da área
  segura. `soltarJoy` zera o `centro`. O protótipo `desenvolvimento/interface/prototipo.html` continua compatível, porque
  só lê `estado`.
- **CSS:** a ordem e a especificidade dos blocos novos estão certas. No toque, `#toast` com `!important` vence os quatro
  `top` anteriores. As regras de deitado (`max-height: 500px`) vêm depois das de em pé e não se cruzam com o tablet
  (810×1080 e 1080×810 ficam fora das duas consultas, com aviso de 16 px). `.grade-catalogo` com `max-height` deitado
  também vale para janelas baixas de computador, o que é inofensivo e até ajuda.
- **Pacote:** só contém os caminhos do site. O robô, com o caminho absoluto, fica em `desenvolvimento/` e não é publicado.
