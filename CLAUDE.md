# samuel.tech — contexto para o Claude

Site de jogos feitos pelo pai/mãe para o **Samuel (7 anos)** e para a **Heloísa (4 anos)**.
Publicado em **https://samuel.tech**. Idioma: **português do Brasil**, sempre.

## Stack
- **Site estático, sem build.** HTML + CSS + JS puro. Sem framework, sem npm.
- Cada jogo é **um único `index.html`** na sua própria pasta (`/nome-do-jogo/`).
- Testar localmente: `python3 -m http.server 8765` e abrir http://localhost:8765

## Estrutura
```
index.html               Home pública (céu, personagens, vitrine, heróis)
entrar/index.html        Login com "senha de blocos" (escolhe herói + 3 blocos)
jogos/index.html         Área logada: perfil, XP, conquistas, baú de jogos
marca/index.html         Kit de marca visual  ·  marca/MARCA.md = versão texto
dragoes-e-blocos/        Jogo 1 (canvas, HTML único)
assets/css/samuel.css    Design system "Blocos 90" (tokens + componentes)
assets/js/config.js      Jogadores e senhas de blocos
assets/js/catalogo.js    LISTA DE JOGOS (editar aqui para publicar jogo novo)
assets/js/site.js        Sessão, progresso/XP, sons 8-bit, contador → window.Samuel
assets/img/              personagens/, blocos/, icones/, marca/  (gerados)
assets/fonts/            Press Start 2P + VT323 (OFL, locais)
ferramentas/gerar_pixel_art.py   Gera TODAS as imagens a partir de grades ASCII
```

## Regras de design (resumo de marca/MARCA.md — leia o arquivo completo)
- Estilo **“Blocos 90”**: mundo de blocos (pixel art 16×16) + internet anos 90 (janelas com bisel, letreiro, contador, selos 88×31).
- **Nada de cantos arredondados.** Sombra dura `6px 6px 0`, contorno de 4px `var(--noite)`, espaçamentos em múltiplos de 4px.
- Fontes: `var(--fonte-titulo)` (Press Start 2P) para títulos/botões; `var(--fonte-texto)` (VT323) para texto, **mínimo 22px**.
- Use **só as cores dos tokens** de `samuel.css` (`--grama`, `--terra`, `--diamante`, `--ouro`, `--redstone`, `--neon-rosa`, `--neon-roxo`, `--noite`…).
- Imagens pixel art sempre com `image-rendering: pixelated` e ampliadas em múltiplos inteiros.
- Reaproveite os componentes: `.btn`, `.janela`, `.slot`, `.etiqueta`, `.letreiro`, `.xp`, `.ceu`, `.chao`.
- Alvos de toque ≥ 56px (dedos pequenos, tablet/celular).
- Texto fala **com a criança**: curto, “você”, animado. Ver “Voz e tom” em MARCA.md.
- Nada de violência gráfica, sustos, anúncios, links externos, chat ou coleta de dados.
- Respeitar `prefers-reduced-motion`.
- **Nunca** usar fotos reais das crianças no site — só os personagens em pixel art.
- Não copiar personagens, texturas, logos ou nomes de jogos/desenhos existentes (Minecraft, Bluey etc.): o estilo é inspirado em blocos, mas tudo é original.

## Como publicar um jogo novo
1. Criar `/<id-do-jogo>/index.html` — HTML único, autossuficiente, funciona com toque e teclado.
2. No jogo, incluir um link `<a href="../jogos/">← Voltar aos jogos</a>` (tela inicial e tela de fim).
3. Opcional: usar a marca dentro do jogo com
   `<link rel="stylesheet" href="../assets/css/samuel.css">` e `<link rel="icon" href="../assets/img/marca/icone.svg">`.
4. Adicionar o item em `assets/js/catalogo.js` (`status: "pronto"`, `novo: true`).
5. Se precisar de ícone novo: desenhar a grade em `ICONES` dentro de `ferramentas/gerar_pixel_art.py` e rodar `python3 ferramentas/gerar_pixel_art.py`.

### Modelo de pedido para um jogo novo
> Crie o jogo **<NOME>** para o samuel.tech seguindo o CLAUDE.md.
> Ideia: <o que o jogador faz, em 2–3 frases>.
> Personagem jogável: <Samuel | Heloísa | os dois>.
> Controles: toque na tela + setas/espaço no teclado.
> Dificuldade: <fácil para 4 anos | média para 7 anos>, com fases que vão ficando mais difíceis.
> Usar paleta e fontes do kit de marca, sons 8-bit, botão de som e de pausa.
> Ao terminar: adicionar no `assets/js/catalogo.js`.

## Publicação (Hostinger)
O samuel.tech fica na **Hostinger** (conta `u401945237`, pasta `public_html`). O app do GitHub conectado
à Hostinger não enxerga `WeBoaz/jogos-samuel`, então **não há deploy automático**. Para publicar:
1. Juntar as mudanças na `main`.
2. `ferramentas/empacotar.sh` → gera `samuel-site.zip` (só arquivos públicos).
3. Atualizar a branch órfã **`publicacao`** do repositório com o novo `samuel-site.zip` (+ `LEIA-ME.md`) e dar push.
4. Hostinger (MCP): `hosting_git_deploy-website-repository` com
   `https://github.com/WeBoaz/jogos-samuel.git`, branch `publicacao`, directory `_publicacao`
   (se a pasta já existir, isso faz pull).
5. Hostinger: `hosting_websites_deploy-static-site-archive` com `archive_path: "_publicacao/samuel-site.zip"`.
6. Conferir com `hosting_files_list-website-and-directories`.
Alternativa definitiva: no hPanel (Sites → samuel.tech → Avançado → Git) conectar a conta GitHub WeBoaz;
aí `hosting_deploy` com `WeBoaz/jogos-samuel`, branch `main`, `type: static` liga o deploy automático.

## Login (importante)
O login é uma **“porta de brincadeira”** guardada no `localStorage`: escolhe o herói e toca 3 blocos
(senhas em `assets/js/config.js`). **Não é segurança de verdade**: o site é estático e qualquer pessoa
pode ler as senhas no código ou abrir a URL de um jogo direto. Se um dia precisar de login real,
usar um serviço de autenticação (ex.: Supabase Auth) — não tentar “esconder” senha no front-end.

## API JS disponível (`window.Samuel`, de assets/js/site.js)
- `Samuel.sessao.jogador()` → jogador logado ou `null` · `.exigir()` redireciona para /entrar/ · `.sair()`
- `Samuel.progresso.ler(id)` · `.registrarJogada(idJogador, idJogo)` (+10 XP) · `.nivel(xp)`
- `Samuel.som.tocar('clique'|'bloco'|'moeda'|'sucesso'|'erro')` · atributo `data-som` em botões
- `Samuel.url('caminho/relativo/a/raiz')` → URL absoluta (funciona em qualquer subpasta)
