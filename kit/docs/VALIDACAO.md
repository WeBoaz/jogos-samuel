# Validação — 31/10/2026

## Conferido nesta entrega

| Item | Resultado |
|---|---|
| Home em navegador desktop | Inspecionada visualmente; arte, textos e botões carregam |
| Rolagem horizontal no desktop | `scrollWidth` e largura disponível iguais: 1348 px |
| Home em largura de 390 px | Inspeção visual em iframe de 390 × 844 px; layout empilhado e controles visíveis |
| Entrada demonstrativa | Botão abre seletor; perfil Samuel abre biblioteca |
| Biblioteca | Três exemplos exibidos com categorias e estados identificados |
| Favoritos | Adição refletida no botão e mensagem de confirmação |
| Filtro e busca | Busca sem resultado com filtro de favoritos exibe estado vazio |
| Mini demo | Seis estrelas coletadas; mensagem de conclusão exibida |
| Reinício | Contador volta a 0/6 e as seis estrelas voltam a aceitar interação |
| Manual de marca | Aberto e inspecionado visualmente no navegador |
| Imagens | Ambas carregadas; arquivo de personagens tem canal alpha de 0 a 255 |
| JavaScript | Sintaxe validada com `node --check` |
| JSON | Tokens e catálogo de exemplos carregados por parser JSON |
| Arquivos locais | Recursos locais conferidos; versões independentes incorporam imagens e favicon |
| Fotos originais | Fora do pacote; somente as duas artes finais foram incluídas |

O navegador registrou mensagens de erro de uma extensão, sem falha de interface observada no fluxo conferido. Isso não equivale a uma auditoria completa de compatibilidade.

## Limites

Não houve teste em aparelho físico, em todos os navegadores, nem auditoria completa de acessibilidade. O protótipo é estático; não implementa nem testa autenticação real, proteção de arquivos, banco de dados, uploads ou jogos externos.

A inspeção visual móvel foi feita em 390 px. Outras larguras mencionadas no prompt do Claude são critérios para a próxima implementação, não resultados desta entrega. Nenhuma publicação ou alteração de DNS/domínio foi realizada.

## Atualização das capas 3D

As três capas 3D foram aplicadas na home e na biblioteca, que usam o mesmo componente de card. Inspeção visual desktop confirmou carregamento das três imagens a 379 × 198 px aproximadamente, preservando o assunto principal. O HTML independente incorpora também as três capas. Não houve alteração no fluxo de login, favoritos ou mini demo nesta revisão.
