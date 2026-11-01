# QA-UX / QA-FUNC — Ilha dos Blocos 0.2 (toque)

- **Candidata:** `ilha-dos-blocos@0.2+5081b57` (commit `b736b1d`)
- **Protocolo:** QA v1.1 — papel QA-UX/QA-FUNC (experiência e funcionamento no toque)
- **Data:** 2026-11-01
- **Ambiente:** cliente dev `http://localhost:5190/?debug` (código `ilha-local`) + servidor local `127.0.0.1:4100`, os dois já rodando (não reiniciei nada)
- **Ferramenta:** Playwright 1.63, com WebKit para os perfis Apple e Chromium (headless com SwiftShader) para o Pixel 7
- **Natureza:** **só emulação.** Nenhum aparelho real foi testado. Ficaram de fora: gesto nativo de arrastar, pinça de zoom, menu de toque longo do iOS, rolagem nativa, desempenho e calor.

## Resultado: **REPROVADO** (nenhum P0, 4 P1)

O que funciona bem:
- O núcleo do toque funciona em todos os perfis: andar e olhar ao mesmo tempo com dois dedos, pular, colocar e quebrar mirando, voar e descer, trocar bloco pela barra.
- Catálogo e pausa param o movimento e nada fica "apertado" ao voltar.
- `visibilitychange` pausa e solta tudo.
- Girar o aparelho no meio do jogo funciona.
- O computador continua igual.

Por que foi reprovado:
- O aviso (toast) cobre a mira com um bloco amarelo enorme e tem texto cortado.
- Os botões da barra de blocos são menores que 44 px.
- O voo é rápido demais para uma criança.
- O polegar parado perto da borda faz o personagem andar sozinho.

Todos os quatro têm correção pequena.

## Perfis executados

| Perfil | Viewport | Motor | Girar no jogo |
|---|---|---|---|
| iPhone SE (3rd gen), em pé | 375×667 | WebKit | → deitado 667×375 (extra) |
| iPhone 13, em pé | 390×664 | WebKit | → deitado |
| iPhone 13, deitado | 750×342 | WebKit | → em pé |
| iPad (gen 7), em pé | 810×1080 | WebKit | → deitado |
| iPad (gen 7), deitado | 1080×810 | WebKit | → em pé |
| Pixel 7, em pé (Android) | 412×839 | Chromium 1243 | → deitado 863×360 |
| Computador sem toque | 1366×768 | WebKit e Chromium | — |

Capturas e dados brutos ficam em `qa-ilha-01/ux-02/`:
- Capturas: `<perfil>-inicio/jogo/avisos/voando/catalogo/pausa/girado-*.png`, `*-aviso-real.png` e `desktop-*.png`.
- JSON: `*_girar.json`, `metricas-*.json`, `joystick-borda.json` e `raf-iPhone-13.json`.
- Scripts: `qa-toque.cjs`, `metricas.cjs`, `borda.cjs`, `raf.cjs`, `pulo2.cjs` e `desktop.cjs`.

Os cenários são meus. O robô de referência foi lido, mas não reaproveitado.

Como os arrastos foram simulados:
- Cada dedo é um PointerEvent sintético com `pointerType:'touch'` e `pointerId` próprio.
- O evento vai para o elemento em `elementFromPoint`. Os movimentos seguintes vão para o mesmo alvo, para imitar a captura do ponteiro.
- Toques simples usam `touchscreen.tap` nativo.

---

## P1 — corrigir antes de publicar

### P1-1. O aviso (toast) vira um bloco amarelo gigante sobre a mira, com texto cortado no celular
**Cenário:** no iPhone 13 em pé, mirar no chão logo abaixo dos pés e tocar 🧱.
- Aparece o aviso real "Aí não: você está nesse lugar!" numa caixa de **356×322 px**, de y=160 a y=482. Ela cobre a mira e o meio da tela por 1,8 s.
- Tamanho da caixa nos outros perfis:
  - iPad em pé: 356×738
  - iPad deitado: 356×468
  - Pixel 7: 356×497
  - iPhone 13 deitado: 356×170, cobrindo ⛏, ▦, a barra e a base do joystick
- Captura: `iPhone-13-aviso-real.png` e `iPhone-13-avisos.png`.

**Causa:** `.toast` em `ui-blocos.css` define `bottom: calc(…+170px)`. Ao mesmo tempo, `#toast` (computador) e `body.ilha-toque #toast` (toque) definem `top`. Com topo e base definidos, a caixa estica.

**Texto cortado.** O aviso usa `white-space: nowrap` em mono 18 px:

| Aviso | Largura | Cortado em |
|---|---|---|
| "Esse é o fundo da ilha: não dá para quebrar." | 507 px | SE, iPhone 13, Pixel |
| "Ops! De volta para o meio da ilha." | 399 px | SE, iPhone 13 |
| "Escolha um bloco no catálogo (E)." | 388 px | SE |
| Aviso de conexão caída | 821 px | todos os celulares e o iPad em pé |

O aviso de conexão caída também fica parado na tela até a conexão voltar.

**Já existia no computador:** a 1366×768 a caixa tem 356×574, de y=12 até perto da barra (`desktop-*-aviso.png`). Ou seja, o problema já está em produção desde a 0.1.1. No toque ele ficou mais visível e passou a cortar o texto.

**Correção sugerida:**
- Em `ilha.css`: `#toast { bottom: auto; white-space: normal; max-width: calc(100vw - 32px); text-align: center; }`.
- No toque, trocar "(E)" por "(▦)".

### P1-2. Botões da barra de blocos menores que 44 px (regra do kit)
**Cenário:** iPhone SE, iPhone 13 e Pixel 7 em pé.
- As 9 vagas medem **34×34 px**. Em celular deitado medem **40×40 px**. Só o iPad tem 56×56.
- O kit pede no mínimo 44 px, e o próprio projeto declara 64 px para jogos (`--alvo`).
- Funcionalmente o toque acerta: tocar a vaga 3 e a vaga 9 e tocar a 3 px da borda da vaga 5 selecionam a vaga certa. Mas para dedos de 7 anos o risco de errar a vaga é alto.

**Sugestões** (com BARRA=9, 9×44 não cabe em 375 px):
- Em pé: barra em duas linhas (5+4) de 48–52 px abaixo de ▦/II.
- Deitado: vagas de 44 px com espaço de 2 px (cerca de 420 px de largura), afastando a barra de ▦.
- Veja P2-4: no SE deitado a barra de 408 px já encobre 18 px de ▦.

### P1-3. Voo rápido demais para criança no toque
Medido no iPhone 13, só com `requestAnimationFrame` (`raf-iPhone-13.json`):

| Movimento | Velocidade |
|---|---|
| Voo na horizontal | **40,6 blocos/s** (`flySpeed` padrão 40) |
| Subir (⤒) | 22 blocos/s |
| Descer (⤓) | 21 blocos/s |
| Andar (comparação) | 5,1–6 blocos/s |

- Depois de soltar o joystick, o personagem ainda desliza (média de 22 blocos/s nos 300 ms seguintes).
- O joystick é digital (ver P2-1): qualquer empurrão já dá velocidade máxima.
- Com o limite da ilha em ±90 blocos, 2 a 3 s de joystick levam até a borda. Aí vem o teleporte "Ops!" e o aviso gigante do P1-1.
- Para o Samuel, isso é perder o controle.

**Sugestão:**
- No toque, `controls.options.flySpeed` ≈ 10–12 e subir/descer ≈ 6–8 blocos/s.
- Considerar o mesmo no computador.

### P1-4. Polegar parado perto da borda faz o personagem andar sozinho
**Cenário:** encostar o polegar, sem arrastar, nos últimos ~67 px da esquerda ou de baixo da tela (`joystick-borda.json`).

| Perfil | Ponto | Resultado |
|---|---|---|
| iPhone 13 | canto (24, 644) | eixo (−0,68; 0,73) → anda para trás e para a esquerda, **3 blocos em 0,5 s** |
| iPhone 13 | borda de baixo (78, 640) | para trás |
| iPhone 13 | borda esquerda (20, 498) | para a esquerda |
| iPhone 13 deitado | mesmos pontos | mesmo resultado |
| iPad deitado | mesmos pontos | mesmo resultado |
| todos | sobre o desenho do joystick | eixo 0, não anda (correto) |

**Causa:** em `controles-toque.js` o centro do joystick é limitado (x ≥ 76, y ≤ altura−76) e não fica embaixo do dedo. O dedo já começa "empurrado".

Criança apoia o polegar no canto. O boneco anda para trás sozinho, rumo à água ou a um barranco.

**Correção sugerida:**
- O centro lógico deve ser o ponto onde o dedo encostou. Só o desenho da base deve ser limitado.
- Alternativa: tratar o primeiro toque como zona morta até o dedo se mover.

---

## P2 — melhorias

1. **Joystick digital.** Qualquer empurrão além da zona morta já dá velocidade máxima. O motor (`setMovementVector`) usa um limiar de 0,1.
   - Empurrão leve de 14 px: 5,9 blocos/s. Empurrão máximo de 60 px: 6,0 blocos/s.
   - Não dá para andar devagar perto da beira.
   - Sugestão: velocidade proporcional ao eixo, ou andar mais devagar no toque (≈4,5 blocos/s).
2. **Dedo do olhar pode ficar "preso".**
   - Cenário: dedo na zona de olhar → tocar II → Continuar, e o `pointerup` do primeiro dedo nunca chega.
   - Resultado: um dedo novo não gira a câmera (0°) até o antigo ser solto. Depois de solto, volta a 27,5°.
   - Causa: `sairDoJogo()` e o `blur` soltam joystick e botões, mas não zeram o `dedo` da zona de olhar em `main.ts`.
   - Num aparelho real a captura do ponteiro costuma entregar o `pointerup`, então o risco é baixo. Correção de uma linha.
3. **Catálogo com o celular deitado** (iPhone 13 e SE deitados, Pixel deitado).
   - O botão "✓ Pronto" fica fora da tela e só 7 blocos aparecem. A grade rola dentro de uma tela que também rola (rolagem dupla).
   - Tocar num bloco já fecha o catálogo, então dá para usar.
   - Os nomes dos blocos têm **12 px**: pequeno para leitura aos 7 anos. Sugestão: 14–16 px. O mesmo vale para "modo criativo · prévia" (11,5 px) na tela inicial.
4. **Sobreposições pequenas.**
   - iPhone SE deitado (perfil extra): a barra (z-index igual, vem depois no DOM) cobre 18 px da esquerda do ▦. Tocar no centro do ▦ funciona; tocar na borda esquerda pega a vaga 9.
   - Nome do bloco encosta 2 px na barra em celular deitado e no iPad (só visual).
   - iPhone SE em pé: a base do joystick em repouso encosta (1 px) em ⛏ e 🧱, e a zona do joystick (172 px) termina 5 px depois do começo dos botões. Os botões ficam por cima e não roubaram o toque, mas o polegar fica colado nas ações.
5. **Tela inicial com o celular deitado.** O cartão não cabe inteiro: o link "trocar o código" fica cortado embaixo. O botão ENTRAR (248×64) aparece.
6. **Não testável em emulação (risco).**
   - Menu de toque longo do iOS sobre as imagens da barra (`<img>` sem `-webkit-touch-callout: none`).
   - Pinça de zoom começando em `.vaga` e `.mini` (`touch-action: manipulation`).
   - Sugestão: `-webkit-touch-callout: none` e `touch-action: none` também nesses botões.
7. **`blur` solta tudo mas não pausa** (`visibilitychange` pausa). O comportamento é aceitável; registro só para decisão.

### Nota para o QA e para o robô (não é defeito do produto)
`window.__ilha.avancar()` chamado enquanto o `requestAnimationFrame` também roda **atrapalha a física**: `atRestY` fica preso em 0 e o pulo só funciona na primeira vez (`pulo.cjs`).
- Só com `requestAnimationFrame`, 5 de 5 pulos funcionaram (altura 1,24) e toques de 20, 40, 60 e 90 ms pularam (`pulo2.cjs` e `raf.cjs`).
- O robô `robo-toque-webkit.cjs` usa `avancar` e pode mascarar ou inventar falhas de física.
- O `setDirection()` de depuração também não atualiza o quaternion móvel. O próximo arrasto do olhar "pula" de volta, o que é artefato de teste.

---

## Verificações que passaram

### Layout em jogo (todos os perfis)
- Nada fica fora da tela.
- Não há rolagem da página (`scrollWidth/Height` = viewport; `scrollX/Y` = 0 no fim).
- Nenhum alvo tem o toque roubado: centro e 4 cantos internos testados com `elementFromPoint`.
- A mira não fica sob nenhum botão.
- Medidas dos botões:
  - ▦ e II: 64×64.
  - Ações em pé: ⛏ e 🧱 76×76, ⤒ 104×104, 🪽 64×64.
  - Ações deitado: 64, 84 e 56 px.
  - ⤓ aparece só voando e não sobrepõe nada.
- Zona livre de olhar: 60% (iPhone 13 em pé) a 86% (iPad) da metade direita. Zona do joystick: 91–94%.
- Textos do HUD e da pausa têm 16 px ou mais. Dicas da tela inicial: 15 px.
- No toque aparecem só as dicas de toque.

### Funcionamento
- **Dois dedos:** joystick (id 11) e olhar (id 12) juntos, em todos os perfis:
  - O boneco anda 3,1–4,9 blocos em 40 quadros, e a frente fica mantida em 39–40 dos 40 quadros enquanto gira.
  - A câmera gira **−55,0°** para 160 px, exatamente o esperado: 160 × 0,5 × 0,012 rad.
  - Ao soltar os dois dedos, eixo e movimentos zeram.
- **Pular:** altura de 1,21–1,26 bloco. O botão afunda (`.on`). Segurar o botão faz pular de novo (2 a 4 pulos em 2 s).
- **Colocar e quebrar** em todos os perfis: tocar 🧱 põe "Tábuas claras" no voxel mirado e tocar ⛏ remove o mesmo bloco. Tentar pôr um bloco dentro de si mostra o aviso e não põe nada.
- **Voar:** 🪽 liga o voo, ⤓ aparece, ⤒ sobe e ⤓ desce. Tocar 🪽 de novo desliga e o ⤓ some.
- **Barra:** tocar a vaga 3 escolhe a vaga 3 e tocar a 9 escolhe a 9. O jogo continua (`emJogo` = true).
- **Catálogo com o dedo ainda no joystick:**
  - Ao abrir: `emJogo` = false, eixo (0,0), sem movimentos e deslocamento 0 com o menu aberto.
  - Ao escolher um bloco: volta ao jogo e a vaga 1 recebe o bloco.
  - Com o dedo antigo ainda encostado, o boneco fica parado (0 m), mesmo se esse dedo se mexe (fica ignorado, sem nada "apertado").
  - Um dedo novo no joystick volta a andar.
- **Pausa com ⤒ apertado:** na pausa, `botoes` fica vazio e `.on` some. Depois de Continuar, o boneco não pula sozinho.
- **`visibilitychange` (escondido)** com joystick, ⤒ e olhar apertados: a pausa abre, `emJogo` vira false e tudo é solto. Ao voltar, continua pausado até tocar Continuar. Depois de `pointercancel`, o olhar volta a funcionar.
- **`blur`:** eixo zera e o boneco para (0 m em 30 quadros).
- **Girar o aparelho** com o joystick apertado (iPhone 13, SE, iPad e Pixel, nos dois sentidos):
  - O canvas e o `aspect` se ajustam (ex.: 1500×684, 2,193).
  - O layout em CSS de deitado é aplicado sem nada fora da tela nem rolagem.
  - O dedo que segurava continua valendo até ser solto.
  - Depois de girar: o olhar funciona, o catálogo abre e fecha e o jogo segue em andamento.
  - O teste de andar logo após girar deu 0 em alguns perfis por obstáculo no terreno de spawn. Nas medições limpas, andar funciona em todos os perfis.

### Sensibilidade do olhar e velocidade de andar
O olhar tem ganho constante de **0,34°/px** (`OLHAR_PX` 0,5 × 0,012 rad).

| Perfil | Meia largura | Graus por meia largura |
|---|---|---|
| iPhone SE | 175 px | 59° |
| iPhone 13 | 182 px | 62° |
| Pixel 7 | 193 px | 65° |
| iPhone 13 deitado | 362 px | 124° |
| Pixel 7 deitado | 419 px | 143° |
| iPad em pé | 392 px | 134° |
| iPad deitado | 527 px | 180° |

- Na vertical é o mesmo ganho (ex.: 1/6 da altura do iPhone = 38°). Olhar para o chão e para o céu para perto de ±88°.
- Arrastar para a direita vira para a direita; arrastar para baixo olha para baixo.
- No vidro isso dá cerca de 18–21° por cm em todos os aparelhos.
- **Avaliação:** adequado para criança no celular em pé; um pouco rápido em celular deitado e no tablet (meia tela vira 124–180°).
- **Sugestão (opcional):** `OLHAR_PX` ≈ 0,4 (≈ 0,27°/px, ≈ 15–16°/cm) e validar com o Samuel.

**Andar:** 5,9–6,0 blocos/s, sempre na velocidade máxima (joystick digital, ver P2-1).
- **Sugestão:** ≈ 4,5 blocos/s no toque, ou velocidade analógica.

Os números do Pixel 7 vêm do Chromium com renderização por software: a física roda com quadros irregulares e as velocidades medidas lá são menos confiáveis. O layout e o funcionamento lá são válidos.

### Computador (1366×768, sem toque), WebKit e Chromium
- `MODO_TOQUE` = false e `pointer: coarse` = false.
- A camada `.toque` tem `display: none` e o `body` não ganha a classe `ilha-toque`.
- Aparecem as dicas de teclado; as de toque ficam escondidas.
- O ▦ de toque tem `display: none`.
- A barra fica embaixo (12 px da borda) com vagas de 56×56. Não há rolagem.
- Sem gesto real, a trava do mouse falha no headless e o jogo cai na tela de pausa com "▶ Continuar", que é o caminho previsto no código.
- **Continua igual à 0.1.1**, inclusive com o mesmo defeito do aviso esticado (P1-1).

## Limpeza e isolamento
- Coloquei e removi 1 bloco por perfil, sempre no voxel (6,31,−2) em lugar plano longe do spawn. Todos voltaram a 0 (`limpo: true`). Nenhum bloco foi colocado "dentro de si" (o jogo recusou).
- Não toquei em servidores, no repositório nem em outras origens. Cada execução usou um contexto Playwright novo e descartável, então nada ficou no localStorage. Os scripts de depuração temporários foram apagados.
- Observação: o mundo local já tinha blocos alterados no spawn (voxels em 29–31 perto de (1,1)) antes dos meus testes. `git status` mostra `servidor/src/main.rs` modificado, mas não fui eu.
