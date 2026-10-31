/* ==========================================================================
   samuel.tech — Jogadores e "senhas de blocos"
   --------------------------------------------------------------------------
   A senha é uma sequência de 3 blocos (crianças pequenas não precisam saber
   ler nem decorar números). Blocos possíveis:
     grama · terra · pedra · diamante · ouro · madeira · folhas · neon

   ⚠️  IMPORTANTE: isto é uma "porta de brincadeira", NÃO é segurança de
   verdade. O site é estático e qualquer pessoa que abrir este arquivo vê as
   senhas. Serve para dar a sensação de "minha área secreta" para as crianças.
   Se um dia precisar de login real, troque por Supabase/Firebase Auth etc.
   ========================================================================== */
window.SAMUEL_JOGADORES = [
  {
    id: "samuel",
    nome: "Samuel",
    titulo: "O Construtor",
    idade: 7,
    avatar: "assets/img/personagens/avatar-samuel.svg",
    corpo: "assets/img/personagens/samuel.svg",
    cor: "#8FD3F0",
    senha: ["diamante", "grama", "ouro"],
  },
  {
    id: "heloisa",
    nome: "Heloísa",
    titulo: "A Exploradora",
    idade: 4,
    avatar: "assets/img/personagens/avatar-heloisa.svg",
    corpo: "assets/img/personagens/heloisa.svg",
    cor: "#FFB3D9",
    senha: ["neon", "neon", "diamante"],
  },
];

window.SAMUEL_BLOCOS_SENHA = ["grama", "diamante", "ouro", "madeira", "neon", "pedra"];
