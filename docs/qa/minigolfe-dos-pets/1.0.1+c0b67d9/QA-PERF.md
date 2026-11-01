# QA-PERF — Minigolfe dos Pets 1.0.1, rodada 2 (protocolo de QA v1.1)

- **Papel:** QA-PERF (desempenho). Não editei nenhum arquivo do repositório. Este relatório é a única saída. Os scripts de medição ficaram em `qa-mg-101b/bench/`.
- **Data:** 2026-11-01 · **Máquina:** Mac (Apple M4 Max), Chrome 152, painel de navegador do app visível o tempo todo (`document.hidden=false` em todas as janelas medidas), tela de 120 Hz.
- **Resultado (escopo Mac): APROVADO.** P0: 0 · P1: 0 · P2: 1 (abaixo), mais observações sem severidade.
- **Aparelho de referência (celular): NÃO EXECUTADO.** O FPS no Mac não substitui o celular. O item continua "Não executado".

## Candidata e hashes conferidos

| Item | Valor |
|---|---|
| Release | `minigolfe-dos-pets@1.0.1+c0b67d9` (`release_id` servido: `minigolfe-dos-pets@1.0.1+c0b67d9.producao`, `source_commit` `c0b67d93…`) |
| Commit da candidata | `752744b` (manifesto) sobre `c0b67d9` (código) |
| `samuel-site.zip` | `eb76b1220f6eae07e097ed59a4becc98214e04bf434b078958ccb605c9204473`: **confere** |
| Worktree `cand-mg-101b/wt` | limpo: só `node_modules` fora do controle de versão, e continuou assim no fim |

Arquivos servidos por `http://127.0.0.1:8770/jogo/minigolfe-dos-pets/` (curl + `shasum -a 256`), comparados com os `files` do `release.json` servido, com o worktree e com o conteúdo do zip:

| Arquivo | SHA-256 servido | `release.json` | wt | zip |
|---|---|---|---|---|
| `index.html` | `1f7ee30b…b19b0a0` | confere | confere | confere |
| `assets/index-B7yEyLEs.js` | `8dd233c2…b3da052` | confere | confere | confere |
| `assets/index-CE_SRpX7.css` | `8f80caa9…e367f216` | confere | confere | confere |
| `THIRD_PARTY_NOTICES.txt` | `b46f7231…55a70db` | confere | confere | confere |
| `release.json` | `01d2bce5…5f6aff` | — | confere | confere |

`/_privado/jogos/minigolfe-dos-pets/index.html` responde 403.

## Método

- Usei uma aba nova (`tab-13`) e não mexi na aba "seed". Tamanhos testados: 1366×768, 375×812 (o preset de celular também emula UA Android 14/Pixel 8) e 812×375 (deitado). No fim voltei para desktop e fechei a aba.
- **Sonda própria de rAF**, instalada depois do jogo. Ela mede o intervalo entre quadros e a **latência antes do meu callback** (`performance.now() - timestamp do rAF`), que inclui o quadro do jogo e o medidor. É o mesmo método da rodada 1. Um `MutationObserver` em `#medidor` marca os quadros em que o medidor atualizou a faixa (a cada 500 ms, que é quando ele calcula o resultado). Assim dá para comparar a latência nos "quadros do medidor" com a dos outros quadros.
- Sessão longa: `?fps=1800&debug` no menu, em 1366×768, por **430 s (~51 mil amostras a 120 Hz)**, com janelas de 30 s registradas de forma contínua.
- Micro-benchmark em Node 22 (mesmo M4 Max) com uma transcrição literal do `Acumulador` de `src/ui/medidor.ts` (`c0b67d9`), lado a lado com a rotina antiga (cópia + sort).
- Partidas: em `?fps=60`, `configurar(1,'normal','circuito')` + `jogar()`, com tacadas automáticas (`tacar(anguloParaBuraco(), 0.55)`) nos primeiros 40 s. Depois deixei a partida parada no estado `jogando` até passar dos 60 s. Pausa, Fechar, Continuar e os arrastos da mira foram **cliques e arrastos reais** no painel.
- Memória/GPU: `__minigolfe.info()` depois de 3 quadros renderizados, no menu, no placar de cada pista, no fim e no menu depois de cada circuito. Rodei **3 circuitos completos** (6 pistas cada).

## 1. Picos de quadro do medidor: sumiram

**Antes (rodada 1, `c3c2f99`):** pico de main thread a cada ~500 ms, de 4,4–9,3 ms com ~25 mil amostras e de mediana 7,3 ms / máx. 11,7 ms com ~41 mil.

**Agora (`c0b67d9`), `?fps=1800`, menu, 1366×768:**

| Tempo (≈ amostras a 120 Hz) | Intervalo p95 / máx. | Quadros > 12 ms | Latência nos quadros do medidor: p50 / p95 / máx. (n) | Latência nos outros quadros: p50 / p95 / máx. |
|---|---|---|---|---|
| 7–27 s (~3 mil) | 10,1 / 10,4 ms | 0 | 1,4 / 2,4 / 2,7 ms (39) | 1,2 / 2,3 / 5,7 ms |
| 117–157 s (~19 mil) | 10,0 / 10,5 ms | 0 | 1,5 / 2,5 / 3,1 ms (80) | 1,2 / 2,4 / 16,0 ms¹ |
| 167–197 s (~23 mil) | 10,0 / 10,4 ms | 0 | 1,4 / 2,5 / 2,6 ms (60) | 1,7 / 2,5 / 3,9 ms |
| 197–227 s (~27 mil) | 10,1 / 10,4 ms | 0 | 1,9 / 2,8 / 3,6 ms (59) | 1,3 / 2,4 / 4,0 ms |
| 227–257 s (~31 mil) | 10,1 / 10,4 ms | 0 | 2,0 / 2,6 / 2,8 ms (60) | 1,7 / 2,4 / 7,2 ms |
| 257–287 s (~34 mil) | 10,1 / 10,4 ms | 0 | 1,6 / 2,3 / 2,8 ms (59) | 1,2 / 2,2 / 7,2 ms |
| 287–317 s (~38 mil) | 10,0 / 10,4 ms | 0 | 1,8 / 2,3 / 3,3 ms (60) | 1,5 / 2,3 / 4,2 ms |
| 317–347 s (~42 mil) | 10,0 / 10,4 ms | 0 | 1,7 / 2,2 / 2,4 ms (59) | 1,6 / 2,3 / 4,2 ms |
| 347–377 s (~45 mil) | 10,0 / 10,4 ms | 0 | 1,8 / 2,2 / 2,7 ms (59) | 1,6 / 2,2 / 4,0 ms |
| **377–407 s (~49 mil)** | **10,0 / 10,4 ms** | **0** | **1,7 / 2,3 / 2,5 ms (60)** | **1,6 / 2,3 / 4,8 ms** |

¹ Um quadro isolado de 16 ms fora do momento do medidor (provavelmente a própria ferramenta). Não se repetiu.

- **Não há mais pico periódico.** Com ~49 mil amostras, os quadros em que o medidor calcula o resultado ficam no mesmo nível dos demais (p95 2,3 vs 2,3 ms; máx. 2,5 ms). Na rodada 1, com 41 mil amostras, esse quadro tinha mediana 7,3 ms. **O custo não cresce mais com o tempo de teste.**
- Faixa no fim (430 s): `120 FPS · média 120.0 · p95 10.5 ms · quedas 0`. Heap JS: **18,9 MB** (na rodada 1 eram 27–31 MB aos 5,7 min).

**Com e sem `?fps` (intervalo de quadro, menu, 1366×768):**

| | Média | p95 | p99 | Máx. | > 12 ms | Latência antes do meu rAF p50 / p95 / máx. |
|---|---|---|---|---|---|---|
| Sem `?fps` (20 s) | 8,33 ms | 10,1 | 10,3 | 10,4 | 0 | 1,0 / 1,8 / 2,9 ms |
| `?fps=1800`, 7–27 s | 8,33 ms | 10,1 | 10,2 | 10,4 | 0 | 1,2 / 2,3 / 5,7 ms |
| `?fps=1800`, 117–157 s | 8,33 ms | 10,0 | 10,2 | 10,5 | 0 | 1,2 / 2,4 / 16,0 ms |
| `?fps=1800`, 377–407 s | — | 10,0 | — | 10,4 | 0 | 1,6 / 2,3 / 4,8 ms |

O medidor acrescenta ~0,2–0,5 ms de main thread por quadro (atualizar o texto da faixa e o layout dela). Esse custo é constante e não tem pico. O intervalo de quadro fica idêntico.

**Micro-benchmark (Node 22, M4 Max):**

| N amostras | `resultado()` novo (histograma) | Rotina antiga (cópia + sort) |
|---|---|---|
| 600 | 0,05 µs | 0,09 ms |
| 18.000 (300 s @ 60 Hz) | < 0,05 µs | 3,76 ms |
| 108.000 (1800 s @ 60 Hz) | < 0,05 µs | 27,5 ms |
| 216.000 (1800 s @ 120 Hz) | 0,04 µs | 56,2 ms |
| 216.000 com p95 perto de 50 ms (varre ~200 faixas) | 0,18 µs | — |

`adicionar()` custa ~0,01–0,02 µs por quadro. O único caminho com sort é o p95 acima de 250 ms (lista `longos`). Ele só acontece num aparelho com mais de 5% dos quadros acima de 250 ms, e cresce no máximo até 7.200 itens em 1800 s (~1,5 ms a cada 500 ms). É irrelevante.
Conferência funcional: uma travada de 1,2 s entra como `travadas: 1` e `quedas: 1`. Com 10% dos quadros entre 300 e 309 ms, o p95 sai exato (304 ms).

## 2. `?fps=60`: mesmo nível da rodada 1

| Cenário | Resumo do medidor (60 s) | Minha sonda (sessão inteira) | Rodada 1 |
|---|---|---|---|
| **1366×768**, circuito jogado + parada em `jogando` | 7.180 quadros · **média 119,6** · **p95 10,3 ms** (98 FPS) · quedas 4 · **travadas 0** · < 30 FPS 0,1% · 43 calls · 2732×1536 · qualidade 2 · **CUMPRIDA** | 12.310 intervalos · média 119,8 · p95 10,10 · > 50 ms: 2 · máx. 66,0 ms | 119,6 · p95 10,2 · quedas 4 · 0,1% |
| **375×812**, idem | 7.189 quadros · **média 119,6** · **p95 10,3 ms** · quedas 4 · **travadas 0** · 0,1% · 50 calls · 750×1624 · qualidade 2 · **CUMPRIDA** | 13.478 intervalos · média 119,8 · p95 10,00 · > 50 ms: 3 · máx. 67,0 ms | 119,7 · p95 10,2 · quedas 4 · 0,1% |
| 812×375, `?fps=10` | 1.206 quadros · média 119,5 · p95 10,3 · quedas 1 · travadas 0 · 31 calls · 1624×750 · CUMPRIDA | — | 119,5 · p95 10,2 · 1 |

- Os números estão no mesmo nível. O p95 do medidor sai até 0,25 ms acima da sonda porque o histograma devolve o limite **superior** da faixa de 0,25 ms (viés pessimista e desprezível). As 4 quedas de cada resumo coincidem com troca de pista/placar (compilação de shader, 50–67 ms), como na rodada 1. A sonda conta só 2–3 porque começou depois da carga.
- A qualidade adaptativa ficou em 2 o tempo todo.

## 3. Painel e faixa

| Verificação | 1366×768 | 375×812 | 812×375 |
|---|---|---|---|
| Depois do tempo, em `jogando`, o painel **não abre** | ok (conferido de 2,5 em 2,5 s por ~10 s depois do fim, `#medidorResumo` ausente) | ok (inclusive durante uma tacada real feita com o resumo pronto) | ok |
| Faixa diz `RESUMO PRONTO: toque em II` | ok | ok (3 linhas, 363×53) | ok (2 linhas, 800×38) |
| II (clique real) abre o painel | ok | ok | ok |
| Painel cabe sem rolagem | 560×299, sem rolagem interna (295 = 295), sem rolagem horizontal | 359×334, sem rolagem interna (330 = 330), botões dentro da tela | 422×255 (versão compacta), sem rolagem interna (251 = 251) |
| Área coberta | 16% | 39% | **35%** (na rodada 1 eram 52%) |
| Botões Copiar/Fechar | 105×64 / 107×64 | 105×64 / 107×64 | 87×48 / 88×48 (≥ 44 px) |
| Fechar (clique real) | remove o painel e ele não volta | idem | idem |
| Continuar (clique real, depois de Fechar) | `pausado=false`, `jogando` | idem | idem |
| Toque no jogo passando pela faixa | arrasto real soltando sobre a faixa → tacada (2→3) | arrasto real sobre a faixa → tacada antes da pausa (0→1) e depois do Continuar (1→2) | arrasto real sobre a faixa → tacada (1→2) |
| `elementFromPoint` no centro da faixa | `#jogo` (faixa com `pointer-events: none`) | `#jogo` | `#jogo` |
| Abre sozinho no placar | — | — | ok: tacada que embocou depois do tempo → `placar` com o painel aberto |

Texto do resumo conferido: versão `minigolfe-dos-pets@1.0.1+c0b67d9.producao`, aparelho, tempo visível, média/p95, "quedas (> 50 ms)", "travadas (≥ 1 s)", % abaixo de 30 FPS, qualidade/calls/canvas e a meta.

## 4. Sem `?fps`

- `#medidor` e `#medidorResumo` ausentes do DOM.
- Requisições (`read_network_requests` + `performance.getEntriesByType('resource')`): só `index.html`, `index-B7yEyLEs.js` e `index-CE_SRpX7.css`. **Nenhuma requisição a `release.json`.**
- Com `?fps`: uma requisição `release.json`, mesma origem. Nada sai para outro host.

## 5. Memória/GPU e pacote

`__minigolfe.info()` em 1366×768 (sem `?fps`), modo com ajuda, 9 tacadas por circuito:

| Momento | geometries | textures | calls | triangles |
|---|---|---|---|---|
| Menu inicial | 83 | 11 | 85 | 59.750 |
| C1 placares 1→5 | 85 · 96 · 109 · 117 · 105 | 11 · 11 · 12 · 13 · 12 | 85–128 | 59–71 mil |
| C1 fim / menu depois | 146 / **146** | 14 / **14** | 168 / 166 | 78.150 / 75.878 |
| C2 placares 1→5 | 91 · 97 · 109 · 117 · 105 | 11 · 11 · 12 · 13 · 12 | 85–128 | 59–71 mil |
| C2 fim / menu depois | 146 / **146** | 14 / **14** | 168 / 166 | 78.150 / 75.878 |
| C3 placares 1→5 | 91 · 97 · 109 · 117 · 105 | 11 · 11 · 12 · 13 · 12 | 85–128 | 59–71 mil |
| C3 fim / menu depois | 146 / **146** | 14 / **14** | 168 / 166 | 78.150 / 75.878 |

- **Sem crescimento.** Os circuitos 2 e 3 são idênticos. A diferença de +6 geometries só na pista 1 entre C1 e C2 é a mesma da rodada 1 (rastro/efeitos) e não cresce no C3. Heap JS: 21,4 → 24,9 → 32,9 → 31,8 MB (sobe e desce com o GC, sem tendência).

Pacote (`gzip -9`, mesma ferramenta para todos):

| Arquivo | 1.0 (`040829f`) bruto / gzip | 1.0.1 r1 (`c3c2f99`) gzip | **1.0.1 r2 (`c0b67d9`)** bruto / gzip | Δ gzip vs 1.0 |
|---|---|---|---|---|
| JS | 604.495 / 160.177 | 161.808 | 609.415 / 162.165 | +1.988 B (+1,2%) |
| CSS | 17.364 / 4.407 | 4.609 | 18.320 / 4.683 | +276 B (+6,3%) |
| `index.html` | 5.693 | 5.693 | 5.693 | 0 |
| **Total JS+CSS** | **164.584** | 166.417 | **166.848** | **+2.264 B (+1,4%)**; +431 B vs a rodada 1 |

## Achados

### P0
Nenhum.

### P1
Nenhum.

### P2

**P2-1: ao abrir na pausa, o painel cobre os botões da própria tela de pausa (e, deitado, a maior parte do Continuar) até alguém tocar em Fechar.**
- Cenário concreto, em 812×375 (celular deitado): o tempo termina, a pessoa toca em II, o painel (422×255, canto superior direito) cobre **64% do botão Continuar, inclusive o centro**, e também o título "PAUSA". Só sobra visível uma tira de ~63 px à esquerda do Continuar. ☰ Menu e ← Jogos ficam 44% cobertos (centros livres). No placar deitado, o ☰ Menu fica coberto. Em 1366×768, o painel cobre 100% de 🔊, ↻ Recomeçar, ☰ Menu e ← Jogos, e 11% da borda de baixo do Continuar (centro livre). Em 375×812 cobre 86% de 🔊 e ↻ Recomeçar e 100% de ☰ Menu e ← Jogos. O Continuar fica livre.
- Impacto: só existe com `?fps` (ferramenta do responsável, criança não vê). Fechar está sempre visível e tem alvo ≥ 44 px. Depois de Fechar, tudo volta a ficar livre e o painel não reabre (conferido nos 3 tamanhos). Não bloqueia: é um toque a mais. Num celular real, quem testa pode tocar no Continuar parcialmente visível sem perceber que não tocou no painel.
- Sugestão (opcional): deitado, ancorar o painel à esquerda/embaixo ou abaixo dos botões da pausa. Outra opção é abrir a pausa com o painel recolhido num botão "Ver resumo".

### Observações (sem severidade)
- Depois que o resultado congela, a faixa continua atualizando média, p95 e quedas da sessão inteira. Exemplo em 1366×768: faixa `média 119.8` com o painel mostrando `119.6`. Isso pode confundir quem copia os números da faixa em vez do painel. Vale dizer no roteiro do celular: "copie do painel (botão Copiar)".
- No quadro em que o painel abre, a faixa ainda mostra "RESUMO PRONTO: toque em II" por até 500 ms. Cosmético.
- O p95 do histograma é o limite superior da faixa de 0,25 ms (até +0,25 ms; viés pessimista, irrelevante para a meta de 40 ms).
- O resumo continua sendo "um retrato do instante" para qualidade/calls/canvas (43 a 50 calls no momento do resumo, contra 166–168 de pico na pista final). Já tinha sido apontado na rodada 1.
- `jogo.php` continua entregando o JS **sem compressão** (`Content-Length: 609415`, sem `Content-Encoding`, mesmo com `Accept-Encoding: gzip, br`). Não é regressão (já era assim na 1.0). O efeito na Hostinger (produção) não foi verificado.
- O preset de celular emula UA Android: o resumo diz "Android 14" com GPU Apple M4 Max. É o Mac num tamanho de celular, não um celular.

## Não executado
- **FPS/toque no aparelho de referência (celular real): NÃO EXECUTADO.** Continua pendente até o teste do Boaz com `?fps` (300 s padrão), jogando de verdade e copiando o resumo pelo botão Copiar.
- Safari/iOS (rAF a 60 Hz) e Firefox. Throttling de CPU/GPU (as ferramentas do painel não oferecem).
- Resumo com 300 s padrão completo em partida: medi 60 s e 10 s com partida e 430 s em `?fps=1800` no menu.
- Abertura automática do painel no menu e na volta de segundo plano (`visibilitychange` → pausa): não exercitei. Pelo código (`podeMostrar = pausado || estado !== 'jogando'`), devem abrir.
- Botão Copiar: não cliquei nesta rodada. O código não mudou em relação à rodada 1, onde funcionou.
- Compressão e tempo até o menu em produção ou rede móvel.

## Limpeza
- localStorage em `127.0.0.1:8770`: removida `samuel:minigolfe-dos-pets:convidado:v1`. A origem ficou vazia, como estava antes do teste.
- Viewport de volta para desktop. Aba `tab-13` fechada. A aba "seed" ficou intocada.
- Arquivos no scratchpad (fora do repositório): `qa-mg-101b/bench/bench.mjs`, `bench2.mjs` e `qa-mg-101b/zip/` (cópia dos arquivos do jogo extraída do zip para conferir os hashes).

## Resultado
**APROVADO para o escopo Mac** (P0: 0 · P1: 0 · P2: 1). As três correções pedidas na rodada 1 foram confirmadas no Mac:
- o custo do medidor ficou constante, e com ~49 mil amostras não há pico;
- travadas ≥ 1 s agora são contadas;
- o painel não abre durante a jogada e deitado cobre 35% em vez de 52%.

O FPS e o toque no celular de referência continuam **NÃO EXECUTADOS** e são condição separada para dar a meta de 30 FPS por cumprida.
