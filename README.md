# Jogos do Samuel — samuel.tech

Site estático com os jogos feitos para o Samuel, no estilo **“Blocos 90”** (mundo de blocos + internet anos 90).

| Página | Caminho |
|---|---|
| Home | `index.html` |
| Entrar (herói + 3 blocos secretos) | `entrar/` |
| Baú de jogos (área logada, XP, conquistas) | `jogos/` |
| Kit de marca | `marca/` · texto em `marca/MARCA.md` |
| Jogo: Dragões & Blocos | `dragoes-e-blocos/` |

Sem build. Para testar localmente:

```bash
python3 -m http.server 8765
```

**Senhas de blocos (troque em `assets/js/config.js`):**
- Samuel: diamante → grama → ouro
- Heloísa: neon → neon → diamante

**Publicar jogo novo:** crie `/<pasta>/index.html` e adicione um item em `assets/js/catalogo.js`.

**Regerar imagens** (personagens, blocos, ícones, logo, favicon, imagem de compartilhamento):

```bash
python3 ferramentas/gerar_pixel_art.py
```

Instruções completas para o Claude (estrutura, regras de design, como criar jogos): **`CLAUDE.md`**.
