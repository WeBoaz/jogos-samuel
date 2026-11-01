# QA-UX / QA-FUNC — Ilha dos Blocos 0.2, rodada 2 (toque)

- **Candidata:** `ilha-dos-blocos@0.2+04d916f` (commit `92e749c`)
- **Protocolo:** QA v1.1, papel QA-UX/QA-FUNC (experiência e funcionamento no toque)
- **Data:** 2026-11-01
- **Ambiente:** cliente dev `http://localhost:5190/?debug` (fonte do commit; conferi que o servidor dev entrega `flySpeed: 12`) e servidor local `127.0.0.1:4100`. Os dois já estavam rodando. Não reiniciei nada.
- **Ferramenta:** Playwright 1.63. WebKit nos perfis Apple, Chromium com SwiftShader no Pixel 7.
- **Física medida só com o `requestAnimationFrame` real.** Nesta rodada não usei `__ilha.avancar()` em nenhum teste.
- **Natureza: só emulação.** Nenhum aparelho real foi testado. Ficaram de fora: gesto nativo, pinça de zoom, menu de toque longo do iOS, 120 Hz (ProMotion), desempenho e calor.

## Resultado: **REPROVADO** (0 P0 · 2 P1)

O que está bom:
- Quatro dos seis P1 da rodada 1 foram resolvidos: aviso, vagas, polegar na borda e o "toque quebra o bloco". O espelho do voo também foi resolvido.
- O núcleo do toque continua inteiro em todos os perfis.
- O computador segue funcionando.

Os dois P1 que reprovam:
1. **P1-A (resto do P1-3 da rodada 1).** Subir e descer no voo continuam a 23–24 blocos/s, a mesma velocidade de antes. Só a velocidade horizontal mudou.
2. **P1-B (novo, regressão desta rodada).** Se o jogo devolve a criança ao meio da ilha enquanto ela voa ("Ops! De volta para o meio da ilha."), ela fica presa. Primeiro o joystick não move no voo. Depois de desligar o voo, ela afunda 1 bloco no chão e não anda. Só um pulo solta. Com o `flyForce` da 0.1.1 isso não acontecia.

## Perfis executados

| Perfil | Viewport | Motor | Girar no meio do jogo |
|---|---|---|---|
| iPhone SE (3rd gen) em pé | 375×667 | WebKit | → deitado |
| iPhone SE (3rd gen) deitado | 667×375 | WebKit | → em pé |
| iPhone 13 em pé | 390×664 | WebKit | → deitado |
| iPhone 13 deitado | 750×342 | WebKit | → em pé |
| iPad (gen 7) em pé | 810×1080 | WebKit | → deitado |
| iPad (gen 7) deitado | 1080×810 | WebKit | → em pé |
| Pixel 7 em pé | 412×839 | Chromium | → deitado 863×360 |
| Computador sem toque | 1366×768 | WebKit e Chromium | — |

Sobre o Pixel 7: os números de velocidade do Chromium com renderização por software não são confiáveis, porque os quadros vêm irregulares (picos de 17–20 blocos/s num teleporte, por exemplo). Para o Pixel, valem o layout e o funcionamento.

Onde estão os dados, em `qa-ilha-01/ux-r2/`:
- Scripts: `qa2.cjs` (bateria completa por perfil), `voo2.cjs` (voo e pulo por quadro), `andar2.cjs` (andar, borda e dois dedos numa sessão nova), `preso.cjs` e `preso2.cjs` (P1-B), `desktop2.cjs`, `inicio.cjs` e `resumo.cjs`.
- JSON: `<perfil>_girar.json`, `voo-*.json`, `andar-*.json`, `preso-*.json`, `preso2.json` e `desktop.json`.
- Capturas: `<perfil>-jogo/aviso-real/aviso-conexao/voando/catalogo/pausa/girado-*.png`, `iPhone-13-afundado.png`, `desktop-*-aviso.png` e `*-inicio.png`.

---

## Status dos P1 da rodada 1

| P1 anterior | Status | Evidência (emulação) |
|---|---|---|
| UX P1-1 aviso gigante e cortado | **Resolvido** | Ver abaixo |
| UX P1-2 vagas < 44 px | **Resolvido** | Ver abaixo |
| UX P1-3 voo rápido demais | **Parcial: segue P1 (P1-A)** | Ver abaixo |
| UX P1-4 polegar parado na borda anda | **Resolvido** | Ver abaixo |
| REV P1-1 tocar na barra/▦/II quebra o bloco mirado | **Resolvido** | Ver abaixo |
| REV P1-2 botão de voo invertido depois de pousar | **Resolvido** | Ver abaixo |

### UX P1-1 aviso — resolvido
- O aviso real ("Aí não: você está nesse lugar!", disparado tocando 🧱 com a mira nos pés) mede 258×31 nos celulares em pé e 320×38 deitado e no iPad. Não cobre a mira em nenhum perfil. A menor distância até a mira é de 30 px.
- O texto mais longo (conexão caída) quebra em 2 linhas: 343–380 px nos celulares em pé e 520×56 nos demais. Nada cortado.
- O aviso some depois de 1,8 s.

### UX P1-2 vagas — resolvido
- Em pé: 48×48, em 2 fileiras (5+4).
- Deitado: 44×44, numa fileira à esquerda.
- iPad: 48×48.
- O espaço entre vagas é de 4 px. Toques a 3 px da borda entre a vaga 5 e a 6, e na base da vaga 1, pegaram a vaga certa em todos os perfis.

### UX P1-3 voo — parcial, segue P1
- Horizontal: **9,7 blocos/s** (antes 40,6). Depois de soltar o joystick, desliza a 4,5–4,8 blocos/s por 300 ms. Isso está ok.
- Subir com ⤒: **23,9 blocos/s**. Descer com ⤓: **22,9 blocos/s**. Antes eram 22 e 21, ou seja, não mudou. Detalhes em P1-A.

### UX P1-4 polegar na borda — resolvido
- Pontos testados: canto (14,H−12), (24,H−20), borda esquerda e borda de baixo, com uma tremidinha de ±3 px. Resultado: eixo (0,0) e **0 blocos** em 0,8 s, nos 8 perfis.
- Partindo do canto, empurrar para cima anda a 4,4 blocos/s.

### REV P1-1 tocar na barra/▦/II — resolvido
Com a mira num bloco do chão, testei em todos os perfis:
- Tocar nas vagas 3 e 8.
- Tocar em ▦ e depois Pronto.
- Tocar em II e depois Continuar.
- Tocar na zona de olhar.
- Tocar num ponto do canvas sem camada.

Nenhum desses toques quebra o bloco mirado nem põe bloco. O toque emulado gerou 7 `mousedown` de compatibilidade no `document`, ou seja, o mecanismo do bug foi exercitado de verdade. Também disparei à mão `mousedown`/`mouseup` com os botões esquerdo e direito sobre a vaga, ▦, II, a zona de olhar, o canvas e o `body`: o bloco continuou intacto.

### REV P1-2 voo invertido — resolvido
A classe `.voando` e o ⤓ seguiram `gravityMultiplier === 0` em todos os casos testados:
- Ligar o voo.
- Descer segurando ⤓ até pousar: em 1,5 s a classe sai e o ⤓ some.
- Ligar de novo: o ⤓ aparece. Descer de novo funciona (pousa e a classe sai).
- Dois toques em 🪽 com 40 ms entre eles.
- Teleporte voando.

---

## P1 — corrigir antes de publicar

### P1-A. Subir e descer no voo continuam rápidos demais (resto do P1-3)
Medido por quadro (60 quadros de 16,6 ms) no iPhone 13 e no iPad deitado (`voo-*.json`), e confirmado em todos os perfis WebKit (`qa2.cjs`):

| Movimento | Velocidade / efeito |
|---|---|
| Subir (⤒ segurado) | **23,9 blocos/s**; ao soltar ainda sobe a 9 blocos/s por 0,4 s |
| Descer (⤓ segurado) | **22,9 blocos/s**; ao soltar ainda desce a 12 blocos/s por 0,3 s |
| Toque curto de 100 ms | ⤒ sobe 1,8 bloco; ⤓ desce 2,4 blocos |
| ⤒ segurado por 1,25 s | **32 blocos acima do chão** (o chão "some") |

- **Cenário:** o Samuel liga o voo e segura ⤒ um pouco. Em um segundo e pouco ele está a 30 blocos de altura. Para voltar, segura ⤓ e despenca a 23 blocos/s. Não é o "devagar" que a RESOLUCAO diz.
- **Causa:** no motor (`@voxelize/core`, trecho de voo do `RigidControls`), a velocidade vertical vem de `flyImpulse` (padrão 2,5, aplicado **a cada quadro**) contra `flyInertia` (6). O `flyForce` só age na horizontal. Em regime: v ≈ `flyImpulse` / (`flyInertia` · dt) ≈ 25 blocos/s a 60 Hz.
- **Risco extra (não testado):** como o impulso é por quadro, num aparelho a 120 Hz a velocidade vertical tende a dobrar.
- **Correção sugerida:** em `opcoesControle`, `flyImpulse` ≈ 0,6–0,8, o que dá cerca de 6–8 blocos/s a 60 Hz. Medir de novo por quadro. O ideal é o robô medir também a vertical, porque ele só mede a horizontal.
- No computador (Espaço no voo) é igual: 23,4 blocos/s no WebKit. Isso já vinha da 0.1.1.

### P1-B. Voando, a volta ao meio da ilha prende a criança (regressão do `flyForce: 60`)
Reproduzido no iPhone 13 em lugar plano (6,5, −2,5), com o `teleportToTop` que o próprio jogo usa (`preso.cjs`, `preso2.json`). Também apareceu em todos os perfis no fim da bateria de voo.

| Passo | Com os valores da rodada 2 (`flyForce` 60 / `flySpeed` 12) | Com a 0.1.1 (300 / 40) | Com o padrão do motor (80 / 40) |
|---|---|---|---|
| No chão, andar 0,6 s | 2,4 blocos | 2,5 | 2,4 |
| Voando → teleporte ao topo → joystick 0,6 s | **0,1 bloco** (preso, flutuando rente ao chão) | 20,1 | 7,3 |
| Desligar o voo → andar 0,6 s | **0 bloco**, y 31,43 (afundou 1 bloco; o normal é 32,43) | 3,2 (afunda, mas sai) | 2,4 |
| Novo teleporte ao topo | continua afundado e parado | — | — |
| Tocar ⤒ (pulo) | solta: volta a andar 2,4 | — | — |

- **Cenário real:** o Samuel voa numa direção. A 9,7 blocos/s, uns 9 s depois passa de ±90. Aparece "Ops! De volta para o meio da ilha." e ele é teleportado **ainda voando**, com o corpo rente ao chão.
  - O joystick não faz nada.
  - Ele toca 🪽 para parar de voar e afunda 1 bloco. A tela parece normal (`iPhone-13-afundado.png`), mas o boneco não anda para lado nenhum.
  - Só o ⤒ solta, e uma criança de 7 anos pode não descobrir isso.
- Reproduzi o caminho real: `teleport(95, 45, 0)` voando → aviso "Ops!" → no meio, andar deu 0,1/1,2/0,1/0,2 blocos nas 4 direções.
- No computador (F) os parâmetros são os mesmos, então espero o mesmo efeito. Não reproduzi lá.
- **Correção sugerida** (qualquer uma serve):
  - Na volta ao meio, desligar o voo antes de teleportar: `if (voando) controls.toggleFly()`. Ou teleportar com folga: `teleportToTop(0.5, 0.5, 1)`.
  - Usar `flyForce` ≈ 80 (padrão do motor) com `flySpeed` 12. Com 80 o boneco não fica preso nem afunda.
  - No robô: voar, teleportar ao topo, desligar o voo e conferir que anda.

---

## P2 — melhorias (podem seguir)

1. **O aviso fica em cima do nome do bloco.**
   - `.nome-bloco` e `#toast` têm o mesmo `top` no toque, em todos os perfis. Quando a criança troca de bloco e logo erra um 🧱, o aviso cobre "Tábuas claras".
   - É só visual (`pointer-events: none`). Sugestão: deslocar o aviso cerca de 36 px para baixo do nome.
2. **Fonte do aviso no celular em pé caiu para 13 px** (antes 18).
   - Agora que o texto quebra linha, não precisa encolher.
   - Sugestão: 15–16 px, pensando em leitura aos 7 anos. Deitado e no iPad já está em 16 px.
3. **"Escolha um bloco no catálogo (E)."** ainda mostra "(E)" no toque. Sugestão: "(▦)".
4. **Celular deitado e estreito: o aviso longo de conexão encosta em ▦/II/🪽.**
   - Cerca de 2 px, no SE e no iPhone 13 deitados (`iPhone-SE-3rd-gen-landscape-aviso-conexao.png`).
   - Só visual. Os avisos curtos não encostam.
5. **Continuam da rodada 1:**
   - Catálogo deitado: o "✓ Pronto" fica fora da tela no SE, no iPhone 13 e no Pixel deitados. Tocar num bloco fecha o catálogo, então dá para usar.
   - Nomes do catálogo com 12 px.
   - SE em pé: a base do joystick encosta (1 px) em ⛏ e 🧱.
   - Tela inicial deitada: o cartão não cabe e rola. O ENTRAR fica visível.
   - Joystick ainda digital: empurrão de 14 px dá a mesma velocidade que o de 60 px. Com 4,4 blocos/s isso pesa bem menos.
   - `blur` solta tudo mas não pausa.
6. **Toque instantâneo (0 ms) em ⤒ não pula.**
   - O `touchscreen.tap` do Playwright aperta e solta dentro do mesmo quadro, então o motor nunca vê o "pular".
   - Com 30, 60 e 100 ms pulou 1,2 bloco nos 3 casos. Um toque real dura mais que um quadro, então o risco é baixo.
   - Correção opcional: guardar o aperto até o próximo `passo()`.
7. **Partindo do canto, a base do joystick fica desenhada uns 70 px longe do dedo.**
   - Exemplo: dedo em (24, 644) e base em (76, 588). O pino aponta para o lado certo.
   - É o efeito esperado da correção (o centro lógico é o dedo). Só registro.
8. **Não testável em emulação (risco):**
   - `-webkit-touch-callout` nas imagens da barra.
   - Pinça começando em `.vaga`/`.mini`.
   - 🪽 (Unicode 15) em iOS antes de 16.4 e Android antes de 14.
   - Velocidade de voo a 120 Hz (ver P1-A).

---

## Verificações que passaram (nada novo quebrado)

### Layout em jogo, nos 8 perfis
- Nenhum alvo de toque menor que 44 px.
- Nada fora da tela. Sem rolagem da página (scroll 0/0 no fim).
- Nenhum toque roubado: centro e 4 cantos internos de cada alvo conferidos com `elementFromPoint`.
- A mira não fica sob nenhum botão. Barra, ▦/II e o aviso não se sobrepõem.
- A única sobreposição medida é a do SE em pé (P2-5).
- Voando, o ⤓ aparece sem sobrepor nada.
- Zona livre de olhar: 55% no iPhone 13 em pé (antes 60%, a barra de 2 fileiras ocupa um pouco), 59% no SE em pé, 66–77% deitado e 87% no iPad. Zona do joystick: 91–94%.

### Funcionamento
- **Andar e olhar com dois dedos, numa sessão nova:**
  - Anda 4,5–4,7 blocos e gira **−55°** para 160 px, como esperado (0,34°/px).
  - A frente fica mantida em 34 de 34 quadros.
  - Ao soltar os dois dedos, eixo e movimentos zeram.
- **Andar:** 4,4–4,5 blocos/s com o joystick no máximo (antes 6,0).
- **Pular:** 1,21 bloco, 3 de 3 vezes, em todos os perfis WebKit. O Pixel varia (renderização por software).
- **Colocar e quebrar pelos botões:** 🧱 põe "Tábuas claras" no voxel mirado, sem mexer no chão mirado. ⛏ tira o mesmo voxel. Limpo em todos os perfis.
- **Catálogo com o dedo no joystick:**
  - Ao abrir: `emJogo` false, eixo (0,0), 0 blocos/s com o menu aberto.
  - Ao escolher um bloco: volta ao jogo. O dedo antigo, parado ou mexendo, não move o boneco.
  - Um dedo novo anda a 4,4 blocos/s.
- **Pausa com ⤒ apertado e um dedo no olhar sem `pointerup`:**
  - Na pausa, `botoes` fica vazio. Ao voltar, o boneco não pula sozinho.
  - Um dedo novo olha −27,5° com o antigo ainda preso. **O P2 da rodada 1 (`soltarOlhar`) foi resolvido.**
- **`visibilitychange` escondido** com joystick, ⤒ e olhar apertados:
  - Pausa e solta tudo. Ao voltar, continua pausado.
  - Depois de Continuar, o olhar funciona (−27,5°).
- **`blur`:** eixo zera, o boneco para (0 blocos) e um dedo novo olha normalmente.
- **Girar o aparelho** com o joystick apertado, nos 7 sentidos:
  - O canvas e o `aspect` se ajustam (ex.: 1500×684, 2,193).
  - O layout de destino segue sem nada pequeno, fora da tela ou roubado.
  - Andar, olhar e o catálogo funcionam depois.
  - Os "anda 0" do SE depois de girar vieram do P1-B (o boneco estava afundado por causa do teste de voo anterior). Na sessão nova (`andar2.cjs`), o SE anda 4,4 blocos/s nos dois sentidos.

### Computador 1366×768 (WebKit e Chromium; trava do mouse simulada, porque o headless não prende o ponteiro)
- `MODO_TOQUE` false, `pointer: coarse` false.
- `.toque` com `display: none`. Nenhum ponto da tela cai na camada de toque (grade de 40 px). O `body` não ganha `ilha-toque`. O ▦ de toque e as dicas de toque ficam escondidos.
- Barra a 12 px da base, vagas de 56 px, sem rolagem.
- **Mouse:**
  - Clique direito real põe o bloco no voxel mirado. Clique esquerdo real tira.
  - `__ilha.colocar()` e `__ilha.quebrar()` também funcionam.
  - Ficou limpo nos dois navegadores.
- **Tecla F:** liga e desliga o voo pelo motor.
- **Aviso no computador:** agora 454×38 no topo (y=12), com 16 px. O "esticado" que vinha da 0.1.1 foi corrigido.

## Limpeza e isolamento
- Cada perfil colocou e removeu 1 bloco em (8, 31, −2). Todos ficaram limpos (`limpo: true`). O mesmo vale para o computador.
- Os testes de colocar "dentro de si" foram recusados pelo jogo.
- Não toquei em servidores, no repositório (`git status` limpo) nem em outras origens.
- Cada execução usou um contexto Playwright novo e descartável.
- As execuções que mexem no mundo rodaram uma de cada vez. A primeira tentativa do `preso.cjs` (em 20,5, 10,5) foi descartada, porque o terreno ali não é plano.
