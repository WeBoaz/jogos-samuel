# Estado — Ilha dos Blocos

- Slug: `ilha-dos-blocos` — **prévia 0.1 no catálogo como `pronto`** (pedido do Boaz em 2026-11-01; DEC-013)
- Data e fuso: 2026-11-01, America/Sao_Paulo (-03:00)
- Base: Voxelize — **@voxelize/core 3.0.0 (npm) + crate `voxelize` =3.0.0 (crates.io)**, par publicado e casado.
  A prova da BLK-010 usou o commit `7ae1c20` (mais novo); a versão publicada também tem `MobileRigidControls`.
  Ver `docs/blocos/ADR-001-base.md`.
- Etapa atual: **BLK-030 em execução — incremento 1 (primeiro trecho jogável) feito, local**
- Fonte: `desenvolvimento/jogos/ilha-dos-blocos/{servidor,cliente}` · build em `_privado/jogos/ilha-dos-blocos/`
- Servidor: VPS `srv2114451.hstgr.cloud`, serviço `ilha-dos-blocos` atrás do nginx em `https://srv2114451.hstgr.cloud:8443`
  (infra em `desenvolvimento/infra/vps/`); entrada com o **código da ilha** (cópia do Boaz em `~/samuel-tech-ilha-codigo.txt`,
  no servidor em `/opt/ilha/ilha.env`)

## O que funciona (local)

Servidor Rust (`servidor/`): catálogo próprio de 32 blocos + água com IDs fixos; ilha por seed (2026) de 160×160
blocos com morros, praia, água em volta, árvores e veios de carvão/minério; save em disco; escuta só em
`127.0.0.1` (exige `ILHA_SEGREDO` para escutar fora); sem chat.

Cliente (`cliente/`): telas no padrão da casa (começo, conectando, "a ilha está dormindo" com tentar de novo,
pausa, catálogo); céu com as cores do kit; texturas 16×16 desenhadas em código para os 32 blocos; barra de 9 vagas
(1–9, rodinha, clique) com ícones 3/4; catálogo do Criativo com os 32 blocos; quebrar (clique) e colocar (botão
direito) com alcance de 5 e recusa de bloco dentro do jogador; voo (F).

## Evidência deste incremento

| Verificação | Resultado |
|---|---|
| `cargo test --release` (servidor) | 5/5 — catálogo (32 IDs/nomes únicos, registro), seed determinística, centro seco/borda com água, árvores e nascimento livre |
| `vitest` (cliente) | 12/12 — inventário (9: pilhas, retirar tudo-ou-nada, mover/dividir sem duplicar, Criativo infinito, validação) e catálogo igual ao do servidor (3) |
| `tsc --noEmit` | ok |
| Sessão no navegador (painel do app, `?debug`) | entrar → ilha renderizada; quebrar tronco claro (4,31,−6); colocar tábuas, vidro e lâmpada trocando vaga; capturas em `capturas/` |
| Persistência | servidor parado → tela "a ilha está dormindo" → servidor de volta → **Tentar de novo** (clique real) → cliente novo vê o tronco quebrado e os 3 blocos |

Observações do teste: o painel do app não permite *pointer lock* (no navegador normal funciona); nos testes o
`isLocked` foi forçado e a câmera virada com `controls.setDirection`. `avancar(n)` no `?debug` roda quadros na mão.
Gotcha registrado: no dev, o Vite precisa de `optimizeDeps.exclude: ['@voxelize/core']` (os workers do core usam
`new URL('assets/…', import.meta.url)`) e de pré-empacotar as dependências CommonJS dele.

## Falta para fechar a BLK-030 (aceite: casa com porta/janela/telhado, salvar/reabrir, exportar/importar)

1. Porta que abre e fecha (hoje é painel fino passável) e girar bloco/porta para o lado certo.
2. Exportar/importar o mundo (método no servidor + botão no menu) e backup antes de importar.
3. Mundos por código opaco (hoje há um mundo só, `ilha`) e escolha de mundo no começo.
4. Build de produção dentro do orçamento (`TESTES.md`: ≤ 450 KB gzip) e entrada no portal pelo porteiro.
5. Robô de sessão (Playwright) que constrói a casa de referência e confere depois de reabrir.

Toque e câmera ficam na BLK-040; servidor na VPS depende da etapa de infra (condição 1 da ADR).

## Como rodar local

```bash
cd desenvolvimento/jogos/ilha-dos-blocos/servidor && cargo run --release   # 127.0.0.1:4100
cd desenvolvimento/jogos/ilha-dos-blocos/cliente && npm install && npm run dev   # http://localhost:5190
```
Ou pelas configurações `ilha-servidor` e `ilha-cliente` do `.claude/launch.json`.
