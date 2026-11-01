# desenvolvimento/ — material dos jogos que não vai para o site

Nada desta pasta entra no `samuel-site.zip`: o `ferramentas/empacotar.sh` só leva a lista
explícita de pastas públicas (`_privado`, `_app`, `assets`…). O roteador local também
bloqueia `/desenvolvimento/` para imitar o site.

## Onde fica o código de cada jogo

| Tipo de jogo | Código-fonte | O que o site serve |
|---|---|---|
| **Sem build** (HTML + módulos ES + import map relativo, como Turbo e Caça às Estrelas) | `_privado/jogos/<slug>/` é a própria fonte | `_privado/jogos/<slug>/` |
| **Com build** (Vite/TypeScript etc.) | `desenvolvimento/jogos/<slug>/src/` + `package.json` com versões exatas | saída do build copiada para `_privado/jogos/<slug>/` e commitada |

O pacote usa `git archive` do HEAD: **a saída que vai ao ar precisa estar commitada** em
`_privado/jogos/<slug>/`. Build com Vite usa `base: './'` (caminhos relativos).

`desenvolvimento/jogos/<slug>/` guarda também, para qualquer tipo de jogo:

- `ORIGEM.md` — repositório, commit, licença e o que foi aproveitado de código de terceiros;
- `upstream-*/` — cópia de referência do código de terceiros usado como base (com `LICENSE`);
- testes e anotações que não devem ser publicados.

## Comandos

```bash
# conferir a pasta publicável de um jogo (ou de todos)
python3 ferramentas/verificar_jogo.py hordas-dos-blocos
python3 ferramentas/verificar_jogo.py --todos

# portal local com PHP (Docker; o brew deste Mac não instala php)
docker run --rm -p 127.0.0.1:8770:8770 -v "$PWD":/app:ro -w /app \
  -e SAMUEL_CONFIG=/tmp/samuel-config.php php:8.3-cli \
  php -S 0.0.0.0:8770 ferramentas/roteador-local.php
# → http://127.0.0.1:8770/jogar/?jogo=<slug>

# com PHP instalado, o comando do CLAUDE.md continua valendo
SAMUEL_CONFIG=/tmp/samuel-config.php php -S 127.0.0.1:8770 ferramentas/roteador-local.php
```

Jogo em desenvolvimento entra no `_app/jogos.json` com `"status": "rascunho"`: só abre no
modo responsável (`/admin`). Vira `pronto` na tarefa de publicação, depois dos testes.
