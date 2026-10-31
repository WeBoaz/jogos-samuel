# Prompt para continuar Samuel.tech no Claude / Claude Code

Você está recebendo o kit visual e o protótipo HTML do Samuel.tech, um portal familiar para hospedar e organizar os jogos que estou criando para meu filho Samuel. Quero continuar este projeto respeitando a interface entregue.

## Leia primeiro

1. `README.md`.
2. `site/index.html` e as imagens em `site/assets/`.
3. `brand/brand-kit.html` e `brand/tokens.json`.
4. `docs/ESTRUTURA-E-ROTAS.md` e `docs/games.example.json`.
5. `docs/VALIDACAO.md`.

Abra a home e preserve sua composição, textos principais, cores, marca e ilustrações. Não substitua o trabalho por um template genérico.

## Direção aprovada

- Nostalgia de computador dos anos 90 + mundos voxel inspirados em Minecraft.
- Papel retrô claro, tinta verde-escura, botões verde-lima, laranja e lilás como acentos.
- Bordas de 2 px, sombras sólidas deslocadas, janelas com barras `.exe`, blocos e tipografia monospace.
- A home é acolhedora, divertida e simples para uma criança navegar.
- Título: “Aperte o play na imaginação.”
- Conceito afetivo: jogos feitos pelo papai e explorados em família.
- Samuel: jaqueta laranja de explorador, camiseta amarela, calça azul-petróleo.
- Player 2: jardineira lilás e blusa pêssego, laço lilás, óculos de coração como acessório.
- Mascotes: Jack Russell branco/marrom com faixa branca no focinho + gato amarelo tigrado.
- NÃO USAR uniforme escolar, nome ou símbolo da escola, fotos originais, sobrenomes, localização ou rotina das crianças. NÃO voltar ao panda.

## O que já existe de verdade

A entrega é um protótipo estático: home, seleção demonstrativa de perfil, biblioteca, busca e favoritos locais. “Caça às estrelas” é uma pequena demonstração jogável. “Ilha dos blocos” e “A turma dos pets” são conceitos, não jogos que eu já forneci. O seletor de perfil não é autenticação.

## Próxima implementação

Meu destino pretendido é `samuel.tech`. Inspecione o repositório e a hospedagem disponíveis antes de propor a stack. Se eu fornecer um projeto existente, trabalhe nele e preserve sua configuração útil. Caso eu ainda não tenha fornecido código de backend ou jogos reais, conclua as partes independentes e peça apenas os arquivos ou acessos que realmente faltarem; não invente integrações.

Implemente nesta ordem:

1. Preserve a home responsiva e converta em componentes somente se isso ajudar o projeto existente.
2. Separe o catálogo de jogos do código de apresentação.
3. Implemente login familiar real, sob administração do responsável, seguido de escolha de perfil. Sem cadastro público de crianças. Não pedir nome completo, data de nascimento, escola, telefone ou e-mail da criança.
4. Proteja biblioteca, APIs e arquivos privados com validação no servidor. Não trate localStorage ou uma senha em JavaScript como barreira de acesso.
5. Implemente rotas reais conforme `docs/ESTRUTURA-E-ROTAS.md`.
6. Integre inicialmente UM dos jogos reais que eu enviar. Valide todo o fluxo: home → login → perfil → biblioteca → jogo → voltar.
7. Depois conecte os demais jogos, favoritos por perfil e gerenciamento mínimo de catálogo.
8. Preserve a ilustração principal e os personagens transparentes; otimize formatos para web se necessário, mantendo os PNG originais do kit.
9. Publique uma versão de teste quando o fluxo funcionar no ambiente disponível. Não alterar domínio ou DNS sem haver configuração concreta e instrução para isso.

## Comportamento esperado

- Biblioteca com busca, favoritos, capas e mensagens de catálogo vazio ou erro.
- Player com retorno claro e instruções de controle por jogo.
- Compatibilidade com mouse, teclado e toque conforme o jogo.
- Tela cheia e áudio somente quando suportados e acionados pelo usuário.
- Sem anúncios, chat público, perfis públicos, ranking com dados pessoais ou links de terceiros não solicitados.
- Sem números de visitantes, conquistas ou “online agora” inventados.
- Os jogos ilustrativos só deixam de ser exemplos quando houver implementação real correspondente.

## Critérios de conclusão

- Home visualmente fiel ao kit, sem rolagem horizontal em 360, 390, 768 e 1366 px.
- Diálogos acessíveis, labels, foco visível e uso por teclado.
- Nenhum arquivo ou metadado publicado identifica escola ou rotina das crianças.
- Nenhuma foto de referência incluída no build público.
- Rotas, APIs e arquivos privados recusam requisições sem sessão válida.
- Um jogo real carrega, responde a controles, reinicia e retorna à biblioteca.
- Estados vazio, carregando, erro e 404 têm mensagens claras.
- Verificação visual desktop/celular e validação de permissões no servidor.
- README atualizado com execução, configuração e implantação, sem segredos.

Execute o que estiver dentro do escopo e dos acessos disponíveis. Ao final, diga o que funciona, o que foi verificado e o que ainda depende dos meus jogos ou da hospedagem.
