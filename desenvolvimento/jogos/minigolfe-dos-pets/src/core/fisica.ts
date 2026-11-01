// BallPhysics + HoleDetector. Passo fixo, sub-passos curtos (a bola anda no máximo 40% do raio
// por sub-passo), então nem a tacada mais forte atravessa parede ou pula o buraco sem teste.
import type { Ajustes, EventoFisica, Obstaculo, P2, Parede, Pista, Piso } from './tipos';

export const RAIO_BOLA = 0.2;
export const RAIO_BURACO = 0.34;
export const PASSO = 1 / 120;
const GRAVIDADE = 9.0;            // aceleração que a inclinação produz (unidades/s²)
const ATRITO_FIXO = 0.6;          // desaceleração de rolamento
const ATRITO_VEL = 0.2;           // desaceleração proporcional à velocidade
const RESTITUICAO = 0.72;
const ATRITO_PAREDE = 0.9;
const PARADA_VEL = 0.07;
const PARADA_TEMPO = 0.22;
const RAMPA_SEGURA = 0.1;          // inclinação abaixo da qual a bola consegue parar
const TEMPO_MAX_ROLANDO = 18;      // depois disso a bola é parada à força (recuperação)

interface Segmento { ax: number; az: number; bx: number; bz: number; esp: number; vx: number; vz: number; w: number; cx: number; cz: number }

export interface EstadoBola {
  x: number; z: number; vx: number; vz: number;
  movendo: boolean; noBuraco: boolean; fora: boolean;
  tempoParada: number; tempoRolando: number;
  naBorda: boolean;
}

function alturaPiso(p: Piso, x: number, z: number): number {
  if (!p.rampa) return p.h ?? 0;
  const r = p.rampa;
  const c = r.eixo === 'x' ? x : z;
  const t = Math.min(1, Math.max(0, (c - r.de) / (r.ate - r.de)));
  return r.h0 + (r.h1 - r.h0) * t;
}
function gradPiso(p: Piso): P2 {
  if (!p.rampa) return [0, 0];
  const r = p.rampa;
  const g = (r.h1 - r.h0) / (r.ate - r.de);
  return r.eixo === 'x' ? [g, 0] : [0, g];
}
export function dentro(poly: P2[], x: number, z: number, folga = 0.002): boolean {
  let ok = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ok = !ok;
  }
  if (ok || folga <= 0) return ok;
  // tolerância nas bordas entre pisos vizinhos
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (distSeg(x, z, poly[j][0], poly[j][1], poly[i][0], poly[i][1]) < folga) return true;
  }
  return false;
}
function distSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

export class Fisica {
  readonly pista: Pista;
  readonly ajustes: Ajustes;
  bola: EstadoBola;
  tempo = 0;                       // relógio da simulação (obstáculos móveis usam este, não o relógio real)
  private fixos: Segmento[];
  private eventos: EventoFisica[] = [];

  constructor(pista: Pista, ajustes: Ajustes) {
    this.pista = pista;
    this.ajustes = ajustes;
    this.fixos = pista.paredes.map((p) => segFixo(p));
    this.bola = this.bolaNoTee();
  }

  private bolaNoTee(): EstadoBola {
    const [x, z] = this.pista.tee;
    return { x, z, vx: 0, vz: 0, movendo: false, noBuraco: false, fora: false, tempoParada: 0, tempoRolando: 0, naBorda: false };
  }

  /** Coloca a bola parada num ponto (tee, local de recuperação). */
  colocar(x: number, z: number): void {
    Object.assign(this.bola, { x, z, vx: 0, vz: 0, movendo: false, noBuraco: false, fora: false, tempoParada: 0, tempoRolando: 0, naBorda: false });
  }

  pisoEm(x: number, z: number): Piso | null {
    for (const p of this.pista.pisos) if (dentro(p.poly, x, z)) return p;
    return null;
  }
  altura(x: number, z: number): number {
    const p = this.pisoEm(x, z);
    return p ? alturaPiso(p, x, z) : -0.6;
  }

  /** Tacada: direção em radianos no plano (0 = −z, para o buraco padrão) e força 0..1. */
  tacar(angulo: number, forca: number): boolean {
    const b = this.bola;
    if (b.movendo || b.noBuraco) return false;
    const f = Math.max(0, Math.min(1, forca));
    const v = 0.6 + f * (this.ajustes.velMax - 0.6);
    b.vx = Math.sin(angulo) * v;
    b.vz = -Math.cos(angulo) * v;
    b.movendo = true; b.fora = false; b.tempoParada = 0; b.tempoRolando = 0;
    return true;
  }

  /** Segmentos dos obstáculos móveis no instante t (também usados para desenhar). */
  segmentosMoveis(t = this.tempo): Segmento[] {
    const out: Segmento[] = [];
    for (const o of this.pista.obstaculos ?? []) out.push(...segmentosObstaculo(o, t));
    return out;
  }

  /** Avança dt segundos (o chamador usa PASSO). Devolve os eventos ocorridos. */
  passo(dt = PASSO): EventoFisica[] {
    this.eventos = [];
    this.tempo += dt;
    const b = this.bola;
    if (!b.movendo) return this.eventos;
    b.tempoRolando += dt;

    const moveis = this.segmentosMoveis();
    const vel = Math.hypot(b.vx, b.vz);
    const n = Math.max(1, Math.ceil((vel * dt) / (RAIO_BOLA * 0.4)));
    const h = dt / n;
    for (let i = 0; i < n && b.movendo; i++) this.subpasso(h, moveis);

    if (b.movendo && b.tempoRolando > TEMPO_MAX_ROLANDO) this.parar();
    if (!Number.isFinite(b.x + b.z + b.vx + b.vz)) { this.colocar(...this.pista.tee); this.eventos.push({ tipo: 'parou' }); }
    return this.eventos;
  }

  private subpasso(h: number, moveis: Segmento[]): void {
    const b = this.bola;
    const piso = this.pisoEm(b.x, b.z);
    // gravidade na rampa
    let gx = 0, gz = 0;
    if (piso) { [gx, gz] = gradPiso(piso); b.vx -= GRAVIDADE * gx * h; b.vz -= GRAVIDADE * gz * h; }
    // atrito de rolamento
    let v = Math.hypot(b.vx, b.vz);
    if (v > 0) {
      const dv = (ATRITO_FIXO + ATRITO_VEL * v) * h;
      const k = v > dv ? (v - dv) / v : 0;
      b.vx *= k; b.vz *= k; v *= k;
    }
    // ímã do modo Assistido: perto do buraco e devagar, puxa de leve
    if (this.ajustes.ima > 0) {
      const [hx, hz] = this.pista.buraco;
      const dx = hx - b.x, dz = hz - b.z, d = Math.hypot(dx, dz);
      if (d < RAIO_BURACO + this.ajustes.ima && d > 1e-4 && v < this.ajustes.capturaBuraco * 1.2) {
        const a = 2.6 * (1 - d / (RAIO_BURACO + this.ajustes.ima));
        b.vx += (dx / d) * a * h; b.vz += (dz / d) * a * h;
      }
    }
    b.x += b.vx * h; b.z += b.vz * h;

    for (const s of this.fixos) this.colidir(s);
    for (const s of moveis) this.colidir(s);

    // buraco
    const [hx, hz] = this.pista.buraco;
    const dB = Math.hypot(b.x - hx, b.z - hz);
    if (dB < RAIO_BURACO - RAIO_BOLA * 0.3) {
      const vb = Math.hypot(b.vx, b.vz);
      if (vb <= this.ajustes.capturaBuraco) {
        b.noBuraco = true; b.movendo = false; b.vx = 0; b.vz = 0; b.x = hx; b.z = hz;
        this.eventos.push({ tipo: 'buraco' });
        return;
      }
      if (!b.naBorda) {
        // rápida demais: "beija" a borda, perde força e desvia (detectado, não atravessa sem teste)
        b.naBorda = true;
        const ox = (b.x - hx) / (dB || 1), oz = (b.z - hz) / (dB || 1);
        b.vx = b.vx * 0.82 + ox * vb * 0.12; b.vz = b.vz * 0.82 + oz * vb * 0.12;
        this.eventos.push({ tipo: 'borda', x: b.x, z: b.z });
      }
    } else if (dB > RAIO_BURACO + RAIO_BOLA) b.naBorda = false;

    // saiu do chão (água, beira da ponte)
    if (!this.pisoEm(b.x, b.z) && dB > RAIO_BURACO) {
      b.fora = true; b.movendo = false; b.vx = 0; b.vz = 0;
      this.eventos.push({ tipo: 'fora', x: b.x, z: b.z });
      return;
    }

    // parada
    v = Math.hypot(b.vx, b.vz);
    const inclinacao = piso ? Math.hypot(...gradPiso(piso)) : 0;
    if (v < PARADA_VEL && inclinacao < RAMPA_SEGURA) {
      b.tempoParada += h;
      if (b.tempoParada >= PARADA_TEMPO) this.parar();
    } else b.tempoParada = 0;
  }

  private parar(): void {
    const b = this.bola;
    b.vx = 0; b.vz = 0; b.movendo = false; b.tempoParada = 0;
    this.eventos.push({ tipo: 'parou' });
  }

  private colidir(s: Segmento): void {
    const b = this.bola;
    const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz;
    const t = l2 ? Math.max(0, Math.min(1, ((b.x - s.ax) * dx + (b.z - s.az) * dz) / l2)) : 0;
    const px = s.ax + t * dx, pz = s.az + t * dz;
    let nx = b.x - px, nz = b.z - pz;
    const d = Math.hypot(nx, nz), lim = RAIO_BOLA + s.esp;
    if (d >= lim) return;
    if (d < 1e-6) { nx = l2 ? -dz : 1; nz = l2 ? dx : 0; } // centro exatamente na parede: empurra pela normal
    const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    b.x = px + nx * lim; b.z = pz + nz * lim;
    // velocidade do ponto de contato (obstáculo móvel)
    let svx = s.vx, svz = s.vz;
    if (s.w) { svx += -s.w * (pz - s.cz); svz += s.w * (px - s.cx); }
    const rvx = b.vx - svx, rvz = b.vz - svz;
    const vn = rvx * nx + rvz * nz;
    if (vn < 0) {
      const tvx = rvx - vn * nx, tvz = rvz - vn * nz;
      const nvx = -vn * RESTITUICAO * nx, nvz = -vn * RESTITUICAO * nz;
      b.vx = svx + nvx + tvx * ATRITO_PAREDE; b.vz = svz + nvz + tvz * ATRITO_PAREDE;
      if (-vn > 0.35) this.eventos.push({ tipo: 'parede', forca: Math.min(1, -vn / 9), x: px, z: pz });
      b.tempoParada = 0;
    }
  }

  /** Prévia da trajetória (modo Assistido mostra mais longa). Não altera o estado. */
  previa(angulo: number, forca: number, segundos: number): P2[] {
    const copia = new Fisica(this.pista, { ...this.ajustes, ima: 0 });
    copia.tempo = this.tempo;
    copia.colocar(this.bola.x, this.bola.z);
    copia.tacar(angulo, forca);
    const pts: P2[] = [[copia.bola.x, copia.bola.z]];
    const passos = Math.round(segundos / PASSO);
    for (let i = 0; i < passos && copia.bola.movendo; i++) {
      copia.passo(PASSO);
      if (i % 4 === 0) pts.push([copia.bola.x, copia.bola.z]);
      if (copia.bola.noBuraco || copia.bola.fora) break;
    }
    pts.push([copia.bola.x, copia.bola.z]);
    return pts;
  }
}

function segFixo(p: Parede): Segmento {
  return { ax: p.a[0], az: p.a[1], bx: p.b[0], bz: p.b[1], esp: p.esp ?? 0.12, vx: 0, vz: 0, w: 0, cx: 0, cz: 0 };
}

export function segmentosObstaculo(o: Obstaculo, t: number): Segmento[] {
  if (o.tipo === 'gira-gira') {
    const ang = (o.fase ?? 0) + o.vel * t;
    const out: Segmento[] = [];
    const [cx, cz] = o.centro;
    for (let i = 0; i < o.pas; i++) {
      const a = ang + (i * Math.PI * 2) / o.pas;
      out.push({ ax: cx, az: cz, bx: cx + Math.cos(a) * o.raio, bz: cz + Math.sin(a) * o.raio, esp: 0.1, vx: 0, vz: 0, w: o.vel, cx, cz });
    }
    // eixo central
    out.push({ ax: cx, az: cz, bx: cx, bz: cz, esp: 0.22, vx: 0, vz: 0, w: 0, cx, cz });
    return out;
  }
  // portão que desliza: posição = a + desloc · (0..1) em onda suave
  const w = (Math.PI * 2) / o.periodo;
  const s = 0.5 - 0.5 * Math.cos(w * t + (o.fase ?? 0));
  const ds = 0.5 * w * Math.sin(w * t + (o.fase ?? 0));
  const ox = o.desloc[0] * s, oz = o.desloc[1] * s;
  return [{ ax: o.a[0] + ox, az: o.a[1] + oz, bx: o.b[0] + ox, bz: o.b[1] + oz, esp: 0.16, vx: o.desloc[0] * ds, vz: o.desloc[1] * ds, w: 0, cx: 0, cz: 0 }];
}
