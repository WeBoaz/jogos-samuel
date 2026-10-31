# Kit de marca — samuel.tech

Versão visual: abra `/marca/` no navegador (samuel.tech/marca).

## 1. Conceito — “Blocos 90”

> **Um mundo de blocos onde cada jogo foi construído à mão para o Samuel.**

A marca junta duas coisas:

1. **Mundo de blocos**: grama, terra, pedra, minérios brilhando, céu com nuvens quadradas e sol quadrado. Tudo em pixel art 16×16.
2. **Internet dos anos 90**: janelas com bisel (`JOGO.EXE`), letreiro rolando, contador de visitas, selos 88×31, faixa “em construção” e tela de TV antiga (CRT).

O resultado tem que ser colorido, nítido e alegre, sem nada assustador.

## 2. Logo

- Fonte própria **“Bloquinho”** (bitmap 5×7, desenhada em `ferramentas/gerar_pixel_art.py`).
- `SAMUEL` em blocos de **grama** (verde em cima, terra embaixo). `.TECH` em **diamante**. `JOGOS DO` em **ouro**.
- Sempre com contorno de 1px **#1B1036** e extrusão 3D para baixo e para a direita.

| Arquivo | Uso |
|---|---|
| `assets/img/marca/logo-horizontal.svg` | Cabeçalho, rodapé, assinaturas |
| `assets/img/marca/logo-empilhado.svg` | Capa, tela inicial, imagem de compartilhamento |
| `assets/img/marca/icone.svg` / `icone-512.png` / `icone-180.png` | Favicon, ícone de app (“S” de grama no bloco neon) |
| `assets/img/marca/og-samuel-tech.png` | Imagem de compartilhamento 1200×630 |

**Pode:** ampliar em múltiplos inteiros (2×, 3×, 4×) com `image-rendering: pixelated`; usar sobre céu, noite roxa, papel creme ou grama.
**Não pode:** esticar, girar, borrar, suavizar, trocar as cores das letras, tirar o contorno ou colocar sobre foto.

## 3. Cores

### Blocos (base)
| Nome | Hex | Token | Uso |
|---|---|---|---|
| Grama | `#5DBB3F` | `--grama` | Botão principal, chão, sucesso |
| Grama escura | `#3E8E2A` | `--grama-esc` | Sombra da grama |
| Terra | `#8B5A2B` | `--terra` | Chão, letras do logo |
| Terra escura | `#5E3A1A` | `--terra-esc` | Extrusão 3D |
| Pedra | `#8C8C8C` | `--pedra` | Faixas, slots |
| Diamante | `#4EE6E0` | `--diamante` | Links, .TECH, destaques |
| Ouro | `#FFC93C` | `--ouro` | Títulos 3D, botão Entrar, moedas |
| Redstone | `#E8333A` | `--redstone` | Sair, erro, vida |
| Madeira | `#B98A4E` | `--madeira` | Detalhes, baús |

### Neon 90s (tempero — use pouco)
| Nome | Hex | Token | Uso |
|---|---|---|---|
| Neon rosa | `#FF4FD8` | `--neon-rosa` | “NOVO!”, bordas do letreiro |
| Neon roxo | `#8A4FFF` | `--neon-roxo` | Barra de janela, bloco neon |
| Azul janela | `#1F3A93` | `--azul-janela` | Barra de título |
| Cinza janela | `#C9C3D9` | `--cinza-janela` | Fundo de janelas e do topo |

### Noite e céu (fundos)
| Nome | Hex | Token | Uso |
|---|---|---|---|
| Noite | `#1B1036` | `--noite` | Fundo escuro e **contorno de tudo** |
| Noite 2 | `#2A1858` | `--noite-2` | Cartões no escuro |
| Tinta | `#140B26` | `--tinta` | Texto escuro, rodapé |
| Papel | `#FFF7E6` | `--papel` | Texto claro |
| Céu | `#7EC8F5` | `--ceu` | Fundo do dia |
| Céu topo | `#4FA8F0` | `--ceu-topo` | Topo do degradê do céu |

### Heróis
| Nome | Hex | Token |
|---|---|---|
| Azul Samuel | `#8FD3F0` | `--cor-samuel` |
| Rosa Heloísa | `#FFB3D9` | `--cor-heloisa` |

## 4. Tipografia

| Fonte | Uso | Tamanhos | Regras |
|---|---|---|---|
| **Press Start 2P** | Títulos, botões, etiquetas, barras de janela | 10 · 12 · 14 · 18 · 24 · 40px | Frases curtas (até ~5 palavras); CAIXA ALTA nos botões |
| **VT323** | Parágrafos, descrições, fichas | 22 (mínimo) · 24 (padrão) · 28–40 | Nunca abaixo de 22px |

As duas estão em `assets/fonts/` (licença SIL OFL, sem depender do Google).

## 5. Personagens

Recriados a partir das fotos de referência, em pixel art (cabeça 16×16, proporção de boneco de blocos). **Nenhuma foto real vai para o site.**

**Samuel (7) — “O Construtor”** · herói principal
- Cabelo castanho-escuro arrepiado pra cima (topete em pontas)
- Olhos castanhos, bochechas rosadas, sorrisão com a **janelinha do dente**
- Polo azul-claro `#8FD3F0`, calça azul-marinho `#22305A`, tênis azul `#5F86C0` com detalhe laranja `#FF7A2E`

**Heloísa (4) — “A Exploradora”** · parceira de aventura
- Tranças castanhas `#5C3820` com **elásticos roxos** `#9B5CFF`
- **Óculos de coração** rosa `#FF3E9A` na cabeça, brilhinhos no rosto
- Vestido degradê pastel: rosa `#FFB3D9` → pêssego → amarelo → menta → azul `#BFE3FF`; sandálias rosa e menta

Arquivos: `assets/img/personagens/` → `samuel.svg/png`, `heloisa.svg/png`, `dupla.svg`, `avatar-samuel.svg`, `avatar-heloisa.svg`.

## 6. Blocos e ícones

Grade 16×16, ampliados em múltiplos inteiros, contorno de 1px `--noite` nos ícones.

- **Blocos** (`assets/img/blocos/`): grama, terra, pedra, diamante, ouro, madeira, folhas, neon.
- **Ícones** (`assets/img/icones/`): coração, estrela, moeda, controle, troféu, cadeado, chave, casa, dragão, nuvem, sol.

Todos são gerados por `python3 ferramentas/gerar_pixel_art.py` (texturas próprias, nada copiado de jogo nenhum).

## 7. Componentes (em `assets/css/samuel.css`)

Regras de ouro: **sem cantos arredondados** · sombra dura `6px 6px 0` · contorno de 4px `--noite` · espaçamentos em múltiplos de 4px · alvos de toque com no mínimo 56px.

| Classe | O que é |
|---|---|
| `.btn` + `--ouro` `--diamante` `--rosa` `--pedra` `--perigo` · `--grande` `--pequeno` | Botão de bloco 3D que “afunda” ao apertar |
| `.janela` > `.janela__barra` + `.janela__corpo` + `.janela__status` | Janela estilo Windows 95 |
| `.slot` (+ `.slot--trancado`) dentro de `.inventario` | Cartão de jogo, estilo inventário |
| `.etiqueta` (+ `--novo` piscando, `--breve`) | Etiquetas |
| `.letreiro` > `.letreiro__trilho` | Letreiro rolando |
| `.selo-88` · `.em-construcao` · `.contador` | Enfeites anos 90 |
| `.xp` > `.nivel` + `.xp__barra` | Barra de experiência |
| `.ceu` · `.ceu--noite` · `.chao` · `.faixa-pedra` · `.nuvem` · `.sol` | Cenário |
| `.texto-3d` · `.crt` · `.pula` · `.balanca` | Efeitos |

Sons 8-bit sem arquivos: `Samuel.som.tocar('clique' | 'bloco' | 'moeda' | 'sucesso' | 'erro')`, ou o atributo `data-som="bloco"` em qualquer botão.

## 8. Voz e tom

O site fala **com a criança**, como um amigo animado: frases curtas, “você”, verbos de ação e no máximo um emoji. Os leitores têm 7 e 4 anos.

| ✔ Assim | ✘ Assim não |
|---|---|
| “Bora jogar!” | “Clique aqui para acessar a plataforma.” |
| “Ops! Tente de novo.” | “Credenciais inválidas.” |
| “Acertou! Abrindo o baú…” | “Você perdeu. Fim de jogo.” |

**Vocabulário:** jogos → **baú** · login → **entrar** · senha → **blocos secretos** · pontos → **XP** · usuário → **herói** · erro → **ops!**
