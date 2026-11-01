# Resolução dos QAs — Minigolfe dos Pets (2026-11-01)

Quatro QAs independentes revisaram o build `1235b79`: QA-DEV, QA-UI, QA-UX e QA-QUALIDADE
(relatórios nesta pasta). Esta tabela diz o que foi feito com cada achado relevante no build seguinte.

| Achado | O que foi feito | Evidência |
|---|---|---|
| **P0** D1 / Q1 — tacada durante "TUDO BEM!" travava a partida | `Partida.parou()` vai para a fase `encerrou` sem passar a vez; a tela mostra o aviso e chama `continuar()`. `main.tacar()` checa `podeTacar()` antes da física. | teste `limite de tacadas…` + navegador: tentativa de tacar no aviso ignorada, vez passa para o J2 com a bola no tee |
| D2 — obstáculo atravessava a bola parada | `Fisica.empurrarParada()` (bola parada é empurrada e volta a rolar) e `desencostar()` antes da tacada | QA-F2 e QA-F3 passam (F3 ajustado: pá na frente da bola, na linha da mira, rebate — comportamento físico) |
| D3 — portão espremia a bola pela parede | móveis resolvidos antes das paredes fixas; portão mais curto (1,4) e curso 2,6 | QA-F1 passa |
| D4 — toast preso no menu | `limparMensagens()` em nova partida, menu, placar e fim | código |
| D5 / P3 — Samuel e Player 2 dividiam o save | player passa `?perfil=<id>` no iframe (`jogar/index.php`); `perfilLocal()` lê da URL e depois do cookie | teste `chave versionada por perfil`; curl do player mostra `?perfil=samuel` nos 5 jogos (200) |
| D6 — save corrompido dizia "navegador não guarda" | `try` da leitura separado do `try` do `JSON.parse` | QA-S1 passa |
| D7 — Shift/Caps Lock prendiam a mira | teclas normalizadas para minúscula | QA-M1 passa |
| D8 / Q3 — vazamento de GPU na decoração | dispose de geometria, material e `InstancedMesh` | 12 trocas de pista: 63 geometrias e 6 texturas antes e depois |
| D9 — GC da prévia | `Fisica.previa()` reaproveita uma cópia; câmera sem objetos novos por chamada | código |
| D11 — rampa `de === ate` | guarda contra divisão por zero | código |
| Q2 — capa faltando | `assets/img/minigolfe-dos-pets.webp` 1200×675 (41 KB), quadro real do jogo (`?capa=4`) | curl 200 `image/webp` |
| Q4 — aviso MIT do three.js | `THIRD_PARTY_NOTICES.txt` no build | `verificar_jogo.py` ✓ |
| UI-01 / UX-07 — medidor e dica cobriam a bola | força, dica e aviso ficam logo abaixo do HUD (posição medida em tempo real) | auditoria 375×812, 812×375, 1366×768: sem sobreposição |
| UI-02 / CE-01 — câmera alta e bola colada embaixo | inclinação 0,92→0,74, FOV 38/52, centro a 42% do caminho bola→buraco | capturas |
| UI-03 — seta invisível | cores sólidas por faixa (verde/ouro/laranja), sem tone mapping, contorno tinta, pontos maiores | capturas |
| UI-04 — pista da cor do gramado | green `#3f9e3a/#4aab43`, gramado `#b5d98a` | capturas |
| UI-05 / UX-12 — avisos ilegíveis/cortados | cartão dourado no alto, fonte com `clamp`, quebra de linha; "VEZ DO 💜 2!" | auditoria |
| UI-06 / UX-05 — placar cortado no celular | no estreito só colunas jogadas + total; coroa 👑 para quem lidera | auditoria 375 com 4 jogadores: sem rolagem |
| UI-07 / UX-25 — menu rolando | layout compacto em telas baixas; modos numa linha | auditoria: sem rolagem |
| UI-08 — comemoração fora da tela | pets correm até o buraco e a câmera enquadra buraco + pets | código/capturas |
| UI-09 / UX-20 — HUD atrás das telas | HUD só durante a jogada | auditoria |
| UI-10..17 | logo sem borrar, números nos botões, dicas com ícone, singular/plural, posição densa (sem 🎖️), textos maiores, bola inteira na cor do jogador + número no HUD, som na pausa/menu/fim, véu mais leve com desfoque | capturas |
| UI-18 / UX-16 — janela dentro de janela no portal | dentro do iframe o menu esconde a barra `.exe` e as dicas (layout compacto) | código (altura do iframe do portal não foi alterada) |
| CE-02 — cores lavadas | `NeutralToneMapping`, exposição 1,0, sol 1,9, hemisfério 0,95 | capturas |
| CE-03 / CE-04 / CE-05 | gato na largura local do tee; decoração evita o lago; foco da câmera no canto da pista 2 | capturas |
| CE-06..13 | gira-gira listrado com eixo de pata; casinha com telhas, cumeeira e porta; lago com ondas, pedrinhas e vitórias-régias; ponte com corrimão; rampa com setas; bordas mais grossas com faixa clara e postes nos cantos; tee com pegada; pets 1,8× virados para a câmera; pinheiros e flores com pétalas | capturas |
| UX-01 — modo para a partida inteira | modo por jogador (🐾 com ajuda / ⭐ desafio); recorde separado por modo | testes + robô com modos mistos |
| UX-02 / UX-03 — rampa punia quem joga com ajuda; prévia enganava | com ajuda: velocidade 10, "rampa amiga" (gravidade 0,6) e prévia até a bola parar (6 s) | robô |
| UX-04 — pista 6 paredão | ponte 1,9 de largura, portão mais lento (5,6 s) | robô |
| UX-08 / UX-09 — dica duplicada / some para sempre | dica da pista 1 virou "⛳ Acerte o buraco!"; mão aparece na 1ª tacada de cada jogador (e em cada pista para quem joga com ajuda) | código |
| UX-10 — desafio fácil demais | captura do desafio 4,2→3,4 e buraco da pista 1 fora do centro; "Quase!" não aparece junto do acerto | robô |
| UX-11 / UX-17 — jargão e texto ambíguo | "meta ⭐", "DE PRIMEIRA! 🎯", "NA META!", "+1 tacada", "com ajuda/desafio", "BOA TENTATIVA! 👍 agora é a vez do 💜 2" | código |
| UX-13 — apagar partida sem confirmação | Recomeçar e Menu pedem um segundo toque | código |
| UX-14 — volume acima do teto | ganho mestre 0,22→0,12 (pico ≈ 0,08) | código |

**Ficou pendente (registrado):** teste em aparelho real (toque, FPS de 30 no celular de referência,
Safari/iPhone), playtest com o Samuel, altura do iframe no player do portal (o JOGAR! ainda pode ficar
abaixo da dobra em 1280×800 no portal), decoração extra da pista 1 (CE-14), `?debug` continua
disponível em produção (só expõe o estado do jogo, como os outros jogos).
