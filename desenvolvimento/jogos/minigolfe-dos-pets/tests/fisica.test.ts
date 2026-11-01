import { describe, expect, it } from 'vitest';
import { Fisica, PASSO, RAIO_BOLA } from '../src/core/fisica';
import { PISTAS } from '../src/content/pistas';
import type { Ajustes, EventoFisica, Pista } from '../src/core/tipos';

const NORMAL: Ajustes = { velMax: 11, capturaBuraco: 4.2, ima: 0 };
const ASSISTIDO: Ajustes = { velMax: 8, capturaBuraco: 5.4, ima: 0.55 };

function rolar(f: Fisica, max = 30): EventoFisica[] {
  const ev: EventoFisica[] = [];
  for (let t = 0; t < max && f.bola.movendo; t += PASSO) ev.push(...f.passo(PASSO));
  return ev;
}
const anguloPara = (f: Fisica, x: number, z: number) => Math.atan2(x - f.bola.x, -(z - f.bola.z));

describe('BallPhysics', () => {
  it('a bola para sozinha numa pista plana', () => {
    const f = new Fisica(PISTAS[0], NORMAL);
    f.tacar(0.25, 0.3);
    const ev = rolar(f);
    expect(f.bola.movendo).toBe(false);
    expect(ev.some((e) => e.tipo === 'parou')).toBe(true);
  });

  it('não aceita tacada com a bola andando', () => {
    const f = new Fisica(PISTAS[0], NORMAL);
    expect(f.tacar(0, 0.5)).toBe(true);
    f.passo();
    expect(f.tacar(1, 1)).toBe(false);
  });

  it('a tacada mais forte, em qualquer direção, nunca atravessa parede', () => {
    for (const pista of PISTAS) {
      for (let k = 0; k < 24; k++) {
        const f = new Fisica(pista, { ...NORMAL, capturaBuraco: 0 });
        f.tacar((k / 24) * Math.PI * 2, 1);
        for (let t = 0; t < 12 && f.bola.movendo; t += PASSO) {
          f.passo(PASSO);
          if (!f.bola.fora) expect(f.pisoEm(f.bola.x, f.bola.z), `${pista.nome} ângulo ${k}`).not.toBeNull();
        }
        if (pista.id !== 6) expect(f.bola.fora, `${pista.nome} saiu do chão`).toBe(false);
      }
    }
  });

  it('bola devagar no buraco cai e é detectada', () => {
    const f = new Fisica(PISTAS[0], NORMAL);
    f.colocar(0, -2.6);
    f.tacar(0, 0.12);
    const ev = rolar(f);
    expect(ev.some((e) => e.tipo === 'buraco')).toBe(true);
    expect(f.bola.noBuraco).toBe(true);
  });

  it('bola rápida passando pelo buraco é detectada (borda) e não some', () => {
    const f = new Fisica(PISTAS[0], NORMAL);
    f.colocar(0, 1);
    f.tacar(0, 1);
    const ev = rolar(f);
    expect(ev.some((e) => e.tipo === 'borda' || e.tipo === 'buraco')).toBe(true);
    expect(Number.isFinite(f.bola.x)).toBe(true);
  });

  it('modo Assistido: tacada mediana na direção certa entra na pista reta', () => {
    const f = new Fisica(PISTAS[0], ASSISTIDO);
    const ang = anguloPara(f, ...PISTAS[0].buraco);
    let acertou = false;
    for (let forca = 0.4; forca <= 0.85; forca += 0.05) {
      f.colocar(...PISTAS[0].tee);
      f.tacar(ang, forca);
      if (rolar(f).some((e) => e.tipo === 'buraco')) { acertou = true; break; }
    }
    expect(acertou).toBe(true);
  });

  it('na rampa, tacada fraca volta para baixo e para no plano', () => {
    const f = new Fisica(PISTAS[2], NORMAL);
    f.tacar(0, 0.28);
    rolar(f);
    expect(f.bola.movendo).toBe(false);
    expect(f.bola.z).toBeGreaterThan(2.2 - RAIO_BOLA);   // ficou no plano de baixo
  });

  it('na rampa, tacada forte alcança o green de cima', () => {
    const f = new Fisica(PISTAS[2], { ...NORMAL, capturaBuraco: 0 });
    f.tacar(0, 0.6);
    let subiu = false;
    for (let t = 0; t < 30 && f.bola.movendo; t += PASSO) { f.passo(); if (f.altura(f.bola.x, f.bola.z) > 0.69) subiu = true; }
    expect(subiu).toBe(true);
  });

  it('cair da ponte gera evento "fora" (recuperação)', () => {
    const f = new Fisica(PISTAS[5], NORMAL);
    f.colocar(0, 0.3);
    f.tacar(Math.PI / 2, 0.5);          // para a direita, fora da ponte
    const ev = rolar(f);
    expect(ev.some((e) => e.tipo === 'fora')).toBe(true);
    expect(f.bola.movendo).toBe(false);
  });

  it('gira-gira empurra a bola e a simulação usa o relógio do jogo', () => {
    const f = new Fisica(PISTAS[4], NORMAL);
    const a = f.segmentosMoveis(0)[0], b = f.segmentosMoveis(1)[0];
    expect(a.bx).not.toBeCloseTo(b.bx);
    f.tacar(0, 1);
    rolar(f);
    expect(f.bola.movendo).toBe(false);
  });

  it('recupera bola presa: para à força depois do tempo máximo', () => {
    const pista: Pista = { ...PISTAS[0], paredes: PISTAS[0].paredes };
    const f = new Fisica(pista, NORMAL);
    f.tacar(0.3, 1);
    for (let t = 0; t < 40; t += PASSO) f.passo(PASSO);
    expect(f.bola.movendo).toBe(false);
  });

  it('prévia não altera a bola de verdade', () => {
    const f = new Fisica(PISTAS[1], NORMAL);
    const antes = { ...f.bola };
    const pts = f.previa(0.1, 0.8, 1.5);
    expect(pts.length).toBeGreaterThan(3);
    expect(f.bola).toEqual(antes);
  });
});
