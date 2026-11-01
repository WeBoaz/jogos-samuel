# Prova no motor WebKit — candidata 1.0.1+c0b67d9 (resumo do medidor)

- **Papel:** DEV-01 (apoio). Build idêntico ao commitado em `c0b67d9` (o `release.json` ainda não existia na hora: "versão: ?").
- **Ambiente:** Playwright 1.63.0 + WebKit 26.6, perfil "iPhone 13 landscape" (750×342), portal local. Script: `webkit/teste-webkit-resumo.cjs`.

| Verificação | Resultado |
|---|---|
| Jogando, após o tempo do `?fps=10` | painel **não** abre; faixa: "RESUMO PRONTO: toque em II" |
| Toque em II (pausa) | painel abre, ocupa 36% da tela deitada (`webkit/pausa-deitado.jpg`) |
| Fechar → Continuar | ok, jogo volta |
| Resumo | inclui a nova linha "travadas (≥ 1 s)" |

O fluxo completo em retrato (menu → jogar → tacada → pausa → fim → save → jogar de novo) está em
`../1.0.1+c3c2f99/WEBKIT.md`; o diff para esta candidata só toca o medidor, o CSS dele e o `release_jogo.py`.
