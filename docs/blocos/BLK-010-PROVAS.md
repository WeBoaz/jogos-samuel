# BLK-010 — Provas técnicas da base de blocos

- **Data:** 2026-11-01 (America/Sao_Paulo) · **Executor:** Claude (ORQ-01/DEV-01) · **Repo:** `main` a partir de `1f464ae`
- **Decisão do Boaz que orienta a prova:** Voxelize primeiro; noa só se o Voxelize reprovar um critério obrigatório;
  zardoy só como prova curta para o ADR.
- **Ambiente:** Mac (Apple M4 Max), macOS, Rust 1.99.1 (rustup, usuário local), wasm-pack 0.15.1, protoc 36.2
  (Homebrew), Node 22.22.3, pnpm 10.9.0; navegador do app (Chromium) e WebKit 26.6 (Playwright 1.63.0, sem rede externa).

## Resultado

| Candidato | Resultado | Motivo em uma linha |
|---|---|---|
| **Voxelize** `7ae1c202c4ed33e6f18ea2e947c5c6f9a373b605` (MIT) | **Aprovado como base** (com ressalvas abaixo) | todos os critérios técnicos passaram; toque provado na API, falta toque real em aparelho |
| **zardoy/minecraft-web-client** `f9ea1d105fb62d7353f7fd1bd50f68b17ef48964` (MIT) | **Reprovado para publicação** | depende de `mc-assets` (texturas/modelos extraídos do Minecraft) — recurso não distribuível |
| **noa-engine** | **Não executado** | regra do plano: só se o Voxelize reprovar critério obrigatório |

## Voxelize — o que foi provado

Clone raso no commit fixado em `desenvolvimento/provas/voxelize/` (fora do Git e do pacote). Patch mínimo só na demo
(`prova-voxelize/patch-demo.diff`): `?servidor=<url>` para conectar de outra origem e `window.__vx` com `?debug`.

| Critério | Resultado | Evidência |
|---|---|---|
| Build do servidor (Rust, exemplo `demo`) | ok — 1 min 58 s, binário 16 MB | `cargo build --profile release-dev --example demo` |
| Build do cliente (WASM mesher + `@voxelize/*`) | ok — WASM 400 KB | `pnpm install --frozen-lockfile && pnpm build` |
| Servidor sobe e pré-carrega mundos | ok — 2 mundos em 0,27 s | log do servidor |
| Mundo por seed (determinístico) | ok — mundo `terrain` (seed 999, sem save): 100 amostras de topo/tipo, mesmo hash `1516291191` antes e depois de reiniciar o servidor | console |
| Quebrar e colocar bloco | ok — vidro colocado (id 160) e pedra removida no mundo `flat` | `world.updateVoxel` |
| Servidor autoritativo / 2 clientes | ok — cliente 2 vê as mudanças do 1 e vice-versa | duas abas |
| Persistência no servidor | ok — após **parada abrupta** do servidor, um cliente novo vê os 2 vidros e a pedra quebrada (`data/worlds/flat/chunks/0\|0.json`) | reinício |
| Reconexão | ok — cliente aberto reconectou sozinho (`connected`/`joined` = true) depois do reinício | `network` |
| Build estático em outra origem + WebSocket | ok — `vite build --base ./` servido em `127.0.0.1:8892` conectando a `localhost:4000`; sem erro de console | aba do navegador |
| Tempo até jogar | 1,7 s até o mundo com blocos (local, sem latência de rede) | `performance.now()` |
| Safari (motor WebKit 26.6) | ok — iPad 7 deitado e iPhone 13: WebGL2, mundo carregado, bloco colocado, 0 erros | `prova-voxelize/webkit-mundo.cjs`, capturas |
| Toque | **ok na API** — `MobileRigidControls`: joystick (`setMovementVector`) andou 13,3 blocos em 1,5 s; `setJumping` subiu 1,12; há `setLookDirection` | `prova-voxelize/webkit-toque.cjs` |
| Porteiro do portal entrega `.wasm` | ok — `EXTENSOES_JOGO` já tem `application/wasm` | `_app/inicio.php` |
| Inventário | não é do motor — a demo tem só barra de blocos; inventário/crafting ficam no jogo (BLK-030/050) | leitura do código |

## Ressalvas (entram no ADR e nos requisitos da Ilha)

1. **Toque real não testado**: a demo não tem interface de toque; o motor tem a API. Na BLK-030, ligar
   `desenvolvimento/compartilhado/controles-toque.js` a `MobileRigidControls` e testar em aparelho.
2. **Peso no celular**: a demo pesa 3,2 MB de JS (914 KB gzip) e usou 157–182 MB de heap JS no mundo `terrain`. A
   demo carrega p5, postprocessing e lil-gui que a Ilha não precisa; meta da Ilha: JS ≤ 1,5 MB (≤ 450 KB gzip),
   raio de render pequeno no celular, medido com o mesmo `?fps` do Minigolfe.
3. **Estabilidade no painel do app**: a aba travou 3 vezes em ~12 cargas do mundo `terrain` (página virou `data:`),
   com duas abas 3D abertas ou logo após troca de dependências do Vite. No WebKit headless e com uma aba só, não
   repetiu. Medir de novo no aparelho na BLK-030.
4. **Servidor sempre necessário** (inclusive solo): a Ilha só funciona com o servidor Rust no ar → VPS, TLS (`wss://`),
   backup e plano de "servidor fora do ar" com mensagem amigável.
5. **Segurança/conteúdo infantil**: o exemplo escuta em `0.0.0.0:4000` com segredo fixo `"test"` e tem chat pronto. Na
   Ilha: escutar só atrás do proxy, segredo fora do Git, mundos por código opaco, **chat desligado** (só sinais
   prontos), sem lista pública.
6. **Arte**: os assets de exemplo do Voxelize são CC BY-SA 4.0 — a Ilha usa arte própria/CC0.

## zardoy/minecraft-web-client — auditoria curta

- Código MIT, ativo (push 2026-10-26), `pnpm@10.32.1`.
- Depende de `mc-assets@^0.2.90` — o próprio pacote se descreve como "Minecraft assets (extracted for all versions)",
  24,6 MB e 2767 arquivos. O rótulo MIT do pacote não muda a titularidade das texturas e modelos da Mojang.
- Também usa `minecraft-protocol`, `mineflayer`, `flying-squid`, `minecraft-data` (protocolo e dados do jogo).
- **Conclusão:** reprova o critério "recursos válidos" antes do build; publicar no samuel.tech exigiria trocar todos os
  recursos — trabalho maior que construir sobre o Voxelize. Build e sessão **não executados** por isso.

## Não executado

- Aparelho real (toque nativo, FPS, memória), Safari iOS de verdade (Mac sem Xcode completo), servidor na VPS e
  `wss://` com TLS (depende da etapa de infra), noa-engine (não necessário pela regra).

## Como repetir

```bash
cd desenvolvimento/provas && git init -q voxelize && cd voxelize
git remote add origin https://github.com/voxelize/voxelize.git
git fetch --depth 1 origin 7ae1c202c4ed33e6f18ea2e947c5c6f9a373b605 && git checkout FETCH_HEAD
git apply ../../../docs/blocos/prova-voxelize/patch-demo.diff
pnpm install --frozen-lockfile && pnpm build
cargo build --profile release-dev --example demo
# servidor: ./target/release-dev/examples/demo  · cliente: configs voxelize-servidor/voxelize-cliente do .claude/launch.json
```

**NEXT:** BLK-020 — ADR-001 (Voxelize escolhido; zardoy reprovado; noa como reserva), `RECURSOS.md`, `TESTES.md` e a
matriz de fidelidade.
