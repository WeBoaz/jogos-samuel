# QA de UI — Minigolfe dos Pets

Data: 2026-11-01 · Build testado: `_privado/jogos/minigolfe-dos-pets/` (commit 1235b79), servido em
`http://localhost:8770/jogo/minigolfe-dos-pets/index.html?debug` e no player do portal
(`/jogar/?jogo=minigolfe-dos-pets`). Navegador embutido, aba própria, tamanhos 1366×768, 375×812 e
812×375. Nenhum arquivo do projeto foi alterado; só este relatório foi criado.

## Resumo

| | Nota | Em uma frase |
|---|---|---|
| **Beleza da cena 3D** | **5/10** | Base técnica boa (sombras suaves, bandeira ao vento, pets com personalidade, confete), mas a câmera quase zenital, a pista da mesma cor do gramado, o tone mapping que lava as cores do kit e obstáculos "de bloco" (gira-gira = tábua, casinha = laje vermelha, lago = piscina) deixam tudo com cara de protótipo. |
| **Telas DOM** | **6,5/10** | Fiel ao kit (cartões `.exe`, borda 2 px, sombra sólida, Courier 900, verde/ouro) e alvos ≥ 64 px em todo lugar, mas o medidor de força e a dica escondem a bola, o placar corta o Total no celular, o menu rola nos dois formatos de celular e há muito texto pequeno (12–13 px). |

Os três problemas que mais pesam, em ordem:
1. **Durante a mira a bola some** atrás do medidor de FORÇA (desktop e celular deitado) — UI-01.
2. **A câmera põe a bola colada na borda de baixo** (91 % da altura) e a dica de toque cobre a bola — UI-02.
3. **Seta da mira e pista quase sem contraste**: seta renderizada `#dcd6ad` sobre green `#8bc867` = 1,35:1; green da pista × gramado = 1,1:1 — UI-03, UI-04.

## Como foi medido

- `__minigolfe.configurar/jogar/tacar/avancar/proxima/pausar` para chegar em cada tela; gesto de mira
  simulado com `PointerEvent` (`pointerdown` + 6 `pointermove`, sem soltar).
- `getBoundingClientRect`, `scrollWidth/scrollHeight`, `getComputedStyle` em todas as telas e tamanhos
  (script que lista alvos < 64 px, elementos fora da tela e telas que rolam).
- Cores reais da cena lidas do canvas (cópia do quadro num `requestAnimationFrame` após o render) e
  contraste WCAG calculado.
- "Lupa": `transform: scale()` temporário no `canvas#jogo` para ver detalhes da cena (só em tempo de
  execução).

Resultados objetivos que passaram:
- **Nenhuma rolagem horizontal** do documento em 1366, 375 e 812 (`scrollWidth` = largura).
- **Todos os botões/links visíveis ≥ 64×64 px** em todas as telas e tamanhos (o script não achou nenhum menor).
- HUD respeita safe area (`env(safe-area-inset-*)`) e os botões 🔊/II ficam a 10 px da borda.
- Console sem erros.
- Contraste DOM: tinta/papel 11,9:1; tinta/ouro 9,5:1; cinza `#526568`/creme 6,0:1; floresta/papel 6,2:1.

## Descrição das capturas (a ferramenta não salva arquivos)

- **Menu 1366×768:** cartão 860×603 centrado; logo com sombra verde+tinta; 3 pílulas de dica; 4 botões de jogadores só com corações de 18 px (muito vazio); 7 botões de pista com emoji 24 px e rótulo 12 px; "← Jogos", "▶ JOGAR!" e selo de recorde. Fundo: copas de árvores vistas de cima sob véu escuro.
- **Cena sem o menu (pista 1):** pista estreita no meio de um campo enorme e plano, vista quase de cima; pista e gramado do mesmo verde; árvores em anel; pets minúsculos nos cantos do tee.
- **HUD + jogada 1366×768:** bola a ~91 % da altura, metade coberta pela pílula dourada "👆 Puxe para trás e solte!" (dica y 647–691 px; bola ≈ 698 px). Pets cortados pela borda inferior.
- **Mira:** seta creme clara, quase invisível sobre o verde; pontinhos brancos finos; anel-alvo amarelo pequeno. Medidor de força embaixo, cobrindo a bola (pista 6 desktop; pista 1 deitado).
- **Acerto ("BURACO EM UMA!"):** câmera fechada no buraco, aviso branco-contornado exatamente em cima do buraco e do confete; pets fora do quadro.
- **Placar 1366:** tabela-planilha 16 px, cabeçalho com emojis de 12 px, linha "par", Total em ouro. **375:** tabela de 392 px num cartão de 351 px — coluna 6 e **Total cortados**.
- **Pausa:** cartão pequeno com ▶ Continuar grande e 3 secundários; sem 🔊.
- **Fim:** "PISTA COMPLETA! 🎉", pódio em linhas; empate 1-1-1 dá três 🥇 e o último recebe 🎖️; texto "1 tacadas".
- **Pistas 2–6:** pista 2 girada 45° (câmera alinhada tee→buraco) e Gatinho sozinho longe, no gramado; pista 3 sem nenhuma leitura de rampa; pista 4 casinha vista só como telhado retangular vermelho; pista 5 gira-gira = tábua bege com cone; pista 6 lago retangular azul-claro com moldura bege, ponte sem guarda-corpo, flores e pedra boiando no lago.
- **Portal:** janela `.exe` dentro de janela `.exe`; em 1366×768 o "▶ JOGAR!" fica abaixo da dobra.

## Achados

Severidade: **P0** impede/atrapalha muito jogar · **P1** feio ou confuso para a criança, corrigir antes de mostrar · **P2** acabamento · **P3** detalhe.

### Interface e leitura do jogo

| ID | Sev. | Tela / tamanho | O que está errado | Correção específica |
|---|---|---|---|---|
| UI-01 | **P0** | Mira · 1366×768 e 812×375 | O `.medidor-forca` (fixo embaixo, 32 px de altura, `bottom: 18px`) **cobre a bola e o tee enquanto a criança mira**. Medido em 812×375: barra y 325–357, bola ≈ y 340. Em 1366×768 (pista 6) a bola some atrás da barra. | `minigolfe.css` `.medidor-forca`: tirar de baixo. Sugestão: `top: calc(max(10px, env(safe-area-inset-top)) + 70px); bottom: auto;` (abaixo do HUD) ou barra vertical à direita (`right: max(14px, env(safe-area-inset-right)); top: 50%; width: 34px; height: min(220px, 50vh)`). Somado a UI-02 a bola nunca fica embaixo de nada. |
| UI-02 | **P1** | Jogada · todos, pior em 1366 e 812 | A câmera centra a caixa bola+buraco, então a **bola fica a ~91 % da altura**, colada na borda, com Doguinho e Gatinho cortados. A `.dica-toque` (bottom +60 px) cobre a metade de cima da bola em 1366×768. | `main.ts` `enquadrarParaTacada()` / `camera.ts` `enquadrar()`: alvo da câmera em `lerp(bola, buraco, 0.42)` (não o centro da caixa) e margem 2,4 em vez de 1,7, para a bola ficar a ~70 % da altura com os pets inteiros. Mover `.dica-toque` para cima do HUD inferior: `bottom: calc(max(18px, env(safe-area-inset-bottom)) + 18vh)` ou para o topo, abaixo do HUD. |
| UI-03 | **P1** | Mira · todos | Seta e prévia quase invisíveis. Pixel real da seta com 83 % de força: `#dcd6ad` (creme) sobre green `#8bc867` = **1,35:1**; deveria estar laranja. Causa: `MeshBasicMaterial` com tone mapping ACES + `opacity .92` + `setHSL(…, .85, .62)`. Pontos brancos de 0,045 e anel amarelo fino somem no verde claro. | `render/efeitos.ts` `Mira`: `toneMapped: false` e `opacity: 1` em seta, pontos, anel e alvo; cor sólida por faixa de força (`#b9ed80` < 35 %, `#ffd56b` < 70 %, `#ff9d52` acima). Contorno do kit: segunda malha com a mesma `ShapeGeometry` escalada 1,15, cor `#193337`, `renderOrder 2`, logo abaixo da seta. Pontos: raio 0,06 + "sombra" `#193337` opacidade .35 deslocada 0,02. Alvo: `RingGeometry(0.16, 0.26)` laranja. |
| UI-04 | **P1** | Cena · todas as pistas | **Pista e gramado têm a mesma cor**: green renderizado `#8bc867` × gramado `#a6cd76` = **1,1:1** (matiz 0,24–0,27, luminosidade 0,59–0,63). A pista "some" no campo; o que separa é só a borda fina. | `render/texturas.ts`: green mais escuro e saturado (faixas `#3f9e3a`/`#4aab43`, pontos hsl 105–115 % 55 % 38–48 %) e gramado mais claro e amarelado (base `#b5d98a`, tufos hsl 75–95). Alternativa: escurecer só o terreno perto da pista (anel de grama mais escura `#7fb85a` com 1,2 de largura em volta das placas). |
| UI-05 | **P1** | Avisos · todos | Avisos ("PISTA 1", "BURACO EM UMA!", "VEZ DO JOGADOR 2", "SPLASH!") são texto papel com contorno de 2 px direto sobre a grama clara: papel × grama **1,6–1,8:1**; o subtítulo tem 12,6 px no celular deitado e 25 px no desktop. O aviso de acerto fica **em cima do buraco e do confete** (top 40 %). | Em `minigolfe.css` (para não mexer na cópia compartilhada): `.aviso { color: var(--ink); background: var(--gold); border: var(--line); box-shadow: var(--shadow); padding: 8px 18px; text-shadow: none; top: calc(max(10px, env(safe-area-inset-top)) + 84px); transform: translateX(-50%); }` e `.aviso small { font-size: max(18px, .42em); }`. Ajustar o `@keyframes pop` para `translate(-50%, 0)`. Em `max-height: 500px`, `top: 64px`. |
| UI-06 | **P1** | Placar · 375×812 | Tabela de 392 px dentro do cartão de 351 px: **coluna 6 e Total ficam cortados** (rola dentro de `.tabela-placar`). Total é a informação principal. | Em `@media (max-width: 560px)`: esconder colunas futuras (só gerar `<th>/<td>` até `ate` em `tabelaPlacar()` quando a tela for estreita) ou trocar a tabela por um cartão por jogador: bolinha + nome + **número grande da pista** + total. Mínimo CSS: `.tabela-placar th, .tabela-placar td { padding: 4px 3px; min-width: 26px; } .tabela-placar td.nome { font-size: 0; } .tabela-placar td.nome .bolinha { width: 22px; height: 22px; }`. |
| UI-07 | **P1** | Menu · 375×812 e 812×375 | Menu rola: 375×812 cartão 819 px (+31 px; selo de recorde e borda inferior abaixo da dobra); 812×375 `scrollHeight` 385 em 375 e **aparece barra de rolagem vertical de 15 px** (`scrollWidth` da tela 797). | 375: `.dica-icones` em uma linha (`font-size: 13px; padding: 4px 8px; gap: 6px`) ou escondê-las abaixo de 700 px de altura; `.logo { margin-bottom: 6px }`. 812×375: `.corpo { padding: 8px 14px 10px }`, `.logo { font-size: 26px; margin: 0 0 4px }`, `.secao { margin: 4px 0 4px }`, `.acoes { margin-top: 6px }` dentro do `@media (max-height: 500px)`. Meta: `scrollHeight === clientHeight` nos dois. |
| UI-08 | **P1** | Acerto e fim · todos | A **comemoração acontece fora da tela**: no acerto a câmera fecha no buraco e os pets (que pulam e latem) ficam no tee, fora do quadro. No fim, o mesmo; confete sai na bola, atrás do cartão. | `main.ts` `acertou()`/`terminar()`: ao acertar, `camera.enquadrar([buraco, posDog, posGato], 1.2)` ou levar os pets para perto do buraco (`dog.colocar(hx - 0.9, h, hz + 0.6, …)`, `gato.colocar(hx + 0.9, …)`) com um pulinho. No fim, enquadrar a pista inteira com os pets no centro e o cartão menor/na parte de baixo. |
| UI-09 | **P2** | Placar · todos | HUD continua visível no placar e o botão **II não faz nada** (`pausar()` retorna se `estado !== 'jogando'`). No deitado o HUD aparece atrás das bordas do cartão. | `main.ts` `mostrarTela()`: esconder o HUD também em `placar` (`$('hud').hidden = this.estado !== 'jogando' \|\| …`), ou fazer II abrir a pausa no placar. |
| UI-10 | **P2** | Menu · todos | Logo: sombras fixas (`3px 3px var(--play), 6px 6px var(--ink)`) e `letter-spacing: -3px` **borram as letras** a 30 px (deitado) e no portal 375 a logo quebra em 2 linhas. | `minigolfe.css`: `.logo { letter-spacing: -.05em; text-shadow: .05em .05em 0 var(--play), .1em .1em 0 var(--ink); }`. |
| UI-11 | **P2** | Menu · todos | Escolha de jogadores sem número: só corações de 18 px em botões de 150–290 px; o botão de 4 quebra os corações em 2 linhas no 375. | Em cada `.opcao[data-n]`: `<b class="num">1</b>` (Courier 900, 30 px) acima dos corações; `.opcoes.quatro .ic { font-size: 15px; letter-spacing: -2px; white-space: nowrap; }`. |
| UI-12 | **P2** | Toast/dica · todos | Dicas longas e sem ícone ("Bata na parede para fazer a curva." = 7 palavras); no deitado o toast (`bottom: 110px`) fica no meio da pista. Na pista 1 o toast repete exatamente o texto da `.dica-toque` ("Puxe para trás e solte!"). | `content/pistas.ts` `dica`: "🧱 Bata na parede!", "⛰️ Força para subir!", "🏠 Passe na casinha!", "🌀 Espere a pá!", "💦 Cuidado, água!". `main.ts`: não mostrar o toast da pista 1 enquanto `#dica` estiver visível. Toast deitado: `top: 84px; bottom: auto`. |
| UI-13 | **P2** | Fim · todos | "1 **tacadas**" no pódio e "recorde 1 **tacadas**" no menu; empate 1-1-1 dá três 🥇 e o último recebe 🎖️ (posição 4 do ranking competitivo), que parece "perdeu". Barra diz `fim_do_circuito.exe` também em pista avulsa. | `main.ts` `terminar()`/`montarMenu()`: singular quando `=== 1`; medalha por posição densa (1,1,1,2 → 🥇🥇🥇🥈); para 7 anos, todos ganham um selo (🐾). Barra `fim_da_pista.exe` quando `pistas.length === 1`. |
| UI-14 | **P2** | Todas | Texto pequeno para a regra infantil (≥ 20 px em cartões, ≥ 24 px no HUD): `.secao` 12 px, `.pista-btn` 12 px, `.opcao small` 13 px, `small.par` 13 px, `th` do placar 12 px (emojis de pista 12 px), `FORÇA` 13 px, `.barra` 12 px; HUD 22 px (18 px no 375). | `.secao` 14 px; `.pista-btn` 14 px com emoji 28 px; `.tabela-placar th` 14 px e emoji 20 px; `.painel` 24 px (20 px no 375); `.medidor-forca b` 15 px. A barra `.exe` pode ficar em 12 px (é decoração). |
| UI-15 | **P2** | Vez do jogador | "sua bolinha tem esta cor" usa **só cor** (regra: cor nunca é a única informação) e a faixa da bola é fina (tubo 0,16·R) — de longe as bolas de J1/J2 parecem iguais. | `render/efeitos.ts` `Bola`: faixa `RAIO_BOLA * 0.32` ou bola inteira na cor do jogador com faixa branca; HUD com número grande do jogador (`J2`) junto da bolinha; aviso "VEZ DO 💜 2". |
| UI-16 | **P2** | Pausa | Sem 🔊 dentro da pausa (o `INTERFACE.md` pede) e sem "em que pista estou". | Acrescentar `<button class="btn sec" id="bSomPausa">🔊</button>` e um subtítulo "⛳ 2/6". |
| UI-17 | **P2** | Fundos das telas | Véu `rgba(25,51,55,.45)` sobre a cena vira verde-lamacento; no placar/fim a câmera está fechada no buraco e mostra troncos enormes. | `.tela { background: rgba(25,51,55,.22); backdrop-filter: blur(3px) saturate(1.1); }` e, ao abrir placar/fim, enquadrar a pista inteira (`limitesDaPista`). |
| UI-18 | **P2** | Portal · 1366×768 e 375 | Janela `.exe` dentro de janela `.exe` (`minigolfe-dos-pets.exe` do portal + `minigolfe_dos_pets.exe` do jogo, grafias diferentes). Iframe 1196×599 começando em y = 277: **JOGAR! fica abaixo da dobra** e o menu ainda rola 28 px dentro do iframe; no 375 o iframe começa em y = 360 e o menu rola 130 px por dentro. | No jogo, se `window.top !== window`, pôr `body.embutido` e esconder `.cartao > .barra` do menu (o portal já desenha a janela) e usar o layout compacto. No portal, altura do iframe `min(100svh - 24px, …)` com rolagem até ele ao abrir. |
| UI-19 | **P3** | Pausa · 812×375 | Cartão da pausa cobre metade do botão 🔊 do HUD (cartão y 64; botão até y 74). | Esconder o HUD sob as telas modais (ver UI-09). |

### Cena 3D

| ID | Sev. | Pista / tamanho | O que está errado | Correção específica |
|---|---|---|---|---|
| CE-01 | **P1** | Todas | **Câmera alta demais**: com `inclinacao 0.92` e a distância que enquadra a pista inteira, o efeito é quase de cima: some o céu, some a profundidade, a rampa não aparece, a casinha vira telhado, pets são vistos pelas costas/de cima. Campo enorme e vazio em volta de uma pista fina (~12 % da largura no desktop). | `render/camera.ts`: `inclinacao` 0.92 → **0.72** (~41°), `fov` 42 → 38 no desktop; `distDesejada` com fator 0.82 → 0.72 para aproximar; opcional por pista (`camera?: { inclinacao }` em `pistas.ts`; pista 4: 0.62 para mostrar a porta da casinha). Com isso o horizonte, as nuvens e os morros entram no quadro do desktop. |
| CE-02 | **P1** | Todas | **Tone mapping lava as cores do kit**: `ACESFilmicToneMapping` + exposição 1.05 + hemisfério 1.15 + sol 2.5 deixam o laranja `#ff9d52` (para-choques, cone do gira-gira, bandeira, coleira) com cara de pêssego/bege e o verde pastel. | `render/mundo.ts`: `toneMapping = THREE.NeutralToneMapping` (existe no three 0.170), `toneMappingExposure 1.0`, sol 2.5 → 1.9, hemisfério 1.15 → 0.95. Conferir de novo os pixels: laranja deve sair perto de `#f9944a`. |
| CE-03 | **P1** | Pista 2 (e qualquer pista não retangular) | **Gatinho fica longe do tee, sozinho no gramado** (x = 8,25): `carregarPista()` usa o maior x do polígono inteiro do piso do tee (o L vai até 7,5). Visível em 1366 e 812. | `main.ts` `carregarPista()`: largura local na linha do tee — andar a partir de `tee.x` para os lados até `dentro(poly, x, tee.z) === false` e somar 0,75; ou guardar `pets?: [P2, P2]` em cada pista de `pistas.ts`. |
| CE-04 | **P1** | Pista 6 | **Flores e pedra em cima do lago** (perto de x = ±3,2). Causa em `render/mundo.ts` `ocupado()`: o teste de piso/água só roda se o ponto está dentro da caixa `L` dos **pisos** (x ±2,6), mas o lago vai até ±3,6. | Calcular a caixa usada em `ocupado()` com os pontos de `p.pisos` **e** `p.agua`, ou tirar o pré-teste da caixa (são poucos polígonos). |
| CE-05 | **P1** | Pista 2 · 375×812 | O canto do L e o para-choque — justamente o que a dica pede para usar — **ficam fora da tela** à esquerda; a câmera só enquadra bola + buraco. | `main.ts` `enquadrarParaTacada()`: incluir pontos de foco da pista (novo campo `foco?: P2[]` em `pistas.ts`; pista 2: `[[-1.25,-4.6],[0.05,-4.6]]`) e, em retrato, preferir azimute 0 (sem girar 45°) quando a pista inteira couber. |
| CE-06 | **P2** | Pista 5 | **Gira-gira = tábua com cone**: pás na mesma madeira das bordas (`#d9a066`), finas (0,2), e o cubo lilás é pequeno; não lê como brinquedo nem como perigo. | `render/pista3d.ts` `obstaculo()`: pás `RoundedBoxGeometry(o.raio - 0.1, 0.3, 0.26, 3, 0.1)` alternando `#ff9d52` e `#fffdf7` (ou listras), ponta com bolinha `#ffd56b`; cubo central raio 0,34 `#ceb7ef` com topo de pata/osso; base circular `#326344` no chão sob o eixo. Física não muda. |
| CE-07 | **P2** | Pista 4 | **Casinha-túnel lê como laje vermelha**: de cima só aparece o telhado liso `#e0634f`, sem telhas, sem cumeeira, sem beiral; a porta em arco fica de perfil e não aparece. | Textura de telhas (canvas listrado `#e0634f`/`#c94f3d` a cada 0,12), cumeeira cilindro 0,05 `#fffdf7`, beiral +0,15 nas águas, abertura da porta escura `#2b3a2e` (forma do arco preenchida 0,02 para dentro), placa 🐶 com raio 0,24 e borda tinta; câmera mais baixa nesta pista (CE-01). |
| CE-08 | **P2** | Pista 6 | **Lago parece piscina**: retângulo azul-claro (`#4fb6dc`, opacidade .86 sobre a grama) com moldura bege reta (`RoundedBox` `#c9b79a`). Ponte sem guarda-corpo nem pilares visíveis. | Água opaca `#2f9fd0`, `toneMapped` normal, brilho com textura de ondinhas animada (offset); margem com ~24 pedrinhas instanciadas (`#b9b2a5`) seguindo o contorno com folga 0,2 + 4–6 vitórias-régias (disco `#4fa83d`, raio 0,25) e juncos; ponte com postes `#8b5a35` a cada 0,6 em x = ±0,85 e corrimão (só visual, fora do piso). |
| CE-09 | **P2** | Pistas 3 e 6 | **Rampa invisível**: mesma textura e cor do plano; nada diz "suba com força". | Material próprio para piso com `rampa`: green 8 % mais claro + chevrons ▲ (textura canvas, `#fffdf7` alfa .35) apontando para a subida; faixa de sombra no pé da rampa. |
| CE-10 | **P2** | Todas | **Bordas de madeira finas e com junções aparentes**: veio da textura quase invisível nesta distância; nas quinas (ex.: pista 3 em z = −0,8) as caixas se sobrepõem em degrau; sem postes de canto. | `pista3d.ts` `parede()`: `esp` 0,12 → 0,16 e `alta` 0,3 → 0,34; madeira `#d9a066` → `#c8874a` com faixa de topo clara `#e8b77a`; poste de canto (cilindro raio `esp*1.35`, tampa `#fffdf7`) em cada vértice de parede — esconde as junções e dá acabamento de minigolfe de verdade. |
| CE-11 | **P2** | Todas | **Tee = quadrado verde-escuro liso** (`#3f8f3a`) que parece um buraco/caixa. | Tapete com borda (base `#2f7a33` 1,0 × 0,04 + miolo `#4aa346` 0,86) e marca de **pata** `#fffdf7` no lugar do anel; ou dois blocos de tee nas cores do kit. |
| CE-12 | **P2** | Todas | Pets pequenos e de costas: escala 1,45; o Gatinho fica de costas para a câmera; os dois são cortados pela borda (UI-02). Bonitos de perto, ilegíveis no jogo. | `pets.ts`/`main.ts`: escala 1,45 → 1,9; `olhandoPara` virado ~45° para a câmera (meio caminho entre a bola e a câmera); posição z do tee −0,2. |
| CE-13 | **P2** | Todas | Decoração genérica: flores = bolinha num palito (parecem cotonetes/alfinetes), árvores = 3 icosaedros iguais, morros = 14 esferas achatadas iguais. | Flores com 5 pétalas (`CircleGeometry(0.07, 5)` + miolo `#ffd56b`) e menos tufos perto da câmera; dois tipos de árvore (redonda e pinheiro com 3 cones), tronco mais grosso (0,12/0,18), copa com cor por altura (base `#3f8c37`, topo `#6bbd4e`), escala 0,8–1,6; morros com cores alternadas `#7fbf63`/`#6aae55`. |
| CE-14 | **P3** | Pista 1 | Pista 1 é uma reta vazia: nada para olhar além das bordas. | Duas casinhas de cachorro/ossos decorativos fora das bordas, um tapetinho "1" no tee, cerquinha baixa atrás do buraco. |
| CE-15 | **P3** | Fim/placar | Bandeira grande e escura em primeiro plano atrás do cartão; não ajuda a ler. | Enquadrar a pista inteira nessas telas (UI-17). |

## O que não consegui verificar

- **Toque real**, Safari/iPhone, Android, iPad: só gesto simulado com `PointerEvent`.
- **Resolução das capturas**: o painel reduz 1366 px para 800 px; detalhes finos foram vistos com a lupa CSS no canvas (o render continua em resolução nativa), não em captura 1:1.
- **Fim do circuito completo de 6 pistas** com pódio de vários jogadores: testei fim de pista avulsa (1 e 4 jogadores) e placar entre pistas (2 e 4 jogadores).
- O "pop" do aviso: nas capturas em tempo real ele aparecia translúcido porque a animação parte de `opacity: 0`; a leitura estática foi conferida mostrando o aviso sem a classe `pop`.
- Som, qualidade adaptativa (`reduzirQualidade`), desempenho em aparelho fraco, `prefers-reduced-motion`, foco por teclado e leitor de tela.
- Animação do portão (pista 6) em movimento e o "SPLASH!" na água.
- Teste com o Samuel (ainda não testado com o Samuel).

Observação de limpeza: o `localStorage` de `localhost:8770` é compartilhado com outra aba aberta por
outro agente. Na limpeza apaguei a chave `samuel:minigolfe-dos-pets:convidado:v1` e logo a regravei com o
mesmo conteúdo, porque ela tinha um recorde `circuito-assistido` (13 tacadas) que não era deste QA.
