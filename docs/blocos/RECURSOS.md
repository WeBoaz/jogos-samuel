# Recursos e licenças — Ilha dos Blocos

Inventário de origem e licença de tudo que a Ilha usa ou poderá usar. Regra: **só entra no pacote o que está aqui
com licença conferida**. Atualizar a cada recurso novo (BLK-030 em diante). Levantado em 2026-11-01 (BLK-020).

## Motor e código de terceiros

| Item | Versão/commit | Licença | Onde roda | Vai para o pacote? |
|---|---|---|---|---|
| Voxelize (servidor, crate `voxelize`) | `7ae1c20` / 3.0.0 | MIT (© 2022 Shaoru Ian Huang) | VPS | não (binário fica na VPS) |
| `@voxelize/core`, `aabb`, `physics-engine`, `raycast`, `protocol`, `wasm-mesher` | 3.0.0 (mesmo commit) | MIT | navegador | sim, no bundle — aviso em `THIRD_PARTY_NOTICES.txt` |
| three.js | 0.183.x (dependência do core) | MIT | navegador | sim — aviso |
| Pacotes que entram no bundle da Ilha 0.1 (lista gerada no build) | `package-lock.json` | 16 MIT, 7 BSD-3-Clause (`protobufjs` e 6 `@protobufjs/*`), 1 Apache-2.0 (`long`), 2 zlib (`postprocessing`, `gl-vec3`) | navegador | sim — texto completo de cada licença em `THIRD_PARTY_NOTICES.txt`, gerado pelo plugin `avisosDeLicenca` do `vite.config.ts` a partir dos módulos do bundle |
| Crates Rust do servidor | ~500 no `Cargo.lock` | a conferir com `cargo-deny`/`cargo-about` na BLK-065 | VPS | não |
| `controles-toque.js`, `ui-blocos.css` | da casa | nosso | navegador | sim |

## Assets do repositório Voxelize — **não usar**

| Item | Motivo |
|---|---|
| Texturas/imagens de exemplo (`examples/client/src/assets/*`, `assets/*`) | origem mista; parte declarada CC BY-SA 4.0 (exige atribuição e compartilhamento igual) e capturas de tela; não precisamos delas |
| Fontes da demo (`PressStart2P`, `PixelGameFont`, `Emulogic`, `AGoblinAppears`, `ConnectionSerif`) | licenças individuais não conferidas; a casa já tem fonte própria do kit |
| Bloco/registro de exemplo (`examples/server/registry.rs`) | serve de referência de API; nosso catálogo é próprio (seção 6) |

## Arte, som e fontes da Ilha (a produzir)

| Tipo | Caminho escolhido | Licença | Estado |
|---|---|---|---|
| Texturas dos 32 blocos | geradas por código em canvas (como no Minigolfe) — paleta do kit; opção B: Kenney Voxel Pack | nossa / CC0 (opção B com `License.txt`) | a fazer (BLK-030) |
| Pets (Jack Russell, gato amarelo), animais e inimigo estilizado | modelos voxel próprios em código | nossa | a fazer (BLK-050/060) |
| Sons (quebrar/colocar por material, passos, UI) | sintetizados com Web Audio (como no Minigolfe) | nossa | a fazer |
| Fonte da interface | a do kit do samuel.tech | conforme `kit/brand/` | reaproveitar |
| Capa 1200×675 | renderizada do próprio jogo | nossa | a fazer (BLK-065) |

## Proibido

Texturas, sons, modelos, nomes ou logotipos do Minecraft/Mojang/Microsoft ou Roblox; pacotes "extraídos" (como
`mc-assets`); resource packs de terceiros sem licença explícita; fotos reais; qualquer dado das crianças.
