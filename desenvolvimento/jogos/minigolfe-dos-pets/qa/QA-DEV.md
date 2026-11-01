# QA-DEV — Minigolfe dos Pets (code review técnico)

Data: 2026-11-01 · Revisor: QA de desenvolvimento (Claude) · Base: `main` @ 1235b79, fonte sem alterações locais
(`src/` com última modificação 12:03:55; build em `_privado/jogos/minigolfe-dos-pets/` gerado às 12:03:58).

## Resumo

O núcleo está sólido no que a ficha mais teme: nenhuma tacada atravessa parede fixa (incluindo paredes
internas e para-choques), o buraco é sempre testado, NaN/Infinity não corrompem a bola, a pausa congela
de fato os timers e os obstáculos, os ouvintes não duplicam entre circuitos e o save sobrevive a falhas
de armazenamento.

Achei **1 defeito P0** que trava a partida: durante o aviso "TUDO BEM! 👍" (estouro do limite de tacadas)
a mira continua liberada; uma tacada nessa janela de 1,6 s é contada para o próximo jogador (ou para a
próxima pista) e depois deixa a partida presa em `rolando` para sempre. Também achei **1 P1** na física
(obstáculos móveis atravessam a bola parada; uma tacada nesse instante sai até 179° fora da mira) e três P2.

Estado: só relatório + testes novos em `tests/qa-dev-*.test.ts`. Nada em `src/` foi alterado. Nada commitado.

## Achados

| ID | Sev. | Arquivo:linha | Cenário de falha reproduzível | Correção sugerida |
|---|---|---|---|---|
| D1 | **P0** | `src/main.ts:305-312` (espera de 1,6 s), `src/main.ts:71` (`pode()`), `src/core/partida.ts:57-59` (`passarVez` já põe `fase='mirando'`) | 2 jogadores, Normal, pista 1. O J1 dá 6 tacadas sem acertar → `parou()` estoura o limite, já passa a vez e deixa `podeTacar()` = true; o main só troca a bola daqui a 1,6 s. Nessa janela, um gesto real na tela (PointerEvents no canvas) taca: `tacadas[1][0]=1`, a bola anda da posição do J1 e com a cor do J1. Aos 1,6 s `prepararVez(true)` teleporta a bola para o tee com `movendo=false`, então nenhum `parou` chega e a partida fica em `fase='rolando'` para sempre (`podeTacar()`=false, gestos ignorados; só sai pelo menu). **Confirmado no navegador.** Variante com 1 jogador no circuito: a tacada conta 1 na pista 2 (`[6,1,…]`) e, depois de "Próxima pista", a pista 2 já começa travada em `rolando` com o HUD mostrando 1. | Tratar o estouro como a comemoração: `parou()` com estouro põe uma fase de transição (ex.: `'encerrou'`) **sem** passar a vez; o main chama `continuar()` (que passa a aceitar `'acertou'` ou `'encerrou'`) depois do aviso. Defesa extra: em `main.tacar` checar `partida.podeTacar()` **antes** de `fisica.tacar` e não ignorar o retorno de `partida.tacar()` (`main.ts:236-237`). Teste de unidade sugerido: depois de um estouro, `podeTacar()` precisa ser false até `continuar()`. |
| D2 | **P1** | `src/core/fisica.ts:117` (`if (!b.movendo) return` antes de qualquer colisão com móveis) | Bola parada dentro do disco do gira-gira (pista 5) ou na faixa do portão (pista 6): a pá ou o portão passa **através** da bola a cada ~2,5 s / 4,2 s (visto no navegador: a bola fica sobre a pá). Se a criança solta a tacada nesse instante, a primeira colisão empurra a bola pelo lado de dentro, com a velocidade da pá: saída até **179°** fora da mira no gira-gira e 99° no portão (QA-F3). Frequência real: 10,5% das tacadas a partir do tee na pista 5 param dentro do disco; 3–4% das tacadas na pista 6 param na faixa do portão. Viola o critério 2 ("parada em local inválido" sem recuperação). | No `passo()`, com a bola parada, testar os segmentos móveis contra a bola; se houver contato (`d < RAIO_BOLA+esp`), acordar a bola (`movendo=true`) e aplicar `colidir` (a pá empurra a bola de verdade). Como `Partida.parou()` já ignora `parou` fora de `rolando`, isso não conta tacada; a mira já fica bloqueada com `movendo`. Alternativa mais simples: em `parar()`, se a bola parou dentro da área varrida de um obstáculo, levá-la ao ponto livre mais próximo. Testes QA-F2/QA-F3 cobrem. |
| D3 | P2 | `src/core/fisica.ts:155-156` (paredes fixas resolvidas **antes** das móveis) + `src/content/pistas.ts:88` (portão chega a x=±2,45 com tampa de 0,16 → 2,61, além da face interna da parede, 2,48) | Bola quase parada encostada na parede direita da pista 6 em z≈−5 quando o portão chega: o portão a empurra para x=b+0,36 > 2,6; no subpasso seguinte a parede a empurra **para fora** (x=2,92) → evento `fora` → "SPLASH! 💦 (+1)" no meio do green, longe da água (QA-F1). Reproduzido só com estado montado; 0 casos em 7.680 tacadas naturais varridas, por isso P2. | (a) Resolver os móveis primeiro e as paredes fixas por último (a parede sempre ganha); se ainda houver penetração no móvel, zerar a velocidade normal relativa. (b) Conteúdo: deixar folga ≥ diâmetro da bola entre o fim do curso do portão e as paredes (ex.: `desloc` 3,3 → 2,8 e `a` em −2,2). |
| D4 | P2 | `src/main.ts:161` (`novaPartida` zera `esperas`) e `src/main.ts:371-374` (`irMenu` esconde `#aviso`, mas não `#toast`) | Assistido, pista 1: aos 2,4 s aparece o toast "Puxe para trás e solte!". Pausa → Menu (ou Recomeçar) enquanto ele está na tela: a espera que o esconderia é apagada e o toast fica visível no menu e durante toda a partida seguinte (confirmado: Normal, pista 3, 30 s depois, `esperas=0`, toast ainda visível). O mesmo vale para o "Quase! 😮" da borda. | Criar `limparMensagens()` que esconde `#toast` e `#aviso` (e zera os `_id`) e chamá-la sempre que `esperas` for zerado (`novaPartida`, `irMenu`). |
| D5 | P2 | `src/storage/save.ts:39-42` vs `_app/inicio.php:192-193` (`setcookie(... 'httponly' => true)`) | O portal grava `samuel_perfil` como **HttpOnly**; `document.cookie` nunca o enxerga, então `perfilLocal()` sempre devolve `convidado`. Samuel e Player 2 dividem recordes e preferências na chave `samuel:minigolfe-dos-pets:convidado:v1`. (Provado por leitura de código e pelo comportamento padrão de HttpOnly; não troquei de perfil no navegador.) | O portal passa o perfil ao iframe (ex.: `jogar/index.php:15` → `.../index.html?perfil=<id>`, conferindo se `jogo.php` repassa a query) ou grava um cookie público só com o id; o jogo lê `?perfil=` com o mesmo regex `^[a-z0-9-]{1,24}$`. |
| D6 | P3 | `src/storage/save.ts:51-55` | Valor salvo corrompido (`{quebrado`): o `JSON.parse` cai no mesmo `catch` do armazenamento e põe `funciona=false`; o menu mostra "Este navegador não deixa guardar o recorde" embora `gravar()` funcione, e `funciona` nunca volta a true (QA-S1). Também: `melhores[*].jogadores`/`par` aceitam qualquer número (`save.ts:32`). | Separar o `try` do `getItem` do `try` do `JSON.parse`; marcar `funciona=false` só em erro de armazenamento e `funciona=true` quando `setItem` dá certo. Limitar `jogadores` a 1..4 e `par` a > 0. |
| D7 | P3 | `src/input/mira.ts:42` (keyup apaga `e.key` exato) e `src/input/mira.ts:98` (só `a/d/w/s` minúsculos) | Segurar `d`, apertar Shift, soltar `d` (o keyup chega como `D`): `d` fica preso no `Set` e a mira gira sozinha a 1,5 rad/s até um blur (QA-M1). Com Caps Lock ligado, WASD não funciona. | Usar `e.code` (`KeyA`, `ArrowLeft`…) em vez de `e.key`, ou normalizar com `toLowerCase()` no keydown e no keyup. |
| D8 | P3 | `src/render/mundo.ts:80-81` | A decoração é refeita a cada troca de pista **e a cada toque num botão de pista do menu**: descarta só as geometrias; os 6 `MeshStandardMaterial` novos não são descartados e as `InstancedMesh` não recebem `dispose()`, então os buffers `instanceMatrix`/`instanceColor` não são liberados pelo `WebGLObjects` (`onInstancedMeshDispose`, three r170). Não medi (a API de debug só expõe `info.render`). | No traverse: `if (o instanceof THREE.InstancedMesh) o.dispose();` e `o.material.dispose()` para cada malha antes do `clear()`. |
| D9 | P3 | `src/core/fisica.ts:106-110,120` (`segmentosMoveis()` aloca arrays/objetos a cada passo de 1/120 s), `fisica.ts:226` (`previa()` cria uma `Fisica` nova a cada pointermove: ~0,86 ms por chamada na pista 5, no Node), `main.ts:467,470`, `efeitos.ts:27,69,166`, `camera.ts:70-72` (Vector3/Matrix4/Raycaster novos por quadro, passo ou movimento) | Pressão de GC contínua enquanto a bola rola ou a mira está ativa (até 120 prévias/s num iPad com ponteiro de 120 Hz). Não é trava, mas é onde aparecem os soluços em aparelho fraco. | Reaproveitar buffers de segmentos (preencher in-place), manter uma `Fisica` de prévia reutilizável (`colocar` + `tempo`), limitar a prévia a 1 por quadro (marcar como "suja" no `aoMudar` e calcular no `avancar`), e guardar Vector3/Matrix4/Raycaster como campos. |
| D10 | P3 | `tests/fisica.test.ts:33-46` | (a) O teste "nunca atravessa parede" só confere `pisoEm != null`: não detecta travessia de parede **interna** (há chão dos dois lados). Cobri com um teste de cruzamento de segmento (passa). (b) Ele leva 0,9–2,5 s sozinho e, numa rodada com a máquina carregada, levou 6,8 s e estourou o timeout padrão de 5 s (falso vermelho; passou nas 3 rodadas seguintes). | Dar timeout explícito (`it(..., 30_000)`) ou reduzir amostras; manter o teste novo de cruzamento. |
| D11 | P3 (endurecimento) | `src/core/fisica.ts:31,37` e `src/render/pista3d.ts:22` | Divisão por `(ate - de)` sem validação: uma rampa nova com `de === ate` gera Infinity/NaN. Não acontece nas 6 pistas atuais. | Teste de conteúdo que valida as pistas (rampas com `de≠ate`, tee e buraco dentro do chão, polígonos com ≥3 pontos). |

Suspeitas não provadas (não entram na contagem):
- Enter/Espaço com o foco num botão do HUD (ex.: 🔊 depois de clicado) pode tacar **e** acionar o botão; não testei a ordem de ativação nos navegadores.
- Qualidade adaptativa (`main.ts:426-428`): os quadros longos na troca de pista (texturas em canvas + compilação de shader) podem baixar a qualidade de vez num aparelho bom; não medi.

## Verificado e OK (critérios da ficha)

| Critério | Evidência |
|---|---|
| 1. Bola rápida não atravessa parede nem passa pelo buraco sem teste | Subpasso ≤ 40% do raio; teste novo de cruzamento de segmento em todas as paredes (6 pistas × 36 ângulos × 2 forças) = 0 cruzamentos; portão em jogo normal = 0 travessias; testes de buraco existentes. Exceção: D3 (espremido pelo portão). |
| 2. Sem tacada com a bola andando; recuperação | `Fisica.tacar` recusa com `movendo`; `pode()` checado no toque e na soltura; `fora` volta ao último pouso; parada forçada em 18 s. Exceções: D1 e D2. |
| 3. Troca de jogador uma única vez; placar fecha em 6 | `trocasDeVez` e testes existentes; `continuar()` repetido não troca. Exceção: D1 (tacada atribuída ao jogador errado). |
| 4. Mouse e toque sem rolar; cancelar não taca | `touch-action:none` no canvas e no body; `preventDefault` no pointerdown/move; testes novos de cancelamento, pointercancel, lostpointercapture, multitoque, botão direito, blur. |
| 5. Reiniciar limpa tudo; 2 circuitos sem duplicar ouvintes | No navegador: Recomeçar no meio da tacada e durante o SPLASH → `mirando`, 0 tacadas, bola parada no tee; ouvintes `{dom:16, mira:9}` antes e depois de 2 circuitos. Exceção: D4 (toast). |
| Pausa real | No navegador: pausado durante a comemoração, `avancar(15)` → `fisica.tempo` e as 4 esperas não andam; despausar segue para o fim normalmente. |
| Perda de foco | `blur` limpa teclas e cancela o gesto (teste novo). Exceção: D7 (Shift). |
| Save versionado e à prova de falha | Testes novos: schema errado/lixo → padrão; campo a campo; `__proto__` não polui; `getItem`/`setItem` lançando → não quebra, `funciona=false`; recorde só quando melhora; chave por perfil. Exceções: D5, D6. |

## Resultado dos comandos

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` (em `desenvolvimento/jogos/minigolfe-dos-pets`) | exit 0 (antes e depois dos testes novos) |
| `npx vitest run` antes dos testes novos | 2 arquivos, **19/19 passaram** |
| `npx vitest run` com os testes novos | 5 arquivos, 41 testes: **36 passam, 5 falham de propósito** (QA-F1, QA-F2, QA-F3, QA-S1, QA-M1). Numa rodada sob carga, o teste antigo "nunca atravessa parede" estourou o timeout de 5 s (D10). |
| `python3 ferramentas/verificar_jogo.py minigolfe-dos-pets` (raiz) | `✓ minigolfe-dos-pets` — aviso: 3 arquivos, 0,6 MB; exit 0 |

## Testes criados

Todos em `tests/`. Os nomes `QA-Fn/Sn/Mn` afirmam o comportamento **correto** e hoje falham; vão passar
quando o defeito for corrigido. Os outros são cobertura e passam.

- `qa-dev-fisica.test.ts`
  - QA-F1 (falha, D3): portão espreme a bola pela parede direita da pista 6 → `x=2,92`, eventos `parede,fora`.
  - QA-F2 (falha, D2): bola parada em (1,0; 0,2) na pista 5 fica sobreposta à pá enquanto ela gira.
  - QA-F3 (falha, D2): tacada para o buraco dada com a pá sobre a bola sai até 179° fora da mira.
  - Cobertura: nenhuma tacada cruza o traço de parede alguma, internas incluídas; o portão não é atravessado em jogo normal; NaN/Infinity não corrompem; obstáculos só andam com o relógio da simulação.
- `qa-dev-save.test.ts` (save.ts não tinha teste)
  - Cobertura: validação de schema e campo a campo, recordes inválidos, `__proto__`, chave por perfil, `perfilLocal`, gravar/reler, recorde só quando melhora, armazenamento nulo, `getItem` e `setItem` lançando.
  - QA-S1 (falha, D6): JSON corrompido marca `funciona=false` embora `gravar()` funcione.
- `qa-dev-mira.test.ts` (ShotController com DOM mínimo de mentira)
  - Cobertura: arrastar e soltar taca uma vez para o lado oposto; voltar ao início, pointercancel e lostpointercapture não tacam; segundo dedo ignorado; botão direito ignorado; `pode()=false` na soltura não taca; blur cancela e libera o próximo toque; `destruir()` remove os 9 ouvintes; teclado Enter → setas → Enter.
  - QA-M1 (falha, D7): tecla `d` presa depois de soltar com Shift.

O D1 (P0) está no controlador DOM/Three e não tem teste em Node; foi reproduzido no navegador com
PointerEvents reais no canvas (passos acima). Teste de unidade sugerido junto da correção em `Partida`.

## Verificação no navegador

`http://localhost:8770/jogo/minigolfe-dos-pets/index.html?debug`, numa aba própria, fechada no fim.
Reproduzi o D1 (as duas variantes), o D4 e o D2 (screenshot: bola parada sobre a pá na pista 5).
Conferi a pausa durante a comemoração, Recomeçar no meio da tacada e durante o SPLASH, e a contagem de
ouvintes em 2 circuitos. O console ficou sem mensagens. Apaguei a chave de teste
`samuel:minigolfe-dos-pets:convidado:v1` do `localStorage`.

## O que não consegui verificar

- Toque real em iPad/celular (multitoque físico, gesto do sistema na borda, Safari iOS), som real e volume.
- Medir vazamento de GPU (D8): a API de debug não expõe `renderer.info.memory`.
- Desempenho em aparelho fraco e o efeito da qualidade adaptativa.
- Troca real de perfil no portal para observar o D5 de ponta a ponta.
- Layout 375×812 e deitado, e o checklist "Pronto para o Samuel" (escopo do QA de produto).
- Ainda não testado com o Samuel.
