# Samuel.tech — kit inicial

Home retrô dos anos 90 com um universo voxel inspirado em Minecraft. Projeto visual original para reunir os jogos criados em família.

## Abrir agora

- Abra `site/index.html` no navegador, mantendo `assets/` ao lado. HTML, CSS e JavaScript estão no mesmo arquivo.
- `Samuel-tech-preview.html`, na raiz, é a mesma interface com as imagens incorporadas: pode ser aberto sozinho ou enviado ao Claude.
- Abra `brand/brand-kit.html` para o manual visual. `Samuel-tech-brand-kit.html` é sua versão independente, com imagens incorporadas.
- Para a próxima implementação, envie o ZIP inteiro ao Claude e peça que leia `PROMPT-PARA-CLAUDE.md`.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `site/index.html` | Home, entrada demonstrativa, biblioteca, busca, favoritos e mini demo |
| `site/assets/universo.png` | Arte principal com a dupla e os dois pets |
| `site/assets/turma.png` | Personagens e pets em fundo transparente |
| `site/assets/ilha-dos-blocos.png` | Capa 3D da ilha flutuante |
| `site/assets/caca-as-estrelas.png` | Capa 3D da aventura espacial |
| `site/assets/turma-dos-pets.png` | Capa 3D com Jack Russell e gato amarelo |
| `site/assets/favicon.svg` | Símbolo S de blocos |
| `brand/logo.svg` | Logo horizontal editável em SVG |
| `brand/brand-kit.html` | Manual visual completo |
| `brand/tokens.json` | Cores, tipografia, espaçamento e componentes |
| `docs/ESTRUTURA-E-ROTAS.md` | Estrutura proposta para a versão com login real |
| `docs/games.example.json` | Exemplo de catálogo de jogos para evolução |
| `docs/PROMPTS-DE-IMAGEM.md` | Direção de arte e prompts finais |
| `docs/VALIDACAO.md` | Verificações realizadas e limites |
| `PROMPT-PARA-CLAUDE.md` | Briefing e critérios para continuar o projeto |

## O que funciona

A home é responsiva. O botão de entrada abre uma escolha demonstrativa de perfil e, em seguida, a biblioteca. A busca filtra títulos; favoritos são guardados somente no navegador. Caça às estrelas é uma pequena demonstração de seis cliques/toques, com reinício. Os outros dois títulos são conceitos identificados como exemplos.

## O que vem depois

O protótipo não implementa autenticação, área administrativa, upload, salvamento em servidor nem hospedagem dos jogos reais. A escolha de perfil não protege conteúdo. As rotas atuais são hash (`#/` e `#/jogos`), para funcionar inclusive como arquivo local. O documento de estrutura descreve as rotas definitivas.

O domínio samuel.tech não foi alterado. Este pacote é a base para a próxima implementação, conforme solicitado.

## Personagens e privacidade

As artes finais usam Samuel de jaqueta laranja, Player 2 de jardineira lilás, um Jack Russell branco e castanho e um gato amarelo tigrado. Não há panda. Nenhuma referência à escola ou foto original foi incluída no pacote. As roupas são de fantasia.

## Dependências

Nenhuma dependência externa, instalação, fonte remota, chave de API ou ferramenta de build é necessária para abrir o HTML. As ilustrações foram produzidas com a ferramenta integrada de geração de imagens; os elementos geométricos da interface são SVG/CSS.

## Atualização visual das capas

As três capas dos cards foram recriadas como ilustrações 3D voxel detalhadas, em continuidade com a arte principal. Elas aparecem na home e na biblioteca. Os títulos continuam sendo exemplos de conteúdo; somente a mini demo de estrelas é jogável.
