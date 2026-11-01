# Prova no motor WebKit (Safari) — Minigolfe dos Pets 1.0.1

- **Papel:** DEV-01 (evidência de apoio; não é parecer independente).
- **Candidata:** `minigolfe-dos-pets@1.0.1+c3c2f99` · commit `9390cb2` · pacote SHA-256 `d42600f58fee7bf66bb31b8555ed5ce75f85f63676151dec6bd257c73adc90af`.
- **Ambiente:** Playwright 1.63.0 com WebKit 26.6 (build 2359 já em cache nesta máquina), perfil "iPhone 13"
  (390×664 @3x, toque habilitado, UA iOS), portal PHP local (Docker) em `127.0.0.1:8770`. Script: `webkit/teste-webkit.cjs`.
- **Por que não iOS Simulator:** este Mac tem só as Command Line Tools; o Simulator exige o Xcode completo.

## Resultado

| Verificação | Resultado |
|---|---|
| Console sem erros (WebKit) | ok — 0 erros, 0 pageerror |
| WebGL disponível | ok |
| Menu visível | 3,6 s (máquina local, sem rede) |
| Sem rolagem em 390×664 e 844×390 | ok (scroll = viewport) |
| Toque em ▶ JOGAR! (tap nativo do Playwright) | ok → estado `jogando` |
| Gesto estilingue | ok com **Pointer Events touch sintéticos** (o WebKit do Playwright não arrasta toque nativo) |
| Pausa (II) e Continuar | ok |
| Fim do circuito → recorde salvo → Jogar de novo | ok (`circuito-assistido` = 18 tacadas) |
| Medidor `?fps=10`: barra, resumo com versão do `release.json`, botões | ok |

FPS medido aqui (≈57 média, p95 19 ms) é **do Mac emulando**, não do celular: não vale para a meta de 30 FPS.

## Não executado

Aparelho real (toque nativo, FPS, som no alto-falante, Safari iOS de verdade) → `ROTEIRO-CELULAR.md` para o Boaz.
