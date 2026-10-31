# Samuel.tech — estrutura e evolução

## Objetivo

Reunir os jogos que Boaz está criando para o Samuel em um portal familiar com home pública e biblioteca privada. Primeiro entregar o universo visual; depois conectar acesso real e jogos reais sem redesenhar tudo.

## Entrega atual

HTML estático sem dependências. A home, os diálogos e a biblioteca vivem em `site/index.html`. A navegação funciona por hash para abrir também em arquivo local. `#/jogos` exibe uma demonstração após escolher um perfil; não é uma rota protegida.

Acesso por escolha de perfil, metadados de jogos, busca e favoritos locais são demonstrações. A mini demo Caça às estrelas é funcional. Os outros títulos são conceitos de conteúdo.

## Mapa de rotas da versão futura

| Rota | Público | Conteúdo e comportamento |
|---|---|---|
| `/` | Visitantes | Home, universo, prévias e CTA de entrada |
| `/entrar` | Visitantes | Login do responsável ou fluxo privado definido por ele; nunca cadastro público de crianças |
| `/exploradores` | Família autenticada | Escolha do perfil de jogo; perfil não substitui autenticação |
| `/jogos` | Família autenticada | Biblioteca com busca, categorias e favoritos |
| `/jogos/:slug` | Família autenticada | Apresentação, instruções curtas e botão Jogar |
| `/jogar/:slug` | Família autenticada | Player do jogo, voltar, reiniciar e tela cheia quando suportada |
| `/admin` | Responsável | Catálogo e organização |
| `/admin/jogos/novo` | Responsável | Cadastrar nome, imagem, instruções e origem do jogo |
| `/admin/jogos/:id` | Responsável | Editar, testar e publicar/arquivar |
| `/sair` | Família autenticada | Encerrar sessão no servidor |
| Estado 404 | Todos | “Esse mundo ainda não foi descoberto.” + retorno à home |

Os caminhos são um plano de implementação, não endpoints presentes neste ZIP.

## Home

1. Barra de sistema: identidade retrô, sem contadores falsos.
2. Cabeçalho: marca, Os jogos, Nosso universo, Entrar para jogar.
3. Hero: “Aperte o play na imaginação.” + cenário da dupla com Jack Russell e gato amarelo.
4. Faixa de valores do universo: explorar, construir e guardar memórias.
5. Prévias dos mundos: exemplos identificados até haver catálogo real.
6. Nosso universo: história curta do projeto em família e personagens transparentes.
7. Como brincar: entrar, escolher, explorar.
8. Convite final e rodapé.

## Biblioteca e player

Cards com capa, título, categoria, indicação de versão, controles de favorito e abertura do jogo. Em celular, texto legível e botões de pelo menos 44 px. Não depender apenas de hover.

Quando o catálogo estiver vazio: “O papai está preparando os primeiros mundos.” Não inventar jogos prontos. Quando falhar: instrução curta para tentar novamente e retorno à biblioteca. Enquanto carregar: manter área estável e mensagem simples.

No player, manter controles de voltar, reiniciar, áudio e tela cheia (somente quando suportados). Não tocar som automaticamente. Evitar redirecionar para sites externos sem ação do responsável.

## Modelo mínimo de dados

| Entidade | Campos principais |
|---|---|
| Responsável | id interno, identidade de autenticação, permissões |
| Família | id interno, responsável, configurações de acesso |
| Perfil | id, familyId, apelido, avatar; sem data de nascimento, escola ou nome completo |
| Jogo | id, slug, title, category, description, cover, instructions, entry, input, status, visibility, version |
| Favorito | profileId, gameId |
| Progresso (opcional) | profileId, gameId, schemaVersion, saveData, updatedAt |

`docs/games.example.json` é um exemplo de catálogo sem URLs reais. A versão inicial não precisa de progresso em servidor ou administração sofisticada para cumprir o objetivo.

## Adicionar os jogos reais

1. Receber de Boaz os arquivos/exportações e identificar tecnologia, arquivo inicial e dependências.
2. Abrir cada jogo separadamente e conferir teclado, toque, áudio e carregamento.
3. Cadastrar uma entrada de catálogo por jogo com capa e instruções reais.
4. Hospedar HTML, JS, WASM e demais arquivos em estrutura versionada.
5. Integrar ao player ou abrir em uma rota compatível conforme cada engine.
6. Testar que uma nova versão não troca indevidamente o progresso salvo.

Não existe upload automático implementado. Não apontar os cards conceituais a links inventados.

## Acesso e conteúdo privado

O responsável administra o acesso; a criança escolhe um avatar depois da autenticação familiar. A implementação deve validar sessão e autorização no servidor para páginas, APIs e arquivos privados. Esconder HTML com JavaScript, guardar uma flag em localStorage ou usar apenas uma senha embutida no código não protege os jogos.

Se jogos precisarem de isolamento, usar origem própria e uma política de iframe apropriada. Conceder só as permissões exigidas por cada jogo; não combinar `allow-scripts` e `allow-same-origin` para código não confiável servido na mesma origem do portal. Validar origem e formato de qualquer `postMessage` de progresso. Não gravar tokens em arquivos públicos.

## Imagens e identidade

Publicar somente as artes finais. Samuel usa roupa laranja de explorador; Player 2 usa jardineira lilás. Os pets são um Jack Russell branco e marrom e um gato amarelo tigrado. Sem uniforme, escola, sobrenomes, rotina, localização ou fotos originais.

O domínio samuel.tech é referência de destino; não foi alterado nesta entrega. A consulta pública ao domínio não retornou conteúdo legível nesta sessão, portanto não há afirmação sobre a tecnologia existente.

## Ordem de trabalho sugerida ao Claude

1. Ler o kit e abrir o HTML entregue para preservar o desenho aprovado.
2. Inspecionar o projeto/hospedagem reais antes de escolher backend ou bibliotecas.
3. Extrair componentes e catálogo, se o ambiente justificar um framework.
4. Implementar autenticação familiar e proteção dos arquivos.
5. Integrar um jogo real como prova completa do fluxo.
6. Completar catálogo, gerenciamento simples e deploy de teste.
7. Testar desktop, celular, teclado, falhas e acesso sem sessão antes de publicar.
