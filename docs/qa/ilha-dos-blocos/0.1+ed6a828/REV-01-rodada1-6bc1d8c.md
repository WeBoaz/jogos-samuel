# REV-01 — Ilha dos Blocos 0.1 (prévia do modo criativo)

- **Revisor:** REV-01 (revisão de código independente, protocolo de QA v1.1)
- **Commit revisado:** `6bc1d8c` (lido com `git show`; a árvore de trabalho já tem mudanças posteriores em `main.ts`, `index.html` e no bundle, que **não** foram revisadas)
- **Data:** 2026-11-01
- **Sem navegador e sem SSH:** nada foi verificado na VPS nem em execução no browser; tudo abaixo vem do código, do bundle do commit e do código-fonte do `voxelize` 3.0.0 / `@voxelize/core` 3.0.0 instalados.

## Resultado: **Reprovado** (0 P0 · 2 P1 · 14 P2)

Não há P0. Os dois P1 são baratos de corrigir, mas devem ser resolvidos antes de publicar: (1) o mundo único fica aberto para qualquer pessoa que tenha a URL, o que contraria a proteção infantil que o próprio projeto exigiu (DEC-012/ADR-001); (2) os avisos de licença estão incompletos (faltam BSD-3-Clause e Apache-2.0 que estão no bundle). O P1-1 também pode ser fechado com mitigação mínima mais o aceite escrito do responsável (detalhes abaixo).

## Comandos rodados

| Comando | Resultado |
|---|---|
| `npx vitest run` (cliente) | 12/12 ok (catálogo 3, inventário 9) |
| `npx tsc --noEmit` (cliente) | ok, sem erros |
| `cargo test --release` (servidor, `CARGO_TARGET_DIR` no scratchpad) | 5/5 ok |
| `python3 ferramentas/verificar_jogo.py --todos` | 7 jogos ✓ (ilha: 6 arquivos, 2,0 MB) |
| Regex do verificador contra casos que **devem** falhar | ver seção 4 |
| Bundle do commit vs fonte | bate: `any-pointer: fine`, `?servidor=` só com `?debug`, URL `https://srv2114451.hstgr.cloud:8443/`, `"ilha-local"` |

---

## P1 — corrigir antes de publicar

### P1-1 · Mundo único aberto a quem tiver a URL; a "chave" é pública; sem limites no proxy

**Onde:** `cliente/src/main.ts:15-16` (`SEGREDO = … || 'ilha-local'`, `MUNDO = 'ilha'`), `servidor/src/main.rs:36` (mesmo padrão), `desenvolvimento/infra/vps/ilha-dos-blocos.nginx.conf:21-30` (`location /` faz proxy de tudo, sem `limit_conn`/`limit_req`/Origin), `_app/jogos.json:125` ("fica guardado na ilha da família").

**Fatos:**
- `ilha-local` é a única coisa que o servidor confere (`voxelize-3.0.0/server/runtime.rs` `ws_route`), e ela está no Git e no bundle público (`index-Bmhi7S4A.js`: `dT=…"https://srv2114451.hstgr.cloud:8443/",uT="ilha-local",IT="ilha"`). **Nenhuma proteção real depende dela** — confirmado: o único uso é essa comparação. Ela deve ser tratada como pública, e o comentário do nginx já faz isso.
- O servidor aceita `Update`/`bulk_update` de qualquer cliente conectado, sem limite de alcance, de taxa ou de quantidade (`world/inbound.rs` `on_update`: só confere `is_within_world`). Cada quadro WS pode ter até 16 MB (`runtime.rs`, `max_frame_size(16 MiB)`). `client_max_body_size 2M` não vale para quadros de WebSocket.
- Com a mesma chave pública, qualquer um entra como **transport** (`?is_transport`), aparece em `/info` e tem o mesmo poder de edição.
- `?debug` funciona em produção e expõe `window.__ilha.world` (main.ts:220-226). Isso só facilita o que o DevTools já permite.
- Isso contraria decisões do próprio projeto: DEC-012 (`docs/samuel-tech/DECISOES.md:98`) e ADR-001:74 exigem "mundos privados por código opaco"; TESTES.md:26 exige "limites (taxa de ações, tamanho de mensagem)". ESTADO.md:41 lista "mundos por código opaco" como pendente.

**Cenário concreto:** alguém abre o jogo (o portal é público, "jogos abertos"), lê a URL do servidor no JS e roda um script com `@voxelize/core` (ou `?debug` + `__ilha.world.updateVoxel` em laço). Em segundos apaga a casa do Samuel ou "escreve" palavras ou desenhos com blocos. O Samuel vê a mudança ao vivo e ela fica salva no disco. O único jeito de desfazer é o backup diário, que pode perder até 24 h. Outros jogadores não aparecem na tela (o cliente não registra `Peers`), então a criança vê blocos sumindo ou surgindo "sozinhos". A probabilidade é baixa (exige intenção e um mínimo de técnica), mas o impacto para uma criança de 7 anos é alto. A descrição "ilha da família" passa à família uma privacidade que não existe.

**Correção mínima para a prévia (escolher ao menos 1+2+3):**
1. nginx: só `location = /ws/` (o cliente não usa `/info`, `/health` nem `/` — conferido no bundle). O resto responde `return 404`.
2. nginx: recusar o upgrade se `$http_origin` não for `https://samuel.tech` (ou `www.`). Isso barra páginas de terceiros e o "copiar o cliente"; scripts fora do navegador ainda forjam o Origin, mas o esforço sobe.
3. nginx: `limit_conn_zone $binary_remote_addr` (ex.: 4 conexões por IP) e `limit_req` no `/ws/`. A zona fica só em memória e não vai para log.
4. Backup mais frequente (de hora em hora) enquanto o mundo for aberto.
5. Trocar "fica guardado na ilha da família" por algo verdadeiro, e registrar em `DECISOES.md` o aceite do responsável: "prévia com mundo único aberto, sem código opaco, até a BLK-030 item 3".

**Correção definitiva:** um token curto assinado pelo portal (HMAC entre a Hostinger e a VPS), validado no nginx (`secure_link` sobre `$arg_secret` e reescrita para a chave estática), ou o código de mundo opaco que já está planejado.

### P1-2 · Avisos de licença incompletos; inventário de licenças incorreto

**Onde:** `cliente/public/THIRD_PARTY_NOTICES.txt` (igual a `_privado/jogos/ilha-dos-blocos/THIRD_PARTY_NOTICES.txt`), `docs/blocos/RECURSOS.md:13`, `docs/blocos/ADR-001-base.md:19`.

**Fatos (conferidos no bundle do commit):**
- **protobufjs 7.6.6 — BSD-3-Clause** (entra pelo `@voxelize/protocol`; o bundle tem `asPromise`, `LongBits`, `protocol.Peer`). A cláusula 2 da BSD-3 exige reproduzir o aviso na documentação quando se distribui binário/bundle. O aviso não está no `THIRD_PARTY_NOTICES.txt` e nenhum cabeçalho dela ficou no bundle.
- **long.js 5.3.2 — Apache-2.0** (no bundle, linha ~4070: `Copyright 2020 Daniel Wirtz / The long.js Authors … Apache License 2.0`). O cabeçalho ficou, mas o texto da licença não acompanha o pacote.
- MIT de zod, @tweenjs/tween.js, omggif, ndarray, deepmerge etc.: o arquivo só diz "Demais dependências do motor: MIT, ISC e zlib (ver RECURSOS.md)". A MIT exige o aviso de copyright e permissão "em todas as cópias", e o RECURSOS.md não vai junto com o jogo.
- RECURSOS.md:13 e ADR-001:19 dizem "43 MIT, 3 ISC, 2 zlib, 1 domínio público" e não mencionam BSD nem Apache. O próprio RECURSOS dizia "gerar a lista do bundle real na BLK-065", e isso não foi feito.

**Correção:** gerar os avisos a partir do bundle real (por exemplo `rollup-plugin-license` no `vite.config.ts`, ou `license-checker --production` filtrado pelo que entrou), com o texto completo de cada licença, e corrigir RECURSOS.md e ADR-001.

---

## P2 — pode seguir (registrar e tratar)

### Segurança, infra e criança

- **P2-1 · O log de erros do nginx grava IP e query string.** `ilha-dos-blocos.nginx.conf:15-17`. O comentário diz "logs sem IP nem query string", mas `error_log … warn` inclui as linhas `error` do nginx, e elas trazem `client: <IP>` e `request: "GET /ws/?secret=ilha-local&client_id=…"`. Cenário: o servidor Rust reinicia (`Restart=on-failure`) ou está fora → cada tentativa da família grava `connect() failed (111) … client: <IP da casa>`. Isso contraria a ADR-001:75 ("logs sem dados pessoais"). Correção: `error_log … crit` (ou `emerg`) e corrigir o comentário.
- **P2-2 · `/info` e `/health` públicos.** O `location /` expõe `pid`, `buildId`/`gitSha`, `startedAt` e os IDs das conexões abertas (`voxelize server/mod.rs` `get_info`). Não há dado pessoal, mas abre espaço sem necessidade. A correção é a mesma do P1-1, item 1.
- **P2-3 · O servidor ainda repassa chat.** `world/inbound.rs:314-332`: uma mensagem `Chat` vinda de qualquer cliente vai para todos (`ClientFilter::All`). Hoje o cliente **não** registra `Chat` (main.ts:51) nem `Peers`/`Events`, então nenhum texto livre chega à tela. Confirmado: não há canal de texto livre na UI. Mas o servidor funciona como relé. Como defesa em profundidade, ao registrar um `Chat`/`Peers` no futuro (por exemplo nomes sobre a cabeça), revisar isto antes. Se o Voxelize permitir, um `set_command_handle`/filtro que descarte `Chat` no servidor fecha a porta.
- **P2-4 · O INIT envia a config inteira do mundo para o cliente** (`generate_init_message`: `options` com `save_dir` = `/opt/ilha/dados/mundos/ilha` e `seed`). É só vazamento de informação interna, de baixo risco.
- **P2-5 · Unit systemd: endurecimento correto, mas mínimo.** `ilha-dos-blocos.service:16-22`. Pontos conferidos:
  - Escuta só em 127.0.0.1: confirmado (`Environment=ILHA_ENDERECO=127.0.0.1`, padrão do binário, `main.rs:35`).
  - `ProtectSystem=strict` + `ReadWritePaths=/opt/ilha/dados`: o servidor só grava em `ILHA_DADOS/mundos/ilha` (chunks, `stats.json`, entidades), conferido no crate. O perf log (`.staging/perf`) só existe com `TOWN_PERF_LOG=1`, e não há `fern` gravando em arquivo. Então grava onde precisa.
  - Ressalva 1: se `/opt/ilha/dados` não existir, a unit falha com `226/NAMESPACE`.
  - Ressalva 2: `EnvironmentFile` **sobrepõe** `Environment=`, então um `ilha.env` com `ILHA_ENDERECO=0.0.0.0` passaria. O `panic!` em `main.rs:39-41` só exige trocar a chave, o que quebraria o cliente.
  - Sugestões: `PrivateDevices=yes`, `ProtectKernelTunables/Modules/ControlGroups=yes`, `RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX`, `CapabilityBoundingSet=`, `LockPersonality=yes`, `RestrictNamespaces=yes`, `SystemCallFilter=@system-service`, `UMask=0077`.
  - Falta um README de instalação em `desenvolvimento/infra/vps/`: usuário `ilha`, `install -d -o ilha /opt/ilha/dados`, linha do cron, firewall da 8443.
- **P2-6 · Backup.** `ilha-backup.sh:6-7`: roda com o mundo sendo gravado. Os chunks usam tmp+rename, mas um `tar` que avisa "file changed as we read it" sai com código 1 e, com `set -e`, pula o `find -delete` (a limpeza não roda nesse dia). Além disso, o backup fica no mesmo disco e na mesma VPS, sem cópia externa. Sugestão: `tar … || [ $? -eq 1 ]`, excluir `*.tmp` e mandar uma cópia semanal para fora da VPS.
- **P2-7 · Queda de conexão no meio do jogo não aparece na tela.** `main.ts` não usa `network.onDisconnect`. O core reconecta e entra de novo sozinho, mas a criança continua construindo sem saber se está salvando. Sugestão: um toast "reconectando…" e voltar para "a ilha está dormindo" depois de N segundos.
- **P2-8 · Nada é contado para a pausa, mas `?debug` vale em produção** (main.ts:12, 220). Pode ficar porque a URL do servidor só muda com `?debug` e só para o próprio cliente. Avaliar gatear `__ilha` também por build (`import.meta.env.DEV`).

### Cliente

- **P2-9 · `controls.lock()` depois de `await` (main.ts:175).** O `requestPointerLock` exige ativação de usuário recente (cerca de 5 s no Chromium). Se conectar e iniciar demorar mais que isso (primeira carga de 2 MB, VPS lenta), o lock falha: aparecem o HUD e o mundo, mas a câmera não mexe e as teclas 1–9/E ficam inativas, sem nenhuma instrução. Dá para recuperar com um clique no canvas (`onDocumentClick` faz o lock), mas esse mesmo clique pode quebrar um bloco (`inputs.click('left', quebrar)`). Sugestão: depois de conectar, mostrar "▶ Clique para jogar" em vez de travar direto. Também vale para `bContinuar` logo depois do Esc (o Chrome tem um intervalo antes de permitir o lock de novo).
- **P2-10 · Cair no vazio.** Não há bloco inquebrável no fundo (`terreno.rs:79-89`, o `quebrar` em main.ts:114-118 aceita y=0) e não há parede na borda do mundo (chunks −5..4, ±80 blocos, `main.rs:16-17`). A água rasa deixa andar pelo fundo até a borda. Cenário: a criança "explora até o horizonte" ou cava até o fundo e cai para sempre. O único jeito de sair é saber do F (voo) ou ir em Pausa → Jogos. Sugestão: teletransportar para o nascimento quando `y < 0` e recusar quebrar em `vy === 0`.
- **P2-11 · Proteção de tablet (main.ts:18, 197): correta para o caso pedido.** `pointer: coarse` sem `any-pointer: fine` → esconde "Entrar" e mostra o aviso com "← Escolher outro jogo" (`target="_top"`). Notebook com touch, iPad com trackpad e Surface com mouse continuam entrando. Caso de borda: celular com caneta (S-Pen) passa no `any-pointer: fine`, o lock falha e a criança cai no HUD sem teclado. Não fica preso, porque o botão "II" fica clicável sem lock e leva à pausa → Jogos.
- **Itens conferidos sem defeito:**
  - Fluxo começo → conectar → jogar → pausa → catálogo: `unlock` mostra a pausa só fora do catálogo, o catálogo troca o namespace para `menu`, e "Pronto" e a escolha fazem o lock com gesto do usuário.
  - Falha de conexão: `iniciando ??=` evita duas conexões ao mesmo tempo; no `catch`, `iniciando = null` + `network.disconnect()`, que zera `joined`, `waitingForInit`, fila, `serverURL` e o intervalo de sync, então o reconectar automático do core não continua atrás da tela "dormindo". Tentar de novo cria um socket novo. Nenhum estado vaza.
  - Ouvintes: `montarBarra`/`montarCatalogo` recriam os botões com `replaceChildren` (os antigos e seus ouvintes vão embora). Não há ouvinte global repetido.
  - Bloco dentro do jogador (main.ts:108-113): a AABB do corpo é calculada pela altura do olho; está certo.
  - IDs cliente/servidor: o teste lê `catalogo.rs` e compara os 32 IDs, os nomes e a água (40).
  - Inventário: puro, imutável, testado.
  - Texturas: semente fixa por bloco e face.
- **P2-12 · Orçamento de peso estourado.** TESTES.md:35 pede JS ≤ 1,5 MB / ≤ 450 KB gzip. O commit tem `index` com 1.602.893 B (≈ 1,53 MiB; 423 KB gzip) + `mesh-worker` 381 KB (147 KB gzip) + `light-worker` 104 KB (21 KB gzip) = **≈ 2,09 MB / ≈ 591 KB gzip**. Aceitável numa prévia só para desktop; registrar.

### Servidor

- **P2-13 · Geração e panics.**
  - Geração determinística: hash inteiro próprio, só depende de (x, z, seed); o teste confirma.
  - Árvores ficam longe da borda (altura > 25 só dentro de raio de cerca de 59); folhas fora do chunk viram `exceeded_changes`; a altura máxima (60+6) fica abaixo de `max_height` 96.
  - Panics possíveis: `catalogo::id()` dá `panic!` com nome inexistente e é chamado em cada chunk (`terreno.rs:69-71`). Os nomes atuais existem, mas **nenhum teste roda `EstagioIlha::process`**, então um erro de digitação só apareceria em produção. Sugestão: um teste que gera um chunk.
  - `parse().expect` das variáveis de ambiente só roda na partida (ok).
  - No crate: `stats.rs` tem `.expect("Unable to write stats file.")` (disco cheio derruba o servidor); `MessageType::from_i32(..).unwrap()` com tipo desconhecido está dentro de `catch_unwind` (`world/sync.rs:75`), então não derruba o servidor.
  - Trocar `ILHA_SEED` com mundo salvo cria emendas entre chunks antigos e novos; vale documentar.

### Portal e verificador

- **P2-14 · Brechas pequenas no `verificar_jogo.py`.**
  - Linha 29: `(?-i:url)\(` torna o `url(` do CSS sensível a maiúsculas, e o CSS não é. `background:URL(/x.png)` e `Url(/x.png)` **passam**. Sugestão: `(?<!new\s)(?<![\w$.])url\(` com `re.I`, o que mantém `new URL("/x", base)` fora.
  - Linha 33: `amplitude.init(` e `window.amplitude.track(` passam. É aceitável, porque o snippet e o SDK empacotado trazem `cdn.amplitude.com`/`api2.amplitude.com`, que são pegos.
  - O verificador não percebe a dependência de servidor externo da Ilha (a URL entra por variável em `network.connect`). Sugestão: um campo explícito no `jogos.json` (por exemplo `"servidor": "wss://srv2114451.hstgr.cloud:8443"`) que o verificador confira contra as URLs do bundle, para que outra dependência externa não passe em silêncio.

  Testes pedidos (casos que DEVEM falhar), rodados contra os regex do commit:

  | Caso | Resultado |
  |---|---|
  | `url(/x.png)` em CSS | pega ✓ |
  | `url('/x.png')` | pega ✓ |
  | `URL(/x.png)` em CSS | **passa ✗** (P2-14) |
  | `src="/x.js"` / `SRC='/x.js'` | pega ✓ |
  | `amplitude.com` | pega ✓ |
  | `cdn.amplitude.com` | pega ✓ |
  | `@amplitude/analytics-browser` | pega ✓ |
  | `amplitude.init(` | passa (P2-14) |
  | `new URL('/x', import.meta.url)` (deve passar) | passa ✓ |
  | `uniform float amplitude;` (three, deve passar) | passa ✓ |

- **Entrada no `jogos.json`: coerente** com o esquema dos outros jogos `pronto` (`slug, title, category, description, cover, entry, instructions[], input[], status, novo, version`). A capa `assets/img/ilha-dos-blocos.webp` existe, as instruções estão em pt-BR e são boas para criança, e `input` só tem `mouse`/`keyboard` (correto). Só o texto da descrição entra no P1-1. A categoria nova "Construção" aparece só como rótulo (`layout.php:80`). O mesmo commit também muda o minigolfe para `1.0.1`, fora do escopo e coerente com o commit anterior.
- **Documentação desatualizada** (dentro do P2-12/P2-5): no commit, `docs/jogos/ilha-dos-blocos/ESTADO.md:3,9` ainda diz "catálogo: `em-breve`; vira `pronto` só na BLK-065" e "sem build no portal, sem VPS". O nginx diz "o cliente usa /ws/ e /registry/" (`nginx.conf:2`), mas o cliente usa só `/ws/` (e `/rtc/offer` se o WebRTC estiver ligado, e não está). A ADR-001 desenha Caddy :443, mas o que foi entregue é nginx :8443. Atualizar.

## Não verificado (fora do alcance desta revisão)

- Se a VPS roda de fato com esta unit, este nginx e este cron; certificado e firewall da 8443; logs reais.
- Pointer lock dentro do iframe do `/jogar/` em produção (o ESTADO registra que o painel do app não permite; o iframe não tem `sandbox`, então em tese funciona).
- Comportamento de `update_voxel` com `vy` fora de [0, 96) vindo de cliente malicioso (o código só confere x/z; o processamento é posterior).

## Arquivos de referência

- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/src/main.ts`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/servidor/src/main.rs`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/servidor/src/terreno.rs`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-dos-blocos.nginx.conf`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-dos-blocos.service`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/infra/vps/ilha-backup.sh`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/desenvolvimento/jogos/ilha-dos-blocos/cliente/public/THIRD_PARTY_NOTICES.txt`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/docs/blocos/RECURSOS.md`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/ferramentas/verificar_jogo.py`
- `/Users/boaz_mac/Workspace/06-ANDAIME-IO/Samuel.Tech/Games/_app/jogos.json`
- Crate: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/voxelize-3.0.0/server/{runtime.rs,server/mod.rs,world/inbound.rs,world/sync.rs}`
