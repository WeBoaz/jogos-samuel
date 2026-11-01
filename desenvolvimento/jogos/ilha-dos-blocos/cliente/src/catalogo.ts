// Espelho do catálogo do servidor (../servidor/src/catalogo.rs) com a arte de cada bloco.
// tests/catalogo.test.ts garante que IDs e nomes batem com o servidor.
export type Desenho =
  | 'grama' | 'terra' | 'pedra' | 'areia' | 'cascalho' | 'argila' | 'tronco' | 'folhas' | 'tabuas' | 'tijolo'
  | 'vidro' | 'talhada' | 'minerio' | 'metal' | 'cristal' | 'neve' | 'gelo' | 'la' | 'lampada' | 'porta'
  | 'bancada' | 'fornalha' | 'bau' | 'agua';

export interface BlocoArte { id: number; nome: string; desenho: Desenho; cor: string; cor2?: string }

export const BLOCOS: BlocoArte[] = [
  { id: 1, nome: 'Grama', desenho: 'grama', cor: '#6fbf4a', cor2: '#8a5a3b' },
  { id: 2, nome: 'Terra', desenho: 'terra', cor: '#8a5a3b' },
  { id: 3, nome: 'Pedra', desenho: 'pedra', cor: '#8d9094' },
  { id: 4, nome: 'Areia', desenho: 'areia', cor: '#e8d48f' },
  { id: 5, nome: 'Cascalho', desenho: 'cascalho', cor: '#8f8580' },
  { id: 6, nome: 'Argila', desenho: 'argila', cor: '#a8afc0' },
  { id: 7, nome: 'Tronco claro', desenho: 'tronco', cor: '#b98a55', cor2: '#e7cf9b' },
  { id: 8, nome: 'Tronco escuro', desenho: 'tronco', cor: '#5b3d26', cor2: '#a17a52' },
  { id: 9, nome: 'Folhas claras', desenho: 'folhas', cor: '#5fae3e' },
  { id: 10, nome: 'Folhas escuras', desenho: 'folhas', cor: '#2f6e34' },
  { id: 11, nome: 'Tábuas claras', desenho: 'tabuas', cor: '#d4a86a' },
  { id: 12, nome: 'Tábuas escuras', desenho: 'tabuas', cor: '#7a5233' },
  { id: 13, nome: 'Tijolo', desenho: 'tijolo', cor: '#b5543a', cor2: '#d9c7b0' },
  { id: 14, nome: 'Vidro', desenho: 'vidro', cor: '#cfeef7' },
  { id: 15, nome: 'Pedra talhada', desenho: 'talhada', cor: '#9a9da3' },
  { id: 16, nome: 'Carvão', desenho: 'minerio', cor: '#8d9094', cor2: '#26282b' },
  { id: 17, nome: 'Minério comum', desenho: 'minerio', cor: '#8d9094', cor2: '#d9a066' },
  { id: 18, nome: 'Minério raro', desenho: 'minerio', cor: '#8d9094', cor2: '#5fd0e0' },
  { id: 19, nome: 'Bloco de metal', desenho: 'metal', cor: '#c9ccd1' },
  { id: 20, nome: 'Bloco de cristal', desenho: 'cristal', cor: '#7fe0ea' },
  { id: 21, nome: 'Neve', desenho: 'neve', cor: '#f4f8fb' },
  { id: 22, nome: 'Gelo', desenho: 'gelo', cor: '#a9d8f2' },
  { id: 23, nome: 'Lã clara', desenho: 'la', cor: '#f1ede3' },
  { id: 24, nome: 'Lã escura', desenho: 'la', cor: '#3d4247' },
  { id: 25, nome: 'Lã vermelha', desenho: 'la', cor: '#d2483c' },
  { id: 26, nome: 'Lã azul', desenho: 'la', cor: '#3f6fd1' },
  { id: 27, nome: 'Lã verde', desenho: 'la', cor: '#5aa83f' },
  { id: 28, nome: 'Lâmpada', desenho: 'lampada', cor: '#ffd36b' },
  { id: 29, nome: 'Porta', desenho: 'porta', cor: '#b07a45' },
  { id: 30, nome: 'Bancada', desenho: 'bancada', cor: '#b98a55' },
  { id: 31, nome: 'Fornalha', desenho: 'fornalha', cor: '#7c7f84' },
  { id: 32, nome: 'Baú', desenho: 'bau', cor: '#a8743f' },
];

export const AGUA: BlocoArte = { id: 40, nome: 'Água', desenho: 'agua', cor: '#3d8fd6' };

export const IDS = new Set(BLOCOS.map((b) => b.id));
export const porId = (id: number) => BLOCOS.find((b) => b.id === id);

/** Barra inicial do Criativo: o necessário para a primeira casa. */
export const BARRA_INICIAL = ['Tábuas claras', 'Tronco claro', 'Pedra talhada', 'Vidro', 'Porta', 'Lâmpada', 'Tijolo', 'Lã vermelha', 'Grama'];
