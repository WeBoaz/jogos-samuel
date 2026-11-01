# Hordas dos Blocos — origem do código

Decisão: DEC-008 em `docs/samuel-tech/DECISOES.md` (ST-010).

| Campo | Valor |
|---|---|
| Repositório | https://github.com/ken-fs/voxel-survivors |
| Commit | `cf9f1fccbcb73487ff45b8e3a6619a19b000be86` (2026-10-13) |
| Licença | MIT — © 2026 BubuAi (`upstream-voxel-survivors/LICENSE`, manter no jogo publicado) |
| Origem anterior declarada | módulos de `lib/` extraídos de mike007jd/voxel-musou (MIT, © 2026 BubuAi) |
| Three.js no upstream | r186 em `vendor/three` (não copiado aqui; fixar versão exata do npm no HO-010) |

## Cópia de referência (`upstream-voxel-survivors/`)

Só o necessário para adaptar: `LICENSE`, `README.md`, `lib/*.js`, `demos/play/index.html`
e `demos/play/README.md`, sem alterações. **Não publicar como está**: o `index.html`
traz Google Analytics com banner de consentimento, artigo de SEO e JSON-LD, que o
verificador (`ferramentas/verificar_jogo.py`) recusa.

Ficaram de fora: `vendor/` (Three.js), `demos/*/demo*.png`, `dist/itch`, `scripts/`
(site, IndexNow, domínio), `wrangler.jsonc`, `.build-env` (ID do GA), `.indexnow-key`,
`.wrangler/` e os demais demos.

## O que muda na adaptação

Lista completa em DEC-008. Resumo: tema de blocos claro e pt-BR, sem caveiras;
modo Explorador; horda menor; pausa em `visibilitychange`; botões de toque dentro de
375 px; mira automática a avaliar; sem analytics.
