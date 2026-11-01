# REV-01 — Revisão de código independente · Minigolfe dos Pets 1.0.1 (rodada 2)

## Papel
REV-01, revisor de código independente, protocolo de QA v1.1 do samuel.tech, rodada 2.
- Só leitura: nenhum arquivo do worktree da candidata foi editado. `git status` continua mostrando só o symlink
  `node_modules`, que já existia.
- Os testes do `release_jogo.py` rodaram num **clone descartável** no scratchpad (`qa-mg-101b/rev01-clone`), nunca
  no worktree.
- Navegador não usado.

## Candidata
| Campo | Valor |
|---|---|
| id | `minigolfe-dos-pets@1.0.1+c0b67d9` (manifesto: `minigolfe-dos-pets@1.0.1+c0b67d9.producao`) |
| commit da candidata | `752744bf90eb2538faba72011b9e80d2f755dbee` (HEAD do worktree, conferido) |
| source_commit | `c0b67d939defbf188b8dd6a07a44de4858e5a24b`. `git diff c0b67d9 752744b` só acrescenta `release.json`: o c0b67d9 apagou o manifesto velho e o 752744b grava o novo. |
| pacote | `samuel-site.zip`, SHA-256 **conferido**: `eb76b1220f6eae07e097ed59a4becc98214e04bf434b078958ccb605c9204473` |
| base da revisão | rodada 1 reprovada (`1.0.1+c3c2f99`, commit `9390cb2`). Diff revisado: `git diff 9390cb2 752744b` |

## Comandos e saídas resumidas
Caminhos relativos ao scratchpad da sessão.

| # | Comando | Resultado |
|---|---|---|
| 1 | `shasum -a 256 cand-mg-101b/samuel-site.zip` | bate com o hash congelado |
| 2 | `npx vitest run` (em `desenvolvimento/jogos/minigolfe-dos-pets`) | 6 arquivos, **53/53 testes passam**. `medidor.test.ts` tem 7, sendo 3 novos. |
| 3 | `npx tsc --noEmit` | sem erros, saída 0 |
| 4 | `python3 ferramentas/verificar_jogo.py minigolfe-dos-pets` (raiz do worktree) | `✓ minigolfe-dos-pets`, aviso “5 arquivos, 0.6 MB”, saída 0 |
| 5 | `unzip` do zip congelado num diretório novo e vazio (`qa-mg-101b/rev01-zip/`), depois `python3 -I qa-mg-101b/rev01-scripts/hashes.py <pasta do jogo extraída>` (script fora do diretório extraído; nada do zip foi executado) | os **4 hashes de `files` batem**: `THIRD_PARTY_NOTICES.txt`, `assets/index-B7yEyLEs.js`, `assets/index-CE_SRpX7.css`, `index.html`. Nenhum arquivo fora do manifesto, nenhum faltando. |
| 6 | `git archive --format=zip 752744b <mesmos caminhos do empacotar.sh>`, depois `shasum`, `unzip` e `diff -r` | o zip do `git archive` tem **o mesmo SHA-256 `eb76b122…` do zip congelado** (idêntico byte a byte). Também 86 entradas nos dois, e `diff -r` sem diferenças. |
| 7 | `diff -r` da pasta do jogo no zip contra o worktree | idênticas |
| 8 | `npx vite build --outDir qa-mg-101b/rev01-build --emptyOutDir` (rebuild fora do repositório) | build **reprodutível**: os 4 arquivos têm o mesmo hash do build commitado |
| 9 | `release_jogo.py minigolfe-dos-pets 1.0.1` no clone em `752744b` | `files` igual ao `release.json` da candidata |
| 10 | contagem de `fetch(`, `sendBeacon`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `localStorage` e URLs no bundle novo e no antigo | contagens iguais (2/0/0/0/0/1). A única URL é o namespace XHTML. Nenhuma rede nova. |
| 11 | `node qa-mg-101b/rev01-scripts/bench.mjs` (transpila o `medidor.ts` antigo e o novo com o esbuild do projeto e compara) | ver a seção P1-01 abaixo. Saída completa em `qa-mg-101b/rev01-scripts/bench.out`. |

## Achados da rodada 1 → status

### P1-01 (custo do medidor cresce e entra na medição) → **CORRIGIDO**
Código: `src/ui/medidor.ts:13-35` (`Acumulador`) e `:78-99` (`Medidor.quadro`).
- **Por quadro:** `adicionar` é O(1): soma, três contadores, um índice no histograma `Uint32Array(1000)` e um
  `push` só para quadros acima de 250 ms.
- **A cada 500 ms:** `resultado()` percorre no máximo 1000 faixas e o anel soma 120 valores. Não há mais
  `Array.from(...).sort` do histórico nem `slice(-120)`.

Custo medido (Node 22, Mac):

| Amostras | Antigo: `estatisticas` + `slice(-120)` a cada 500 ms | Novo: `resultado()` + anel a cada 500 ms | Novo: `adicionar` por quadro | Novo: `adicionar` + `resultado` em todo quadro |
|---|---|---|---|---|
| 18 mil | 3,24 ms | **0,16 µs** | 0,008 µs | 0,08 µs |
| 108 mil | 28,3 ms | **0,17 µs** | 0,006 µs | 0,07 µs |
| 216 mil | 57,1 ms | **0,17 µs** | 0,006 µs | 0,07 µs |

- O custo é constante: não cresce de 18 mil para 216 mil amostras.
- Mesmo com o fator 4× estimado para um celular de entrada, fica na casa de 1 µs, abaixo de qualquer resolução que
  apareça no `dt`.
- O acumulador continua somando depois do resumo, mas isso agora é irrelevante, porque o custo não cresce.
- Caso patológico: p95 acima de 250 ms com 10,8 mil quadros longos em 108 mil. Aí `resultado()` ordena a lista de
  longos e custa 0,54 ms a cada 500 ms. Só acontece com o jogo abaixo de 4 FPS, então não preocupa.

**p95 do histograma (1400 conjuntos aleatórios, 1 a 20 mil amostras, 7 distribuições: uniforme 8–48, realista,
vsync 16/33, borda em 40, com travadas, muito lento, todos longos):**
- Pior diferença para o exato (ordenação completa): **0,2490 ms** (≤ 0,25).
- O valor do histograma nunca fica abaixo do exato (0 casos), porque ele devolve a borda superior da faixa. O viés é
  pessimista e no máximo 0,25 ms.
- Média, segundos, quedas e `abaixo30`: idênticos ao exato em 100% dos casos. A meta diverge em 0 casos.

**Acima de 250 ms:**
- Em 400 casos aleatórios com p95 exato ≥ 250 ms, o resultado foi **idêntico** ao exato.
- O índice `alvo − acum − 1` está certo. Quando o laço termina sem achar o alvo, `acum = n − longos.length`, e todos
  os valores do histograma são menores que qualquer valor longo. Por isso a posição global `alvo − 1` corresponde a
  `alvo − 1 − acum` na lista ordenada de longos. O índice nunca é negativo, porque nesse ramo `acum < alvo`.
- Casos dirigidos conferidos: 6×300 em 100 dá 300; o limite exato de 250 cai em `longos` e dá 250; uma mistura de
  251 a 1200 dá o mesmo valor do exato.
- Os testes `tests/medidor.test.ts` “p95 … até 0,25 ms”, “acima de 250 ms sai exato” e “custo … 108 mil” passam.

### P2-01 (travadas ≥ 1 s descartadas) → **CORRIGIDO**
- `medidor.ts:81`: o limite `dt < 1000` saiu. Com a aba visível, todo intervalo positivo entra em `total`.
- O retorno do segundo plano continua protegido. `visibilitychange` zera `ultimo` (`:69`), e `document.hidden` zera
  e sai (`:79`). Assim, o primeiro quadro depois da volta não vira travada.
- A nova linha do resumo mostra “travadas (≥ 1 s): N” (`:109`). Uma travada também conta como queda e entra na
  média e no p95. Teste: 10 × 1200 ms dão `travadas = 10` e `p95 = 1200`.

### P2-02 (manifesto lia o disco, zip sai do Git) → **CORRIGIDO** (com ressalva menor, ver observações)
- `ferramentas/release_jogo.py:41-48` agora usa `git ls-files -- _privado/jogos/<slug>`, o mesmo conjunto
  versionado que o `git archive` leva.
- Arquivo ignorado pelo Git deixa de entrar.
- Os hashes vêm do disco. Isso é seguro porque a checagem `status --porcelain` (`:35-39`) exige a pasta limpa, e
  não há `.gitattributes` nem `core.autocrlf` que mudem bytes.
- No clone, o resultado é igual ao manifesto da candidata.

### QA-PERF P2-3 (resumo no meio da tacada e cobrindo 52% deitado) → **CORRIGIDO no código**; o layout não foi medido por mim
- `medidor.ts:94`: `pronto` congela as estatísticas no instante em que o tempo acaba.
- `:98`: o painel só abre quando `podeMostrar()` é verdadeiro.
- `main.ts:95`: `podeMostrar = () => this.pausado || this.estado !== 'jogando'`. Com `Estado = 'menu' | 'jogando' |
  'placar' | 'fim'` (`main.ts:34`), isso equivale exatamente a pausa, menu, placar ou fim.
- Durante a mira, a bola rolando ou o aviso “VEZ DO…”, o estado é `jogando` e o painel não abre. A faixa mostra
  “RESUMO PRONTO: toque em II” (`:95`), e ela tem `pointer-events: none`.
- O botão `II` (`#bPausa`) e a tecla P/Esc chamam `pausar(true)`. Em até 500 ms o painel aparece sobre `tPausa`
  (z-index 41, acima da `.tela`).
- O `ROTEIRO-CELULAR.md` já descreve esse fluxo.

## Regressões no diff (item 2)
| Ponto | Verificação | Resultado |
|---|---|---|
| `podeMostrar` | Os 4 estados mais `pausado` foram cobertos. A checagem acontece só no tique de 500 ms (atraso ≤ 500 ms, aceitável). O valor padrão `() => true` mantém outros usos compatíveis. | ok |
| Resultado congelado | Como `pronto` é atribuído uma vez, o resumo mostra o que existia no fim do tempo, mesmo que a pausa venha minutos depois. A faixa ao vivo continua somando, mas **Copiar** copia o congelado. `extra()` (qualidade e draw calls) e `aparelho()` saem no momento em que o painel abre, não no congelamento. Isso já era assim e é só um retrato. | ok |
| Anel de 120 | `Float32Array(120)`, índice `nRecentes++ % 120` e média sobre `min(n, 120)`. Até completar 120 usa só o que existe, e os zeros iniciais não entram. Float32 não tem precisão relevante a perder em intervalos de ms. | ok |
| CSS deitado | `@media (max-height: 480px)`: canto superior direito, `max-width: 52vw`, `max-height: calc(100vh − 56px)`. Herda `overflow: auto` da regra base (`minigolfe.css:145`), então os botões alcançam por rolagem em telas muito baixas. Botões com `min-height: 48px` (≥ 44). Sem conflito com a faixa `#medidor`, que fica no canto inferior esquerdo. Está no bundle publicado (`index-CE_SRpX7.css`). | ok, ver o que não foi verificado |
| `release_jogo.py` com `git ls-files` | Lista o índice. Com a pasta limpa, o índice é igual ao HEAD, que é o que o `empacotar.sh` arquiva. O `release.json` é pulado. | ok |
| Caminho sem `?fps` | Em `main.ts` só mudou o argumento do construtor, dentro de `if (FPS)`. As contagens de APIs de rede e storage não mudaram. | ok |
| Build | Reprodutível a partir do c0b67d9, e só `medidor.ts`, `main.ts` (1 linha) e `minigolfe.css` mudaram no código-fonte. | ok |

## Novos achados

### P0
Nenhum.

### P1
Nenhum.

### P2
Nenhum que precise de correção para esta candidata. As observações abaixo não têm severidade.

### Observações (sem severidade)
1. **Exatamente na borda de 40 ms** (`medidor.ts:31`): o histograma devolve a borda superior da faixa.
   - Se o p95 exato for **exatamente** 40,000 ms, o medidor mostra 40,25 e “NÃO cumprida”. O cálculo exato daria
     “CUMPRIDA”.
   - Reproduzido em `bench.mjs` (6 × 40 em 100 amostras).
   - Valores entre 39,75 e 39,99 dão 40,00 e passam. Fora desse ponto único, nenhuma divergência em 1400 casos.
   - O viés é pessimista, e um p95 de exatamente 40,000 é improvável com `performance.now()` em ponto flutuante.
     Se quiserem, basta documentar “p95 com resolução de 0,25 ms (arredonda para cima)”.
2. **Travada falsa no Safari iOS** (`medidor.ts:81`): sem o limite de 1 s, uma pausa de renderização do sistema
   sem `visibilitychange` entraria como travada e pesaria na média ponderada pelo tempo.
   - Exemplo: puxar a Central de Controle no iOS. Não confirmei que isso acontece.
   - Num aparelho limítrofe (30,2 FPS), uma pausa de 5 s em 300 s puxa a média para cerca de 29,7.
   - Mitigação já existente: o resumo mostra “travadas (≥ 1 s): N”. Vale pedir no `ROTEIRO-CELULAR.md` que o
     testador não abra a Central de Controle nem a gaveta de notificações durante os 300 s, ou que anote se abrir.
3. **`release_jogo.py` e caminhos com ponto** (`ferramentas/release_jogo.py:43`): o `ls-files` passa a incluir
   arquivos versionados dentro de `.pasta/` ou com nome iniciado por ponto. O `jogo.php:28` não entrega esses
   arquivos.
   - Teste no clone: `.leiame` e `.oculto/a.txt` entraram em `files`.
   - Isso já é barrado antes: o `verificar_jogo.py` recusa os dois (“pasta oculta ou link”, “arquivo oculto”), e ele
     é passo obrigatório antes do commit.
   - Nesta candidata não existe nenhum.
4. **`release_jogo.py` com acento no nome** (`:43`): `ls-files` sem `-z` devolve nomes com acento entre aspas
   (`"…/p\303\251.txt"`) por causa do `core.quotePath`, e o script quebra com `FileNotFoundError`.
   - A falha é ruidosa, não silenciosa. Hoje o `verificar_jogo.py` e os jogos atuais não usam acento em nomes de
     arquivo.
   - Sugestão para depois: `git ls-files -z`.
5. **Prova do layout deitado:** a `RESOLUCAO.md` diz “36% medido no WebKit”, mas as capturas commitadas são da
   candidata anterior.
   - `webkit/6-deitado.jpg` mostra a versão `…+c3c2f99`, sem a linha de travadas e com o painel centralizado em
     pleno `jogando`.
   - O `WEBKIT.md` também se refere a `c3c2f99`.
   - Não há no repositório evidência da medida da candidata nova. Fica para o QA-PERF ou WebKit da rodada 2.
6. Em pausa no modo deitado, o painel (até 52vw, canto superior direito) pode cobrir parte do cartão `pausa.exe`,
   inclusive o “▶ Continuar”, até alguém tocar em **Fechar**. O mesmo vale para os botões do placar no modo
   retrato.
   - É ferramenta de teste e não abre mais no meio da jogada, então é aceitável.
   - Depois de **Fechar**, o resumo não reabre. A faixa ao vivo continua, mas sem o texto completo. Já era assim na
     rodada 1.

## O que não foi verificado
- O layout real do painel em celular, Safari, WebKit ou Chrome (nenhum navegador usado), incluindo a área coberta
  no modo deitado e a sobreposição com `tPausa`.
- O custo em aparelho real. O custo do `Acumulador` foi medido só no Node do Mac, mas é constante e da ordem de
  microssegundos.
- O comportamento de `requestAnimationFrame` e `visibilitychange` no iOS com a Central de Controle ou notificações
  (observação 2).
- Os outros jogos e o portal PHP dentro do zip não foram revisados. Só confirmei que são iguais ao `git archive` do
  commit.
- O recibo externo (Notion) e o hash do zip registrado lá.
- A skill `.claude/skills/design-infantil/SKILL.md` não está no worktree (`.claude/` está no `.gitignore`).
  Apliquei as regras do `CLAUDE.md` do samuel.tech.

## Resultado
**Aprovado**: 0 P0, 0 P1, 0 P2 novos.
- Os quatro achados da rodada 1 estão corrigidos: P1-01, P2-01, P2-02 e o P2-3 do QA-PERF.
- O medidor agora tem custo constante: cerca de 0,17 µs a cada 500 ms, contra 28 ms com 108 mil amostras na rodada
  1.
- O p95 fica no máximo 0,25 ms acima do exato e é exato acima de 250 ms.
- O pacote está íntegro: o hash confere, o zip é idêntico byte a byte ao `git archive 752744b`, o manifesto confere
  e o build é reprodutível.

Antes de publicar, ainda faltam, fora do escopo do REV-01:
- a prova de layout do painel na candidata nova (observação 5);
- o teste em celular real do `ROTEIRO-CELULAR.md`.

Artefatos, todos no scratchpad: `qa-mg-101b/rev01-zip/`, `qa-mg-101b/rev01-arch/` + `rev01-arch.zip`,
`qa-mg-101b/rev01-build/`, `qa-mg-101b/rev01-clone/` (clone descartável) e `qa-mg-101b/rev01-scripts/`
(`bench.mjs`, `bench.out`, `hashes.py`, `medidor-antigo.*`, `medidor-novo.*`).
