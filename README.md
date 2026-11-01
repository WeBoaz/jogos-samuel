# samuel.tech — portal de jogos da família

“Aperte o play na imaginação.” Home + biblioteca de jogos com acesso livre (sem senha), no visual do kit
(retrô anos 90 + mundo voxel). Detalhes técnicos e regras: **`CLAUDE.md`**. Kit original: **`kit/`**.

## Rotas
| Rota | Acesso | O que é |
|---|---|---|
| `/` | livre | Home |
| `/jogos/` | livre | Biblioteca com busca, filtro e favoritos (Samuel ou Player 2) |
| `/jogar/?jogo=<slug>` | livre | Player (voltar, recomeçar, tela cheia) |
| `/exploradores/` | livre | Trocar de explorador |
| `/admin/` | responsável (senha) | Cadastrar jogo por .zip, capa, status, testar, excluir |

Jogos: **Reino dos Blocos** (plataforma, 3 fases), **Caça às Estrelas** (voo 3D, 6 constelações), **Turbo dos Blocos** (corrida 3D) e **Dragões & Blocos** (jogáveis); **A turma dos pets** e **Ilha dos blocos** (em breve).

## Adicionar um jogo (sem código)
1. Abra **samuel.tech/admin/** → na primeira vez, ative com o código de configuração e crie a sua senha.
2. **＋ Novo jogo** → nome, frase, dicas, o **.zip** do jogo (com `index.html`) e uma capa.
3. Deixe como **Rascunho**, clique em **Testar**; se estiver bom, mude para **Publicado**.

## Rodar no computador
```bash
SAMUEL_CONFIG=/tmp/samuel-config.php php -S 127.0.0.1:8770 ferramentas/roteador-local.php
```
Abra http://127.0.0.1:8770 — os jogos abrem direto; `/admin/` pede o código de configuração na primeira vez.

## Acesso
Os jogos abrem direto, sem senha. Só a área do responsável (`/admin/`) pede senha, porque ela aceita envio de arquivos.

## Publicar
Ver “Publicação (Hostinger)” no `CLAUDE.md` (resumo: `ferramentas/empacotar.sh` → branch `publicacao` → Hostinger).
