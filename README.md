# samuel.tech — portal de jogos da família

“Aperte o play na imaginação.” Home pública + biblioteca privada com login da família, no visual do kit
(retrô anos 90 + mundo voxel). Detalhes técnicos e regras: **`CLAUDE.md`**. Kit original: **`kit/`**.

## Rotas
| Rota | Acesso | O que é |
|---|---|---|
| `/` | público | Home |
| `/entrar/` | público | Primeiro acesso (cria a senha) e login da família |
| `/exploradores/` | família | Escolher Samuel ou Player 2 |
| `/jogos/` | família | Biblioteca com busca, filtro e favoritos |
| `/jogar/?jogo=<slug>` | família | Player (voltar, recomeçar, tela cheia) |
| `/conta/` | família | Trocar a senha |
| `/sair/` | — | Sai deste aparelho |

Jogos: **Dragões & Blocos** e **Caça às estrelas** (jogáveis); **A turma dos pets** e **Ilha dos blocos** (em breve).

## Rodar no computador
```bash
SAMUEL_CONFIG=/tmp/samuel-config.php php -S 127.0.0.1:8770 ferramentas/roteador-local.php
```
Abra http://127.0.0.1:8770 — no primeiro acesso, `/entrar/` pede o código de configuração.

## Primeiro acesso no site publicado
Abra https://samuel.tech/entrar/, digite o **código de configuração** (entregue no chat, não está no repositório)
e escolha a senha da família. A senha fica num arquivo fora da pasta pública. Esqueceu? Apague
`samuel-config.php` (pasta `domains/samuel.tech/`, acima de `public_html`) no Gerenciador de Arquivos e refaça.

## Publicar
Ver “Publicação (Hostinger)” no `CLAUDE.md` (resumo: `ferramentas/empacotar.sh` → branch `publicacao` → Hostinger).
