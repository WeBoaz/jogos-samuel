// Tipos da cópia de desenvolvimento/compartilhado/controles-toque.js (o módulo da casa é JS puro).
export interface EstadoToque { eixo: { x: number; y: number }; botoes: Set<string>; usandoToque: boolean }
export interface ControlesToque {
  estado: EstadoToque;
  soltarTudo(): void;
  recarga(nome: string, fracao: number): void;
  destruir(): void;
}
export function criarControlesToque(opcoes: {
  raiz: HTMLElement;
  aoApertar?: (nome: string) => void;
  aoSoltar?: (nome: string) => void;
}): ControlesToque;
