# Estado — Minigolfe dos Pets

- Slug: `minigolfe-dos-pets`
- Ficha no Notion: https://app.notion.com/p/40b0a726d055815b96a7e71134a36414 (Estado: Publicado sem revisão)
- Data e fuso: 2026-11-01, America/Sao_Paulo (-03:00)
- Branch: `main` local = `exp-01-minigolfe-dos-pets` no fork AndaimeOS/jogos-samuel → PR https://github.com/WeBoaz/jogos-samuel/pull/1
- Último commit do código: `c0b67d9` · manifesto: `752744b` (1.0.1) — 1.0 era `8b3e383`/`040829f`
- Etapa atual: 1.0.1 publicada (RV-MG-001/003); aguardando teste no celular (Boaz) e revisão EXP-01-F
- Versão: 1.0.1 (`minigolfe-dos-pets@1.0.1+c0b67d9.producao`), em produção desde 2026-11-01 14:04 (-03:00)
- Pacote publicado: SHA-256 `eb76b1220f6eae07e097ed59a4becc98214e04bf434b078958ccb605c9204473`; QA em `docs/qa/minigolfe-dos-pets/1.0.1+c0b67d9/`
- Identidade pública: https://samuel.tech/jogo/minigolfe-dos-pets/release.json (SHA-256 de cada arquivo em `files`)
- Teste de FPS no aparelho: https://samuel.tech/jogo/minigolfe-dos-pets/index.html?fps (roteiro em `ROTEIRO-CELULAR.md`)
- URL local: http://127.0.0.1:8770/jogar/?jogo=minigolfe-dos-pets (Docker PHP, config `samuel-tech-php`)
- URL de produção: https://samuel.tech/jogar/?jogo=minigolfe-dos-pets
- Registro de deploy: https://app.notion.com/p/40b0a726d05581d69440cf9fa623464f (SHA256 do pacote `3d9b77d3…5379`)

## O que funciona

Seis pistas autorais em 3D (reta, curva com para-choque, rampa, casinha-túnel, gira-gira, final com ponte, água
e portão); de 1 a 4 jogadores por turnos, cada um com seu jeito (🐾 com ajuda: prévia até a bola parar, ímã,
rampa amiga, força limitada; ⭐ desafio: prévia curta, penalidade na água); mira estilingue por toque/mouse
(começa em qualquer lugar, cancela ao soltar perto) e teclado; placar entre pistas; pódio; recorde por circuito,
jeito e perfil (`samuel:minigolfe-dos-pets:<perfil>:v1`, perfil vindo de `?perfil=` do player); pausa real
(botão, P, Esc, troca de aba); confirmação para recomeçar/menu; som sintetizado com volume baixo.

## Decisões

DEC-010 (Three.js 0.170 + TS + Vite, física própria, sem Rapier) e DEC-011 (manifesto de release) em
`docs/samuel-tech/DECISOES.md`. Arte toda gerada por código; aviso MIT do three.js no build.

## Aceites

| Critério | Resultado |
|---|---|
| Bola rápida não atravessa parede nem pula o buraco sem detecção | cumprido — testes de física (24 direções × 6 pistas, cruzamento de paredes internas) |
| Sem tacada com bola andando; recuperação fora da pista / local inválido | cumprido — testes + navegador (água volta ao último ponto, parada forçada em 18 s, obstáculo empurra bola parada) |
| Alternância de jogador uma única vez; placar fecha após 6 buracos | cumprido — testes + robô (18 trocas para 3 jogadores) |
| Mira com mouse e toque sem rolar a página; cancelar não taca | cumprido — gestos simulados (soltar perto, pointercancel, blur) e testes da mira |
| Reiniciar limpa tudo; dois circuitos sem duplicar listeners | cumprido — ouvintes estáveis após vários circuitos; GPU estável |
| Aceites globais (rotas, 403, pt-BR, sem rolagem, pausa, save, sem erro de console, licenças, regressão) | cumprido — ver QA-QUALIDADE.md e verificação pós-deploy |
| Desempenho ≥ 30 FPS no celular de referência | **não testado** — medidor `?fps` publicado na 1.0.1; Mac ~120 FPS; WebKit emulado ~57 FPS (não vale como aparelho) |
| Recordes não se perdem com duas abas (RV-MG-003) | cumprido — 1.0.1, testes de mescla no save |
| Playtest com o Samuel | **não testado** |

## Pendências e bloqueios

- A conta GitHub disponível (AndaimeOS) não tem escrita em WeBoaz/jogos-samuel: código no PR #1 (fork); a
  branch `publicacao` não foi atualizada. Depois do merge, rodar `ferramentas/empacotar.sh` e atualizar a
  `publicacao`, senão um deploy por ela remove o jogo.
- Teste em aparelho real e playtest com o Samuel.

## Próxima ação exata

Boaz roda `ROTEIRO-CELULAR.md` no celular e manda o resumo do `?fps`; com ele, registrar em RV-MG-001 e pedir a
reavaliação EXP-01-F. Fila P2 para a próxima versão: painel do `?fps` cobre os botões da pausa; `git ls-files -z`.

## Arquivos alterados

`desenvolvimento/jogos/minigolfe-dos-pets/**`, `_privado/jogos/minigolfe-dos-pets/**`, `_app/jogos.json`,
`assets/img/minigolfe-dos-pets.webp`, `jogar/index.php`, `ferramentas/release_jogo.py`,
`ferramentas/roteador-local.php`, `docs/samuel-tech/DECISOES.md`.
