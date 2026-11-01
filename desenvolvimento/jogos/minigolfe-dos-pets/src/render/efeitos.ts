// Bola, seta de mira, prévia pontilhada, rastro e efeitos (confete, poeirinha, respingo).
// Tudo com objetos reaproveitados: reiniciar não cria malhas novas.
import * as THREE from 'three';
import { RAIO_BOLA } from '../core/fisica';
import type { P2 } from '../core/tipos';
import { texBrilho } from './texturas';

const CORES_CONFETE = ['#ff9d52', '#ceb7ef', '#b9ed80', '#ffd56b', '#7fc8e8', '#ff9ad0'];

export class Bola {
  readonly malha: THREE.Mesh;
  private mat: THREE.MeshPhysicalMaterial;
  private faixa: THREE.Mesh;
  private giro = new THREE.Quaternion();
  constructor() {
    this.mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    this.malha = new THREE.Mesh(new THREE.SphereGeometry(RAIO_BOLA, 32, 24), this.mat);
    // bola inteira na cor do jogador, com faixa branca (cor nunca é a única pista: o HUD mostra o número)
    this.faixa = new THREE.Mesh(new THREE.TorusGeometry(RAIO_BOLA * 0.99, RAIO_BOLA * 0.22, 10, 40), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.35 }));
    this.malha.add(this.faixa);
    this.malha.castShadow = true;
  }
  cor(c: string): void { this.mat.color.set(c); }
  /** Gira a bola de acordo com o deslocamento (parece rolar de verdade). */
  rolar(dx: number, dz: number): void {
    const d = Math.hypot(dx, dz);
    if (d < 1e-5) return;
    const eixo = new THREE.Vector3(dz, 0, -dx).normalize();
    this.giro.setFromAxisAngle(eixo, d / RAIO_BOLA);
    this.malha.quaternion.premultiply(this.giro);
  }
}

export class Mira {
  readonly grupo = new THREE.Group();
  private seta: THREE.Mesh;
  private matSeta: THREE.MeshBasicMaterial;
  private pontos: THREE.InstancedMesh;
  private anel: THREE.Mesh;
  private alvo: THREE.Mesh;
  private readonly maxPontos = 48;
  constructor() {
    const forma = new THREE.Shape();
    forma.moveTo(-0.07, 0); forma.lineTo(0.07, 0); forma.lineTo(0.07, 0.75); forma.lineTo(0.17, 0.75); forma.lineTo(0, 1); forma.lineTo(-0.17, 0.75); forma.lineTo(-0.07, 0.75); forma.closePath();
    const geo = new THREE.ShapeGeometry(forma); geo.rotateX(-Math.PI / 2); // aponta para −z
    // cores sólidas do kit, sem tone mapping (antes saía creme quase invisível no verde) e contorno tinta
    this.matSeta = new THREE.MeshBasicMaterial({ color: '#b9ed80', toneMapped: false, depthWrite: false, transparent: true });
    this.seta = new THREE.Mesh(geo, this.matSeta);
    this.seta.renderOrder = 4;
    const contorno = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#193337', toneMapped: false, depthWrite: false, transparent: true }));
    contorno.scale.set(1.28, 1, 1.1); contorno.position.set(0, -0.004, 0.035); contorno.renderOrder = 3;
    this.seta.add(contorno);
    this.pontos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#fffdf7', toneMapped: false }), this.maxPontos);
    this.pontos.count = 0; this.pontos.frustumCulled = false;
    this.anel = new THREE.Mesh(new THREE.RingGeometry(RAIO_BOLA * 1.45, RAIO_BOLA * 1.95, 40), new THREE.MeshBasicMaterial({ color: '#fffdf7', toneMapped: false, depthWrite: false, transparent: true }));
    this.anel.rotation.x = -Math.PI / 2;
    this.alvo = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.24, 28), new THREE.MeshBasicMaterial({ color: '#ffd56b', toneMapped: false, depthWrite: false, transparent: true }));
    this.alvo.rotation.x = -Math.PI / 2;
    this.grupo.add(this.seta, this.pontos, this.anel, this.alvo);
    this.esconder();
  }
  esconder(): void { this.grupo.visible = false; }
  /** Mostra a seta a partir da bola. `previa` = pontos da trajetória (vazio no modo Normal curto). */
  mostrar(x: number, y: number, z: number, angulo: number, forca: number, previa: P2[], alturaEm: (x: number, z: number) => number, t: number): void {
    this.grupo.visible = true;
    const comp = 0.5 + forca * 2.4;
    this.seta.position.set(x, y + 0.02, z);
    this.seta.rotation.set(0, -angulo, 0);
    this.seta.scale.set(0.8 + forca * 0.6, 1, comp);
    // verde (fraca) → amarelo → laranja (forte), em faixas do kit
    this.matSeta.color.set(forca < 0.35 ? '#b9ed80' : forca < 0.7 ? '#ffd56b' : '#ff9d52');
    this.anel.position.set(x, y + 0.015, z);
    this.anel.scale.setScalar(1 + Math.sin(t * 6) * 0.06);
    const m = new THREE.Matrix4();
    const n = Math.min(this.maxPontos, previa.length);
    for (let i = 0; i < n; i++) {
      const [px, pz] = previa[i];
      const s = 1 - (i / n) * 0.6;
      m.makeScale(s, s, s).setPosition(px, alturaEm(px, pz) + 0.06, pz);
      this.pontos.setMatrixAt(i, m);
    }
    this.pontos.count = n; this.pontos.instanceMatrix.needsUpdate = true;
    this.alvo.visible = n > 2;
    if (n > 2) { const [ax, az] = previa[n - 1]; this.alvo.position.set(ax, alturaEm(ax, az) + 0.02, az); }
  }
}

interface Particula { vivo: boolean; p: THREE.Vector3; v: THREE.Vector3; vida: number; max: number; giro: THREE.Vector3; tam: number; gravidade: number; cor: THREE.Color }

/** Confete em papel (InstancedMesh) + brilhos (sprites) — tudo pré-alocado. */
export class Efeitos {
  readonly grupo = new THREE.Group();
  private confete: THREE.InstancedMesh;
  private pConf: Particula[] = [];
  private sprites: THREE.Sprite[] = [];
  private pSpr: Particula[] = [];
  private rastro: THREE.Points;
  private posRastro: Float32Array;
  private nRastro = 0;
  private readonly N_CONF = 160;
  private readonly N_SPR = 48;
  private readonly N_RASTRO = 40;

  constructor() {
    this.confete = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.05), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 }), this.N_CONF);
    this.confete.frustumCulled = false;
    for (let i = 0; i < this.N_CONF; i++) {
      const cor = new THREE.Color(CORES_CONFETE[i % CORES_CONFETE.length]);
      this.confete.setColorAt(i, cor);
      this.pConf.push({ vivo: false, p: new THREE.Vector3(), v: new THREE.Vector3(), vida: 0, max: 1, giro: new THREE.Vector3(), tam: 1, gravidade: 3, cor });
    }
    this.confete.count = 0;
    const brilho = texBrilho();
    for (let i = 0; i < this.N_SPR; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho, transparent: true, depthWrite: false }));
      s.visible = false; this.sprites.push(s); this.grupo.add(s);
      this.pSpr.push({ vivo: false, p: new THREE.Vector3(), v: new THREE.Vector3(), vida: 0, max: 1, giro: new THREE.Vector3(), tam: 1, gravidade: 0, cor: new THREE.Color() });
    }
    this.posRastro = new Float32Array(this.N_RASTRO * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.posRastro, 3));
    this.rastro = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: brilho, transparent: true, opacity: 0.55, depthWrite: false, color: '#ffffff' }));
    this.rastro.frustumCulled = false;
    this.grupo.add(this.confete, this.rastro);
  }

  confetes(x: number, y: number, z: number): void {
    for (const c of this.pConf) {
      const a = Math.random() * Math.PI * 2, f = 1.5 + Math.random() * 2.8;
      c.vivo = true; c.p.set(x, y + 0.1, z);
      c.v.set(Math.cos(a) * f * 0.5, 3.5 + Math.random() * 3, Math.sin(a) * f * 0.5);
      c.vida = c.max = 2.2 + Math.random() * 1.2; c.gravidade = 4.2;
      c.giro.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
    }
  }

  /** Nuvenzinha: poeira na parede, respingo na água, brilho no buraco. */
  puf(x: number, y: number, z: number, tipo: 'poeira' | 'agua' | 'brilho', n = 8): void {
    let feitos = 0;
    for (const s of this.pSpr) {
      if (s.vivo) continue;
      const a = Math.random() * Math.PI * 2;
      s.vivo = true; s.p.set(x, y, z);
      if (tipo === 'agua') { s.v.set(Math.cos(a) * 0.9, 2.2 + Math.random() * 1.6, Math.sin(a) * 0.9); s.gravidade = 6; s.cor.set('#bfeaff'); s.tam = 0.22; }
      else if (tipo === 'brilho') { s.v.set(Math.cos(a) * 0.8, 1.2 + Math.random(), Math.sin(a) * 0.8); s.gravidade = 0.6; s.cor.set('#ffe9a6'); s.tam = 0.26; }
      else { s.v.set(Math.cos(a) * 0.5, 0.35 + Math.random() * 0.3, Math.sin(a) * 0.5); s.gravidade = 0; s.cor.set('#f3ead7'); s.tam = 0.18; }
      s.vida = s.max = 0.5 + Math.random() * 0.4;
      if (++feitos >= n) break;
    }
  }

  marcarRastro(x: number, y: number, z: number): void {
    this.posRastro.copyWithin(3, 0, (this.N_RASTRO - 1) * 3);
    this.posRastro[0] = x; this.posRastro[1] = y; this.posRastro[2] = z;
    this.nRastro = Math.min(this.N_RASTRO, this.nRastro + 1);
    this.rastro.geometry.setDrawRange(0, this.nRastro);
    (this.rastro.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
  limparRastro(): void { this.nRastro = 0; this.rastro.geometry.setDrawRange(0, 0); }

  /** Zera tudo (reiniciar). */
  limpar(): void {
    for (const c of this.pConf) c.vivo = false;
    for (const s of this.pSpr) s.vivo = false;
    for (const s of this.sprites) s.visible = false;
    this.confete.count = 0;
    this.limparRastro();
  }

  atualizar(dt: number): void {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
    let n = 0;
    for (const c of this.pConf) {
      if (!c.vivo) continue;
      c.vida -= dt;
      if (c.vida <= 0) { c.vivo = false; continue; }
      c.v.y -= c.gravidade * dt; c.v.multiplyScalar(1 - dt * 1.4);
      c.p.addScaledVector(c.v, dt);
      e.set(c.giro.x * c.vida, c.giro.y * c.vida, c.giro.z * c.vida); q.setFromEuler(e);
      const k = Math.min(1, c.vida / 0.4);
      m.compose(c.p, q, s.set(k, k, k));
      this.confete.setMatrixAt(n, m);
      this.confete.setColorAt(n, c.cor);
      n++;
    }
    this.confete.count = n;
    this.confete.instanceMatrix.needsUpdate = true;
    if (this.confete.instanceColor) this.confete.instanceColor.needsUpdate = true;
    for (let i = 0; i < this.pSpr.length; i++) {
      const p = this.pSpr[i], spr = this.sprites[i];
      if (!p.vivo) { spr.visible = false; continue; }
      p.vida -= dt;
      if (p.vida <= 0) { p.vivo = false; spr.visible = false; continue; }
      p.v.y -= p.gravidade * dt;
      p.p.addScaledVector(p.v, dt);
      const t = p.vida / p.max;
      spr.visible = true; spr.position.copy(p.p);
      spr.scale.setScalar(p.tam * (1.6 - t * 0.6));
      const mat = spr.material as THREE.SpriteMaterial;
      mat.color.copy(p.cor); mat.opacity = t;
    }
  }
}
