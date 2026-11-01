// Texturas 16×16 desenhadas em código (arte própria, sem arquivos de terceiros). Mesmo bloco → mesma textura
// (ruído com semente fixa por bloco e face), para o mundo não "piscar" entre recargas.
import type { BlocoArte } from './catalogo';

export const LADO = 16;
export type Face = 'topo' | 'lado' | 'baixo';

function rng(semente: number) {
  let s = semente >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

function mistura(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x * f)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Desenha um bloco (ou uma face dele) num canvas 16×16. */
export function desenhar(b: BlocoArte, face: Face = 'lado'): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = LADO;
  const g = cv.getContext('2d')!;
  const r = rng(b.id * 97 + (face === 'topo' ? 1 : face === 'baixo' ? 2 : 3));
  const px = (x: number, y: number, cor: string) => { g.fillStyle = cor; g.fillRect(x, y, 1, 1); };
  const granulado = (cor: string, var_ = 0.12) => {
    for (let y = 0; y < LADO; y++) for (let x = 0; x < LADO; x++) px(x, y, mistura(cor, 1 - var_ + r() * var_ * 2));
  };
  const C = b.cor, C2 = b.cor2 ?? b.cor;

  switch (b.desenho) {
    case 'grama':
      if (face === 'topo') granulado(C, 0.16);
      else if (face === 'baixo') granulado(C2, 0.14);
      else { granulado(C2, 0.14); for (let x = 0; x < LADO; x++) { const h = 3 + Math.floor(r() * 3); for (let y = 0; y < h; y++) px(x, y, mistura(C, 0.9 + r() * 0.2)); } }
      break;
    case 'tronco':
      if (face === 'lado') { granulado(C, 0.1); for (let x = 1; x < LADO; x += 3) for (let y = 0; y < LADO; y++) if (r() < 0.7) px(x, y, mistura(C, 0.72)); }
      else { granulado(C2, 0.06); g.strokeStyle = mistura(C, 0.9); for (const rr of [6.5, 3.5]) { g.beginPath(); g.arc(8, 8, rr, 0, Math.PI * 2); g.stroke(); } g.strokeStyle = mistura(C, 0.8); g.strokeRect(0.5, 0.5, 15, 15); }
      break;
    case 'folhas':
      granulado(C, 0.25);
      for (let i = 0; i < 26; i++) px(Math.floor(r() * LADO), Math.floor(r() * LADO), mistura(C, 0.6));
      for (let i = 0; i < 14; i++) px(Math.floor(r() * LADO), Math.floor(r() * LADO), mistura(C, 1.35));
      break;
    case 'tabuas':
      granulado(C, 0.08);
      for (let y = 3; y < LADO; y += 4) { g.fillStyle = mistura(C, 0.68); g.fillRect(0, y, LADO, 1); }
      for (let y = 0; y < LADO; y += 4) { const x = (y * 5) % 16; g.fillStyle = mistura(C, 0.72); g.fillRect(x, y, 1, 3); }
      break;
    case 'tijolo':
      g.fillStyle = C2; g.fillRect(0, 0, LADO, LADO);
      for (let fila = 0; fila < 4; fila++) for (let col = -1; col < 3; col++) {
        const x = col * 8 + (fila % 2 ? 4 : 0), y = fila * 4;
        g.fillStyle = mistura(C, 0.88 + r() * 0.24); g.fillRect(x + 1, y + 1, 7, 3);
      }
      break;
    case 'vidro':
      g.clearRect(0, 0, LADO, LADO);
      g.fillStyle = 'rgba(207,238,247,0.18)'; g.fillRect(1, 1, 14, 14);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(3, 3, 1, 4); g.fillRect(4, 3, 2, 1); g.fillRect(10, 11, 3, 1);
      g.strokeStyle = '#e9f7fb'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 15, 15);
      break;
    case 'gelo':
      granulado(C, 0.08); g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.fillRect(2, 3, 5, 1); g.fillRect(9, 10, 4, 1); g.globalAlpha = 1;
      break;
    case 'talhada':
      granulado(C, 0.08); g.strokeStyle = mistura(C, 0.7); g.strokeRect(0.5, 0.5, 15, 15); g.strokeRect(3.5, 3.5, 9, 9);
      break;
    case 'minerio':
      granulado(C, 0.14);
      for (let i = 0; i < 5; i++) { const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11); g.fillStyle = C2; g.fillRect(x, y, 2, 2); px(x + 1, y + 2, mistura(C2, 0.8)); }
      break;
    case 'metal':
      granulado(C, 0.05); g.fillStyle = mistura(C, 1.15); g.fillRect(0, 0, LADO, 2); g.fillStyle = mistura(C, 0.75); g.fillRect(0, 14, LADO, 2);
      for (const [x, y] of [[2, 4], [13, 4], [2, 11], [13, 11]]) px(x, y, mistura(C, 0.6));
      break;
    case 'cristal':
      granulado(C, 0.1); g.fillStyle = mistura(C, 1.3);
      for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 12), y = Math.floor(r() * 12); g.fillRect(x, y, 1, 4); g.fillRect(x - 1, y + 1, 3, 1); }
      break;
    case 'lampada':
      g.fillStyle = mistura('#7a5233', 1); g.fillRect(0, 0, LADO, LADO);
      g.fillStyle = C; g.fillRect(2, 2, 12, 12); g.fillStyle = '#fff6cf'; g.fillRect(5, 5, 6, 6);
      break;
    case 'porta':
      granulado(C, 0.08); g.fillStyle = mistura(C, 0.7); g.fillRect(0, 0, LADO, 1); g.fillRect(0, 15, LADO, 1); g.fillRect(0, 0, 1, LADO); g.fillRect(15, 0, 1, LADO); g.fillRect(7, 1, 1, 14);
      g.fillStyle = '#193337'; g.fillRect(11, 8, 2, 2);
      break;
    case 'bancada':
      if (face === 'topo') { granulado('#d4a86a', 0.08); g.strokeStyle = '#7a5233'; g.strokeRect(0.5, 0.5, 15, 15); g.fillStyle = '#7a5233'; g.fillRect(3, 3, 4, 4); g.fillRect(9, 9, 4, 4); }
      else { granulado(C, 0.08); g.fillStyle = '#7a5233'; g.fillRect(0, 0, LADO, 3); g.fillRect(2, 6, 3, 8); g.fillRect(11, 6, 3, 8); }
      break;
    case 'fornalha':
      granulado(C, 0.1);
      if (face === 'lado') { g.fillStyle = '#26282b'; g.fillRect(4, 7, 8, 6); g.fillStyle = '#ff9d52'; g.fillRect(5, 10, 6, 2); }
      break;
    case 'bau':
      granulado(C, 0.08); g.fillStyle = mistura(C, 0.65); g.fillRect(0, 5, LADO, 1); g.strokeStyle = mistura(C, 0.6); g.strokeRect(0.5, 0.5, 15, 15);
      if (face === 'lado') { g.fillStyle = '#ffd36b'; g.fillRect(7, 5, 2, 3); }
      break;
    case 'agua':
      g.fillStyle = 'rgba(61,143,214,0.7)'; g.fillRect(0, 0, LADO, LADO);
      g.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(Math.floor(r() * 12), Math.floor(r() * 16), 4, 1);
      break;
    case 'la':
      granulado(C, 0.1); for (let i = 0; i < 20; i++) px(Math.floor(r() * LADO), Math.floor(r() * LADO), mistura(C, 1.12));
      break;
    default:
      granulado(C, b.desenho === 'cascalho' ? 0.28 : b.desenho === 'neve' ? 0.04 : 0.14);
  }
  return cv;
}

/** Ícone 3/4 do bloco para a barra e o catálogo (topo + dois lados sombreados). */
export function icone(b: BlocoArte, tam = 48): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = tam;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const topo = desenhar(b, 'topo'), lado = desenhar(b, 'lado');
  const s = tam / 2, h = tam / 4;
  g.save(); g.setTransform(s / LADO, h / LADO, -s / LADO, h / LADO, s, 0); g.drawImage(topo, 0, 0); g.restore();
  g.save(); g.setTransform(s / LADO, h / LADO, 0, s / LADO, 0, h); g.drawImage(lado, 0, 0); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, LADO, LADO); g.restore();
  g.save(); g.setTransform(s / LADO, -h / LADO, 0, s / LADO, s, 2 * h); g.drawImage(lado, 0, 0); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, 0, LADO, LADO); g.restore();
  return cv;
}
