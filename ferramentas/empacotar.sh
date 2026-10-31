#!/usr/bin/env bash
# Gera samuel-site.zip só com os arquivos do site (a partir do último commit).
# Fica de fora: kit/, ferramentas/, docs e arquivos do repositório.
set -euo pipefail
cd "$(dirname "$0")/.."
git archive --format=zip -o samuel-site.zip HEAD \
  .htaccess index.php 404.php jogo.php robots.txt \
  _app _privado assets entrar exploradores jogos jogar conta sair
echo "✓ samuel-site.zip ($(du -h samuel-site.zip | cut -f1))"
