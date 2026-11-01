# QA-UX / QA-FUNC — Ilha dos Blocos 0.2, rodada 3 (toque)

- **Candidata:** `ilha-dos-blocos@0.2+a2d073f` (commit `91acf90`)
- **Protocolo:** QA v1.1, papel QA-UX/QA-FUNC (experiência e funcionamento no toque)
- **Data:** 2026-11-01
- **Ambiente:** cliente dev `http://localhost:5190/?debug` e servidor local `127.0.0.1:4100`, os dois já rodando. Não reiniciei nada.
  - Conferi que o servidor dev entrega a fonte do commit: `flyImpulse: 0.7`, `teleport(0, 50, 0)` e o centro do joystick a 16 px da borda.
- **Ferramenta:** Playwright 1.63. WebKit nos perfis Apple, Chromium com SwiftShader no Pixel 7.
- **Física medida só com o `requestAnimationFrame` real.** Não usei `__ilha.avancar()` em nenhum teste.
- **Natureza: só emulação.** Nenhum aparelho real foi testado. Ficaram de fora: gesto nativo, pinça, toque longo do iOS, 120 Hz, desempenho e calor.
- **Nascimento conferido antes de começar:** o chão em (−3..3, −3..3) está inteiro em y = 30, sem buraco.

## Resultado: **APROVADO** (0 P0 · 0 P1 · P2 abaixo)

- Os 2 P1 da rodada 2 estão resolvidos em todos os perfis WebKit e no caminho 100% real (voar do meio até passar da borda).
- Os P2 da rodada 2 foram tratados.
- Não achei regressão bloqueante.
- Há uma regressão parcial **pequena** do antigo P1-4 (polegar parado encostado na borda do joystick). Pela faixa muito estreita (0–3 px da borda, 0–7 px do canto), classifiquei como P2, com confirmação recomendada em aparelho real. Detalhes em P2-1.

## Perfis executados

| Perfil | Viewport | Motor | Girar no meio do jogo |
|---|---|---|---|
| iPhone SE (3rd gen) em pé / deitado | 375×667 / 667×375 | WebKit | → o outro sentido |
| iPhone 13 em pé / deitado | 390×664 / 750×342 | WebKit | → o outro sentido |
| iPad (gen 7) em pé / deitado | 810×1080 / 1080×810 | WebKit | → o outro sentido |
| Pixel 7 em pé (e deitado em `andar3`) | 412×839 (863×360) | Chromium | → deitado |
| Computador sem toque | 1366×768 | WebKit e Chromium | — |

- **Pixel 7:** como na rodada 2, as velocidades do Chromium com renderização por software não são confiáveis (quadros irregulares). Exemplos: voo vertical de 0,3 blocos/s, andar 0–4,5. No Pixel valem só layout e funcionamento.

### Onde estão os dados (`qa-ilha-01/ux-r3/`)

- **Scripts:**
  - `qa3.cjs`: bateria por perfil (com giro).
  - `borda3.cjs` e `real3.cjs`: P1-B pelo caminho real e variantes.
  - `andar3.cjs`: andar, borda do joystick e dois dedos, numa sessão nova.
  - `desktop3.cjs`, `torre.cjs`, `nasc.cjs`, `plano.cjs`, `preso3.cjs` e `resumo3.cjs`.
- **JSON:** `<perfil>_girar.json`, `borda-iPhone-13.json`, `real-iPhone-13.json`, `andar-*.json`, `desktop3.json` e `torre.json`.
- **Capturas:**
  - `<perfil>-jogo/aviso-real/aviso-conexao/voando/ops/catalogo/pausa/girado-*.png`
  - `iPhone-13-ops-real.png` e `torre-meio.png`

---

## Status dos P1 da rodada 2

| P1 anterior | Status | Evidência (emulação) |
|---|---|---|
| P1-A subir/descer voando ~23 blocos/s | **Resolvido** | Ver abaixo |
| P1-B voltar ao meio voando encalhava | **Resolvido** | Ver abaixo |

### P1-A — resolvido
Medido em todos os perfis WebKit, com o relógio real:

| Medida | Rodada 2 | Rodada 3 |
|---|---|---|
| Subir com ⤒ segurado | 23,9 blocos/s | **6,5–6,6 blocos/s** |
| Descer com ⤓ segurado | 22,9 blocos/s | **6,3–6,8 blocos/s** |
| Ao soltar ⤒ (inércia) | — | 2,8–2,9 blocos/s por 0,4 s |
| ⤒ segurado 1,2 s | 32 blocos acima do chão | **9,7 blocos acima do chão** |
| Toque curto de 100 ms | sobe 1,8 / desce 2,4 | **sobe 0,8–0,9 / desce 0,7 blocos** |

- Descer segurando ⤓ até o chão: pousa em 1,2 s. A classe `.voando` sai e o ⤓ some. Ligar de novo e descer também funciona.
- Computador (WebKit): Espaço sobe a 6,6 blocos/s e Shift desce a 6,0.
- Risco que continua: o impulso é por quadro, então a 120 Hz a vertical tende a dobrar (~13 blocos/s). Mesmo assim fica abaixo dos 23 de antes. Não testável em emulação.

### P1-B — resolvido
Caminho 100% real (`real3.cjs`, iPhone 13):
1. Do meio, ligar 🪽, subir 1,5 s com ⤒ e voar para +x só com o joystick.
2. Em 7,2 s aparece "Ops! De volta para o meio da ilha." O voo é desligado na hora (`gravityMultiplier` 1, `.voando` fora).
3. Cai do alto (y ≈ 52) e pousa em y = 32,43, a altura normal, sem afundar.
4. Depois disso:
   - anda 2,4–2,5 blocos em 0,6 s nas 4 direções;
   - 🪽 liga o voo e voa;
   - 🪽 de novo desliga, pousa em 32,43 e volta a andar.

Variantes (`borda3.cjs`), todas pousam em 32,43 e andam 2,4 blocos/0,6 s nas 4 direções:
- voando alto (y 70) e passando da borda −z;
- segurando ⤓ na hora da volta;
- segurando ⤒ na hora da volta;
- com o dedo ainda no joystick durante a volta;
- andando (sem voo) até cair da borda.

Na bateria (`qa3.cjs`), a mesma sequência passou nos 6 perfis WebKit: "Ops!", pousa em 32,43, anda 2,4 nas 4 direções, pula 1,21, voa, anda voando, para de voar e anda.

Risco extra conferido (`torre.cjs`): a criança construiu no meio da ilha na altura da volta, com blocos em (0, 49–52, 0). O boneco fica em cima e anda normalmente para fora (3,3 / 1,5 / 2,4 / 2,4). Blocos removidos (`limpo: true`).

---

## Status dos P2 da rodada 2 / REV-01

| P2 | Status | Evidência |
|---|---|---|
| Aviso por cima do nome do bloco | **Resolvido** | Ver abaixo |
| Fonte do aviso 13 px no celular em pé | **Resolvido** | 15 px em pé, 14 px no celular deitado, 16 px no iPad |
| "(E)" no aviso do toque | **Resolvido** (fonte) | Ver abaixo |
| Catálogo deitado sem "Pronto" | **Resolvido** | Ver abaixo |
| Nomes do catálogo 12 px | **Resolvido** | 13 px |
| Dedo encostado na borda: puxando para a borda não andava | **Resolvido** | Ver abaixo |
| Computador: E logo depois de voltar reabria a pausa | **Resolvido** | Ver abaixo |

**Aviso por cima do nome do bloco.** O aviso agora fica 17 px **abaixo** da mira em todos os perfis. No aviso real ("Aí não…") com "Tábuas claras" na tela, `avisoSobreNome` deu false nos 7 perfis.

**"(E)" no aviso do toque.** O código usa `MODO_TOQUE ? 'Escolha um bloco no catálogo ▦.' : '… (E).'`. Não dá para disparar de verdade: o inventário de teste tem as 9 vagas cheias. O texto do toque foi medido e cabe (303×35 em pé, 284×33 deitado).

**Catálogo deitado.** "✓ Pronto" fica visível e tocável (`elementFromPoint`) no SE, no iPhone 13 e no Pixel deitados, e também depois de girar. A grade rola (altura de 152 px no iPhone 13 deitado) e o último bloco é alcançável. A página não rola.

**Puxar para a borda do joystick.** Encostado a 6 px da borda e puxando para ela, anda a 4,3–4,4 blocos/s para a esquerda, para trás e na diagonal do canto, nos 7 perfis (`andar3.cjs`).

**E logo depois de voltar ao jogo (computador).** Testei Esc (sai da trava), Continuar e E depois de 50, 150 e 400 ms:
- o catálogo abre e continua sozinho 900 ms depois, sem a pausa por cima;
- o Pronto volta ao jogo com o mouse preso e sem tela;
- passou no WebKit e no Chromium.

Com a trava recusada pelo navegador, a pausa volta (proteção mantida) e E não abre nada fora do jogo.

---

## P0 / P1
Nenhum.

## P2 — melhorias (podem seguir)

### 1. Regressão parcial do antigo P1-4: polegar parado **colado** na borda do joystick anda sozinho
Medido numa sessão nova no meio da ilha (`andar3.cjs`, 7 perfis WebKit iguais). O polegar fica parado com uma tremidinha de ±2 px:

| Onde o polegar para | Resultado |
|---|---|
| A 3 px da borda esquerda ou da de baixo | anda **1,0–1,2 bloco** em 0,8 s (para a esquerda / para trás) |
| A 5 px do canto inferior esquerdo | anda **2,1–2,3 blocos** na diagonal |
| A 7 px do canto | anda 0,5 bloco |
| A 5–7 px da borda, 9 px do canto, (14,H−12), (24,H−20), (10,¾H), (20%W,H−10) | **0 bloco** (antes também 0) |

- **Causa:** o centro lógico fica a 16 px da borda. Com o dedo a ≤ 3 px, a distância passa de ~13,6 px. Isso equivale à zona morta de 0,18 × 52 px mais o limiar de 0,1 do `setMovementVector` do motor.
- **Cenário:** a criança apoia o polegar bem na quina da tela (iPhone sem moldura) e o boneco anda devagar para trás e para a esquerda.
- **Por que P2 e não P1:** a faixa é de 0–3 px (cerca de 0,5 mm) na lateral e 0–7 px no canto. É raro o centro do contato de um polegar parado ficar tão colado no vidro, e o pedido da REV (puxar para a borda anda) exige alguma margem. **Confirmar em aparelho real.**
- **Sugestão:** guardar o deslocamento inicial (dedo − centro) no `pointerdown` e só considerar o eixo além dele. Ou só usar o centro deslocado depois que o dedo mexer mais de ~4 px na direção da borda. Só reduzir os 16 px não resolve: com 12 px, puxar para a borda daria eixo ≈ 0,06, abaixo do limiar de 0,1 do motor, e deixaria de andar.

### 2. Aviso de 2–3 linhas encosta ou cobre o 🪽 no celular em pé
- Afeta "Esse é o fundo da ilha: não dá para quebrar." e o aviso de conexão caída.
- No iPhone 13 em pé e no SE em pé o aviso fica em y 362–412 (2 linhas). No SE o de conexão tem 3 linhas, 343×67. Ele cobre o topo do 🪽 (`iPhone-13-aviso-conexao.png`).
- Os avisos curtos ficam a 3–7 px do 🪽.
- É só visual (`pointer-events: none`). O de conexão, porém, fica na tela até a conexão voltar.
- **Sugestão:** limitar a largura no celular em pé, para não passar da coluna do 🪽. Por exemplo, `max-width: calc(100vw - 2*(largura do 🪽 + 16px))`. Ou subir o aviso de conexão para cima da mira.
- Deitado, no iPad e no Pixel em pé: folga de 11 a 250 px.

### 3. Voo horizontal subiu para ~12,5 blocos/s
- Antes eram 9,7 blocos/s. O `flyForce` voltou ao padrão, então agora a velocidade chega ao `flySpeed` 12.
- No trajeto real foram 12,6 blocos/s (de 0 a 88 em 7 s). Isso é cerca de 3× a velocidade de andar (4,4) e bate com o valor de projeto.
- Só registro. Se o responsável quiser o "devagar" da rodada 2, a sugestão é `flySpeed` 9–10.

### 4. O que continua das rodadas anteriores
- SE em pé: a base do joystick encosta em ⛏ e 🧱 (sobreposição medida; já registrada antes).
- Catálogo deitado: a segunda fileira aparece cortada pela rolagem. Funciona, mas a dica de que dá para rolar é fraca (`iPhone-SE-3rd-gen-landscape-catalogo.png`).
- Joystick digital: 14 px dá a mesma velocidade que 60 px.
- `blur` solta tudo mas não pausa.
- Toque instantâneo (0 ms) em ⤒ não pula.
- Não testável em emulação: `-webkit-touch-callout`, pinça começando numa vaga, 🪽 em sistemas antigos, 120 Hz.

### 5. Notas para quem roda os testes
Nada disso é do jogo.
- `teleportToTop` com o boneco **voando**, seguido de desligar o voo, deixa o boneco afundado 1 bloco (y 31,43). O jogo não usa mais `teleportToTop` (conferi com `grep`), então isso só afeta robôs e testes. Os robôs devem usar `teleport`.
- **Blocos estranhos perto do lugar de teste (6,5; −2,5):** (9, 31, −2) id 28, (10, 31, −3) id 11 e (10, 31, −4) id 14.
  - Eles atrapalham testes de andar nesse lugar: meus primeiros números de "andar = 0" na bateria vieram daí e de lá. Refiz tudo no meio da ilha.
  - Não sei se foram postos por outros robôs. Não os removi, porque não tenho certeza de que são meus: todos os meus colocar/quebrar terminaram com `limpo: true`.
  - Recomendo conferir e limpar o mundo LOCAL.
- No computador, a trava do mouse recusada gera uma promessa rejeitada sem tratamento. No meu teste ela vinha do mock (`"negado"`). Só aparece no console.

---

## Regressão geral (passou)

### Layout em jogo, nos 7 perfis de toque e depois de girar
- Nenhum alvo menor que 44 px. Vagas de 48 px em pé (2 fileiras) e 44 px deitado.
- Nada fora da tela, nenhum toque roubado (`elementFromPoint` no centro e nos 4 cantos de cada alvo).
- Sem rolagem da página (scroll 0/0). Voando, sem sobreposição.
- Única sobreposição: SE em pé, joystick × ⛏/🧱 (P2-4).
- Zona livre de olhar: 55% (iPhone 13 em pé), 59% (SE em pé), 66–71% deitado e 87% no iPad.

### Funcionamento, nos 6 perfis WebKit (Pixel: só funcionamento)
- **Andar:** 4,4 blocos/s, com empurrão leve ou máximo, para a frente, para trás e para o lado (`andar3.cjs`).
- **Dois dedos (andar e olhar juntos):** anda 4,4–4,7 blocos e gira −55° para 160 px. A frente fica mantida em 34 de 34 quadros. Ao soltar, eixo e movimentos zeram.
- **Pular:** 1,21 bloco, 3 de 3 vezes.
- **Colocar e quebrar pelos botões:** 🧱 põe, ⛏ tira, o chão mirado fica intacto e o lugar fica limpo.
- **Tocar na barra não quebra o bloco mirado.** Testei:
  - toque nas vagas 3 e 8;
  - ▦ e depois Pronto;
  - II e depois Continuar;
  - toque na zona de olhar e no canvas;
  - `mousedown`/`mouseup` sintéticos (botões esquerdo e direito) sobre a barra, ▦, II, o olhar, o canvas e o `body`.

  Em nenhum caso o bloco quebrou ou foi posto. O toque emulado gerou 7 `mousedown` de compatibilidade, então o mecanismo do bug foi exercitado.
- **Barra:** as vagas 1, 3, 5, 6 e 9 respondem. Toque a 3 px da divisa pega a vaga certa.
- **Catálogo com o dedo no joystick:**
  - ao abrir: `emJogo` false, eixo zerado, o boneco não anda;
  - ao escolher um bloco: volta ao jogo e o dedo antigo, parado ou mexendo, não move o boneco;
  - um dedo novo anda 4,4.
- **Pausa com ⤒ apertado e um dedo no olhar sem `pointerup`:** na pausa `botoes` fica vazio. Ao voltar, o boneco não pula sozinho e um dedo novo olha −27,5°.
- **`visibilitychange` escondido:** pausa e solta tudo, continua pausado ao voltar, e o olhar funciona depois.
- **`blur`:** o boneco para (0 blocos) e um dedo novo olha.
- **Girar com o joystick apertado:** o `aspect` se ajusta e o layout de destino fica limpo. Andar (4,4–4,5), olhar e o catálogo (Pronto visível e tocável) funcionam depois.
- **Erros de página:** nenhum, nos 7 perfis.

### Computador 1366×768 (WebKit e Chromium, trava do mouse simulada)
- Camada de toque invisível (`display: none`), 0 pontos sobre ela, sem `ilha-toque`, sem rolagem.
- Barra a 12 px da base, vagas de 56 px.
- Clique direito põe e clique esquerdo tira, no voxel mirado. A API também funciona. Ficou limpo.
- F liga e desliga o voo. W voando: 8,1 blocos/s (WebKit).
- Aviso no topo: 454×38, 16 px.
- E depois de Continuar: ver a tabela de P2 acima.

## Limpeza e isolamento
- Cada perfil colocou e tirou 1 bloco em (8, 31, −2): `limpo: true`. O computador também.
- `torre.cjs` pôs 4 blocos em (0, 49–52, 0) e tirou: `limpo: true`.
- Não toquei em servidores nem no repositório (`git status` limpo, HEAD `91acf90`).
- Cada execução usou um contexto Playwright novo e descartável. As execuções que mexem no mundo rodaram uma de cada vez.
