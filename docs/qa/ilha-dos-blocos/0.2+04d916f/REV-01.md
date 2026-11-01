# REV-01 — Revisão de código de `ilha-dos-blocos@0.2+04d916f` (rodada 2)

- **Revisor:** REV-01 (independente), protocolo de QA v1.1 · 2026-11-01
- **Candidata:** commit `92e749c` (manifesto) sobre `04d916f` (código). Diff da correção: `git diff b736b1d 92e749c`.
- **Pacote:** `cand-ilha-02b/samuel-site.zip`, SHA-256 `ada01c869763e95dfa1ea022644611d4e3d1a94ab6ffbea286ef0f88c6ebbc06`
- **Rodada 1:** `b736b1d`, reprovada (`docs/qa/ilha-dos-blocos/0.2+5081b57/REV-01-0.2.md`, `QA-UX-0.2.md`, `RESOLUCAO.md`).
- **Limites:** sem navegador, sem SSH e sem o arquivo do código da ilha. Os achados vêm da leitura do código do jogo, do
  `@voxelize/core` 3.0.0 (`cliente/node_modules/@voxelize/core/dist/index.mjs`) e da crate `voxelize` 3.0.0
  (`~/.cargo/registry/.../voxelize-3.0.0/server`). Nada foi reproduzido em aparelho.

## Resultado: **Reprovado** (0 P0 · 1 P1 · 8 P2)

Cinco dos seis P1 da rodada 1 estão resolvidos no código. O sexto, o voo rápido demais (QA-UX P1-3), só foi resolvido em
parte: a velocidade na horizontal caiu, mas **subir e descer continuam a cerca de 22 blocos/s**. A mudança feita
(`flyForce`) não age no eixo vertical, ao contrário do que dizem o comentário no código e a `RESOLUCAO.md`. A correção é
de uma linha. Pacote, build, testes e servidor estão em ordem.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npx vitest run` (cliente) | 2 arquivos, **12/12** passaram |
| `npx tsc --noEmit` (cliente) | saída 0, sem erros |
| `cargo test --release` (servidor, `CARGO_TARGET_DIR` no scratchpad) | **6/6** passaram |
| `python3 ferramentas/verificar_jogo.py --todos` | todos ✓ (ilha: 7 arquivos, 2,1 MB) |
| zip = `git archive 92e749c` (mesmos caminhos do `empacotar.sh`) | zip de referência com o **mesmo SHA-256** `ada01c86…bc06`; `diff -r` sem diferença, 68 arquivos |
| hashes de `files` no `release.json` × pacote | **6/6 OK** (o próprio `release.json` fica fora da lista, como antes) |
| build reproduzível (`git archive 04d916f` do cliente no scratchpad + `vite build`, `VITE_ILHA_SERVIDOR=https://srv2114451.hstgr.cloud:8443/`) | os 6 arquivos saem com os **mesmos hashes** do `release.json`. O bundle corresponde ao fonte de `04d916f` |
| `git diff 04d916f 92e749c` | só o `release.json` |
| manifesto × catálogo | `release_id` `ilha-dos-blocos@0.2+04d916f.producao`, `source_commit` `04d916f…`; `_app/jogos.json` diz `0.2`, `pronto` |
| cópia do módulo da casa | `cliente/src/controles-toque.js` e `ui-blocos.css` **idênticos** (`cmp`) aos de `desenvolvimento/compartilhado/` |
| outros usos de `controles-toque.js` | só `desenvolvimento/interface/prototipo.html` (protótipo, lê `estado`; segue funcionando). Nenhum outro jogo publicado usa o módulo (o minigolfe só tem o CSS) |
| árvore do repositório depois da revisão | `git status` limpo |

---

## P1 — corrigir antes de publicar

### P1-1 (residual do QA-UX P1-3) · Subir e descer voando continuam a ~22 blocos/s

- **Onde:** `cliente/src/main.ts:41-42`. O comentário diz "com força menor (sobe e desce devagar)" e o código põe
  `flySpeed: 12, flyForce: 60`.
- **Mecanismo:** no motor, `flyForce` só limita o empurrão **horizontal**. O `push[1]` é multiplicado por `|tiltSin|`, que
  vale 0 porque `flyPitchSteering` é 0 (`index.mjs:8031-8077`). Subir e descer vêm de outro lugar: em todo quadro, com ⤒
  ou ⤓ apertado, o motor aplica `applyImpulse([0, ±flyImpulse, 0])` (`index.mjs:8023-8028`), e a velocidade perde
  `flyInertia·dt` por quadro (`:8020-8022`). Com os padrões `flyImpulse 2.5` e `flyInertia 6` (`:7288-7289`), a 60 Hz a
  velocidade-limite é 2,5 / (6/60) ≈ 25 blocos/s. O QA-UX mediu 22 e 21. Nenhum dos dois parâmetros mudou.
- **Cenário:** o Samuel liga o voo e segura ⤒ por 2 s. Ele sobe uns 44 blocos e passa do teto do mundo (`max_height 96`).
  Para cima não há limite nem volta automática (o teleporte em `main.ts:350` só olha `p.y < -8`). Ao segurar ⤓, ele
  desce na mesma velocidade e bate no chão. É o "perder o controle" que o QA-UX descreveu, agora só no eixo vertical.
- **Por que passou:** o robô `tests/robo-correcoes-0.2.cjs` só mede o voo na horizontal (`velVoo`, 8,1 blocos/s). A
  `RESOLUCAO.md` dá o P1 como resolvido com esse número.
- **Correção sugerida:** acrescentar `flyImpulse` em `opcoesControle`. Com 0,7–0,8 a velocidade-limite fica em ≈ 7–8
  blocos/s a 60 Hz, a faixa que o QA-UX pediu. Medir no robô com ⤒ e ⤓ segurados e com o rAF real. O impulso é aplicado
  por quadro, então numa tela a 120 Hz a velocidade dobra; isso já era assim e vale registrar.

---

## P2 — pode seguir; registrar

**P2-1 · Computador: o plano B da pausa pode trocar o catálogo pela pausa (regressão nova).** `main.ts:132`, `:123`,
`:276-281`. Agora o `setTimeout` de 600 ms roda em toda volta ao jogo, inclusive ao escolher um bloco no catálogo. Ele
não é cancelado quando o jogador sai do jogo de novo. Cenário: no computador, o Samuel escolhe um bloco (o catálogo
fecha e o mouse é preso) e aperta **E** de novo em menos de 0,6 s para pegar outro. O catálogo abre, o `unlock` não
mostra a pausa porque o catálogo está visível, mas o timer vê `!isLocked` e chama `mostrar('tPausa')`. O catálogo some e
aparece a pausa. Dá para sair pelo botão "Catálogo" da pausa, e nada se perde. Os outros casos se resolvem sozinhos: se
o lock chega depois dos 600 ms, o ouvinte `lock` esconde a pausa e volta o namespace para `jogo`, e um Esc dentro da
janela só repete a pausa. Correção: guardar o id do timer e dar `clearTimeout` em `sairDoJogo`, ou no timer só agir com
`$('tCatalogo').hidden`.

**P2-2 · Joystick perto da borda: a base não fica sob o dedo, e começar a menos de ~14 px da borda trava o sentido da
borda.** `controles-toque.js:43-46` (fonte única e cópia). O centro lógico agora é o dedo, como o QA-UX pediu, e o
polegar parado não anda mais. Mas a base desenhada continua presa em (76, h−76), então o pino aparece longe do dedo. E
como não há tela além da borda, quem encosta a 12 px da esquerda só consegue arrastar 12 px para a esquerda. Isso dá
eixo ≈ 0,06, abaixo do limiar de 0,1 do `setMovementVector` (`index.mjs:8314-8320`), então o boneco não anda para a
esquerda; na borda de baixo, não anda para trás. Basta tirar o dedo e encostar de novo, mas vale a pena dizer isso ao
QA-UX. Uma saída é desenhar a base no ponto do dedo, limitada só pela borda da tela.

**P2-3 · ⤓ some debaixo do dedo ao pousar (cenário novo).** `main.ts:335-336` e `ilha.css` (`.acoes-voo .descer
{display:none}`). Como o estado do voo agora vem do motor, segurar ⤓ até o chão esconde o botão enquanto o dedo ainda
está nele. O `pointerup` deve chegar ao botão pela captura (`setPointerCapture`, e `display:none` não desconecta o
elemento), mas isso não foi conferido no WebKit do iOS. O robô despacha `pointerup` sintético direto no elemento, o que
não testa isso. Se o `pointerup` se perder, `descer` fica em `botoes` e o próximo voo desce sozinho até a pausa ou o
`blur` soltarem tudo. Risco baixo: conferir no aparelho.

**P2-4 · Servidor: `stats.tick |= 1` depende do intervalo par e desliga o salvamento de entidades.** `servidor/src/
main.rs:42-49`. Conferi na crate: `stats.tick` só é lido por `systems/saving.rs:27` (o `% save_interval`), por
`chunk/updating.rs:1041` (fila de voxels ativos e random ticks, que já estavam congelados com o relógio parado, e a ilha
não tem ticker nem fluido) e por logs de desempenho. A rede usa `dispatch_count` (`broadcast.rs:375`). Com o tick ímpar,
o `DataSavingSystem` não roda mais nenhuma vez. Isso para o `stats.json`, que era o objetivo, e para também o
`queue_save` de entidades (`save_entities` é `true` por padrão). A ilha não registra entidades, então hoje não há efeito.
O truque só vale enquanto `save_interval` for par (o padrão é 300). Quando chegarem a Sobrevivência (com
`does_tick_time(true)`) ou entidades, rever. Lembrete de operação, como o C2 da 0.1.1: a correção só vale com o binário
novo instalado na VPS.

**P2-5 · Aviso a 13 px no celular em pé.** `ilha.css:107`. A caixa agora fica compacta e o texto quebra, mas o texto
passou de 18 px para 13 px em mono. É pequeno para uma criança de 7 anos; o QA-UX já tinha achado 12 px pequeno. Com a
quebra de linha, 15–16 px também cabem (duas linhas em 343 px).

**P2-6 · Celular deitado muito estreito: a barra ainda cobre o ▦.** `ilha.css:110`. A barra deitada mede 9×44 + 8×4 + 12
+ 4 = 444 px a partir de x=12, até x=456. Em 667×375 e 640×360 ela fica longe do ▦ (x≈519 e x≈492). Em 568×320 (iPhone
SE de 1ª geração / 5s) o ▦ começa em x≈420, e a sobreposição é de cerca de 36 px.

**P2-7 · `.nome-bloco` e `#toast` no mesmo `top` no toque.** `ilha.css:106`, `:113`. Quando os dois aparecem juntos, um
fica por cima do outro. Isso já acontecia (+140/+150) e agora ficou exato. É só visual.

**P2-8 · Robô das correções.** `tests/robo-correcoes-0.2.cjs:2` carrega o `playwright-core` por caminho absoluto de outro
projeto e não roda no `vitest` (é o mesmo P2-10 da rodada 1). Faltam três casos: velocidade vertical do voo (o P1
acima), tocar em II com a mira num bloco, e ⤓ segurado com toque real.

Observação, sem defeito: `flySpeed: 12` vale também no computador (`main.ts:42`). O voo com F ficou 3× mais lento lá. O
QA-UX sugeriu isso como opção, mas é uma mudança de comportamento no computador e vale registrar no changelog.

---

## Status dos achados da rodada 1

| Achado | Status | Como conferi |
|---|---|---|
| REV P1-1 · toque na barra/▦/II quebrava o bloco mirado | **Resolvido** | `main.ts:165-168`: `inputs.click` só sem `MODO_TOQUE`. Não sobra nenhum ouvinte de `mousedown` que quebre ou ponha: o `MobileRigidControls` tem `lock`/`connect` vazios (`index.mjs:8347-8355`). O computador continua quebrando e pondo com o mouse (`!MODO_TOQUE` → `inputs.click` left/right em `jogo`). O robô toca a vaga 3 e o ▦ com `touchscreen.tap` real e confere o voxel |
| REV P1-2 · espelho `voando` fora de sincronia | **Resolvido** | `main.ts:335-336` lê `gravityMultiplier === 0` em todo quadro e só mexe na classe quando o valor muda. Botão e F só chamam `toggleFly`, que é uma arrow function (`index.mjs:7629`), então passar `controls.toggleFly` sem `bind` funciona. Pousar, ligar sob teto baixo e dar dois toques rápidos agora deixam o botão igual ao motor (no teto baixo pisca 1 quadro, só visual) |
| REV P2-1 · `stats.json` 60×/s | **Resolvido** (ver P2-4) | tick ímpar nunca é múltiplo de 300 |
| REV P2-2 · Continuar sem plano B | **Resolvido**, com regressão P2-1 | timer em `voltarAoJogo`, com `conectado &&` |
| REV P2-3 · dedo do olhar não era solto | **Resolvido** | `soltarOlhar` em `sairDoJogo` e no `blur` (`main.ts:135`, `:317-318`). Depois disso, o dedo antigo fica ignorado até sair da tela, e um dedo novo funciona |
| REV P2-4 · girar com o dedo no joystick | **Aberto** (P2) | não foi tratado. O QA-UX viu funcionar na emulação |
| REV P2-5 · barra deitada cobre ▦ | **Resolvido** a partir de 640 px (resta P2-6) | `ilha.css:110` |
| REV P2-6 · vagas < 44 px | **Resolvido** (ver QA-UX P1-2) | |
| REV P2-7 · `aria-hidden` com botões focáveis | **Resolvido** | removido. No computador, `.toque` fica `display:none`; na tela inicial, `#hud[hidden] ~ .toque` |
| REV P2-8 · toque em área sem camada | **Resolvido** | mesma causa do P1-1 |
| REV P2-9 · 🪽 é Unicode 15 | **Aberto** (P2) | `index.html:31`, e as dicas da tela inicial |
| REV P2-10 · robô frágil | **Aberto** (P2-8) | |
| QA-UX P1-1 · aviso gigante e cortado | **Resolvido** | `#toast` com `bottom:auto`, `white-space:normal`, `width:max-content`, `max-width:min(520px,100vw−32px)` (`ilha.css:32`). O id vence o `.toast` (`ui-blocos.css:115`, `:176`). Em pé, o aviso fica em y≈200–270 e a mira em y≈332; deitado, em 72 com a mira em ≈187. O computador também foi corrigido |
| QA-UX P1-2 · vagas < 44 px | **Resolvido** | 48 px em pé (grade 5+4, 270×114 px, em y 80–194, abaixo de ▦/II, que vão até y 74) e no tablet; 44 px deitado |
| QA-UX P1-3 · voo rápido | **Parcial → P1-1** | horizontal 12 (medido 8,1); vertical sem mudança, ~22 blocos/s |
| QA-UX P1-4 · polegar parado anda | **Resolvido** (efeito colateral em P2-2) | `centro = {clientX, clientY}` |
| QA-UX P2-1 · joystick digital | **Mitigado** | `maxSpeed 4.5` só no toque (medido 4,3) |
| QA-UX P2-2 · dedo do olhar preso | **Resolvido** | igual a REV P2-3 |
| QA-UX P2-3 · catálogo deitado (Pronto fora da tela, 12 px) | **Aberto** (P2) | |
| QA-UX P2-4 · sobreposições pequenas | **Parcial** | barra×▦ resolvido. A base do joystick ainda encosta em ⛏/🧱 no SE em pé |
| QA-UX P2-5 · tela inicial deitado | **Aberto** (P2) | |
| QA-UX P2-6 · `-webkit-touch-callout` / pinça | **Aberto** (P2) | |
| QA-UX P2-7 · `blur` não pausa | decisão (sem mudança) | |
| QA-UX: "(E)" no aviso do toque | **Aberto**, sem efeito prático | no Criativo o inventário é infinito e as 9 vagas começam cheias: o aviso não aparece |

## Pontos conferidos sem defeito

- **Clicks só no computador.** Com o mouse, `quebrar`/`colocar` seguem em `jogo`. No toque, quebrar e pôr só pelos botões
  ⛏ e 🧱 (`aoApertar`, com `emJogo`).
- **Voo lido do motor.** `controls.body?.gravityMultiplier` é lido depois de `world.isInitialized`. `$('toque')` existe
  também no computador, onde só ganha a classe, sem efeito. `movements.down = voando && descer` usa o estado do quadro.
- **Velocidades.** `maxSpeed 4.5` e `alwaysSprint=false` são aplicados depois do construtor do `MobileRigidControls`, que
  liga o sprint (`index.mjs:8356`). `flySpeed`/`flyForce` passam pelo construtor e valem nos dois modos.
- **Fallback da pausa.** No toque, sai cedo. Na primeira entrada, `conectado` já é `true` quando `voltarAoJogo` roda. Se
  o lock chega depois de 600 ms, o ouvinte `lock` (`main.ts:281`) esconde a pausa e volta para `jogo`. Se a pausa
  aparece no catálogo, é o P2-1. No `tInicio`, `conectado` falso não age.
- **CSS.** A ordem e a especificidade dos blocos novos estão certas: `body.ilha-toque .vaga` vence o `.vaga` estreito do
  computador, e o `@media (max-width:560px)` novo vem depois do `max-width:430px` (gap e padding finais 4/5). O
  `max-height:500px` final volta para `flex` e tira o `translateX`. Em pé (375–412 px), a barra centralizada cabe sem
  rolagem e sem tocar em ▦/II, inclusive com a área segura de cima. No tablet, a barra de 480 px não chega no ▦ (x≈662 em
  810).
- **Módulo de toque.** A mudança é uma linha, igual na fonte e na cópia. `soltarJoy` zera o `centro`. O protótipo da
  interface continua compatível.
- **Servidor.** `stats_mut()` num bloco próprio solta a trava antes de `mundo` sair. O `set_time(MANHA)` continua depois
  de `World::new`, que lê o `stats.json`. Os testes compilam e passam.
