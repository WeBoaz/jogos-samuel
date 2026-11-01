# QA-PERF — Minigolfe dos Pets 1.0.1 (protocolo de QA v1.1)

- **Papel:** QA-PERF (desempenho). Nenhum arquivo do repositório foi editado; este relatório é a única saída.
- **Data:** 2026-11-01 · **Máquina:** Mac (Apple M4 Max), Chrome 152, painel de navegador do app (visível durante as medições, `document.hidden=false` em todas as amostras), tela de 120 Hz.
- **Resultado (escopo medível no Mac): APROVADO.** Nenhum P0 nem P1. Três P2 (abaixo).
- **Aparelho de referência (celular): NÃO EXECUTADO.** O FPS medido no Mac **não substitui** o teste no celular. Esse item continua "Não executado" até o Boaz rodar `?fps` no aparelho e copiar o resumo.

## Candidata e hashes conferidos

| Item | Valor |
|---|---|
| Release | `minigolfe-dos-pets@1.0.1+c3c2f99` (`release_id` servido: `minigolfe-dos-pets@1.0.1+c3c2f99.producao`) |
| Commit da candidata | `9390cb2` (manifesto) sobre `c3c2f99` (código) |
| `samuel-site.zip` | `d42600f58fee7bf66bb31b8555ed5ce75f85f63676151dec6bd257c73adc90af`: **confere** |
| Worktree | `cand-mg-101/wt` limpo (só `node_modules` não versionado) |

O que o servidor local (`http://127.0.0.1:8770/jogo/minigolfe-dos-pets/`, portal PHP 8.3 em Docker) entrega, comparado com `release.json` e com o worktree (curl + `shasum -a 256`):

| Arquivo | SHA-256 servido | `release.json` / wt |
|---|---|---|
| `index.html` | `0a2a649f…23bbee` | confere |
| `assets/index-pZGKRt6m.js` | `180c7abd…97cc11` | confere |
| `assets/index-CmqmScAi.css` | `94c81087…6df6112` | confere |
| `THIRD_PARTY_NOTICES.txt` | `b46f7231…55a70db` | confere |
| `release.json` | `13f2a519…67c35b2` | igual ao do wt |

Observação: o worktree principal do repositório (`main`) tem alterações não commitadas em `src/ui/medidor.ts`, `tests/medidor.test.ts` e `ferramentas/release_jogo.py`, que não são minhas: aparentemente é a correção de P2-1 e P2-2 em andamento. **Elas não fazem parte desta candidata.** Um build novo vira candidata nova e precisa de outra rodada de QA-PERF.

## Método

- Aba nova (`tabs_create`), sem mexer na aba "seed". Tamanhos: 1366×768, 375×812 (o preset de celular também emula UA Android) e 812×375 (deitado). No fim voltei para desktop.
- Intervalos de `requestAnimationFrame` medidos por script próprio em janelas de 5 a 20 s (média, p95, p99, máx., quadros > 50 ms), com e sem `?fps`.
- Custo do medidor: (a) intervalos de quadro com e sem `?fps`; (b) **tempo de main thread antes do meu callback de rAF** (`performance.now() - timestamp do rAF`) ao longo de uma sessão `?fps=1800` de cerca de 6 min, procurando picos periódicos de 500 ms (o período de atualização do medidor); (c) micro-benchmark da mesma rotina `estatisticas()` (cópia + sort + slice) com N amostras.
- Memória/GPU: `__minigolfe.info()` (geometries/textures/calls/triangles) no menu, no placar de cada pista e ao voltar ao menu depois de 2 circuitos completos (6 pistas cada), com `tacar` + `avancar` + `proxima`.
- Pacote: `gzip -9` dos assets da 1.0 (`040829f`) e da 1.0.1. Tempo até o menu: long task de inicialização + LCP, servindo 1.0 e 1.0.1 pelo **mesmo** servidor estático (`python3 -m http.server`, portas 8791/8792, já encerrado), cache quente, 3 cargas de cada intercaladas.
- Painel de resumo: `?fps=60` (resumo em 60 s visíveis) e `?fps=10`, cliques reais em Copiar/Fechar, arrasto real da mira com o medidor visível e com o resumo aberto.

## Números

### 1. Sem `?fps`
- `#medidor` no DOM: **não**. `#medidorResumo`: **não**.
- Requisições: só `index.html`, `index-pZGKRt6m.js` e `index-CmqmScAi.css`. **Nenhuma requisição a `release.json`** (conferido em `read_network_requests` e em `performance.getEntriesByType('resource')`).
- Com `?fps`: uma única requisição `release.json` (200, `cache: no-store`), mesma origem. Nada sai para outro host.

### 2. Medidor com `?fps=60&debug`

| Cenário | Média (FPS) | p95 (ms) | Quedas > 50 ms | Draw calls | Qualidade | Canvas |
|---|---|---|---|---|---|---|
| 1366×768, menu (5 s) | 120,1 | 10,3 | 0 | 85 | 2 | 2732×1536 |
| 1366×768, jogando (circuito, tacadas 0,6) | 119,7 | 10,2 | 2 (cumulativo) | 43–128 | 2 | 2732×1536 |
| **1366×768, resumo 60 s** | **119,6** | **10,2** (98 FPS) | **4** · abaixo de 30 FPS: 0,1% | 127 (no placar) | 2 | 2732×1536 |
| 375×812, menu (5 s) | 120,2 | 10,0 | 0 | 90 | 2 | 750×1624 |
| 375×812, jogando | 119,7 | 10,1 | 3 (cumulativo) | 60–121 | 2 | 750×1624 |
| **375×812, resumo 60 s** | **119,7** | **10,2** (98 FPS) | **4** · abaixo de 30 FPS: 0,1% | 60 | 2 | 750×1624 |
| 812×375, resumo `?fps=10` jogando | 119,5 | 10,2 | 1 | 90 | 2 | 1624×750 |

- Meta (média ≥ 30 e p95 ≤ 40 ms): **CUMPRIDA** em todos os resumos. A qualidade adaptativa nunca baixou (ficou em 2).
- As 1 a 4 quedas por minuto coincidem com troca de pista/placar (compilação de shader, pico máximo de 50 a 74 ms) e com capturas de tela da ferramenta. Elas aparecem também sem `?fps` (73,6 ms ao embocar e ir para o placar), então não vêm do medidor.
- O resumo traz versão, aparelho (navegador, SO, tela, DPR, janela, GPU via `WEBGL_debug_renderer_info`), tempo visível, quadros, média, p95, quedas, % abaixo de 30 FPS, qualidade/draw calls/canvas e a meta. Os números batem com os da minha amostragem independente (diferença ≤ 0,3 ms no p95).

### 3. Custo do próprio medidor

| Medida | Sem `?fps` | Com `?fps` |
|---|---|---|
| Intervalo de quadro, menu 1366×768 (5 s) | 8,33 ms méd. · p95 10,0 · p99 10,3 · máx. 10,3 | 8,33 ms méd. · p95 10,0 · p99 10,2 · máx. 10,3 |
| Intervalo de quadro, jogando | 8,45 ms méd. · p95 10,0 (1 pico de 73,6 ms ao embocar) | 8,36 ms méd. · p95 10,2 · máx. 50 |

No Mac não há diferença mensurável no intervalo de quadro: o vsync de 120 Hz limita e sobra folga. Mas o custo **cresce com o tempo de teste**. Em `?fps=1800`, no menu, medi o tempo de main thread antes do meu callback de rAF:

| Amostras acumuladas (≈ tempo a 120 Hz) | Mediana normal | Pico a cada ~500 ms (período do medidor) |
|---|---|---|
| ~25 mil (≈ 3,5 min) | 0,9 ms | 4,4–9,3 ms (intervalos 500–509 ms, periódico e limpo) |
| ~41 mil (≈ 5,7 min) | 0,8 ms | mediana 7,3 ms, máx. 11,7 ms |

Mesmo com 41 mil amostras, o intervalo de quadro continuou intacto no M4 Max (20 s: p95 10,0, máx. 10,4, zero quadros > 12 ms). Micro-benchmark da mesma rotina no M4 Max (mediana de 7 execuções):

| N amostras | Exemplo | Custo por atualização (a cada 500 ms) |
|---|---|---|
| 600 | 10 s @ 60 Hz | 0,1 ms |
| 7.200 | 60 s @ 120 Hz | 1,2 ms |
| 18.000 | **padrão 300 s @ 60 Hz** | 4,0 ms |
| 36.000 | padrão 300 s @ 120 Hz | 7,2 ms |
| 108.000 | 1800 s @ 60 Hz | 26,5 ms |
| 216.000 | 1800 s @ 120 Hz | 60,5 ms |

Heap JS em `?fps=1800` depois de 5,7 min: 27 a 31 MB, estável. O array cresce (~8 bytes por amostra), mas o problema é a CPU do sort, não a memória.

### 4. Memória/GPU (`__minigolfe.info()`)

| Momento | geometries | textures | calls | triangles |
|---|---|---|---|---|
| Menu inicial | 83 | 11 | 85 | 59.750 |
| Circuito 1, placar das pistas 1→5 | 86 · 97 · 110 · 118 · 106 | 11 · 11 · 12 · 13 · 12 | 84–128 | 59–71 mil |
| Circuito 1, fim | 147 | 14 | 157 | 76.278 |
| Menu depois do circuito 1 | 147 | 14 | 166 | 75.878 |
| Circuito 2, placar das pistas 1→5 | 92 · 98 · 110 · 118 · 106 | 11 · 11 · 12 · 13 · 12 | 84–128 | 59–71 mil |
| Circuito 2, fim | 147 | 14 | 157 | 76.278 |
| Menu depois do circuito 2 | **147** | **14** | 166 | 75.878 |

**Sem crescimento contínuo.** Cada pista volta aos mesmos números no segundo circuito (± 6 geometries só na pista 1: rastro/efeitos), e o menu depois do circuito 2 é idêntico ao do circuito 1. O 147 > 83 do menu inicial é a pista final carregada como fundo, não vazamento. Pico de draw calls: 157–166 (pista final), 59–76 mil triângulos.

### 5. Pacote e tempo até o menu

| Arquivo | 1.0 (`040829f`) bruto / gzip -9 | 1.0.1 bruto / gzip -9 | Δ gzip |
|---|---|---|---|
| JS | 604.495 / 160.177 B | 608.446 / 161.826 B | **+1.649 B (+1,0%)** |
| CSS | 17.364 / 4.407 B | 18.077 / 4.628 B | +221 B (+5,0%) |
| `index.html` | 5.693 B | 5.693 B | 0 |
| Total gzip (js+css) | 164.584 B | 166.454 B | **+1.870 B (+1,1%)** |

Tempo até o menu, mesmo servidor estático, cache quente, Mac:

| Build | Long task de inicialização | LCP (menu) |
|---|---|---|
| 1.0 | 97–101 ms (+50 ms na carga fria) | 176 · 180 ms (196 frio) |
| 1.0.1 | 102–109 ms (+55 ms na carga fria) | 188 · 188 ms (212 frio) |

Diferença de ~8–12 ms, dentro do ruído de carga local. Pelo portal PHP: `#carregando` sai e o menu aparece em ~140–160 ms (long task 52+87 ms, LCP 156 ms).
Nota (já existia na 1.0, não é regressão): `jogo.php` entrega o JS **sem compressão** (608 KB brutos; `Content-Encoding` ausente, mesmo com `Accept-Encoding: gzip`). Se a Hostinger não comprimir a saída do PHP, o celular baixa 608 KB em vez de ~162 KB. Isso não foi verificado em produção.

### 6. Painel de resumo

| Verificação | 1366×768 | 375×812 | 812×375 |
|---|---|---|---|
| Cabe na tela sem rolagem horizontal | sim (560×282, `scrollWidth` = largura) | sim (359×334; `scrollHeight` 330 = `clientHeight`, sem rolagem interna) | sim (560×282; sem rolagem interna) |
| Botões visíveis sem rolar | sim, 105×64 e 107×64 (≥ 44 px) | sim | sim |
| Área coberta | — | 39% da tela | **52% da tela** |
| Fechar (clique real) | remove o painel; `bProxima`/`bMenuPlacar` voltam a ficar livres | — | remove o painel; botões do placar livres |
| Copiar (clique real) | "Copiado ✓" (o texto do resumo foi para a área de transferência do Mac) | — | — |
| HUD (som/pausa) livre com o resumo aberto | — | sim | sim (`bSom`, `bPausa` livres) |
| `#medidor` (faixa) | `pointer-events: none`; não sobrepõe botão nenhum | 363×53 (3 linhas) no rodapé; não sobrepõe botão; `elementFromPoint` no centro da faixa devolve o elemento do jogo por baixo | 612×23 no rodapé; não sobrepõe botão |
| Toque no jogo com o medidor visível | — | **sim**: arrasto real soltando em cima da faixa gerou tacada (`tacadas` 0→1, bola rolando) | — |
| Toque no jogo com o resumo aberto | — | **sim** fora do painel: arrasto no gramado acima dele gerou tacada (2→3); dentro do painel o toque é do painel (esperado) | — |

## Achados

### P0
Nenhum.

### P1
Nenhum.

### P2

**P2-1: o custo do medidor cresce sem limite com o tempo de teste (sort completo a cada 500 ms) e continua depois do resumo.**
- Cenário concreto: no Mac, em `?fps=1800`, o medidor causa um pico de main thread a cada ~500 ms de 4–9 ms com ~25 mil amostras e de 7–12 ms com ~41 mil (≈ 5,7 min a 120 Hz). O micro-benchmark dá 4 ms com 18 mil amostras (padrão 300 s a 60 Hz) e 26–60 ms com 108–216 mil (teste de 1800 s). Num celular de 3 a 5× menos CPU que o M4 Max, no fim do teste padrão de 300 s, isso dá ~12–20 ms extras a cada 500 ms (1 quadro em 30 perdido, ~3% dos quadros). Num teste de 1800 s, o pico passa de 50 ms e vira "queda" contada pelo próprio medidor. O array e o sort continuam depois do resumo enquanto a aba estiver aberta.
- Impacto: só com `?fps` (crianças não usam). O viés é **pessimista**: pode empurrar um aparelho limítrofe para "NÃO cumprida", nunca para um falso "CUMPRIDA". No teste padrão de 300 s, ~3% de quadros lentos fica abaixo dos 5% que mexeriam no p95.
- Sugestão: histograma de faixas fixas (custo O(1) por quadro) e anel para o "FPS recente". Parar de acumular depois do resumo. (A mudança não commitada em `main` parece ir nessa direção; ela não foi testada aqui.)

**P2-2: quadros ≥ 1000 ms são descartados das estatísticas** (`if (dt > 0 && dt < 1000)`).
- Cenário concreto: uma travada real de 1,2 s no celular (por exemplo, compilação de shader ao trocar de pista num aparelho fraco) não entra na média, no p95 nem nas "quedas". O resumo pode dizer "quedas: 0" com a criança tendo visto o jogo congelar. A aba oculta já é tratada por `visibilitychange`/`document.hidden`, então esse filtro só esconde travadas reais.
- Impacto: viés **otimista**, mas pequeno na meta (uma travada de 1,2 s em 300 s quase não muda média nem p95). O maior efeito é na contagem de quedas, que serve de evidência.
- Sugestão: contar à parte ("travadas ≥ 1 s: N") e mostrar no resumo.

**P2-3: o resumo surge no meio da partida e cobre boa parte do jogo até alguém tocar em Fechar.**
- Cenário concreto: em 812×375 (deitado), o painel ocupa 52% da tela e cobre a área da bola/mira. Em 1366×768 e 812×375 ele cobre os botões do placar (`Pista N ▶`, `☰ Menu`) até o Fechar. Em 375×812 cobre 39% (metade de baixo).
- Impacto: ferramenta de teste, tem Fechar visível com alvo ≥ 44 px, e os botões de pausa/som continuam livres. O toque fora do painel funciona. Não bloqueia.
- Sugestão (opcional): mostrar o resumo só na próxima tela de placar/fim, ou recolhê-lo num botão "Resumo pronto" pequeno.

### Observações (sem severidade)
- O resumo junta menu e partida. Quem testa no celular deve **jogar** durante os 300 s, senão o número reflete o menu. Vale escrever isso na instrução do teste do Boaz.
- "qualidade / draw calls / canvas" no resumo é um retrato do instante do resumo, não o máximo da sessão (no placar da pista 4 eram 127 calls; na pista final chega a 157–166).
- O preset de celular do painel emula UA Android e o resumo diz "Android 14" com GPU Apple M4 Max. Isso confirma que a medida em 375×812 é **o Mac num tamanho de celular**, não um celular.

## Não executado
- **FPS/toque no aparelho de referência (celular real, Android/iPhone): NÃO EXECUTADO.** Continua pendente até o teste do Boaz com `?fps` (padrão 300 s), jogando de verdade, copiando o resumo.
- Safari/iOS (inclusive o limite de 60 Hz do rAF no iOS) e Firefox.
- Throttling de CPU/GPU para simular celular fraco: as ferramentas do painel não oferecem. O efeito em celular de P2-1 é estimativa a partir do custo medido no M4 Max.
- Compressão gzip/brotli na Hostinger (produção) e tempo até o menu em rede móvel.
- Sessão com o resumo em 300 s padrão completo: medi o resumo em 60 s e 10 s, e o crescimento de custo até ~5,7 min em `?fps=1800`.
- Leitor de tela/foco do painel de resumo (fora do escopo de desempenho).

## Limpeza
- localStorage: removida `samuel:minigolfe-dos-pets:convidado:v1` em `127.0.0.1:8770` (antes do teste a origem estava vazia). Em `127.0.0.1:8791/8792` não havia chaves do jogo.
- Área de transferência do Mac: contém o texto do resumo copiado no teste do botão Copiar (sem dados pessoais: versão, navegador, GPU, números).
- Aba `tab-12` fechada; viewport de volta para desktop; servidores estáticos 8791/8792 encerrados; a pasta `scratchpad/qa-mg-101/v10/` (cópia da 1.0 para comparação) ficou no scratchpad.

## Resultado
**APROVADO para o escopo medível no Mac** (P0: 0 · P1: 0 · P2: 3). O FPS e o toque no celular de referência continuam **NÃO EXECUTADOS** e são condição separada para dar a meta de 30 FPS por cumprida.
