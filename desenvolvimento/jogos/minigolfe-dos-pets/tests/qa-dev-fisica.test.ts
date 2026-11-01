// QA de desenvolvimento — física. Testes "QA-Fn" afirmam o comportamento CORRETO e hoje falham
// de propósito (provam o defeito). Os de "cobertura" fecham lacunas e devem passar.
import { describe, expect, it } from 'vitest';
import { Fisica, PASSO, RAIO_BOLA, segmentosObstaculo } from '../src/core/fisica';
import { PISTAS } from '../src/content/pistas';
import type { Ajustes } from '../src/core/tipos';

const NORMAL: Ajustes = { velMax: 11, capturaBuraco: 4.2, ima: 0, rampaGravidade: 1 };
type Seg = { ax: number; az: number; bx: number; bz: number; esp: number };
function distSeg(px: number, pz: number, s: Seg): number {
  const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - s.ax) * dx + (pz - s.az) * dz) / l2)) : 0;
  return Math.hypot(px - (s.ax + t * dx), pz - (s.az + t * dz));
}
const angDif = (a: number, b: number) => { let d = Math.abs(a - b) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; return d; };

describe('QA-DEV física — defeitos (falhavam antes da correção de 2026-11-01; agora devem passar)', () => {
  it('QA-F1: portão da pista 6 não pode espremer a bola através da parede lateral', () => {
    const p6 = PISTAS[5];
    const f = new Fisica(p6, NORMAL);
    f.tempo = 1.4;                       // ponta do portão em x≈1,62 indo para a direita
    f.colocar(2.25, -5.0);               // bola quase parada encostada na parede direita (x=2,6)
    f.bola.movendo = true;
    const tipos = new Set<string>();
    let maxX = -Infinity;
    for (let t = 0; t < 2 && f.bola.movendo; t += PASSO) {
      for (const e of f.passo(PASSO)) tipos.add(e.tipo);
      maxX = Math.max(maxX, f.bola.x);
    }
    // hoje: a bola termina em x≈2,92 (do lado de fora da parede) e gera 'fora' → "SPLASH +1" no Normal
    expect(maxX, `bola saiu da pista: eventos ${[...tipos].join(',')}`).toBeLessThanOrEqual(2.6 - RAIO_BOLA);
    expect(f.bola.fora).toBe(false);
  });

  it('QA-F2: bola parada não pode ficar sobreposta ao gira-gira (pista 5)', () => {
    const p5 = PISTAS[4];
    const f = new Fisica(p5, NORMAL);
    f.colocar(1.0, 0.2);                 // dentro do disco das pás (raio 1,75), lugar comum de parada
    let sobreposta = false;
    for (let t = 0; t < 3; t += PASSO) {
      f.passo(PASSO);
      for (const s of f.segmentosMoveis()) if (distSeg(f.bola.x, f.bola.z, s) < RAIO_BOLA + s.esp - 0.02) sobreposta = true;
    }
    // hoje: passo() retorna cedo com a bola parada, a pá atravessa a bola a cada ~2,5 s
    expect(sobreposta).toBe(false);
  });

  it('QA-F3: tacada dada enquanto a pá está sobre a bola sai na direção da mira (±45°)', () => {
    const p5 = PISTAS[4];
    let pior = 0;
    for (let t0 = 0; t0 < 2.6; t0 += 0.02) {
      const f = new Fisica(p5, NORMAL);
      f.tempo = t0; f.colocar(1.0, 0.2);
      const mira = Math.atan2(0 - 1.0, -(-4.8 - 0.2));
      f.tacar(mira, 0.25);
      // Ajuste depois da correção: se a pá está NA FRENTE da bola, na linha da mira (menos de 0,45),
      // rebater é o comportamento físico certo (como num cata-vento de verdade) e o caso fica de fora.
      // O defeito original era a bola sobreposta à pá sair para o lado errado; isso não pode acontecer.
      const ax = f.bola.x + Math.sin(mira) * 0.45, az = f.bola.z - Math.cos(mira) * 0.45;
      const naFrente = f.segmentosMoveis().some((s) => distSeg(ax, az, s) < RAIO_BOLA + s.esp || distSeg((f.bola.x + ax) / 2, (f.bola.z + az) / 2, s) < RAIO_BOLA + s.esp);
      f.passo(PASSO);
      if (naFrente) continue;
      pior = Math.max(pior, angDif(Math.atan2(f.bola.vx, -f.bola.vz), mira));
    }
    // hoje: até ~179° (a bola volta para trás) quando a tacada coincide com a pá
    expect(pior * 180 / Math.PI).toBeLessThan(45);
  });
});

describe('QA-DEV física — cobertura', () => {
  it('nenhuma tacada cruza o traço de uma parede (inclusive paredes internas e para-choques)', () => {
    const cruzamentos: string[] = [];
    for (const pista of PISTAS) {
      const paredes = pista.paredes.filter((w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) > 1e-3);
      for (let k = 0; k < 36; k++) for (const forca of [1, 0.55]) {
        const f = new Fisica(pista, { ...NORMAL, capturaBuraco: 0 });
        f.tempo = k * 0.37;
        f.tacar((k / 36) * Math.PI * 2, forca);
        for (let t = 0; t < 12 && f.bola.movendo; t += PASSO) {
          const x0 = f.bola.x, z0 = f.bola.z;
          f.passo(PASSO);
          const x1 = f.bola.x, z1 = f.bola.z;
          for (const w of paredes) {
            const [ax, az] = w.a, [bx, bz] = w.b, ex = bx - ax, ez = bz - az;
            const s0 = ex * (z0 - az) - ez * (x0 - ax), s1 = ex * (z1 - az) - ez * (x1 - ax);
            if (s0 * s1 >= 0) continue;
            const den = (x1 - x0) * ez - (z1 - z0) * ex;
            const u = den ? ((ax - x0) * ez - (az - z0) * ex) / den : -1;
            const xi = x0 + u * (x1 - x0), zi = z0 + u * (z1 - z0);
            const tw = ((xi - ax) * ex + (zi - az) * ez) / (ex * ex + ez * ez);
            if (tw >= 0 && tw <= 1) cruzamentos.push(`${pista.nome} k=${k} f=${forca}`);
          }
        }
      }
    }
    expect(cruzamentos).toEqual([]);
  }, 120_000);

  it('bola em jogo normal não atravessa o portão da pista 6', () => {
    const p6 = PISTAS[5], o = p6.obstaculos![0];
    let atravessou = 0;
    for (let k = 0; k < 30; k++) for (let ti = 0; ti < 6; ti++) {
      const f = new Fisica(p6, { ...NORMAL, capturaBuraco: 0 });
      f.tempo = ti * 0.7; f.colocar(0, -3.0);
      f.tacar(-0.9 + (k / 30) * 1.8, 0.7);
      for (let t = 0; t < 10 && f.bola.movendo; t += PASSO) {
        const z0 = f.bola.z; f.passo(PASSO); const z1 = f.bola.z;
        const [s] = segmentosObstaculo(o, f.tempo);
        if ((z0 + 5) * (z1 + 5) < 0 && f.bola.x > s.ax && f.bola.x < s.bx) atravessou++;
      }
    }
    expect(atravessou).toBe(0);
  });

  it('entradas inválidas (NaN/Infinity) não corrompem a bola', () => {
    for (const [a, fz] of [[NaN, 0.5], [0, NaN], [Infinity, 1], [0, Infinity]] as [number, number][]) {
      const f = new Fisica(PISTAS[0], NORMAL);
      f.tacar(a, fz);
      for (let i = 0; i < 120 * 30; i++) f.passo(PASSO);   // a bola rola até ~10 s com o atrito atual
      expect(Number.isFinite(f.bola.x + f.bola.z + f.bola.vx + f.bola.vz)).toBe(true);
      expect(f.bola.movendo).toBe(false);
    }
  });

  it('obstáculos só andam com o relógio da simulação (pausa congela)', () => {
    const f = new Fisica(PISTAS[4], NORMAL);
    const a = f.segmentosMoveis()[0];
    const b = f.segmentosMoveis()[0];          // sem passo(): mesmo instante
    expect(b).toEqual(a);
  });
});
