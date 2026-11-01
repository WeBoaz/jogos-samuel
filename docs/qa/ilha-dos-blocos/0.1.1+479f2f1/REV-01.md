# REV-01 — Ilha dos Blocos 0.1.1

- **Revisor:** REV-01 (revisão de código independente, protocolo de QA v1.1)
- **Candidata:** `ilha-dos-blocos@0.1.1+479f2f1`, commit `17a48f1` (árvore limpa, HEAD = `17a48f1`)
- **Pacote:** `cand-ilha-011/samuel-site.zip`, SHA-256 `1244fa66ee31b1595d19fb2935c528f01dc2466e58265cd5a07be2a2b4f06629` (**confere**)
- **Base:** produção 0.1 = `b8a4f47`. Diff revisado: `git diff b8a4f47 17a48f1`. Entre `479f2f1` e `17a48f1` só muda o `release.json`.
- **Data:** 2026-11-01. Sem navegador e sem SSH. O código da ilha (`~/samuel-tech-ilha-codigo.txt`) **não foi lido**.

## Resultado: **Aprovado** (0 P0 · 0 P1 · 7 P2 novos ou residuais)

Os seis itens que a 0.1.1 dizia corrigir estão corretos no fonte e no bundle publicado. Não encontrei regressão que impeça a família de entrar ou que reabra o mundo.

Fica uma condição de operação, que não pude verificar por regra (**C2**). O P2-4 só vale em produção depois que o **novo `ilha-dos-blocos.service`** (com `ILHA_PRODUCAO=1`) e o **novo binário** forem instalados na VPS, seguidos de `systemctl daemon-reload` e restart. O zip do portal não leva nada disso. Sem esse passo, o servidor da VPS continua sendo o da 0.1.

## Comandos rodados

| Comando | Resultado |
|---|---|
| `shasum -a 256 cand-ilha-011/samuel-site.zip` | `1244fa66…6629` ✓ |
| `git archive --format=zip 17a48f1 <lista do empacotar.sh>` | **byte a byte idêntico** (`cmp` ok, mesmo SHA-256; comentário do zip = `17a48f1…`) |
| hashes de `files` do `release.json` × zip | 6/6 ✓. `source_commit` = `479f2f1…` |
| `vite build` do fonte de `479f2f1` (git archive no scratchpad, `VITE_ILHA_SERVIDOR=https://srv2114451.hstgr.cloud:8443/`) | **6/6 arquivos com o mesmo SHA-256** do zip: o bundle é reproduzível |
| `npx vitest run` (cliente) | 12/12 ok |
| `npx tsc --noEmit` (cliente) | ok |
| `cargo test --release` (servidor, `CARGO_TARGET_DIR` no scratchpad) | **6/6 ok**, incluindo o novo `producao_exige_codigo_de_verdade` |
| `python3 ferramentas/verificar_jogo.py --todos` | 6 jogos ✓ (ilha: 7 arquivos, 2,1 MB) |
| wasm do mesh-worker extraído do base64 + `strings` | crates: `console_error_panic_hook-0.1.7`, `dlmalloc-0.2.11`, `hashbrown-0.14.5`, `hashbrown-0.16.1`, `js-sys-0.3.102`, `serde-1.0.228`, `serde_core-1.0.228`, `serde-wasm-bindgen-0.6.5`, `wasm-bindgen-0.2.125`, `library/{core,alloc,std}` |

## Status dos P2 que a 0.1.1 dizia corrigir

| Achado (rodada 2) | Status | Evidência |
|---|---|---|
| **P2-2** `?servidor=` / `?codigo=` em produção | **Resolvido** | `main.ts:14` e `:20` usam `import.meta.env.DEV`. No bundle, `URLSearchParams(location.search)` aparece uma vez e só como `mT.has("debug")`. Não há `.get(` de parâmetro, nem `"servidor"`, `"codigo"`, `ilha-local` ou `import.meta.env`. O trecho real é `cf="https://srv2114451.hstgr.cloud:8443/"` … `let Fn=yT()\|\|""`. Resíduo: P2-A |
| **P2-3** recusa apaga o código guardado | **Resolvido** | `main.ts:216-241`: só o código recém-digitado (`novo`) é descartado. Uma recusa com código guardado mostra "A ilha não abriu agora" sem apagar nada (no bundle: `t instanceof df&&r?…:t instanceof df?uf("A ilha não abriu agora"…`). nginx `rate=60r/m` (`:6`), `burst=20` (`:33`). Resíduo: P2-B |
| **P2-4** segredo vazio ou padrão aceito | **Resolvido no código** (efetivo só com C2) | `main.rs:16-21`: exige 12+ caracteres (com `trim`) e diferente de `ilha-local` quando `ILHA_PRODUCAO` existe ou o endereço não é `127.0.0.1`. `main.rs:49-51` sai com código 2. `.service:14` define `ILHA_PRODUCAO=1`. Teste em `main.rs:64-71` cobre `""`, `"   "`, `ilha-local` e `curto-123` nos dois modos. Resíduo: P2-C |
| **P2-6** tablet: caixa do código e Enter | **Resolvido** | `main.ts:25` `SO_TOQUE`. `:214` faz `entrar()` sair cedo, e isso cobre o Enter (`:256`), o botão Entrar e o "Tentar de novo". `:175-179` não mostra a caixa nem dá foco. `:263` esconde a caixa e o "trocar". O bundle tem `function nd(){if(Ya)return;…` |
| **P2-1** crates Rust do wasm sem aviso | **Resolvido no essencial** | Seção nova no fim de `THIRD_PARTY_NOTICES.txt` (gerada por `vite.config.ts:6-29`, `:61-68`) com o texto MIT. Bate com os crates achados no wasm. Resíduo: P2-D |
| **P2-7** aviso de conexão caída apagado por outros avisos | **Resolvido em parte** | `main.ts:144`: `aviso()` não sobrescreve enquanto `semConexao`. `:285` `clearTimeout(avisoTimer)` impede que um timer antigo esconda o aviso fixo. A volta esconde o aviso na hora. **Falta:** limite de tempo. Numa queda longa, ou se o código mudar com a criança jogando, "Voltando…" fica para sempre (P2-E) |

Outros da rodada 2 que mudaram neste diff:

- **P2-5 backup:** resolvido. `ilha-backup.sh:9-11`: falha > 1 ou gzip inválido apaga só a cópia ruim e sai **antes** do `find -delete`. A retenção de 3 dias continua (`:12`).
- **P2-10 higiene:** resolvido em parte. `*.env` entrou no `.gitignore`. Continuam: `nginx.conf:2` diz que o cliente usa `/registry/`, e ainda falta o README de instalação da VPS.
- **P2-9 força bruta:** piorou em 3×. Com 60 r/min + burst 20, um IP faz cerca de 86 mil tentativas por dia (antes, cerca de 29 mil). Isso é compensado pelo mínimo de 12 caracteres do servidor, se o código for aleatório (ver P2-C).
- Sem mudança: P2-8 (volta do vazio a cada quadro), P2-11 (systemd), P2-12 (verificador) e P2-13 (sem teste do `EstagioIlha::process`).

## P2 novos ou residuais (pode seguir; registrar)

### P2-A · `?debug` ainda expõe `window.__ilha` em produção

**Onde:** `main.ts:12` e `main.ts:297`. No bundle: `AT&&(window.__ilha={world:ei,controls:qe,network:zo,…,entrar:nd,…})`.

**Fato:** a rodada 2 recomendava expor `__ilha` também só no DEV. Com `?debug`, o objeto `network` (que guarda as opções de conexão com o `secret`) fica em `window`.

**Por que só P2 (sem risco prático):** `window.__ilha` só pode ser lido na mesma origem (`samuel.tech`), e essa origem já lê o `localStorage` com o código. Um parent de outra origem não chega ao objeto. Já o redirecionamento do servidor, que era o vetor real do P2-2, saiu.

**Correção barata:** `if (import.meta.env.DEV && DEBUG)`.

### P2-B · Código digitado que caiu em "fora" passa a ser tratado como "guardado"

**Onde:** `main.ts:216-220` (`novo` é local de cada chamada de `entrar()`) e `main.ts:239-241`.

**Cenário:**

1. O adulto digita um código **errado** quando o servidor está fora, ou a rede demora mais que 8 s (`testarCodigo` resolve `'fora'`).
2. A tela mostra "A ilha está dormindo". O `codigo` digitado fica na memória, sem ir para o `localStorage`.
3. Ele clica em "Tentar de novo" (`bTentar` → `entrar()`). Agora `codigo` não está vazio, então `novo = false`.
4. O servidor responde, recusa o código, e a tela diz "A ilha não abriu agora — Espere um minutinho…". Deveria dizer "Esse código não abriu a ilha".
5. O adulto espera e tenta de novo, e o resultado se repete. O texto manda usar "trocar o código" **na tela inicial**, mas a `tConexao` só tem "Tentar de novo" e "← Jogos". Não há caminho direto para a tela inicial. A saída é voltar aos Jogos e abrir de novo, o que zera o código da memória e mostra o campo.

O mesmo beco sem saída acontece com um código guardado de verdade que foi trocado no servidor: é preciso sair e voltar para ver o "trocar o código".

**Impacto:** confusão, sem perda de dados e sem a criança presa (há "← Jogos").

**Correção:** guardar `codigoNaoConfirmado = true` até o primeiro `ok` (em vez de `novo` local), e pôr um botão "trocar o código" na `tConexao` quando a recusa vier de código guardado.

### P2-C · `conferir_segredo` não garante um código que o cliente consiga mandar

**Onde:** `servidor/src/main.rs:17` contra `cliente/src/main.ts:218` (`trim().toLowerCase()`) e `cliente/index.html:31` (`maxlength="40"`).

**Fato:** o servidor mede `segredo.trim().len()`, mas usa o `segredo` **sem trim** como chave. O cliente sempre manda o que foi digitado com `trim` e em minúsculas, com no máximo 40 caracteres.

**Cenários que o servidor aceita e em que a família nunca entra** (sempre "Esse código não abriu a ilha"):

- `ILHA_SEGREDO=Pato-Coco-Sapo-1234`, com maiúscula.
- O mesmo com espaço no fim, se o `ilha.env` o preservar (por exemplo, entre aspas).
- Um código com mais de 40 caracteres.

**Contexto:** é o C1 da rodada 2. Hoje está fechado na prática, porque a sessão real em samuel.tech entrou com o código (`STATE.md`). Mas a nova trava não impede o erro quando o código for trocado. `.len()` conta bytes, não caracteres (irrelevante para ASCII).

**Correção:** recusar a partida, em produção, se `segredo != segredo.trim().to_lowercase()` ou se `segredo.chars().count() > 40`, e incluir esses casos no teste. Opcional: exigir alguma variedade de caracteres. O exemplo do teste, `pato-coco-sapo-1234`, é feito de palavras e tem pouca entropia para a taxa do P2-9.

### P2-D · Avisos do wasm: dois crates da std sem nome e copyright genérico

**Onde:** `vite.config.ts:9-17`, e a seção final do `THIRD_PARTY_NOTICES.txt`.

**Fatos:**

- O wasm contém `dlmalloc-0.2.11` e `hashbrown-0.16.1`. Os dois são dependências da std do Rust para wasm32, ambos MIT OR Apache-2.0. A lista nomeia "hashbrown 0.14" e "biblioteca padrão do Rust: core, alloc, std", mas não nomeia `dlmalloc` nem `hashbrown 0.16`.
- A linha de copyright é genérica ("os autores e contribuidores de cada crate"). A MIT pede a nota de copyright de cada titular.
- O cabeçalho (`THIRD_PARTY_NOTICES.txt:2`) ainda diz "Os workers em assets/ vêm do @voxelize/core (mesma licença MIT)", e a seção nova corrige isso só em parte.

Listar crates a mais (ahash, bumpalo, futures-*…) não faz mal.

**Correção:** acrescentar `dlmalloc 0.2` e `hashbrown 0.16` (da std), e de preferência as linhas reais de copyright (por exemplo, `Copyright (c) 2014 Alex Crichton` e `The Rust Project Developers`), via `cargo about`.

### P2-E · "Voltando…" sem fim e sem saída

**Onde:** `main.ts:283-286`.

**Fato:** o aviso agora fica fixo, e isso está correto. Mas não há prazo. Se o servidor ficar fora por muito tempo, ou se o código mudar na VPS enquanto a criança joga (o reconectar do core manda o código antigo e é recusado a cada 3 s), o toast fica para sempre. A criança continua "construindo" localmente.

O texto "o que você construiu está guardado" vale para o que veio antes da queda. O core enfileira até 4096 pacotes durante a queda (`index.mjs:9224`, `:9373`), mas eu não verifiquei se a fila é reenviada depois de um novo `join`.

**Correção:** depois de cerca de 30 s sem conexão, desconectar e mostrar a `tConexao` ("A ilha está dormindo", com "Tentar de novo"). Opcional: bloquear `quebrar`/`colocar` enquanto `semConexao`.

### P2-F · systemd: um código fraco vira laço de reinício

**Onde:** `main.rs:51` (`exit(2)`) e `ilha-dos-blocos.service:16-17` (`Restart=on-failure`, `RestartSec=3`).

**Fato:** com o segredo recusado, o serviço reinicia a cada 3 s para sempre. Com o `StartLimitBurst` padrão (5 em 10 s), intervalos de 3 s nunca batem no limite. O efeito é só barulho no journal, e fecha do lado seguro.

**Correção:** `RestartPreventExitStatus=2`.

### P2-G · Backup: a cópia que falha pode apagar a cópia boa da mesma hora

**Onde:** `ilha-backup.sh:6`, `:9` e `:11`.

**Fato:** o nome é por hora (`%Y%m%d-%H`). Se o script rodar duas vezes na mesma hora (cron e manual) e a segunda execução falhar, o `tar` já truncou o arquivo bom, e o `rm -f` o apaga.

**Correção:** gravar em `"$ARQ.tmp"` e fazer `mv` só depois do `gzip -t`. Impacto muito baixo.

## Regressões conferidas sem defeito

**Fluxo de entrada e estados:**

- `iniciando ??=` monta a cadeia `.then/.catch` uma única vez. Um Enter ou clique duplo não cria outra conexão nem troca o `novo` da primeira chamada.
- O código só vai para o `localStorage` depois do sucesso (`guardarCodigo(codigo)` no `.then`).
- Num código novo recusado, o campo é limpo e a tela inicial volta com a mensagem.
- No `catch`, `iniciando = null` e `network.disconnect()` continuam como antes.

**Telas:**

- `telaInicio` mostra a caixa se não houver código e o "trocar" se houver, e nunca os mostra no tablet.
- O "trocar o código" (`:257`) apaga a memória e o `localStorage`.

**`semConexao`:**

- Só muda com `conectado`.
- O `clearTimeout` nas duas transições evita que um timer de 1,8 s esconda o aviso fixo.
- A volta para o meio continua funcionando. Só o toast dela é suprimido durante a queda.

**Bundle de produção:**

- O fallback para `ilha-local` é eliminado (`Fn=yT()||""`).
- O endereço do servidor é a constante do build.
- `secret` aparece só no teste (`searchParams.set("secret",r)`) e no core.

**nginx:**

- A ordem continua a mesma: `return 403` por Origin (fase de rewrite) antes do `limit_req`/`limit_conn`.
- `limit_conn 6` não mudou.
- Com a recusa do código guardado sem apagar nada, o 503 do `limit_req` deixou de ser destrutivo, então o `limit_req_status 429` já não é necessário.

**Servidor:**

- `ILHA_SEGREDO` ausente com `ILHA_PRODUCAO` cai em `ilha-local`, que é recusado.
- `ILHA_PRODUCAO` vale com qualquer valor (`is_ok`), inclusive `0`. Isso fecha do lado seguro.
- O `EnvironmentFile` não consegue "desdefinir" a variável.
- `eprintln!` não imprime o segredo.

## Não verificado

- **C2:** se a VPS já roda o binário e o `.service` da 0.1.1. Não usei SSH.
- O fluxo na tela real: código guardado recusado por 503, tablet, queda e volta da conexão. Fica para o QA de navegador.
- O formato e a entropia do código real. Não li o arquivo, por regra.

## Arquivos de referência

- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/src/main.ts`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/vite.config.ts`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/servidor/src/main.rs`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-dos-blocos.nginx.conf`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-dos-blocos.service`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-backup.sh`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/_privado/jogos/ilha-dos-blocos/THIRD_PARTY_NOTICES.txt`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/_privado/jogos/ilha-dos-blocos/release.json`
- Rebuild de conferência: `/private/tmp/claude-501/-Users-boaz-mac-Workspace-06-ANDAIME-IO-Samuel-Tech-Games/ebc8bade-2c59-49ae-95d3-a4811132d6c9/scratchpad/rev01-011/rb/out/`
- Wasm extraído: `/private/tmp/claude-501/-Users-boaz-mac-Workspace-06-ANDAIME-IO-Samuel-Tech-Games/ebc8bade-2c59-49ae-95d3-a4811132d6c9/scratchpad/rev01-011/mesh.wasm`
