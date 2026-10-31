/* ==========================================================================
   samuel.tech — Catálogo de jogos
   --------------------------------------------------------------------------
   Para publicar um jogo novo:
     1. crie a pasta  /nome-do-jogo/index.html   (um HTML único, sem build)
     2. adicione um item aqui embaixo
   Campos:
     id         — igual ao nome da pasta
     titulo     — nome que aparece no cartão
     descricao  — 1 frase curta, falando com a criança ("Você…")
     url        — caminho relativo à raiz do site (ex.: "meu-jogo/")
     icone      — um SVG de assets/img/icones/ (ou blocos/)
     cor        — cor de fundo da capa (use cores da paleta)
     status     — "pronto" | "em-breve"
     novo       — true mostra a etiqueta piscando "NOVO!"
     jogadores  — quem vê o jogo (ids de config.js). Omitir = todos.
   ========================================================================== */
window.SAMUEL_JOGOS = [
  {
    id: "dragoes-e-blocos",
    titulo: "Dragões & Blocos",
    descricao: "Cuspa fogo e derrube a muralha de blocos antes que ela chegue no seu dragão!",
    url: "dragoes-e-blocos/",
    icone: "assets/img/icones/dragao.svg",
    cor: "#5DBB3F",
    status: "pronto",
    novo: true,
  },
  {
    id: "em-breve-1",
    titulo: "Em breve…",
    descricao: "O próximo jogo está sendo construído bloco por bloco.",
    icone: "assets/img/icones/cadeado.svg",
    cor: "#8A4FFF",
    status: "em-breve",
  },
  {
    id: "em-breve-2",
    titulo: "Segredo!",
    descricao: "Dica: tem diamante no meio. Psiu!",
    icone: "assets/img/blocos/diamante.svg",
    cor: "#1FA7B5",
    status: "em-breve",
  },
];
