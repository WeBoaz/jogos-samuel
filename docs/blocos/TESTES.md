# Testes — Ilha dos Blocos

Como a Ilha é testada em cada incremento e na liberação (protocolo v1.1, seção 14). Definido na BLK-020; os números
são o orçamento contra o qual QA-PERF e QA-NET medem.

## Automáticos (rodam em todo commit do jogo)

| Camada | Ferramenta | O que cobre |
|---|---|---|
| Regras (TS puro) | vitest em `cliente/tests/` | inventário (pilhas, mover, dividir, cancelar sem duplicar/perder), crafting atômico das 12 receitas, modos Livre/Aventura/Desafio, validação de modpack (esquema, dependências, IDs duplicados, referências), schema e migração de save |
| Servidor | `cargo test` em `servidor/` | carregamento do catálogo/modpacks no registro, geração por seed (mesma seed → mesmos chunks), método de inventário (formato/versão inválidos recusados), código de mundo opaco |
| Tipos | `tsc --noEmit`, `cargo check` | — |
| Portal | `python3 ferramentas/verificar_jogo.py ilha-dos-blocos` | sem CDN, sem caminho absoluto, só extensões entregues pelo `jogo.php` |
| Motor (referência) | `pnpm test` / `pnpm test:rust` do Voxelize no commit fixado | só ao trocar o commit |

## Sessões no navegador (robô + manual)

Mesmo padrão do Minigolfe: `?debug` expõe `window.__ilha` (estado, inventário, `colocar/quebrar`, `avancar`);
robô em Playwright/painel do app. Cenários (seção 6 e 14.6):

1. **Criativo:** casa com chão, porta, janela, luz e telhado → sair → reabrir → igual.
2. **Sobrevivência:** madeira → bancada → ferramenta → pedra → abrigo → noite → salvar/reabrir.
3. **Robustez:** abrir inventário andando; perder foco; trocar de aba; servidor reinicia no meio (reconecta sem duplicar
   jogador nem perder bloco); armazenamento do navegador indisponível.
4. **Dois jogadores (QA-NET):** dois clientes no mesmo mundo concordam com blocos e inventários; reconexão não duplica
   jogador; código de mundo errado não entra; limites (taxa de ações, tamanho de mensagem) recusam sem derrubar o servidor.
5. **Integração:** biblioteca → player → jogar → recomeçar → voltar; `release.json` com hashes; servidor fora do ar
   mostra "a ilha está dormindo" e o portal segue funcionando.

## Orçamento de desempenho (QA-PERF)

| Métrica | Meta | Como medir |
|---|---|---|
| FPS no celular de referência | média ≥ 30 e p95 ≤ 40 ms por 5 min | `?fps` (mesmo medidor do Minigolfe), cenário: mundo Criativo com a casa pronta, andando e construindo |
| JS do cliente | ≤ 1,5 MB (≤ 450 KB gzip) | build de produção (a demo do Voxelize tinha 3,2 MB / 914 KB) |
| Tempo até jogar | ≤ 5 s em Wi-Fi doméstico no celular | do toque em Jogar até mover o personagem |
| Memória (heap JS) | ≤ 150 MB no celular | `performance.memory` onde houver; anotar quando não houver |
| Servidor (VPS, 2 vCPU/8 GB) | 4 jogadores no mesmo mundo com CPU < 50% e RAM < 1 GB | `top`/systemd na VPS durante o cenário 4 |
| Rede | reconexão ≤ 10 s após o servidor voltar | cenário 3 |

## Aparelho real

Roteiro para o Boaz no padrão do Minigolfe (`ROTEIRO-CELULAR.md` por candidata). Sem ele, "toque real" e "30 FPS no
celular" ficam **Não executado** no parecer — nunca substituídos por emulação.

## Relatórios

`docs/qa/ilha-dos-blocos/<candidate_id>/` com REV-01, QA-FUNC, QA-UX, QA-PERF, QA-NET, G3 e resolução, como no
Minigolfe 1.0.1.
