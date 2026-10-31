#!/usr/bin/env bash
# Gera samuel-site.zip só com os arquivos públicos do site (a partir do último commit).
set -euo pipefail
cd "$(dirname "$0")/.."
git archive --format=zip -o samuel-site.zip HEAD index.html entrar jogos marca dragoes-e-blocos assets
echo "✓ samuel-site.zip ($(du -h samuel-site.zip | cut -f1))"
