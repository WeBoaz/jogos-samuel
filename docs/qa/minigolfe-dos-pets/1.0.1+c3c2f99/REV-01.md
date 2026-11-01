# REV-01 — Revisão de código independente · Minigolfe dos Pets 1.0.1

## Papel
REV-01, revisor de código independente (protocolo de QA v1.1 do samuel.tech). Só leitura: nenhum arquivo do
repositório foi editado (`git status` do worktree continua limpo; o único item não rastreado é o symlink
`node_modules`, que já existia). Navegador não usado.

## Candidata
| Campo | Valor |
|---|---|
| id | `minigolfe-dos-pets@1.0.1+c3c2f99` (manifesto: `minigolfe-dos-pets@1.0.1+c3c2f99.producao`) |
| commit da candidata | `9390cb2fc7d029ed176e44e1ca18fa226e0ebc3e` (HEAD do worktree, conferido) |
| source_commit do manifesto | `c3c2f99b9a59bd99fd717fe8252eb2599b90689e`; `git diff c3c2f99 9390cb2` muda só `release.json` |
| pacote | `samuel-site.zip`, SHA-256 **conferido**: `d42600f58fee7bf66bb31b8555ed5ce75f85f63676151dec6bd257c73adc90af` |
| base de comparação | 1.0 publicada (`8b3e383`, manifesto `040829f`); diff revisado: `git diff dc7628c 9390cb2` |

## Comandos executados e saídas resumidas
| # | Comando | Resultado |
|---|---|---|
| 1 | `shasum -a 256 cand-mg-101/samuel-site.zip` | bate com o hash congelado |
| 2 | `npx vitest run` (em `desenvolvimento/jogos/minigolfe-dos-pets`) | 6 arquivos, **50/50 testes passam** (inclui `medidor.test.ts` 4 e `qa-dev-save.test.ts` 10) |
| 3 | `npx tsc --noEmit` | sem erros, saída 0 |
| 4 | `python3 ferramentas/verificar_jogo.py minigolfe-dos-pets` (raiz do worktree) | `✓ minigolfe-dos-pets`, aviso “5 arquivos, 0.6 MB”, saída 0 |
| 5 | `unzip` do zip congelado em diretório novo vazio `qa-mg-101/rev01-zip/` + script próprio `python3 -I qa-mg-101/rev01-scripts/hashes.py` (fora do diretório extraído; nada do zip foi executado) | os 4 hashes de `files` batem (`THIRD_PARTY_NOTICES.txt`, `assets/index-CmqmScAi.css`, `assets/index-pZGKRt6m.js`, `index.html`); nenhum arquivo do jogo no zip fica fora do manifesto |
| 6 | `diff -r` pasta do jogo no zip × worktree | idênticas |
| 7 | `git archive 9390cb2 <mesmos caminhos do empacotar.sh>` extraído em `qa-mg-101/rev01-arch/` e `diff -r` com o zip | **zip == git archive do commit da candidata** |
| 8 | `npx vite build --outDir qa-mg-101/rev01-build --emptyOutDir` (rebuild fora do repositório) | build **reprodutível**: os 4 arquivos têm hash idêntico ao build commitado |
| 9 | busca no bundle por `fetch`, `sendBeacon`, `XMLHttpRequest`, `WebSocket`, `EventSource`, URLs `http(s)` | só `fetch("release.json",{cache:"no-store"})` (relativo, novo), `fetch(s.href,…)` (polyfill de modulepreload do Vite, já existia) e o namespace XHTML do Three.js; nenhum envio de dado |
| 10 | microbenchmark `node qa-mg-101/rev01-scripts/bench.mjs` (custo de `estatisticas` por chamada) e modelo `sim.mjs` | ver P1-01 |

## O que foi revisado
1. **Medidor `?fps`** (`src/ui/medidor.ts`, `src/main.ts:30-31, 92-95, 530`, `src/ui/minigolfe.css` final).
   - Só existe com `?fps` (`params.has('fps')`); sem o parâmetro não há DOM, `fetch` nem ouvinte novo.
   - `/jogar/` passa só `?perfil=` ao iframe (`jogar/index.php:16`), então uma criança não liga o medidor sem querer.
   - Nada sai do aparelho: o único acesso de rede é `fetch('release.json')` relativo, na mesma origem (`jogo.php`
     entrega `.json` como `application/json`). Copiar é ação manual (`navigator.clipboard`). UA, tela e GPU
     (`WEBGL_debug_renderer_info`) só aparecem na tela.
   - Toque: `#medidor` tem `pointer-events: none`; o painel de resumo é irmão do canvas e a `Mira` escuta só o
     canvas, então tocar em “Copiar” ou “Fechar” não vira tacada.
   - Ouvintes: um `visibilitychange` por página (uma instância só) e dois `click` que somem com o painel. Não vaza.
   - `FPS_SEG`: `?fps`, `?fps=`, `?fps=abc` e `?fps=0` dão 300 s; o valor fica preso entre 10 e 1800. Correto.
   - Estatística: média ponderada pelo tempo (`n·1000/Σms`), p95 por posição (`ceil(0,95n)−1`), quedas `> 50 ms`
     e meta `média ≥ 29,9 && p95 ≤ 40`. Fórmulas corretas. Problemas de custo e de amostra estão em P1-01 e P2-01.
2. **Save (RV-MG-003)** (`src/storage/save.ts:40-87`).
   - `sincronizar()` relê o disco antes de `gravar()` e de `registrar()` e mescla os recordes com `mesclarMelhores`:
     vence o menor número de tacadas, e no empate fica o do disco.
   - Preferências: vale a última aba que gravou, como pedido.
   - Disco corrompido ou ilegível: o `try/catch` fica com a memória. Schema diferente: `validar` devolve o padrão e
     a mescla só acrescenta.
   - Chaves continuam filtradas por `/^[a-z0-9-]{1,40}$/`, o que barra `__proto__`.
   - Sem recorde falso: `registrar` compara já com o disco mesclado (teste “B não chama de recorde…”).
   - Sem perda de dados: não existe função de apagar recordes (procurei `limpar`, `apagar`, `zerar` e
     `removeItem`), então a mescla não ressuscita nada que alguém apagou de propósito.
   - Nenhuma exceção nova sem tratamento. Chave e schema (`:v1`) inalterados, sem migração.
3. **`ferramentas/release_jogo.py`**: `files` e `files_base_url` corretos para esta candidata, ver passos 5 a 8.
   Ressalva de robustez em P2-02.
4. **Regras da casa** (CLAUDE.md do projeto): nada de coleta, rastreador, analytics, CDN, chat ou anúncio no diff.
   Conteúdo é só texto técnico de teste. `verificar_jogo.py` passa.

## Achados

### P0 (bloqueia)
Nenhum.

### P1 (corrigir antes de publicar)

**P1-01 — O medidor gasta cada vez mais CPU e entra na própria medição (e no jogo)**
`src/ui/medidor.ts:15` e `:54-59`; o custo cai no quadro seguinte de `main.ts:530`.

O problema:
- A cada 500 ms, `quadro()` chama `estatisticas(this.ms)`, que copia e **ordena o histórico inteiro**
  (`Array.from(ms).sort(...)`, O(n log n)).
- `this.ms` cresce sem limite: guarda tudo desde o início e **continua crescendo depois do resumo**.
- O tempo desse sort cai dentro do intervalo do quadro seguinte. Então ele entra no `dt` medido e também no
  `dtReal`, que alimenta a qualidade adaptativa do jogo (`main.ts:532-533`). Isso fere dois requisitos:
  “não afeta o jogo” e “estatística correta”.

Medido (Node, desktop, comparador igual ao do código):

| Amostras | Custo por chamada |
|---|---|
| 18 mil | 4,1 ms |
| 36 mil | 8,1 ms |
| 108 mil | 29,9 ms |
| 216 mil | 58,8 ms |

18 mil amostras são 300 s a 60 Hz; 108 mil são 1800 s a 60 Hz. Um celular de entrada costuma ser várias vezes
mais lento. O fator 4× usado abaixo é estimativa, não foi medido em aparelho.

Modelo (`sim.mjs`, celular 4×, sem a quantização de vsync, que tende a piorar):

| Cenário | Valor real | O medidor relata | Efeito |
|---|---|---|---|
| `?fps=1800` a 60 Hz | 60 FPS, 0 quedas | média 54,2 FPS, **2638 “quedas” > 50 ms** | todas criadas pelo próprio medidor |
| aparelho marginal a 30 FPS, 300 s | média 30,0 | média **29,8** (p95 35,3) | cai abaixo do limite 29,9: a meta vira “NÃO cumprida” sem o jogo ter piorado |

Além disso, se o testador deixar a aba aberta depois do resumo, os soluços crescem sem limite.

Correção sugerida (pequena):
- Ao vivo: soma corrente, contadores (`quedas`, `abaixo30`) e um histograma fixo para o p95 (por exemplo,
  baldes de 0,5 ms até 1000 ms). Fica O(1) por quadro e sem sort.
- Ou: ordenar só uma vez, em `mostrarResumo`, e mostrar ao vivo apenas a janela `slice(-120)`.
- Parar de acumular `ms` depois do resumo.
- Teste novo: `estatisticas` com 200 mil amostras abaixo de X ms, ou simplesmente a ausência de sort no caminho
  por quadro.

### P2 (pode seguir)

**P2-01 — Quadros de 1 s ou mais somem da amostra sem aviso** (`src/ui/medidor.ts:54`, `dt < 1000`).
- Cenário: no aparelho fraco, a troca de pista (compilação de shader) ou uma coleta de lixo trava 1,2 s.
- A criança sente o travamento, mas ele não entra na média, no p95, nas quedas nem no tempo do teste. O viés
  favorece passar na meta.
- Sugestão: contar esses quadros como quedas, ou ao menos mostrar “N travadas ≥ 1 s descartadas” no resumo.
  O limite pode continuar existindo para o caso de aba em segundo plano, que já é tratado por `document.hidden`
  e `visibilitychange`.

**P2-02 — `release_jogo.py` lista arquivos do disco, mas o zip sai do Git** (`ferramentas/release_jogo.py:42-49`).
- `os.walk` lê a pasta de trabalho. Pula só arquivos cujo nome começa com ponto, não os que estão dentro de pastas
  ocultas. Também inclui arquivos ignorados pelo `.gitignore`, que o `git status --porcelain` da linha 35 não
  enxerga.
- Já o `empacotar.sh` usa `git archive HEAD`, e o `jogo.php` recusa qualquer segmento de caminho que comece com
  ponto.
- Cenário: um arquivo ignorado ou dentro de `.algo/` na pasta do jogo entra em `files`, mas falta no zip ou dá 404
  no site. Quem confere pelo manifesto acusa divergência falsa.
- Nesta candidata não acontece: os passos 5 a 7 mostram correspondência exata.
- Sugestão: montar a lista com `git ls-files -z -- _privado/jogos/<slug>` (ou `git ls-tree -r HEAD`), descartar
  caminhos com qualquer segmento iniciado por ponto e falhar se o arquivo do disco diferir do blob.

### Observações (sem severidade, para o QA-PERF e o coordenador)
- Para medir no aparelho é preciso abrir `https://samuel.tech/jogo/minigolfe-dos-pets/index.html?fps` direto,
  porque `/jogar/` não repassa o parâmetro. Nesse modo o perfil do save é `convidado`, e uma partida de teste grava
  recordes do convidado (inofensivo).
- O medidor mede tudo o que está na tela, menu incluído. O roteiro do QA-PERF deve dizer o que jogar durante os
  5 min.
- Transição de versão: uma aba ainda com a 1.0 aberta grava sem mesclar e pode sobrescrever um recorde gravado pela
  1.0.1. Não dá para corrigir no código novo e acontece uma vez só.
- O recorde mostrado no menu de uma aba só se atualiza no próximo `gravar` ou `registrar`. Já era assim na 1.0;
  é só exibição.

## O que não foi verificado
- Comportamento em aparelho ou navegador real (fora do escopo; outro revisor usa o painel). O custo do sort em
  celular é **estimado** a partir do Node desktop.
- A skill `.claude/skills/design-infantil/SKILL.md` **não existe no worktree** (`.claude/` está no `.gitignore`)
  nem no checkout principal. Também não há `AGENTS.md` no repositório; o `AGENTS.md` da raiz do workspace é de
  outro projeto. Apliquei as regras do `CLAUDE.md` do samuel.tech.
- Os outros jogos e o portal PHP dentro do zip não foram revisados, só comparados por igualdade com o
  `git archive` do commit.
- O hash do zip no recibo externo (Notion) não foi conferido.

## Resultado
**Reprovado**: 0 P0, **1 P1** (P1-01) e 2 P2.

O pacote está íntegro: hash, manifesto, zip igual ao commit e build reprodutível. O save novo está correto. O que
reprova é o medidor `?fps`, que custa cada vez mais e entra na própria medição: viola “não afeta o jogo” e
“estatística correta” justamente na ferramenta que esta versão entrega. Depois de corrigir, retestar só
`medidor.ts`, regenerar build e manifesto e conferir os hashes de novo.

Artefatos desta revisão, todos no scratchpad e fora do repositório: `qa-mg-101/rev01-zip/`, `qa-mg-101/rev01-arch/`,
`qa-mg-101/rev01-build/`, `qa-mg-101/rev01-scripts/` (`hashes.py`, `bench.mjs`, `sim.mjs`).
