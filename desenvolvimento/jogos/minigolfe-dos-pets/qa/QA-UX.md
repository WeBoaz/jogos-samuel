# QA de UX — Minigolfe dos Pets (EXP-01)

- Data: 2026-11-01 · Build servido em `http://localhost:8770/jogo/minigolfe-dos-pets/` (assets `index-C6FMlP0k.js`), commit base `1235b79`.
- Navegador: navegador embutido do Claude Code (Chromium), painel oculto. Tamanhos: 1280×800, 375×812 (emulação de celular com toque), 812×375. Player do portal em 1280×800.
- Como joguei: gestos reais simulados (`PointerEvent` com `pointerType: 'touch'` no `canvas#jogo`: encostar, puxar para trás, soltar), teclado (setas, Enter, P, Esc) e cliques nos botões. As 6 pistas foram jogadas nos dois modos, com 1, 2 e 4 jogadores. Como a animação quase para com o painel oculto, avancei o tempo com `__minigolfe.avancar()`.
- Dificuldade medida com simulação (Monte Carlo) usando a própria física do jogo (`Fisica` do build) e as regras de `core/partida.ts` (limite de tacadas, +1 na água no Normal, bola volta ao último ponto). Perfis:
  - **p4** (4 anos, Assistido): puxa na direção do buraco com erro de ±20° (σ 0,35 rad) e força aleatória de 25–100% da barra.
  - **p7a** (7 anos, Assistido): escolhe a tacada olhando o anel da prévia de 2,4 s; erro σ 0,10 rad e ±18% de força.
  - **p7n** (7 anos, Normal): aprende por tentativa (conhece o resultado real); erro σ 0,12 rad e ±22%.
  - **p16** (16 anos, Normal): quase ótimo; erro σ 0,035 rad e ±6%.
  - Os perfis são modelos, não crianças. Servem para comparar pistas e modos, não para prever a nota exata.

## Resumo

O núcleo funciona e é simpático: o gesto "puxar e soltar" funciona em qualquer lugar da tela, cancelar o gesto não taca, os textos de erro são gentis ("SPLASH!", "TUDO BEM! 👍"), a pausa por troca de aba congela tudo, "Jogar de novo" é instantâneo, não há rede nem coleta de dados, e as pistas 1, 2, 4 e 5 são agradáveis. Os problemas estão em quatro frentes. **(1) A família não consegue jogar junta em modos diferentes**: o modo vale para a partida inteira. **(2) A rampa e a Grande Final punem justamente quem joga no Assistido.** **(3) No celular, o placar e o HUD escondem quem é quem e quem está ganhando.** **(4) O Normal quase não desafia o adolescente.**

| Público | Nota | Por quê |
|---|---|---|
| 4 anos (Assistido) | **5/10** | Pistas 1, 2, 4 e 5 são vencíveis: 83–98% de acerto antes do limite. A rampa (P3) devolve a bola até o início quando a força fica abaixo de ~72% da barra, e a prévia promete que a bola vai subir: 28% das tentativas chegam ao limite. A Grande Final (P6) é um paredão: só 27% de acerto. A dica do gesto some para sempre depois de 3 tacadas no aparelho, então quem joga depois nunca a vê. O menu precisa de um adulto. |
| 7 anos (Assistido ou Normal) | **7/10** | No Assistido, com a prévia, acerta quase tudo (88–100%). No Normal vai bem até a P6 (66%). Atrapalham o jargão ("par", "NO PAR!", "+1"), o placar cortado no celular e a dica escondendo a bola. |
| 16 anos (Normal) | **4/10** | Pouco desafio. Mirando reto no buraco, P1 e P3 dão buraco em uma com qualquer força acima de 40% e de 55%: a bola bate na parede do fundo e volta para o buraco. A média simulada é 11,4 tacadas para par 18. Só a P6 exige alguma coisa. |

Não houve achado P0: nada trava, quebra o jogo ou fere a segurança infantil.

## Números de dificuldade (simulação, % que acerta antes do limite · média de tacadas)

| Pista (par) | p4 Assistido | p7a Assistido | p7n Normal | p16 Normal |
|---|---|---|---|---|
| 1 Reta (2) | 98% · 2,09 | 100% · 1,32 | 98% · 1,92 | 100% · 1,32 |
| 2 Curva (3) | 93% · 3,87 | 100% · 2,20 | 100% · 2,68 | 100% · 1,47 |
| 3 Rampa (3) | **72%** · 4,22 | 97% · 2,27 | 100% · 2,86 | 100% · 1,70 |
| 4 Túnel (3) | 92% · 3,68 | 100% · 2,23 | 100% · 2,64 | 100% · 1,60 |
| 5 Gira-Gira (3) | 83% · 3,71 | 100% · 2,20 | 100% · 2,96 | 100% · 1,73 |
| 6 Grande Final (4) | **27%** · 6,48 (0,88 quedas na água por pista) | 88% · 4,27 | **66%** · 5,52 | 96% · 3,60 |

Limiar da rampa, tacada reta do tee:

- **Assistido:** até 69% da barra a bola sobe e volta até z≈5,1–5,7 (o tee fica em 5,3), depois de 6–7 s; com 72% ela sobe; de 83% em diante entra direto (buraco em uma).
- **Normal:** com 50% ela sobe; de 55% em diante, buraco em uma.
- O **Assistido exige mais força que o Normal** nesse ponto: `velMax` 8,2 com força limitada a 0,9, contra 11 sem limite.

Na mão (gestos de toque, celular, Assistido, puxão reto de ~100 px = 74% da barra): circuito completo em 13 tacadas (1, 2, 2, 2, 2, 4). Com puxões de 59% da barra na P3: 6 tacadas, a bola voltou ao tee em todas e a pista terminou em "TUDO BEM! 👍" sem nenhum progresso.

## Achados

| ID | Sev. | Onde | Problema observado (passos) | Sugestão concreta |
|---|---|---|---|---|
| UX-01 | P1 | Menu / `Partida` | O modo (Assistido/Normal) vale para a partida inteira. A família alvo (4 anos no Assistido, 7 e 16 no Normal) não consegue jogar junta: ou o adolescente joga com ímã e captura 5,4 (trivial), ou a criança de 4 anos joga sem ajuda. Passos: menu → 3 jogadores → só existe um seletor "jeito de jogar". | Modo **por jogador**: no passo 1 do menu, cada coração ganha um alternador 🐾/⭐ (toque no coração troca). `Partida.limite()` e os `Ajustes` da física passam a usar o modo de `jogadores[vez]`; a física é recriada (ou recebe novos ajustes) a cada troca de vez. No placar e no pódio, mostrar 🐾 ao lado de quem jogou com ajuda. A chave do recorde vira "misto" quando houver modos diferentes. |
| UX-02 | P1 | P3 Rampa (e a rampa da P6), Assistido | Com força abaixo de ~72% da barra, a bola sobe a rampa e rola de volta até o tee ou para trás dele, e a tacada conta. A inclinação (0,233) é maior que `RAMPA_SEGURA` (0,1), então a bola nunca para na rampa. Cada tentativa perdida leva 6–7 s. No teste por gesto, 6 puxões de 59% terminaram em "TUDO BEM!" sem progresso. O p4 chega ao limite em 28% das vezes. | Só no Assistido: (a) subir `velMax` de 8,2 para 10 ou tirar o teto de 0,9 da força; (b) **trava de rampa**: se a bola inverter o sentido sobre um piso com `rampa`, parar no pé da rampa (z = `de`), e não no tee; (c) depois de 2 voltas seguidas, mostrar o toast "Mais forte! 💪". Alternativa: rampa mais baixa no Assistido (`h1` de 0,7 para 0,45). |
| UX-03 | P1 | Prévia do Assistido (`mudouMira`, `previa(…, 2.4)`) | A prévia simula só 2,4 s. Na rampa, com 61–71% da barra, o anel amarelo aparece **no alto da rampa** (ex.: 71% → anel em z=-0,91, altura 0,70), mas a bola real volta ao tee. A ajuda ensina errado justamente onde mais importa. | No Assistido, simular até a bola parar (no máximo 8 s) e pôr o anel no ponto final. Se a parada for atrás do tee ou na água, pintar o anel de vermelho claro com ↩. Se a prévia longa pesar no celular, simular a cada 3 quadros. |
| UX-04 | P1 | P6 Grande Final | Pico de dificuldade: p4 com 27% de acerto (79% chegam ao limite de 7, 0,88 quedas por pista); p7n com 66%. Depois da queda, a bola volta ao último ponto, geralmente antes da rampa, e é preciso subir de novo. A dica "Cuidado com a água na ponte!" só aparece no Assistido. | Assistido: ponte de 1,5 para 2,4 de largura **ou** mureta baixa nas laterais da ponte; depois da água, recolocar a bola no topo da rampa ou no início da ponte (z≈0,6), não no último ponto; portão com período de 4,2 s para 6 s. Normal: mostrar a dica de água também. Rever o par da P6 (4 → 5) se a meta for "par alcançável" pelo menino de 7 anos. |
| UX-05 | P1 | Placar entre pistas, celular 375×812 | Com 4 jogadores, a tabela tem 392 px de largura para 307 px visíveis: a coluna **Total** e a pista 6 ficam escondidas numa rolagem horizontal quase invisível. A criança não vê quem está ganhando. A linha "par" com total 18 ao lado do total parcial do jogador (ex.: 2) confunde. | Abaixo de 560 px: tabela compacta com Jogador · tacadas desta pista · **Total**, e o histórico completo só ao tocar "ver tudo". Destacar quem está na frente (🥇 ao lado do nome). Esconder a linha "par" no Assistido ou trocá-la por "meta". O total do par deve acompanhar as pistas jogadas (`parTotal` até `ate`). |
| UX-06 | P1 | HUD no celular (<560 px) e cor da bola | O nome do jogador some (`#hNome {display:none}`): fica só uma bolinha de cor pastel. A bola é branca, com uma faixa fina da cor do jogador, quase invisível a distância (lilás e branco se confundem). A cor vira a **única** informação, contra a regra da casa. | Número dentro da bolinha do HUD ("1".."4", fonte 18 px) e no aviso de vez. Bola **inteira** na cor do jogador, com uma faixa branca (inverter o que existe hoje) e cores mais saturadas (#ff8a3d, #a77bff, #6fd14f, #3fa9f5). No celular, mostrar "J2" em vez de esconder o nome. |
| UX-07 | P1 | Enquadramento da câmera (desktop e paisagem) | A bola fica colada na borda de baixo: P6 a 1280×800, y≈765 de 800; P1 em 812×375, y≈335 de 369. Quem encosta **na bola** e puxa para trás (o gesto natural) tem só ~34 px até a borda. Testado: força de 12%, a bola andou 0,6 e a tacada foi perdida. | Enquadrar a bola em ~62% da altura (deslocar o alvo da câmera para trás da bola, ou somar margem extra só atrás dela). Opcional: medir a força pelo maior entre o deslocamento e 1,6× a distância até a borda, quando o dedo encostar nela. Texto da dica: "👆 Puxe de qualquer lugar". |
| UX-08 | P2 | Dica inicial | Na P1 aparecem **duas** caixas com o mesmo texto "Puxe para trás e solte!": o toast `pista.dica` e a `#dica`. Em 812×375 elas se sobrepõem; em 1280×800 a `#dica` (y 679–723) cobre a bola no tee (P1, P2). | Tirar o `dica` da P1 ou trocar por "Acerte o buraco! ⛳". Pôr a `#dica` logo abaixo do HUD (topo), ou acima da posição da bola na tela (projetar a bola e usar `bottom` = altura da tela − y_bola + 40 px). |
| UX-09 | P2 | Dica do gesto (`viuDica`) | A mão animada só aparece nas 2–3 primeiras tacadas **do aparelho**; depois `viuDica` fica gravado para sempre. O 2º, 3º e 4º jogadores (a criança de 4 anos) nunca a veem. Não existe dica por inatividade. | Mostrar a `#dica` na primeira tacada de **cada jogador em cada partida**. No Assistido, mostrar também depois de 5 s sem gesto. `viuDica` passa a reduzir só o tempo da dica, sem apagá-la. |
| UX-10 | P2 | Normal: P1, P3 e alerta de borda | Mirando reto, buraco em uma na P1 com qualquer força de 40–100% e na P3 com 55–100%: a bola passa por cima, bate na parede do fundo e volta para o buraco (`capturaBuraco` 4,2 é generoso). "Quase! 😮" e "BURACO EM UMA!" aparecem **ao mesmo tempo**. O p16 faz média de 11,4 para par 18. | Normal: `capturaBuraco` de 4,2 para ~2,8 e restituição menor na parede do fundo (0,72 → 0,45 nas paredes a menos de 2 unidades atrás do buraco), ou um degrau atrás do buraco. Gira-gira mais rápido no Normal (1,25 → 1,8 rad/s). Meta extra para o adolescente: ⭐ por pista abaixo do par, mostrada no fim. Esconder o toast "Quase" quando a bola cair no buraco em menos de 1,5 s (`acertou()` limpa o `#toast`). |
| UX-11 | P2 | Textos | Jargão para 4 e 7 anos: "par 2" (HUD), "par" (placar), "NO PAR!", "(+1)", "Assistido", "vale cada tacada", "BURACO EM UMA!". | "par 2" → "⭐ 2"; linha "par" → "meta ⭐"; "NO PAR!" → "NA META! ⭐"; "BURACO EM UMA!" → "DE PRIMEIRA! 🎯"; "(+1)" → "+1 tacada"; "Assistido · mira com ajuda" → "🐾 Com ajuda"; "Normal · vale cada tacada" → "⭐ Desafio". |
| UX-12 | P2 | Aviso de troca de vez | No celular, "VEZ DO JOGADOR 2" sai com 410 px de largura numa tela de 375 (corta nas bordas, x=-17). Enquanto o aviso diz "sua bolinha tem esta cor", a câmera ainda está indo para o tee e a bola **não aparece** na tela (P1 e P2, desktop e celular). | Fonte `clamp(28px, 9vw, 60px)` com quebra de linha. Usar `camera.pular()` na troca de jogador (ou esperar a câmera parar antes do aviso). Pôr uma bolinha desenhada na cor do jogador dentro do aviso, no lugar de "esta cor". |
| UX-13 | P2 | Tela de pausa | "↻ Recomeçar", "☰ Menu" e "← Jogos" ficam lado a lado e apagam o circuito inteiro de até 4 jogadores **sem confirmação**. Um toque errado de criança perde 10 minutos de partida. | Confirmação de um toque ("Começar tudo de novo? ✔ / ✖") para Recomeçar e Menu quando já houver pista concluída. Separar Recomeçar/Menu de Continuar com mais espaço (≥24 px) e deixar "Jogos" num canto. |
| UX-14 | P2 | Áudio (`som.ts`) | Ganho mestre 0,22 × vol dos tons: tacada 0,6 → **0,13**; água (ruído 0,45) → 0,10; buraco e vitória: arpejos sobrepostos de 0,077 que somam picos de ~0,15–0,2. O teto da casa é `vol ≤ 0,08`. Não medi a sonoridade real. | Mestre de 0,22 para 0,13, ou limitar cada `vol` a ≤0,36 com o mestre atual. Diminuir a sobreposição do arpejo (atraso 0,09 → 0,12 s e duração 0,22 → 0,16 s). |
| UX-15 | P2 | Menu e tela de fim | O botão de som só existe no HUD, que fica oculto no menu e no fim. A regra da casa pede som sempre visível. | Pôr 🔊 na barra do cartão do menu e do fim (mesmo `bSom`, ou um segundo botão ligado ao mesmo estado). |
| UX-16 | P2 | Player do portal 1280×800 | O iframe começa em y=277 e tem 624 px; o "▶ JOGAR!" do jogo fica em y 796–868, **abaixo da dobra**. É preciso rolar a página (e o menu do jogo ainda rola 3 px por dentro). | Portal: altura do iframe = `calc(100vh - topo)` ou rolar até o quadro ao abrir também no desktop. Jogo: com altura menor que 700 px, compactar o menu (esconder as dicas, botões de pista com 60 px). |
| UX-17 | P2 | Limite de tacadas | "TUDO BEM! 👍 vamos para o próximo" é ambíguo (próximo o quê?) e aparece também na última pista do último jogador, logo antes da tela de fim. | Subtítulo conforme o caso: "vez do Jogador 2", "próxima pista ▶" ou "fim do jogo! 🎉". Trocar "TUDO BEM!" por "BOA TENTATIVA! 👍". |
| UX-18 | P3 | Tamanho de texto | Títulos de seção do menu 12 px, subtítulo do logo 11,5 px, chips 15 px, "mira com ajuda" 13 px, rótulos das pistas 12 px, "par" no HUD 13 px, cabeçalho do placar 12 px, "FORÇA" 13 px. A regra pede ≥20 px nos cartões e ≥24 px lógicos no HUD. | Seções ≥16 px (são para o adulto), rótulos das pistas ≥16 px, cabeçalho do placar ≥16 px, "FORÇA" trocado pelo ícone 💪. |
| UX-19 | P3 | Menu | Os chips "👆 puxe e solte / ⛳ acerte o buraco / 🐾 um de cada vez" têm borda e cara de botão, mas não fazem nada ao toque. | Tirar borda e sombra (texto com ícone) ou transformá-los numa mini-demonstração animada do gesto. |
| UX-20 | P3 | Placar entre pistas | O HUD continua visível atrás do placar, com dados velhos (último jogador e tacadas), e o botão II não faz nada nesse estado. | No placar, esconder o HUD e manter só o 🔊. |
| UX-21 | P3 | Botões de pista | "6. Grande" (corte de "Grande Final" por `split(' ')[0]`) não quer dizer nada. | Campo curto por pista (`rotulo`): "Reta", "Curva", "Rampa", "Túnel", "Gira-Gira", "Final". |
| UX-22 | P3 | Desktop | O teclado funciona (←/→ mira, ↑/↓ força, Enter taca; testado), mas nada avisa. | Com `(pointer: fine)`, mostrar o chip "⌨️ setas + Enter" no menu. |
| UX-23 | P3 | Tela de fim | 🥈🥉🎖️ põem a criança de 4 anos sempre em último numa família mista. O "novo recorde" é do melhor jogador do grupo e não diz de quem. "7 tacadas" aparece para quem nem acertou (limite). | Com modos mistos (UX-01), ordenar por "abaixo da meta" ou dar um destaque por jogador ("🎯 de primeira na P1!"). Recorde com o nome ou a cor de quem fez. Marcar "7*" quando a pista acabou pelo limite. |
| UX-24 | P3 | Rampa (visual) | A rampa quase não aparece de cima (verde liso). A criança não sabe que é subida. | Setas ⬆ pintadas na rampa ou faixas mais escuras, e uma placa "SUBIDA" com 💪. |
| UX-25 | P3 | Menu em 812×375 | O menu rola 10 px (`#tMenu` 385/375). | Reduzir o `margin` do cartão em telas baixas (max-height 400 px). |

## O que funcionou bem (manter)

- Gesto: começa em qualquer lugar, a força é medida em pixels (36% do menor lado da tela = força máxima) e voltar ao ponto inicial cancela. Esc durante a mira cancela sem pausar; um `pointerup` depois do cancelamento não taca (testado).
- Pausa: botão, P e Esc funcionam; a troca de aba (`visibilitychange`, simulada) pausa e congela física, obstáculos e esperas. Tudo verificado.
- "Jogar de novo" e "Recomeçar" são imediatos; os ouvintes ficam estáveis (16 do DOM e 9 da mira) depois de várias partidas.
- O feedback é positivo: "SPLASH! 💦 volta para onde estava", "TUDO BEM! 👍", nenhum "game over", pets comemoram, confete pequeno. Empates dão 🥇🥇.
- Prévia com anel amarelo no ponto de parada nas pistas planas (P1, P2, P4): ajuda de verdade o menino de 7 anos.
- O teto do túnel fica translúcido com a bola dentro (P4); a câmera segue a bola sem enjoar.
- Só requisições para `localhost:8770` (HTML, JS, CSS); nenhuma fonte, CDN ou analytics. O `localStorage` guarda só preferências e recorde (`samuel:minigolfe-dos-pets:<perfil>:v1`).
- O som desligado fica lembrado (testado: `prefs.som=false` gravado).

## Checklist "Pronto para o Samuel" (design-infantil)

- [x] **Abre e joga no celular (375×812) e no computador sem erro no console.** Console sem erros do jogo; único aviso é do portal ("Allow attribute will take precedence over 'allowfullscreen'"). Circuito completo jogado em 375×812 e em 1280×800.
- [x] **Tela de início com ícone, nome, até 2 linhas de instrução e botão "Jogar!".** Sim, com ressalva: são três decisões antes de jogar, e os padrões já permitem tocar direto em JOGAR!. No player do portal a 1280×800, o botão fica abaixo da dobra (UX-16).
- [x] **Primeiros 30 s vencíveis por quem nunca jogou.** P1: p4 com 98% e média 2,09; por gesto, a bola entrou na 2ª tacada. Ressalva: a dica duplicada cobre a bola (UX-08).
- [x] **Perder → jogar de novo em 1 toque; recorde salvo e mostrado.** Tela de fim → "↻ Jogar de novo" reinicia na hora; "🏆 recorde 13 tacadas" aparece no menu depois de recarregar.
- [ ] **Pausa (botão, P/Esc, troca de aba), som liga/desliga lembrado.** Pausa: OK. Som lembrado: OK. **Falha:** o botão de som não aparece no menu nem no fim (UX-15).
- [ ] **Alvos de toque ≥ 64 px; nada de texto pequeno.** Botões com ≥64 px (som e pausa 64×64, opções ≥64, pistas 72). **Falha:** vários textos de 11,5–13 px (UX-18).
- [ ] **Sem flashes fortes, sem sons altos, sem conteúdo assustador.** Flashes: OK (confete e brilho pequenos; "pop" do aviso respeita `prefers-reduced-motion`). Conteúdo: OK. **Falha no teto de volume da casa:** tacada 0,13 e água 0,10, acima de 0,08 (UX-14). A sonoridade real não foi ouvida.
- [x] **Sem rede, anúncios, compras, chat, login ou coleta de dados.** Lista de requisições só com localhost; código sem `fetch`, `sendBeacon` ou URLs externas.
- [x] **Link "← Voltar aos jogos" e cartão na página inicial.** "← Jogos" leva o topo para `/jogos/` (testado dentro do player); cartão "Minigolfe dos Pets" presente em `/jogos/`.
- [ ] **Testado com o Samuel:** ainda não testado com ele (nem com as crianças de 4 e 16 anos).

## O que não consegui verificar

- **Aparelho real com toque** (celular, tablet, iPad antigo): só emulação no Chromium. Desempenho e quedas de quadro não foram medidos.
- **Som de verdade**: estimei os volumes pelo código; não ouvi nada nem medi a sonoridade.
- **Tela cheia do player**: o clique em "⛶ Tela cheia" não entrou em tela cheia no navegador embutido (sem erro visível). Comportamento real não verificado.
- **Troca de aba real**: simulada redefinindo `document.hidden` e disparando `visibilitychange`.
- **Sensação em tempo real** (ritmo, suavidade da câmera, tempo de reação ao gesto): com o painel oculto, o tempo avançou por `avancar()`.
- **Safari e Firefox**: não testados.
- **Crianças de verdade**: as notas e os percentuais vêm de modelos de jogador, não de playtest.
- Observação: limpei o `localStorage` da origem `localhost:8770` no início e no fim do teste, como pede o AGENTS.md. Isso pode ter apagado dados locais de teste do portal na mesma origem (favoritos, preferências).

## Prioridade sugerida

1. UX-01 (modo por jogador), UX-02 + UX-03 (rampa no Assistido e prévia até parar), UX-04 (P6).
2. UX-05 + UX-06 + UX-12 (quem é quem e quem ganha no celular), UX-07 + UX-08 (bola livre para o gesto e dica sem cobrir).
3. UX-10 (desafio no Normal), UX-11 (textos), UX-13 (confirmação), UX-14 + UX-15 (som).
4. P3 em lote.
