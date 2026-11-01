# Matriz de fidelidade e aceite (seção 12)

"100% fiel" não é critério. Cada linha só vira **Atendido** com evidência, commit e resultado; "planejado" não conta.
Estado em 2026-11-01, depois da BLK-010/020 (base Voxelize `7ae1c20`). Resultado do motor ≠ resultado do jogo: a coluna
"Motor" diz o que a prova mostrou que a base consegue; "Jogo" diz o que já foi entregue ao Samuel.

| Área | Teste observável | Destino | Motor (BLK-010) | Jogo | Evidência / tarefa |
|---|---|---|---|---|---|
| Movimento | Andar, correr/pular, colidir, olhar e pausar sem tecla/gesto preso | Ilha/Parkour/Arena | Atendido no desktop; toque provado só na API | Não testado | `BLK-010-PROVAS.md`; jogo: BLK-030/040 |
| Construção | Colocar e quebrar no alcance; não prender o jogador; feedback correto | Ilha/Arena | Atendido (colocar/quebrar autoritativo, 2 clientes) | Não testado | alcance, "não prender" e feedback: BLK-030/040 |
| Inventário | Selecionar, transferir pilha e cancelar sem duplicar/perder | Ilha | Não se aplica (motor não tem; demo só tem barra) | Não testado | regras próprias em TS: BLK-030/050 |
| Crafting | Entradas consumidas e saída criada uma única vez nas 12 receitas | Ilha | Não se aplica | Não testado | BLK-050 |
| Progressão | Madeira → ferramenta → pedra → abrigo → noite | Ilha | Não se aplica (dia/noite existe no motor) | Não testado | BLK-050 |
| Persistência | Fechar/reabrir, exportar/importar, migrar e recuperar save inválido | Ilha | Atendido em parte: fechar/reabrir e parada abrupta | Não testado | exportar/importar, migração, save inválido: BLK-030 |
| Mods próprios | Pacote válido altera conteúdo; inválido falha sem corromper o mundo | Ilha | Não testado (registro de blocos existe no servidor) | Não testado | BLK-060 |
| Controle móvel | Dois dedos para mover/olhar e ações acessíveis no aparelho identificado | Todos | Inconclusivo (API ok no WebKit; sem aparelho) | Não testado | condição 2 da ADR-001; BLK-040 |
| Câmera terceira pessoa | Pouso previsível, próxima plataforma legível, obstáculos tratados | Parkour | Fora desta base (Parkour usa R3F + Rapier) | Não testado | BLK-100 |
| Rodada | Preparação, jogo, eliminação, vencedor e reinício consistentes | Arena | Fora desta base (Arena usa Colyseus) | Não testado | BLK-110 |
| Online | Dois clientes e servidor concordam; reconexão não duplica jogador | Arena (e Ilha) | Atendido para a Ilha em local (2 clientes, reconexão) | Não testado | Ilha na VPS: condição 1 da ADR-001; Arena: BLK-120 |
| Arte | Materiais, escala, interface e animação coerentes em gameplay real | Todos | Não se aplica (arte será nossa) | Não testado | `RECURSOS.md`; BLK-040 |
| Integração | Biblioteca → player → jogar → reiniciar → voltar | Todos | Atendido em parte: estático em outra origem + `.wasm` pelo porteiro | Não testado | iframe + `wss://` na VPS: condição 1; BLK-065 |
| Desempenho | Medir no cenário pesado definido, incluindo toque/iframe | Todos | Medido só no Mac (demo pesada: 3,2 MB JS, ~180 MB heap) | Não testado | orçamento em `TESTES.md`; BLK-040/QA-010 |

## Fora do escopo (não prometer)

Mods `.jar` (Forge/Fabric), protocolo/servidor oficial do Minecraft no cliente da Ilha, mundos do Minecraft, Roblox,
streaming de instalação oficial, circuitos/fluidos completos do Minecraft. Um servidor Minecraft Java oficial para a
família só pela etapa 7 do plano (EULA aceito pelo Boaz, contas próprias das crianças), separado da Ilha.
