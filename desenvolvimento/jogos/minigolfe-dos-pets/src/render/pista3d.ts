// Desenho de uma pista: placas de grama com laterais de terra, buraco recortado com copo,
// bandeira que balança, bordas de madeira arredondadas (seguindo a rampa), para-choques,
// tee, obstáculos móveis, casinha-túnel e água.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Fisica } from '../core/fisica';
import { RAIO_BURACO, segmentosObstaculo } from '../core/fisica';
import type { P2, Pista, Piso } from '../core/tipos';
import { CHAO_Y } from './mundo';
import { texBandeira, texGreen, texLateral, texMadeira, texTabuas } from './texturas';

const MAT = {
  green: () => { const t = texGreen(); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }); },
  lateral: () => new THREE.MeshStandardMaterial({ map: texLateral(), roughness: 0.95 }),
  madeira: () => new THREE.MeshStandardMaterial({ map: texMadeira(), roughness: 0.62 }),
  tabuas: () => new THREE.MeshStandardMaterial({ map: texTabuas(), roughness: 0.8 }),
};

function alturaPiso(p: Piso, x: number, z: number): number {
  if (!p.rampa) return p.h ?? 0;
  const r = p.rampa, c = r.eixo === 'x' ? x : z;
  const t = Math.min(1, Math.max(0, (c - r.de) / (r.ate - r.de)));
  return r.h0 + (r.h1 - r.h0) * t;
}
const area = (poly: P2[]) => poly.reduce((s, [x, z], i) => { const [x2, z2] = poly[(i + 1) % poly.length]; return s + x * z2 - x2 * z; }, 0) / 2;

export class Pista3D {
  readonly grupo = new THREE.Group();
  private bandeira!: THREE.Mesh;
  private bandeiraBase!: Float32Array;
  private haste!: THREE.Group;
  private moveis: { malha: THREE.Object3D; obst: NonNullable<Pista['obstaculos']>[number] }[] = [];
  private telhado: THREE.Mesh[] = [];
  private agua: THREE.Mesh[] = [];
  private levantarBandeira = 0;

  constructor(readonly pista: Pista, private fisica: Fisica) {
    const verde = MAT.green(), lateral = MAT.lateral(), tabuas = MAT.tabuas();
    for (const piso of pista.pisos) this.grupo.add(this.placa(piso, piso.ponte ? tabuas : verde, lateral));
    const madeira = MAT.madeira();
    const borracha = new THREE.MeshStandardMaterial({ color: '#ff9d52', roughness: 0.45 });
    const tampa = new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.5 });
    for (const w of pista.paredes) this.grupo.add(this.parede(w.a, w.b, w.esp ?? 0.12, w.alta ?? 0.3, w.tipo === 'para-choque' ? borracha : madeira, tampa));
    this.copoEBandeira();
    this.tee();
    for (const o of pista.obstaculos ?? []) this.obstaculo(o);
    if (pista.tunel) this.casinha(pista.tunel);
    for (const a of pista.agua ?? []) this.lago(a);
    this.grupo.traverse((o) => { if (o instanceof THREE.Mesh) { o.receiveShadow = true; } });
  }

  private alturaEm(x: number, z: number): number { return this.fisica.altura(x, z); }

  /** Placa de chão: tampo (com o furo do buraco se for o caso) + laterais até o terreno. */
  private placa(piso: Piso, matTopo: THREE.Material, matLado: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    let poly = piso.poly.slice();
    if (area(poly) < 0) poly = poly.reverse();
    const contorno = poly.map(([x, z]) => new THREE.Vector2(x, z));
    const [hx, hz] = this.pista.buraco;
    const furos: THREE.Vector2[][] = [];
    if (insidePoly(poly, hx, hz)) {
      const f: THREE.Vector2[] = [];
      for (let i = 0; i < 40; i++) { const a = -(i / 40) * Math.PI * 2; f.push(new THREE.Vector2(hx + Math.cos(a) * RAIO_BURACO, hz + Math.sin(a) * RAIO_BURACO)); }
      furos.push(f);
    }
    const tris = THREE.ShapeUtils.triangulateShape(contorno, furos);
    const todos = contorno.concat(...furos);
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (const v of todos) { pos.push(v.x, alturaPiso(piso, v.x, v.y), v.y); uv.push(v.x / 2, -v.y / 2); }
    for (const [a, b, c] of tris) idx.push(a, c, b);
    const topo = new THREE.BufferGeometry();
    topo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    topo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    topo.setIndex(idx); topo.computeVertexNormals();
    g.add(new THREE.Mesh(topo, matTopo));

    // laterais
    const lp: number[] = [], luv: number[] = [], li: number[] = [];
    const base = piso.ponte ? null : CHAO_Y;
    poly.forEach(([ax, az], i) => {
      const [bx, bz] = poly[(i + 1) % poly.length];
      const ha = alturaPiso(piso, ax, az), hb = alturaPiso(piso, bx, bz);
      const ya = base ?? ha - 0.16, yb = base ?? hb - 0.16;
      const len = Math.hypot(bx - ax, bz - az), k = lp.length / 3;
      lp.push(ax, ha, az, bx, hb, bz, bx, yb, bz, ax, ya, az);
      const v0 = 0, v1 = Math.max(0.3, (ha - ya) / 0.7);
      luv.push(0, v0, len / 1.4, v0, len / 1.4, v1, 0, v1);
      li.push(k, k + 1, k + 2, k, k + 2, k + 3);
    });
    const lados = new THREE.BufferGeometry();
    lados.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lados.setAttribute('uv', new THREE.Float32BufferAttribute(luv, 2));
    lados.setIndex(li); lados.computeVertexNormals();
    const malhaLados = new THREE.Mesh(lados, piso.ponte ? matTopo : matLado);
    malhaLados.castShadow = true;
    g.add(malhaLados);
    if (piso.ponte) this.pilaresDaPonte(piso, g);
    return g;
  }

  private pilaresDaPonte(piso: Piso, g: THREE.Group): void {
    const xs = piso.poly.map((p) => p[0]), zs = piso.poly.map((p) => p[1]);
    const mat = new THREE.MeshStandardMaterial({ color: '#8b5a35', roughness: 0.85 });
    const h = (piso.h ?? 0) - CHAO_Y;
    for (const x of [Math.min(...xs) + 0.12, Math.max(...xs) - 0.12]) for (const z of [Math.min(...zs) + 0.3, (Math.min(...zs) + Math.max(...zs)) / 2, Math.max(...zs) - 0.3]) {
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, h, 8), mat);
      pilar.position.set(x, CHAO_Y + h / 2 - 0.1, z); pilar.castShadow = true; g.add(pilar);
    }
  }

  /** Borda de madeira (caixa arredondada) que acompanha a inclinação da rampa. */
  private parede(a: P2, b: P2, esp: number, alta: number, mat: THREE.Material, tampa: THREE.Material): THREE.Object3D {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-3) {
      // poste para-choque redondo
      const g = new THREE.Group();
      const h0 = this.alturaEm(a[0], a[1]);
      const corpo = new THREE.Mesh(new THREE.CylinderGeometry(esp, esp, alta * 1.3, 24), mat);
      corpo.position.set(a[0], h0 + alta * 0.65, a[1]);
      const topo = new THREE.Mesh(new THREE.SphereGeometry(esp, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), tampa);
      topo.position.set(a[0], h0 + alta * 1.3, a[1]);
      corpo.castShadow = topo.castShadow = true;
      g.add(corpo, topo);
      return g;
    }
    const geo = new RoundedBoxGeometry(len + esp * 2, alta, esp * 2, 3, Math.min(0.06, esp * 0.8));
    const malha = new THREE.Mesh(geo, mat);
    const ha = this.alturaParede(a, b, 0), hb = this.alturaParede(a, b, 1);
    // base ortonormal destra: X = ao longo da parede, Y = "para cima" perpendicular, Z = X × Y
    const eixo = new THREE.Vector3(b[0] - a[0], hb - ha, b[1] - a[1]).normalize();
    const cima = new THREE.Vector3(0, 1, 0).addScaledVector(eixo, -eixo.y).normalize();
    const lado = eixo.clone().cross(cima).normalize();
    malha.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(eixo, cima, lado));
    malha.position.set((a[0] + b[0]) / 2, (ha + hb) / 2 + alta / 2 - 0.03, (a[1] + b[1]) / 2);
    malha.castShadow = true;
    if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
      // repetição da textura proporcional ao comprimento
      const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 1.6));
    }
    return malha;
  }
  /** Altura do chão na ponta da parede (amostra um pouco para dentro para pegar o piso certo). */
  private alturaParede(a: P2, b: P2, t: number): number {
    const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    let melhor = -Infinity;
    for (const [dx, dz] of [[0, 0], [0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15]]) {
      const h = this.fisica.pisoEm(x + dx, z + dz) ? this.alturaEm(x + dx, z + dz) : -Infinity;
      melhor = Math.max(melhor, h);
    }
    return Number.isFinite(melhor) ? melhor : 0;
  }

  private copoEBandeira(): void {
    const [x, z] = this.pista.buraco;
    const h = this.alturaEm(x + RAIO_BURACO * 1.5, z) ?? 0;
    const copo = new THREE.Mesh(new THREE.CylinderGeometry(RAIO_BURACO, RAIO_BURACO * 0.96, 0.42, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#2b3a2e', roughness: 1, side: THREE.BackSide }));
    copo.position.set(x, h - 0.21, z);
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(RAIO_BURACO, 40), new THREE.MeshStandardMaterial({ color: '#16211a', roughness: 1 }));
    fundo.rotation.x = -Math.PI / 2; fundo.position.set(x, h - 0.41, z);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(RAIO_BURACO + 0.012, 0.018, 8, 48), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.4 }));
    aro.rotation.x = -Math.PI / 2; aro.position.set(x, h + 0.004, z);
    this.grupo.add(copo, fundo, aro);

    this.haste = new THREE.Group();
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.7, 10), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.35 }));
    poste.position.y = 0.85 - 0.35; poste.castShadow = true;
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffd56b', roughness: 0.3, metalness: 0.2 }));
    bola.position.y = 1.7 - 0.35;
    const pano = new THREE.PlaneGeometry(0.72, 0.48, 14, 6);
    pano.translate(0.36, 0, 0);
    this.bandeira = new THREE.Mesh(pano, new THREE.MeshStandardMaterial({ map: texBandeira(), roughness: 0.8, side: THREE.DoubleSide }));
    this.bandeira.position.set(0.02, 1.38 - 0.35, 0);
    this.bandeira.castShadow = true;
    this.bandeiraBase = Float32Array.from(pano.getAttribute('position').array as Float32Array);
    this.haste.add(poste, bola, this.bandeira);
    this.haste.position.set(x, h, z);
    this.grupo.add(this.haste);
  }

  private tee(): void {
    const [x, z] = this.pista.tee;
    const h = this.alturaEm(x, z);
    const tapete = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.03, 0.9, 2, 0.012), new THREE.MeshStandardMaterial({ color: '#3f8f3a', roughness: 0.95 }));
    tapete.position.set(x, h + 0.012, z);
    const marca = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 24), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.6 }));
    marca.rotation.x = -Math.PI / 2; marca.position.set(x, h + 0.03, z);
    this.grupo.add(tapete, marca);
  }

  private obstaculo(o: NonNullable<Pista['obstaculos']>[number]): void {
    const madeira = MAT.madeira();
    if (o.tipo === 'gira-gira') {
      const g = new THREE.Group();
      const [cx, cz] = o.centro;
      const h = this.alturaEm(cx, cz);
      const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 24), new THREE.MeshStandardMaterial({ color: '#ceb7ef', roughness: 0.5 }));
      eixo.position.y = 0.25;
      const chapeu = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.32, 24), new THREE.MeshStandardMaterial({ color: '#ff9d52', roughness: 0.5 }));
      chapeu.position.y = 0.66;
      g.add(eixo, chapeu);
      const pas = new THREE.Group();
      for (let i = 0; i < o.pas; i++) {
        const pa = new THREE.Mesh(new RoundedBoxGeometry(o.raio - 0.15, 0.26, 0.2, 3, 0.06), madeira);
        pa.position.set((o.raio + 0.15) / 2, 0.16, 0);
        const braco = new THREE.Group(); braco.rotation.y = -(i * Math.PI * 2) / o.pas; braco.add(pa);
        pas.add(braco);
      }
      g.add(pas);
      g.position.set(cx, h, cz);
      g.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = true; });
      this.grupo.add(g);
      this.moveis.push({ malha: pas, obst: o });
    } else {
      const len = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
      const g = new THREE.Group();
      const corpo = new THREE.Mesh(new RoundedBoxGeometry(len + 0.32, 0.34, 0.32, 3, 0.07), new THREE.MeshStandardMaterial({ color: '#ff9d52', roughness: 0.5 }));
      corpo.position.y = 0.17;
      const faixa = new THREE.Mesh(new RoundedBoxGeometry(len * 0.5, 0.1, 0.34, 2, 0.03), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.5 }));
      faixa.position.y = 0.2;
      g.add(corpo, faixa);
      g.rotation.y = -Math.atan2(o.b[1] - o.a[1], o.b[0] - o.a[0]);
      g.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = true; });
      this.grupo.add(g);
      this.moveis.push({ malha: g, obst: o });
    }
  }

  /** Túnel em forma de casinha de cachorro (telhado fica transparente quando a bola passa). */
  private casinha(t: NonNullable<Pista['tunel']>): void {
    const len = Math.hypot(t.ate[0] - t.de[0], t.ate[1] - t.de[1]);
    const cx = (t.de[0] + t.ate[0]) / 2, cz = (t.de[1] + t.ate[1]) / 2;
    const h = this.alturaEm(cx, cz);
    const g = new THREE.Group();
    const w = t.largura / 2 + 0.25;
    const matTelhado = new THREE.MeshStandardMaterial({ color: '#e0634f', roughness: 0.7, transparent: true });
    const matParede = new THREE.MeshStandardMaterial({ color: '#fff4dc', roughness: 0.8, transparent: true });
    for (const lado of [-1, 1]) {
      const agua = new THREE.Mesh(new RoundedBoxGeometry(w * 1.25, 0.08, len + 0.5, 2, 0.03), matTelhado);
      agua.position.set(lado * w * 0.5, 0.95, 0);
      agua.rotation.z = lado * -0.62;
      g.add(agua); this.telhado.push(agua);
      const parede = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.62, len, 2, 0.04), matParede);
      parede.position.set(lado * (t.largura / 2 + 0.1), 0.31, 0);
      g.add(parede); this.telhado.push(parede);
    }
    // frontão com arco
    for (const lado of [-1, 1]) {
      const forma = new THREE.Shape();
      forma.moveTo(-w, 0); forma.lineTo(w, 0); forma.lineTo(w, 0.62); forma.lineTo(0, 1.22); forma.lineTo(-w, 0.62); forma.lineTo(-w, 0);
      const arco = new THREE.Path(); arco.moveTo(-t.largura / 2 + 0.05, 0); arco.lineTo(-t.largura / 2 + 0.05, 0.35); arco.absarc(0, 0.35, t.largura / 2 - 0.05, Math.PI, 0, true); arco.lineTo(t.largura / 2 - 0.05, 0); forma.holes.push(arco);
      const frontao = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.1, bevelEnabled: false }), matParede);
      frontao.position.set(0, 0, lado * len / 2 - (lado > 0 ? 0 : 0.1));
      g.add(frontao); this.telhado.push(frontao);
    }
    const placa = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshStandardMaterial({ map: texBandeira('#ffd56b'), roughness: 0.6, transparent: true }));
    placa.position.set(0, 0.86, len / 2 + 0.11);
    g.add(placa); this.telhado.push(placa);
    g.position.set(cx, h, cz);
    g.rotation.y = -Math.atan2(t.ate[0] - t.de[0], -(t.ate[1] - t.de[1])) ;
    g.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = true; });
    this.grupo.add(g);
  }

  private lago(poly: P2[]): void {
    const forma = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ShapeGeometry(forma, 8);
    const mat = new THREE.MeshStandardMaterial({ color: '#4fb6dc', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.86, emissive: '#1d6f95', emissiveIntensity: 0.18 });
    const agua = new THREE.Mesh(geo, mat);
    agua.rotation.x = -Math.PI / 2; agua.position.y = CHAO_Y + 0.12;
    this.grupo.add(agua); this.agua.push(agua);
    // margem de pedrinhas
    const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
    const borda = new THREE.Mesh(new RoundedBoxGeometry(Math.max(...xs) - Math.min(...xs) + 0.4, 0.14, Math.max(...zs) - Math.min(...zs) + 0.4, 3, 0.07), new THREE.MeshStandardMaterial({ color: '#c9b79a', roughness: 0.95 }));
    borda.position.set((Math.max(...xs) + Math.min(...xs)) / 2, CHAO_Y + 0.02, (Math.max(...zs) + Math.min(...zs)) / 2);
    this.grupo.add(borda);
  }

  /** Bola desapareceu no buraco: bandeira sobe girando. */
  comemorar(): void { this.levantarBandeira = 1; }
  reiniciarBandeira(): void { this.levantarBandeira = 0; this.haste.position.y = this.alturaEm(this.pista.buraco[0] + RAIO_BURACO * 1.5, this.pista.buraco[1]); this.haste.rotation.y = 0; }

  atualizar(t: number, dt: number, bolaX: number, bolaZ: number): void {
    // bandeira ao vento
    const pos = this.bandeira.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = this.bandeiraBase[i * 3];
      pos.setZ(i, Math.sin(x * 6 - t * 4.2) * 0.07 * x + Math.sin(t * 2.3 + x * 3) * 0.015);
    }
    pos.needsUpdate = true;
    this.bandeira.geometry.computeVertexNormals();
    if (this.levantarBandeira > 0) {
      this.haste.position.y += dt * 0.5 * this.levantarBandeira;
      this.haste.rotation.y += dt * 3;
      this.levantarBandeira = Math.max(0, this.levantarBandeira - dt * 0.5);
    }
    // obstáculos seguem o relógio da física
    for (const { malha, obst } of this.moveis) {
      if (obst.tipo === 'gira-gira') malha.rotation.y = -((obst.fase ?? 0) + obst.vel * this.fisica.tempo);
      else {
        const [s] = segmentosObstaculo(obst, this.fisica.tempo);
        malha.position.set((s.ax + s.bx) / 2, this.alturaEm((s.ax + s.bx) / 2, (s.az + s.bz) / 2), (s.az + s.bz) / 2);
      }
    }
    // telhado da casinha some quando a bola está embaixo
    if (this.pista.tunel && this.telhado.length) {
      const tn = this.pista.tunel;
      const z0 = Math.min(tn.de[1], tn.ate[1]) - 0.6, z1 = Math.max(tn.de[1], tn.ate[1]) + 0.6;
      const embaixo = bolaZ > z0 && bolaZ < z1 && Math.abs(bolaX - tn.de[0]) < tn.largura;
      const alvo = embaixo ? 0.22 : 1;
      for (const m of this.telhado) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.opacity += (alvo - mat.opacity) * Math.min(1, dt * 8);
        mat.depthWrite = mat.opacity > 0.95;
      }
    }
    for (const a of this.agua) (a.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.16 + Math.sin(t * 1.7) * 0.05;
  }

  descartar(): void {
    this.grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); }
      }
    });
    this.grupo.removeFromParent();
  }
}

function insidePoly(poly: P2[], x: number, z: number): boolean {
  let ok = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ok = !ok;
  }
  return ok;
}
