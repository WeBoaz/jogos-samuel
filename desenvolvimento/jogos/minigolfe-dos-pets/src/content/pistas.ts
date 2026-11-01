// CourseLoader: as 6 pistas autorais. Coordenadas no plano (x, z); o tee fica em z positivo
// e a câmera começa atrás dele olhando para z negativo.
import type { P2, Parede, Pista } from '../core/tipos';

const ret = (x0: number, z0: number, x1: number, z1: number): P2[] => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const p = (a: P2, b: P2, extra: Partial<Parede> = {}): Parede => ({ a, b, ...extra });
/** paredes em volta de um polígono; `pular` lista índices de arestas abertas */
function contorno(poly: P2[], pular: number[] = []): Parede[] {
  return poly.map((a, i) => ({ a, b: poly[(i + 1) % poly.length] })).filter((_, i) => !pular.includes(i));
}

export const PISTAS: Pista[] = [
  {
    id: 1, nome: 'Reta do Doguinho', rotulo: 'Reta', icone: '🐶', par: 2,
    tee: [0, 5.3], buraco: [0.4, -4.4],
    pisos: [{ poly: ret(-1.2, 6.5, 1.2, -6) }],
    paredes: contorno(ret(-1.2, 6.5, 1.2, -6)),
    dica: '⛳ Acerte o buraco!',
  },
  {
    id: 2, nome: 'Curva do Gatinho', rotulo: 'Curva', icone: '🐱', par: 3,
    tee: [0, 5.3], buraco: [6.2, -3.2],
    pisos: [{ poly: [[-1.25, 6.5], [1.25, 6.5], [1.25, -1.8], [7.5, -1.8], [7.5, -4.6], [-1.25, -4.6]] }],
    paredes: [
      ...contorno([[-1.25, 6.5], [1.25, 6.5], [1.25, -1.8], [7.5, -1.8], [7.5, -4.6], [-1.25, -4.6]]),
      p([-1.25, -3.0], [0.05, -4.6], { tipo: 'para-choque' }),
    ],
    dica: '🧱 Bata na parede!',
    foco: [[-1.25, -4.6], [0.05, -4.6], [0, 5.3]],
  },
  {
    id: 3, nome: 'Rampa do Pulo', rotulo: 'Rampa', icone: '⛰️', par: 3,
    tee: [0, 5.3], buraco: [0.6, -4.9],
    pisos: [
      { poly: ret(-1.3, 6.5, 1.3, 2.2) },
      { poly: ret(-1.3, 2.2, 1.3, -0.8), rampa: { eixo: 'z', de: 2.2, ate: -0.8, h0: 0, h1: 0.7 } },
      { poly: ret(-1.9, -0.8, 1.9, -6.5), h: 0.7 },
    ],
    paredes: [
      p([-1.3, 6.5], [1.3, 6.5]),
      p([-1.3, 6.5], [-1.3, 2.2]), p([1.3, 6.5], [1.3, 2.2]),
      p([-1.3, 2.2], [-1.3, -0.8]), p([1.3, 2.2], [1.3, -0.8]),
      p([-1.9, -0.8], [-1.3, -0.8]), p([1.3, -0.8], [1.9, -0.8]),
      p([-1.9, -0.8], [-1.9, -6.5]), p([1.9, -0.8], [1.9, -6.5]), p([-1.9, -6.5], [1.9, -6.5]),
      p([-1.3, -3.2], [-0.45, -3.2], { tipo: 'para-choque' }),
    ],
    dica: '⛰️ Força para subir!',
  },
  {
    id: 4, nome: 'Túnel do Canil', rotulo: 'Túnel', icone: '🏠', par: 3,
    tee: [0, 5.3], buraco: [0.75, -5.1],
    pisos: [{ poly: ret(-1.5, 6.5, 1.5, -6.5) }],
    paredes: [
      ...contorno(ret(-1.5, 6.5, 1.5, -6.5)),
      p([-1.5, 3.0], [-0.75, 1.8]), p([1.5, 3.0], [0.75, 1.8]),
      p([-0.75, 1.8], [-0.75, -1.8]), p([0.75, 1.8], [0.75, -1.8]),
      p([-0.75, -1.8], [-1.5, -3.0]), p([0.75, -1.8], [1.5, -3.0]),
      p([0, -3.9], [0, -3.9], { esp: 0.2, tipo: 'para-choque' }),
    ],
    tunel: { de: [0, 1.8], ate: [0, -1.8], largura: 1.5 },
    dica: '🏠 Passe na casinha!',
  },
  {
    id: 5, nome: 'Gira-Gira', rotulo: 'Gira-Gira', icone: '🌀', par: 3,
    tee: [0, 5.3], buraco: [0, -4.8],
    pisos: [{ poly: ret(-2, 6.5, 2, -6.5) }],
    paredes: contorno(ret(-2, 6.5, 2, -6.5)),
    obstaculos: [{ tipo: 'gira-gira', centro: [0, 0.2], raio: 1.75, vel: 1.25, pas: 2, fase: 0.3 }],
    dica: '🌀 Espere a pá passar!',
  },
  {
    id: 6, nome: 'Grande Final', rotulo: 'Final', icone: '🏆', par: 4,
    tee: [0, 6.0], buraco: [1.6, -6.9],
    pisos: [
      { poly: ret(-1.3, 7, 1.3, 3.2) },
      { poly: ret(-1.3, 3.2, 1.3, 0.8), rampa: { eixo: 'z', de: 3.2, ate: 0.8, h0: 0, h1: 0.6 } },
      { poly: ret(-0.95, 0.8, 0.95, -2.6), h: 0.6, ponte: true },
      { poly: ret(-2.6, -2.6, 2.6, -8), h: 0.6 },
    ],
    paredes: [
      p([-1.3, 7], [1.3, 7]),
      p([-1.3, 7], [-1.3, 3.2]), p([1.3, 7], [1.3, 3.2]),
      p([-1.3, 3.2], [-1.3, 0.8]), p([1.3, 3.2], [1.3, 0.8]),
      p([-1.3, 0.8], [-0.95, 0.8]), p([0.95, 0.8], [1.3, 0.8]),
      p([-2.6, -2.6], [-0.95, -2.6]), p([0.95, -2.6], [2.6, -2.6]),
      p([-2.6, -2.6], [-2.6, -8]), p([2.6, -2.6], [2.6, -8]), p([-2.6, -8], [2.6, -8]),
      p([-1.4, -6.4], [-0.6, -7.2], { tipo: 'para-choque' }),
    ],
    obstaculos: [{ tipo: 'portao', a: [-2.45, -5.0], b: [-1.05, -5.0], desloc: [2.6, 0], periodo: 5.6 }],
    agua: [ret(-3.6, 1.6, 3.6, -3.3)],
    dica: '💦 Cuidado, água!',
  },
];

export const PARES = PISTAS.map((p) => p.par);
