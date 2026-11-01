# Interface de Hordas dos Blocos e Dungeons dos Blocos (ST-030)

Decidido em 2026-11-01. Vale para as superfícies DOM dos dois jogos (menu, HUD, melhoria,
pausa, fim, controles de toque). O portal PHP não muda.

## Arquivos

| Arquivo | Papel |
|---|---|
| `desenvolvimento/compartilhado/ui-blocos.css` | Tokens do kit + componentes (cartão `.exe`, botões, opções, melhorias, resultado, HUD, toque). |
| `desenvolvimento/compartilhado/controles-toque.js` | Joystick flutuante + botões de ação com multitoque (Pointer Events), `soltarTudo()` em blur/troca de aba, `recarga(nome, 0..1)`, `destruir()`. |
| `desenvolvimento/interface/prototipo.html` | Protótipo navegável das 15 telas (`?tela=hordas-chefe`, `?toque` força o modo toque, `?limpo` esconde a barra de telas). Servir `desenvolvimento/` com `python3 -m http.server 8892 --bind 127.0.0.1 --directory desenvolvimento`. |

Cada jogo leva **uma cópia** dos dois arquivos para `_privado/jogos/<slug>/` (o build de um
jogo não pode depender de outro slug). Mudou o original? Copiar de novo para os dois jogos
e anotar no commit.

## Direção

- **Fonte da verdade visual:** `kit/brand/tokens.json` (papel `#F5F2E8`, tinta `#193337`,
  verde play `#B9ED80`, laranja `#FF9D52`, lilás `#CEB7EF`, céu `#C3E8F4`, floresta
  `#326344`) e o padrão de cartões que o Reino dos Blocos já usa: janela com barra `.exe`,
  borda 2 px, sombra sólida, raio 0, títulos Courier New 900.
- **Regras infantis** (skill `design-infantil` da branch `site-estatico`): alvos de toque
  de **64 px** (o kit pede 44 no mínimo), poucas palavras com ícone, números grandes no
  resultado, pausa/som sempre visíveis, "Fim da rodada" em vez de "game over", perder mostra
  o que ele conseguiu, nada de flashes fortes.
- **Mundo do jogo** (orientação para HO-010/DU-010; o protótipo só sugere):
  - herói em laranja/amarelo (cores do Samuel; Player 2 em lilás);
  - inimigos em blocos lilás/roxo de "gosma" com borda escura: contrastam com chão verde
    e com chão de pedra cinza;
  - cristais em ciano `#4ee6e0`; baús em madeira dourada;
  - Dungeons em pedra cinza-arroxeada clara, **sem** caveiras, cripta ou escuro gótico;
  - efeitos nunca escondem herói, inimigos, projéteis ou controles.

## Telas

| Tela | Hordas | Dungeons |
|---|---|---|
| Menu | logo, 3 dicas com ícone, herói (Samuel / Player 2), modo (🐢 Explorador 3 min / ⭐ Desafio 8 min), `← Jogos` · `▶ JOGAR!` · selo de recorde | mesmo layout; dicas 🕹️ ⚔️ 💨 🔑; Explorador com setas de ajuda |
| HUD | ❤️ número + barra, ⏱ tempo, 💎 cristais, nível + barra de XP, 🔊 e II | ❤️, 🚪 sala x/8, 🔑 (apagada até pegar), 🧪 poções, 🔊 e II |
| Evento | aviso grande "ONDA 3!", "CHEFÃO!"; barra do chefe no fluxo do HUD | "SALA DO CHEFE"; toast "🎁 Espada de cristal!" ao abrir baú |
| Melhoria | 3 cartões grandes (ícone + 2 palavras + efeito), teclas 1/2/3; **pausa a simulação** | — |
| Pausa | ▶ Continuar (grande), ↻ Recomeçar, 🔊, ← Jogos | igual |
| Fim | "VOCÊ AGUENTOU!" ou "FIM DA RODADA"; tempo, derrotados, nível; selo de recorde; ↻ Jogar de novo (grande), ☰ Menu, ← Jogos | "MASMORRA VENCIDA!" ou "QUASE LÁ!" com "volta na sala N" (checkpoint) |
| Toque | joystick à esquerda; ✨ especial (grande) + 💨 correr | joystick; ⚔️ golpe (grande), ✨ poder, 💨 esquiva |

Layout adaptativo: em tela estreita (≤ 560 px) vida + pausa/som ficam na 1ª linha do HUD e o
resto desce; as melhorias viram lista. Em tela baixa (≤ 500 px, celular deitado) herói e modo
ficam lado a lado, os botões de ação encolhem para 68/88 px e o aviso vai para 58% da altura.
Dica de tecla (`kbd`) some no modo toque. `prefers-reduced-motion` desliga o "pop" do aviso e a
animação das barras.

## Validação (2026-11-01, navegador embutido)

- 15 telas × 3 tamanhos (815×881 desktop, 375×812 em pé, 812×375 deitado): nenhuma rolagem
  horizontal, nenhum cartão rolando, todos os alvos ≥ 64 px, nenhum painel do HUD sobreposto
  a outro ou aos controles de toque. Antes das correções apareceram: botão de pausa fora da
  tela em 375 px, barra do chefe sob a barra de XP, menu rolando 125 px deitado, aviso sobre a
  barra do chefe e ícone apagado no botão em recarga — todos corrigidos e reauditados.
- Contraste (WCAG): tinta/papel 11,9:1; tinta/verde 9,9; tinta/ouro 9,5; tinta/lilás 7,4;
  floresta/creme 6,9; cinza/creme 6,0.
- Multitoque simulado (Pointer Events): joystick + golpe + esquiva ao mesmo tempo; soltar um
  botão não solta o outro nem o joystick; zona morta zera o eixo; `blur` solta tudo;
  `destruir()` remove os ouvintes.
- Teclado: P e Esc alternam pausa; 1/2/3 escolhem a melhoria. Console sem erros.
- **Não testado:** toque real em aparelho, Safari/iPhone, Android, leitor de tela, criança.

## Skills e ferramentas

Usados: tokens e brand kit do repositório, padrão do Reino dos Blocos e a skill
`design-infantil` (lida da branch `site-estatico`). **Não usados** nesta etapa:
frontend-design, design-taste-frontend, UI UX Pro Max, 21st.dev e Motion — o kit já define a
direção e a interface é DOM simples com CSS; nenhuma dependência nova.
