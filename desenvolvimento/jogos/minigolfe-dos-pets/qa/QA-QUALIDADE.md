# QA de qualidade, desempenho e regressão — Minigolfe dos Pets

- Jogo: `minigolfe-dos-pets`, versão `1.0` no `_app/jogos.json`, commit `1235b79` (build em `_privado/jogos/minigolfe-dos-pets/`).
- Data: 2026-11-01. Ambiente: portal local `http://localhost:8770` (Docker `php:8.3-cli`, repositório só leitura).
- Navegador: painel embutido do Claude (Chrome 152, macOS), GPU Apple M4 Max (ANGLE Metal), tela de 120 Hz, DPR 2.
  Emulação de 375×812 e 812×375 pelo próprio painel. **Nenhum celular ou tablet real foi usado.**
- Estado: só local. Nada foi publicado e nenhum arquivo do repositório foi alterado além deste relatório.
- Outras sessões trabalhavam no repositório ao mesmo tempo (`roteador-local.php`, `DECISOES.md`, `public/THIRD_PARTY_NOTICES.txt`,
  `tests/qa-dev-*.test.ts` e `ferramentas/release_jogo.py` apareceram durante o QA). Não mexi em nenhum deles.

## Resumo

O jogo carrega pela rota real, não tem erro de console, roda leve num computador e não quebrou nenhum dos 4 jogos existentes.
O pacote de publicação leva só o que deve.

**Não publicar antes de corrigir dois P1:**

1. **QA-Q1:** a partida trava se alguém tacar durante o aviso "TUDO BEM! 👍", que aparece quando o jogador chega ao limite de tacadas.
   O defeito foi reproduzido de forma determinística.
2. **QA-Q2:** falta a capa `assets/img/minigolfe-dos-pets.webp`. O primeiro card da home e da biblioteca aparece com a imagem quebrada.

Há também dois P2: um vazamento pequeno de buffers WebGL a cada troca de pista e o build commitado sem o arquivo de avisos de terceiros.

## Achados

| ID | Sev. | Achado | Evidência | Correção sugerida |
|---|---|---|---|---|
| QA-Q1 | **P1** | **Trava a partida.** No limite de tacadas, `Partida.parou()` chama `passarVez()` e já põe `fase='mirando'` para o próximo jogador. A tela só reposiciona a bola 1,6 s depois (`esperar(1.6, trocar)`). Nessa janela `pode()` da Mira é verdadeiro e os avisos têm `pointer-events:none`, então um toque ou ENTER dá uma tacada. A tacada sai da bola do jogador anterior e conta na próxima pista ou vez. Quando o timer dispara, `prepararVez(true)` chama `fisica.colocar(tee)`, que para a bola sem emitir `parou`. A partida fica em `fase='rolando'` para sempre e nenhuma tacada é mais aceita. A saída é Pausa → Recomeçar/Menu, que perde a rodada. | Reprodução com `?debug`: 1 jogador, Normal, circuito, 6 tacadas fracas na pista 1. Logo depois: `{estado:'jogando', fase:'mirando', podeMira:true}`. Tacada com a mesma condição da Mira (`estado==='jogando' && !pausado && podeTacar() && !movendo`). Depois de Próxima + 25 s de simulação: `{estado:'jogando', fase:'rolando', podeTacar:false, movendo:false, tacadas:'6,1,,,,'}`. O robô de 4 jogadores travou do mesmo jeito na pista 3 (`fase:'rolando'`, bola parada no tee). | Tratar o limite como o acerto já é tratado. `parou()` passa para uma fase intermediária (ex.: `'trocando'`) e só `continuar()` chama `passarVez()` depois do aviso. Como defesa extra, bloquear `pode()` enquanto houver troca pendente. Teste: tacar durante a janela não muda `tacadas` e a partida segue jogável. |
| QA-Q2 | **P1** | Capa ausente. O card do jogo novo é o 1º da home e da biblioteca e aparece com a imagem quebrada. | `curl /assets/img/minigolfe-dos-pets.webp` → 404. Console da home e de `/jogos/`: `Failed to load resource: 404`. A captura mostra o card branco com o ícone de imagem quebrada. `capa.php?jogo=minigolfe-dos-pets` → 404. | Criar a capa 1200×675 `.webp` em `assets/img/`. O jogo tem `?capa=N` para gerar o quadro. Commitar junto com o build. |
| QA-Q3 | P2 | Vazamento de memória de GPU por troca de pista. `Mundo.refazerDecoracao()` (`render/mundo.ts:80`) descarta só a `geometry` dos `InstancedMesh`. Os atributos `instanceMatrix` e `instanceColor` e os 7 `MeshStandardMaterial` da decoração ficam vivos. Texturas e programas não vazam. | Contagem por instrumentação de `gl.createBuffer/deleteBuffer` (ver Método). 10 ciclos de 7 cargas de pista: buffers vivos de 140 para 707, **+63 por ciclo (9 por carga)**. Dos 80 buffers criados numa carga da pista 1, **9 seguiam vivos** depois de 6 trocas, somando 55 528 B. Os tamanhos batem com as instâncias da decoração: 19200 B = 300×64 (flores, caules), 4992 = 78×64 (copas), 4352 = 68×64 (arbustos), 1664 = 26×64 (troncos), 768 = 12×64 (pedras), 3600/936/816 = cores. Texturas: saldo 0. Programas: estáveis (2–5). | Em `refazerDecoracao`, chamar `o.dispose()` nos `InstancedMesh` e `material.dispose()` antes de `clear()`. Fazer o mesmo em `Pista3D.descartar()` se algum dia ela usar `InstancedMesh`. Medir de novo: buffers estáveis depois de 10 ciclos. Uma partida normal tem 6 cargas (cerca de 330 KB), por isso não é P1. |
| QA-Q4 | P2 | Aviso de licença incompleto no build commitado. O JS final preserva só o cabeçalho `@license Copyright 2010-2024 Three.js Authors / SPDX-License-Identifier: MIT`, sem o texto da permissão MIT. O `THIRD_PARTY_NOTICES.txt` existe em `desenvolvimento/.../public/`, mas não está versionado nem no build de `_privado/`. O Turbo, por comparação, leva `three-LICENSE.txt`. | `ls _privado/jogos/minigolfe-dos-pets` mostra só `index.html` e `assets/`. `/jogo/minigolfe-dos-pets/THIRD_PARTY_NOTICES.txt` → 404. Num rebuild numa cópia temporária com o `public/` atual, o `.txt` entra e o JS e o CSS saem **byte a byte idênticos** aos commitados. | Commitar `public/THIRD_PARTY_NOTICES.txt`, refazer o build e commitar o `.txt` em `_privado/`. Conferir que `/jogo/minigolfe-dos-pets/THIRD_PARTY_NOTICES.txt` responde 200 `text/plain`. |
| QA-Q5 | P3 | O save nunca separa Samuel de Player 2. O jogo lê o cookie `samuel_perfil` por JS, mas o portal grava esse cookie com `httponly => true` (`_app/inicio.php:192`). O jogo sempre usa `convidado`, enquanto o PHP assume Samuel quando não há cookie. | `document.cookie` vazio dentro do jogo, enquanto o player mostrava "JOGANDO COMO SAMUEL". A única chave no `localStorage` é `samuel:minigolfe-dos-pets:convidado:v1`. | A ficha permite `convidado` como alternativa. Se a separação por perfil for desejada, o player passa o perfil ao iframe (ex.: `?perfil=` validado). Não basta tirar o HttpOnly, porque isso afeta o portal. |
| QA-Q6 | P3 | Duas abas abertas apagam os recordes uma da outra. O save regrava o objeto inteiro que está em memória. | Durante o QA, a chave voltou a `melhores:{}` e `prefs` antigas depois que outra aba do mesmo endereço gravou por cima. Na gravação seguinte, a minha aba reescreveu os seus dados. | Reler e mesclar antes de gravar (`melhores` pelo menor total), ou ouvir o evento `storage`. |
| QA-Q7 | P3 | Teclado: toques curtos em ↑/↓ não mudam a força, só segurar muda (as instruções dizem "↑ ↓ mudam a força"). Ao pausar, o foco não vai para o diálogo. | 10 toques em ↑ deixaram `forca:0.35` (o valor inicial). Pausar com `P` deixou `document.activeElement` vazio. | Somar um passo fixo por `keydown` sem repetição. Dar `focus()` em `#bContinuar` ao abrir a pausa. |
| QA-Q8 | P3 | `?debug` funciona no build de produção e expõe `tacar`, `proxima`, `avancar` etc. (dá para trapacear pelo console). Não há rede nem dados pessoais envolvidos. | `window.__minigolfe` existe com `?debug` em `/jogo/minigolfe-dos-pets/`. Sem o parâmetro, não existe. Os outros jogos expõem `__reino`, `__estrelas` e `__turbo` **sempre**. | Aceitável e mais restrito que o padrão atual. Se quiser zerar, condicionar também a `import.meta.env.DEV` ou a uma flag de build de teste. |
| QA-Q9 | P3 | Peso e cache. O JS tem 592 752 B (156,75 KB com gzip, pelo vite). Localmente a saída do `jogo.php` não vem comprimida e os assets com hash vão com `Cache-Control: private, max-age=3600`. | `curl -sI`: sem `Content-Encoding`, com `max-age=3600`. | Conferir na Hostinger se o LiteSpeed comprime a saída do PHP. Para `assets/` com hash, usar `max-age` longo e `immutable`. |
| QA-Q10 | P3 | `ferramentas/verificar_jogo.py --todos` passou, mas não confere se o arquivo `cover` existe. Teria pegado o QA-Q2. | O script valida campos e arquivos de `_privado/`, não `assets/img/<cover>`. | Avisar quando `assets/img/<cover>` não existir para jogo `pronto`. |
| QA-Q11 | P3 | A home mostra os 3 primeiros do catálogo. Com o minigolfe em 1º, Turbo e Dragões saíram da home (continuam na biblioteca). | Cards da home: minigolfe, reino, caça. | Decisão de produto. Só registrando. |
| QA-Q12 | P3 (verificar) | Outra sessão alterou `ferramentas/roteador-local.php` para deixar `.json` passar em `/jogo/`. Em produção, o `.htaccess` tem `FilesMatch \.(…json…)$`. O comportamento real no LiteSpeed para `/jogo/<slug>/x.json` não foi verificado. O minigolfe não usa `.json`. | `git diff ferramentas/roteador-local.php`. | Testar na Hostinger antes de algum jogo depender de `.json` servido pelo porteiro. |

## Números medidos

Método: `http://localhost:8770/jogo/minigolfe-dos-pets/index.html?debug`, aba própria, **em primeiro plano** (em segundo plano o
`requestAnimationFrame` parou: 0 quadros em 3 s, por isso nenhuma medida foi feita assim).

- Para cada pista: `configurar(1,'normal',i)` → `jogar()` → 0,6 s → amostragem por `requestAnimationFrame` durante 2,5 s.
- `calls` e `triângulos`: máximo de `__minigolfe.info()` (`renderer.info.render`, inclui o passe de sombra).
- Memória: `performance.memory.usedJSHeapSize`.
- Objetos de GPU: wrappers em `gl.create*/delete*` instalados depois da carga, porque a API de debug não expõe `renderer.info.memory`. O resultado é um saldo de criação/remoção a partir desse momento.
- Qualidade adaptativa: ficou em 2 (máxima) o tempo todo.

| Cena | Draw calls | Triângulos | FPS* | Pior quadro | Heap JS |
|---|---|---|---|---|---|
| Menu (pista 1 ao fundo) | 74 | 39 272 | 118 | — | 13,6 MB |
| Pista 1 · Reta | 76 | 41 544 | 120,1 | 9,7 ms | 13,4 MB |
| Pista 2 · Curva | 54 | 38 486 | 120,2 | 13,1 ms | 14,4 MB |
| Pista 3 · Rampa | 87 | 45 680 | 120,0 | 15,2 ms | 19,3 MB |
| Pista 4 · Túnel | 91 | 47 196 | 120,1 | 12,8 ms | 9,7 MB |
| Pista 5 · Gira-gira | 80 | 42 864 | 120,3 | 12,9 ms | 16,8 MB |
| Pista 6 · Grande (mais pesada) | 103 | 48 872 | 120,3 | 13,2 ms | 18,8 MB |
| Pista 1 com confete (buraco em 1) | 76 (sem pico) | 41 544 | 120,0 | 15,4 ms | 17,2 MB |

\* O FPS está limitado pela tela de 120 Hz de um Mac M4 Max. **Não vale como medida de celular.** A meta de 30 FPS no aparelho
de referência continua **não medida**. O confete é pré-alocado (`InstancedMesh`) e não aumentou as draw calls.

- **Troca de pista 10×** (10 ciclos de pistas 1→6 + menu + pista 1, 70 cargas): os buffers WebGL vivos cresceram de forma linear,
  +63 por ciclo (de 140 a 707). Texturas: saldo 0. Programas: estáveis. VAOs: estáveis. Ouvintes: `{dom:16, mira:9}` constantes.
  `esperas` voltou a 2 em todos os ciclos. Heap JS oscilou entre 15 e 34 MB, sem tendência clara (o GC atrapalha a leitura).
  A causa está no QA-Q3.
- **Peso** (`du`/`ls`): pasta publicada com 604 KB. `index.html` 5 393 B, `index-C6FMlP0k.js` 592 752 B, `index-O23vxqWN.css` 13 967 B.
  Gzip (relatório do vite): 1,62 KB, 156,75 KB e 3,69 KB.
- **Carregamento local:** `curl` do JS levou 14,5 ms, do HTML 3,5 ms e do CSS 2,8 ms. `DOMContentLoaded` em 76 ms, com cache, na mesma
  máquina. Em rede real não foi medido. Só como conta: 593 KB a 1,6 Mbit/s dão cerca de 3 s sem compressão e 0,8 s com gzip.
- **Testes e build** (numa cópia em diretório temporário, não no repositório):
  - `tests/fisica.test.ts` e `tests/partida.test.ts` (commitados): **19/19 passaram**.
  - Os arquivos `qa-dev-*.test.ts` não versionados de outra sessão têm 5 testes que falham de propósito (QA-F1, F2, F3, M1, S1). Não são deste relatório.
  - `tsc --noEmit` + `vite build` geraram JS e CSS **idênticos** aos commitados: o build corresponde ao código-fonte.

## Rotas e servidor

| Pedido | Resultado |
|---|---|
| `/jogo/minigolfe-dos-pets/index.html` | 200 `text/html; charset=utf-8`, `nosniff`, `X-Frame-Options: SAMEORIGIN`, `noindex`, `no-cache` |
| `/jogo/minigolfe-dos-pets/assets/index-C6FMlP0k.js` | 200 `text/javascript; charset=utf-8`, 592 752 B |
| `/jogo/minigolfe-dos-pets/assets/index-O23vxqWN.css` | 200 `text/css; charset=utf-8`, 13 967 B |
| `/jogo/minigolfe-dos-pets/` (sem arquivo), `…/nao-existe.js` | 404 (página do porteiro) |
| `/jogo/minigolfe-dos-pets/../reino-dos-blocos/index.html` (`--path-as-is`) | 403 |
| `/jogo/minigolfe-dos-pets/%2e%2e/%2e%2e/_app/jogos.json` | 404 |
| `/jogo/minigolfe-dos-pets/.gitignore` | 403 |
| `/_privado/jogos/minigolfe-dos-pets/index.html` | **403** |
| `/_app/jogos.json` | **403** |
| `/desenvolvimento/…`, `/kit/`, `/ferramentas/empacotar.sh`, `/docs/…` | 403 |
| `/admin/` | 200, pede "Código de configuração" + senha (formulário `configurar`) |
| `/assets/img/minigolfe-dos-pets.webp` | **404 (QA-Q2)** |

Rede no navegador: todos os pedidos do jogo deram 200. O único 404 de toda a sessão foi a capa. O console do jogo ficou sem erros
nem avisos durante todo o QA (menu, 3 circuitos, troca de pista 70×, confete, pausa, 375×812, 812×375).

## Biblioteca e player

- O card aparece na home (1º de 3) e na biblioteca (1º de 5), com título, categoria e selo "Novo!". **A imagem está quebrada (QA-Q2).**
- Fluxo real com mouse:
  1. Biblioteca → "Jogar".
  2. Player `/jogar/?jogo=minigolfe-dos-pets` (iframe 466×856, sem rolagem horizontal).
  3. JOGAR! → arrastar da bola para trás e soltar: tacada real, "BURACO EM UMA!" com confete.
  4. Botão "↻ Recomeçar" do player: o iframe recarrega e volta ao menu do jogo.
  5. "← Biblioteca": volta a `/jogos/`. Tudo funcionou.
- No iframe, o console só mostra o aviso do próprio player: `Allow attribute will take precedence over 'allowfullscreen'`. Ele vem do portal e aparece em todos os jogos.

## Checklist global (seção 9)

| Aceite | Estado | Evidência |
|---|---|---|
| Entrar pela biblioteca, abrir o player, jogar, concluir ou perder, reiniciar e voltar | **Cumprido com ressalva** | O fluxo acima foi feito com mouse real. A conclusão do circuito (1 jogador, 6 pistas, tela "fim", recorde gravado) foi feita pela API `?debug`. **QA-Q1 pode impedir a conclusão em jogo real.** |
| Recursos pela rota real `/jogo/<slug>/` sem 404 ou MIME inválido | **Cumprido** (jogo) / **Falhou** (portal: capa, QA-Q2) | Tabela de rotas e rede do navegador |
| `_privado` bloqueado | **Cumprido** | 403, travessia de diretório 403/404 |
| pt-BR, instruções curtas, foco visível, alvos ≥ 44 px | **Cumprido** | 0 botões/links menores que 44 px em 375×812. `:focus-visible` com 3px `#9956e0`. Textos em pt-BR. Ressalva de foco na pausa: QA-Q7. |
| Sem rolagem horizontal; iframe, orientação e tela cheia | **Parcial** | Sem rolagem em 375×812, 812×375, 521 px (painel) e no iframe 466×856. O menu deitado rola na vertical (`overflow:auto`, 385/375 px) e o JOGAR fica visível. **Tela cheia, 360, 390, 768 e 1366 não testados.** |
| Pausa e retomada não avançam timers nem prendem entrada | **Cumprido** | Pausado com a bola rolando: posição e `fisica.tempo` idênticos depois de 1,5 s reais. Retomada continua de onde parou. `visibilitychange` (simulado) pausa. A Mira cancela ao abrir tela. |
| Reiniciar repetidamente não duplica eventos/entidades/áudio/timers | **Parcial** | Ouvintes `{dom:16, mira:9}` constantes depois de cerca de 80 recomeços e 3 circuitos. `esperas` não acumula. **Buffers de GPU crescem a cada troca de pista (QA-Q3).** Áudio não instrumentado. |
| Persistência ao reabrir; armazenamento indisponível não impede jogar | **Parcial** | Gravação confirmada na chave `samuel:minigolfe-dos-pets:convidado:v1` (`schemaVersion:1`, recordes, prefs). Reabrir isolado não foi validado porque outra aba gravou por cima (QA-Q6). Armazenamento indisponível: só pelo teste unitário de outra sessão (`qa-dev-save`, passa), não no navegador. |
| Sem erro crítico no console; dependências locais; avisos de licença | **Falhou** (licença) | Console limpo e só arquivos locais. Falta `THIRD_PARTY_NOTICES.txt` no build (QA-Q4). |
| Medir desempenho no cenário mais pesado e no aparelho identificado | **Não cumprido** | Pista 6 medida (103 calls, 48 872 tris), mas só num Mac M4 Max. Nenhum celular real. |
| Regressão dos quatro slugs existentes | **Cumprido** | Tabela abaixo |
| Não expor debug, dados pessoais, segredos ou dependências de desenvolvimento | **Cumprido com ressalva** | Pacote sem `desenvolvimento/`, `.map`, `.ts`, `package*.json`. Sem segredos (varredura de padrões). Debug só com `?debug` (QA-Q8). |

Critérios específicos da EXP-01 que este QA tocou:

- Uma tacada com a bola em movimento é ignorada (0 tacadas duplas em 3 circuitos).
- O placar fecha com 6 pistas para 1 jogador.
- Com 4 jogadores, a alternância travou por causa do QA-Q1.
- Dois circuitos seguidos não duplicaram ouvintes.

## Regressão dos 4 jogos (player local)

| Jogo | Abre | Inicia | Estado depois de iniciar | Erros |
|---|---|---|---|---|
| reino-dos-blocos | 200, iframe carregado | `#btnJogar` | `__reino.estado.fase: 'menu'→'jogando'`, jogador em (51,178) | nenhum erro de script. Bloqueio de `navigator.vibrate` vem do clique sintético, sem toque real do usuário. |
| caca-as-estrelas | 200 + 11 módulos em `lib/` com 200 | `#btnJogar` | `__estrelas.estado.fase: 'menu'→'jogando'`, 8 estrelas e combo ×5 em 3 s | nenhum |
| turbo-dos-blocos | 200 + `three.module.min.js` 200 | `#btnCorrer` | `__turbo.estado.fase: 'menu'→'contagem'` (largada) | nenhum |
| dragoes-e-blocos | 200 | `#btnStart` | botão Start some e Pausa aparece. Muralha e HUD "Nível 1" na tela. | nenhum |

Nenhum 404 nos quatro. Capturas conferidas no painel.

## Conteúdo do pacote

Montei uma cópia temporária fora do repositório com o mesmo comando do `ferramentas/empacotar.sh`:
`git archive --format=zip HEAD .htaccess index.php 404.php jogo.php capa.php robots.txt _app _privado assets entrar exploradores jogos jogar conta sair admin`.

- 83 entradas, 3,6 MB descompactado, zip de 1,8 MB.
- **Entram:** `_app/jogos.json` (com o minigolfe), `_privado/jogos/minigolfe-dos-pets/index.html`, `assets/index-C6FMlP0k.js`, `assets/index-O23vxqWN.css`,
  além dos 4 jogos existentes, `.htaccess`, `_app/.htaccess` e `_privado/.htaccess`.
- **Não entram:** `desenvolvimento/`, `docs/`, `ferramentas/`, `kit/`, `node_modules`, `.claude`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `.git`,
  `.map`, `.ts`, testes, `package*.json`.
- **Faltam:** `assets/img/minigolfe-dos-pets.webp` (QA-Q2) e `_privado/jogos/minigolfe-dos-pets/THIRD_PARTY_NOTICES.txt` (QA-Q4).
- O pacote sai do **HEAD**. Os arquivos não commitados de outras sessões não entram até serem commitados.
- `python3 ferramentas/verificar_jogo.py --todos`: ✓ nos 5 jogos (minigolfe com 3 arquivos, 0,6 MB) e saída 0.

## Privacidade e segurança do build

- URLs externas no JS, CSS e HTML: nenhuma. O único `http://` é a string de namespace `http://www.w3.org/1999/xhtml` do three.
- O único `fetch` é o polyfill de `modulepreload` do vite, que só busca o próprio módulo local.
- Sem `XMLHttpRequest`, `sendBeacon`, `WebSocket`, analytics, `eval`, `new Function`, geolocalização, câmera ou microfone.
- Cookies: só leitura de `samuel_perfil`, que na prática nunca é visível (QA-Q5). Nada é gravado.
- `localStorage`: só a chave do jogo, com recordes e preferências e sem dados pessoais. Os nomes dos jogadores são genéricos ("Jogador 1…4").
- Áudio: `AudioContext` criado só depois do clique em JOGAR, com volume mestre de 0,22.
- Licença: o three.js 0.170.0 tem só o cabeçalho SPDX no bundle e falta o texto MIT completo (QA-Q4). O resto do conteúdo é declarado original, gerado em código.

## O que não foi verificado

- Desempenho e toque em **celular ou tablet real**, incluindo a meta de 30 FPS e a qualidade adaptativa caindo de nível num aparelho fraco.
- Botão **Tela cheia** do player, larguras 360/390/768/1366 e iPad antigo.
- Som: tocou sem erro, mas volume e picos não foram medidos com o ouvido.
- Armazenamento indisponível no navegador (só o teste unitário de outra sessão) e persistência ao reabrir de forma isolada (QA-Q6).
- Física em profundidade (paredes, gira-gira, portão da pista 6): coberta pelos testes `qa-dev-fisica` de outra sessão, não por este QA.
- Comportamento em produção (Hostinger/LiteSpeed): compressão, cache e `.json` em `/jogo/` (QA-Q9, QA-Q12).
- Ainda não testado com o Samuel.
- `localStorage` de teste **não foi limpo**: a chave `samuel:minigolfe-dos-pets:convidado:v1` é compartilhada com abas de outras sessões
  ativas no mesmo endereço. Limpar quando todas terminarem.
