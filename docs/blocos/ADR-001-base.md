# ADR-001 — Base técnica da Ilha dos Blocos

- **Estado:** Aceita com condições · **Data:** 2026-11-01 · **Tarefa:** BLK-020 · **Autor:** Claude (ORQ-01/DEV-01)
- **Prova que sustenta:** [`BLK-010-PROVAS.md`](BLK-010-PROVAS.md) · Decisão do Boaz: "Voxelize primeiro".

## Decisão

A Ilha dos Blocos usa o **Voxelize** (`voxelize/voxelize`, MIT; prova no commit `7ae1c202c4ed33e6f18ea2e947c5c6f9a373b605`;
**dependências do jogo: `@voxelize/core` 3.0.0 no npm + crate `voxelize` =3.0.0 no crates.io**, o par publicado e casado,
reproduzível pelos lockfiles — decidido na BLK-030): cliente `@voxelize/core` (Three.js 0.183) servido estático pelo portal em
`/jogo/ilha-dos-blocos/`, e **servidor Rust autoritativo na VPS** (`srv2114451.hstgr.cloud`), acessado por `wss://`.

Um caminho só (regra da seção 5): não manter noa, zardoy ou Luanti em paralelo para o mesmo jogo.

## Critérios obrigatórios (seção 5) × prova

| Critério | Resultado | Evidência / o que falta |
|---|---|---|
| Recursos distribuíveis | **Aprovado** | código MIT; dependências do cliente 43 MIT, 3 ISC, 2 zlib, 1 domínio público (`noisejs`); assets de exemplo (CC BY-SA, fontes, imagens) **não** entram — ver [`RECURSOS.md`](RECURSOS.md) |
| Navegador | **Inconclusivo (falta ambiente)** | desktop (Chromium) e WebKit 26.6 emulando iPad/iPhone ok; falta sessão em aparelho real com toque nativo |
| Save | **Aprovado** | construir → parada abrupta do servidor → reabrir com as mudanças; reconexão automática |
| Hostinger/player | **Inconclusivo (falta ambiente)** | cliente estático em outra origem ok e porteiro já entrega `.wasm`; o processo Rust fica **fora** da hospedagem compartilhada (VPS, infraestrutura separada e explícita), mas o servidor ainda não está na VPS com `wss://` |
| Gameplay | **Aprovado** | quebrar/colocar, seed, 2 jogadores; caminho de sobrevivência definido abaixo (regras próprias) |
| Sustentação | **Aprovado** | commit fixado, `pnpm-lock.yaml`, `Cargo.lock`, toolchain (Rust ≥ 1.90, wasm-pack, protoc) e comandos em `BLK-010-PROVAS.md` |

**Por que não executar noa:** o Voxelize não reprovou nenhum critério; os dois inconclusivos são falta de ambiente
(aparelho, VPS), não falha do motor. A aceitação é **condicionada**: se uma das condições abaixo reprovar, a ADR volta
a "Em revisão" e a prova mínima de noa (Babylon) entra antes de continuar.

### Condições para confirmar a base (entram no aceite da BLK-030/BLK-040)

1. Servidor da Ilha rodando na VPS atrás de proxy com TLS; cliente publicado no portal conecta por `wss://` dentro
   do iframe do player.
2. Sessão em aparelho real (celular de referência): mover e olhar com dois dedos, pular, quebrar/colocar e usar a barra
   sem gesto preso; ≥ 30 FPS medidos com `?fps` no cenário definido em `TESTES.md`.

## Candidatos descartados

- **zardoy/minecraft-web-client** (`f9ea1d1`): reprovado em "Recursos distribuíveis" — depende de `mc-assets`
  ("assets extraídos do Minecraft"). Trocar todos os recursos custaria mais que construir sobre o Voxelize.
- **noa-engine** (0.33.0, Babylon 6): reserva; não testado (regra).
- **Luanti/VoxeLibre WASM**: laboratório (BLK-200), não base.

## Arquitetura decidida

```
Portal PHP (Hostinger compartilhada)            VPS (srv2114451.hstgr.cloud)
/jogar/?jogo=ilha-dos-blocos  ──iframe──►        Caddy :443 (TLS Let's Encrypt)
/jogo/ilha-dos-blocos/*  (estático, jogo.php)        └─► servidor Rust da Ilha (127.0.0.1, systemd)
  cliente @voxelize/core + nossa UI  ──wss://──►         mundos em disco + backup diário
```

- **Fonte:** `desenvolvimento/jogos/ilha-dos-blocos/cliente/` (TS + Vite, `base: './'`) e
  `desenvolvimento/jogos/ilha-dos-blocos/servidor/` (crate Rust que depende do `voxelize` no commit fixado).
  Build do cliente → `_privado/jogos/ilha-dos-blocos/`. O binário do servidor não vai para o pacote do portal.
- **Endereço do servidor** no cliente: configuração de build (não depende da origem), com `?servidor=` só em `?debug`.
- **Regras próprias em TypeScript puro** (`cliente/src/regras/`): inventário, pilhas, crafting atômico, receitas,
  modos Livre/Aventura/Desafio — testadas com vitest, sem Three.js. O servidor continua autoritativo para os blocos do
  mundo; inventário e progresso por jogador são gravados no servidor por um método próprio (`set_method_handle`), com
  validação de formato e versão. (Família, sem competição: não há antifraude além da validação.)
- **Conteúdo e modpacks** em JSON com o manifesto da seção 7; o servidor carrega os blocos no registro ao iniciar e o
  cliente lê os mesmos arquivos. IDs com namespace (`samuel:tabua-clara`), nunca posição em array.
- **Entrada:** teclado/mouse do Voxelize para desktop; no toque, `controles-toque.js` da casa ligado a
  `MobileRigidControls` (`setMovementVector`, `setJumping`, `setLookDirection`) — API provada na BLK-010.
- **Saves:** mundo e inventário no servidor (persistentes, com backup diário na VPS); exportar/importar mundo por
  método do servidor; no navegador fica só preferência (som, sensibilidade) com chave versionada por perfil.

## Consequências e limites

- **Sem servidor, sem jogo** (inclusive solo). O cliente precisa de tela amigável "a ilha está dormindo" com tentar de
  novo, e o portal continua de pé. Isso é diferente dos outros jogos (100% estáticos).
- **Peso:** a demo tem 3,2 MB de JS (914 KB gzip) e 157–182 MB de heap. Orçamento da Ilha em `TESTES.md`
  (JS ≤ 1,5 MB / ≤ 450 KB gzip; raio de render por qualidade; meta 30 FPS no celular).
- **Proteção infantil:** sem chat livre (só sinais prontos), mundos privados por código opaco, sem lista pública,
  segredo do servidor fora do Git, servidor escutando só em `127.0.0.1` atrás do proxy, logs sem dados pessoais.
- **Sem promessas:** nenhum `.jar`, Forge/Fabric, Roblox ou "100% Minecraft". Fidelidade medida pela
  [`MATRIZ-FIDELIDADE.md`](MATRIZ-FIDELIDADE.md).
- **Atualização do motor:** só trocando o commit fixado com nova prova curta (build + testes + sessão), registrada aqui.
