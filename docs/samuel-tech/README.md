# Plano Hordas dos Blocos → Dungeons dos Blocos

Documentação operacional do plano de 2026-11-01. Não publicada (fora do `empacotar.sh`).
O `CLAUDE.md` da raiz continua sendo o contrato da aplicação; aqui fica só o que o plano
acrescenta.

## Fontes de verdade

| O quê | Onde |
|---|---|
| Meta, fila, critérios de aceite, revisões | Notion: [Hub](https://app.notion.com/p/40b0a726d0558101a0badc66a61486c7) · [Tarefas](https://app.notion.com/p/44bf0f8a591e4eee8a77a034b1431e02) · [Deploys e revisões](https://app.notion.com/p/69c38e1020a54332bb18ae633dc32714) · [Jogos](https://app.notion.com/p/ccdcbd2107b04442a201cb98e2387fa7) |
| Código e histórico | Git, branch `main` (portal PHP) |
| Estado da última sessão e NEXT | [`STATE.md`](STATE.md) |
| Decisões técnicas | [`DECISOES.md`](DECISOES.md) |
| Fontes e procedência dos jogos novos | [`../../desenvolvimento/README.md`](../../desenvolvimento/README.md) |

Bases de dados do Notion (para conectores): Tarefas
`collection://7087457a-1b53-4791-a0e8-ff817b1b1a4e` · Jogos
`collection://58646438-d780-42d4-a3d2-4a360f30b4a0` · Deploys
`collection://e6ea834f-1a42-4b33-972a-833d71b47ccf`.

## Ordem

1. ST-000 → ST-040: base, bases de código, fonte/build, interface, contrato de release.
2. HO-010 → HO-060: uma arena completa de Hordas, publicação e revisão.
3. DU-010 → DU-060: uma masmorra de oito salas, publicação e revisão.
4. ST-080 (família) → PET-010 (Ateliê em `a-turma-dos-pets`) → backlog.

Uma tarefa de implementação por vez. Correções P0/P1 vêm antes de conteúdo novo.

## Protocolo de sessão

**Ao começar:** ler este arquivo, `STATE.md` e `CLAUDE.md`; `git status` e `git log`;
no Notion, olhar tarefas em Ajustes e Bloqueada, depois a Em execução; só então pegar a
próxima Pronta com dependências concluídas. Escrever na tarefa: objetivo da sessão,
arquivos previstos e teste que prova a entrega.

**Ao terminar (ST-090):** atualizar `STATE.md` e a tarefa no Notion com código da tarefa,
commit, arquivos, comandos e resultados reais, o que não foi testado, release e um NEXT
executável. Se o Notion falhar, anotar a pendência em `STATE.md` (seção Outbox) com o
código da tarefa e não declarar a sincronização.

**Limites:** push, deploy, servidor e domínio só com pedido explícito do Boaz. Sem
credenciais em Git, Notion ou manifesto. Deploy só é "feito" com a URL conferida; o
sinal `SAMUEL_TECH_DEPLOY_READY` no PR vem depois disso (ST-040). Quem executa não
aprova o próprio deploy.

## Regras dos jogos novos

- Originais: gênero de hordas e de masmorra de ação, com nomes, personagens e arte próprios.
- Faixas etárias só no planejamento; nada de dados pessoais na interface.
- Touch (joystick à esquerda, ações à direita, multitoque) e teclado; pausa em
  `visibilitychange`; reiniciar sem duplicar timers e listeners.
- Save local com `schemaVersion` e chave por slug e perfil.
- Antes de commitar a pasta publicável: `python3 ferramentas/verificar_jogo.py <slug>`.
