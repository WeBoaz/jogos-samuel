// Desenho de uma pista: placas de grama com laterais de terra, buraco recortado com copo,
// bandeira que balança, bordas de madeira arredondadas (seguindo a rampa) com postes nos cantos,
// para-choques, tee com pegada, obstáculos móveis, casinha-túnel com telhado, lago e ponte.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Fisica } from '../core/fisica';
import { RAIO_BURACO, segmentosObstaculo } from '../core/fisica';
import type { P2, Pista, Piso } from '../core/tipos';
import { CHAO_Y } from './mundo';
import { texAgua, texBandeira, texGreen, texLateral, texMadeira, texPata, texRampa, texTabuas, texTelhas } from './texturas';

const lisa = (cor: string, rough = 0.6) => new THREE.MeshStandardMaterial({ color: cor, roughness: rough });

function alturaPiso(p: Piso, x: number, z: number): number {
  if (!p.rampa) return p.h ?? 0;
  const r = p.rampa, c = r.eixo === 'x' ? x : z;
  if (r.ate === r.de) return r.h1;
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
  private texAgua: THREE.Texture | null = null;
  private levantarBandeira = 0;

  constructor(readonly pista: Pista, private fisica: Fisica) {
    const verde = new THREE.MeshStandardMaterial({ map: texGreen(), roughness: 0.92 });
    const rampa = new THREE.MeshStandardMaterial({ map: texRampa(), roughness: 0.9 });
    const lateral = new THREE.MeshStandardMaterial({ map: texLateral(), roughness: 0.95 });
    const tabuas = new THREE.MeshStandardMaterial({ map: texTabuas(), roughness: 0.8 });
    for (const piso of pista.pisos) this.grupo.add(this.placa(piso, piso.ponte ? tabuas : piso.rampa ? rampa : verde, lateral));
    const madeira = new THREE.MeshStandardMaterial({ map: texMadeira(), roughness: 0.6 });
    const tampaMadeira = lisa('#e8b77a', 0.55);
    const borracha = lisa('#ff9d52', 0.45);
    const branco = lisa('#fffdf7', 0.5);
    const cantos = new Map<string, { p: P2; esp: number }>();
    for (const w of pista.paredes) {
      const para = w.tipo === 'para-choque';
      const esp = w.esp ?? 0.14;
      this.grupo.add(this.parede(w.a, w.b, esp, w.alta ?? 0.32, para ? borracha : madeira, para ? branco : tampaMadeira));
      if (!para && Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) > 1e-3) for (const q of [w.a, w.b]) cantos.set(`${q[0].toFixed(2)},${q[1].toFixed(2)}`, { p: q, esp });
    }
    // postes nos cantos: escondem as emendas e dão cara de minigolfe de verdade
    const posteGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
    const capGeo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    for (const { p, esp } of cantos.values()) {
      const h = this.alturaParede(p, p, 0), r = esp * 1.4, alto = 0.42;
      const poste = new THREE.Mesh(posteGeo, madeira); poste.scale.set(r, alto, r); poste.position.set(p[0], h + alto / 2 - 0.03, p[1]);
      const cap = new THREE.Mesh(capGeo, branco); cap.scale.set(r, r * 0.8, r); cap.position.set(p[0], h + alto - 0.03, p[1]);
      poste.castShadow = cap.castShadow = true;
      this.grupo.add(poste, cap);
    }
    this.copoEBandeira();
    this.tee();
    for (const o of pista.obstaculos ?? []) this.obstaculo(o);
    if (pista.tunel) this.casinha(pista.tunel);
    for (const a of pista.agua ?? []) this.lago(a);
    for (const piso of pista.pisos) if (piso.ponte) this.corrimao(piso);
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
    // na rampa, a textura (setas) aponta para a subida
    const r = piso.rampa;
    const sobe = r && r.ate !== r.de ? Math.sign((r.h1 - r.h0) / (r.ate - r.de)) : 0;   // sentido da subida no eixo
    for (const v of todos) {
      pos.push(v.x, alturaPiso(piso, v.x, v.y), v.y);
      if (!r) uv.push(v.x / 2, -v.y / 2);
      else if (r.eixo === 'x') uv.push(v.y / 2, (v.x * sobe) / 2);
      else uv.push(v.x / 2, (v.y * sobe) / 2);
    }
    for (const [a, b, c] of tris) idx.push(a, c, b);
    const topo = new THREE.BufferGeometry();
    topo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    topo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    topo.setIndex(idx); topo.computeVertexNormals();
    g.add(new THREE.Mesh(topo, matTopo));

    const lp: number[] = [], luv: number[] = [], li: number[] = [];
    const base = piso.ponte ? null : CHAO_Y;
    poly.forEach(([ax, az], i) => {
      const [bx, bz] = poly[(i + 1) % poly.length];
      const ha = alturaPiso(piso, ax, az), hb = alturaPiso(piso, bx, bz);
      const ya = base ?? ha - 0.16, yb = base ?? hb - 0.16;
      const len = Math.hypot(bx - ax, bz - az), k = lp.length / 3;
      lp.push(ax, ha, az, bx, hb, bz, bx, yb, bz, ax, ya, az);
      const v1 = Math.max(0.3, (ha - ya) / 0.7);
      luv.push(0, 0, len / 1.4, 0, len / 1.4, v1, 0, v1);
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
    const mat = lisa('#8b5a35', 0.85);
    const h = (piso.h ?? 0) - CHAO_Y;
    for (const x of [Math.min(...xs) + 0.12, Math.max(...xs) - 0.12]) for (const z of [Math.min(...zs) + 0.3, (Math.min(...zs) + Math.max(...zs)) / 2, Math.max(...zs) - 0.3]) {
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, h, 10), mat);
      pilar.position.set(x, CHAO_Y + h / 2 - 0.1, z); pilar.castShadow = true; g.add(pilar);
    }
  }

  /** Corrimão da ponte, só visual, por fora do chão (a bola cai se sair da ponte). */
  private corrimao(piso: Piso): void {
    const xs = piso.poly.map((p) => p[0]), zs = piso.poly.map((p) => p[1]);
    const z0 = Math.min(...zs), z1 = Math.max(...zs), h = piso.h ?? 0;
    const mat = lisa('#8b5a35', 0.8), corda = lisa('#e8b77a', 0.6);
    for (const x of [Math.min(...xs) - 0.12, Math.max(...xs) + 0.12]) {
      for (let z = z0 + 0.1; z <= z1 - 0.05; z += 0.58) {
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.55, 8), mat);
        poste.position.set(x, h - 0.05 + 0.27, z); poste.castShadow = true; this.grupo.add(poste);
      }
      const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, z1 - z0, 8), corda);
      barra.rotation.x = Math.PI / 2; barra.position.set(x, h + 0.45, (z0 + z1) / 2); barra.castShadow = true;
      this.grupo.add(barra);
    }
  }

  /** Borda (caixa arredondada) que acompanha a inclinação da rampa, com faixa clara em cima. */
  private parede(a: P2, b: P2, esp: number, alta: number, mat: THREE.Material, tampa: THREE.Material): THREE.Object3D {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-3) {
      const g = new THREE.Group();
      const h0 = this.alturaEm(a[0], a[1]);
      const corpo = new THREE.Mesh(new THREE.CylinderGeometry(esp, esp, alta * 1.3, 24), mat);
      corpo.position.set(a[0], h0 + alta * 0.65, a[1]);
      const faixa = new THREE.Mesh(new THREE.CylinderGeometry(esp * 1.02, esp * 1.02, alta * 0.25, 24), tampa);
      faixa.position.set(a[0], h0 + alta * 0.7, a[1]);
      const topo = new THREE.Mesh(new THREE.SphereGeometry(esp, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), tampa);
      topo.position.set(a[0], h0 + alta * 1.3, a[1]);
      corpo.castShadow = topo.castShadow = true;
      g.add(corpo, faixa, topo);
      return g;
    }
    const g = new THREE.Group();
    const geo = new RoundedBoxGeometry(len, alta, esp * 2, 3, Math.min(0.06, esp * 0.8));
    const malha = new THREE.Mesh(geo, mat);
    const cobertura = new THREE.Mesh(new RoundedBoxGeometry(len, 0.05, esp * 2 + 0.02, 2, 0.02), tampa);
    cobertura.position.y = alta / 2;
    g.add(malha, cobertura);
    const ha = this.alturaParede(a, b, 0), hb = this.alturaParede(a, b, 1);
    // base ortonormal destra: X = ao longo da parede, Y = "para cima" perpendicular, Z = X × Y
    const eixo = new THREE.Vector3(b[0] - a[0], hb - ha, b[1] - a[1]).normalize();
    const cima = new THREE.Vector3(0, 1, 0).addScaledVector(eixo, -eixo.y).normalize();
    const lado = eixo.clone().cross(cima).normalize();
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(eixo, cima, lado));
    g.position.set((a[0] + b[0]) / 2, (ha + hb) / 2 + alta / 2 - 0.03, (a[1] + b[1]) / 2);
    malha.castShadow = cobertura.castShadow = true;
    if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
      const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 1.6));
    }
    return g;
  }
  /** Altura do chão na ponta da parede (amostra em volta para pegar o piso certo). */
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
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(RAIO_BURACO, 40), lisa('#16211a', 1));
    fundo.rotation.x = -Math.PI / 2; fundo.position.set(x, h - 0.41, z);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(RAIO_BURACO + 0.012, 0.022, 8, 48), lisa('#fffdf7', 0.4));
    aro.rotation.x = -Math.PI / 2; aro.position.set(x, h + 0.004, z);
    this.grupo.add(copo, fundo, aro);

    this.haste = new THREE.Group();
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.7, 10), lisa('#fffdf7', 0.35));
    poste.position.y = 0.85 - 0.35; poste.castShadow = true;
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffd56b', roughness: 0.3, metalness: 0.2 }));
    bola.position.y = 1.7 - 0.35;
    const pano = new THREE.PlaneGeometry(0.76, 0.5, 14, 6);
    pano.translate(0.38, 0, 0);
    this.bandeira = new THREE.Mesh(pano, new THREE.MeshStandardMaterial({ map: texBandeira(), roughness: 0.8, side: THREE.DoubleSide }));
    this.bandeira.position.set(0.02, 1.38 - 0.35, 0);
    this.bandeira.castShadow = true;
    this.bandeiraBase = Float32Array.from(pano.getAttribute('position').array as Float32Array);
    this.haste.add(poste, bola, this.bandeira);
    this.haste.position.set(x, h, z);
    this.grupo.add(this.haste);
  }

  /** Tapete do tee com borda e pegada. */
  private tee(): void {
    const [x, z] = this.pista.tee;
    const h = this.alturaEm(x, z);
    const borda = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.035, 1.0, 2, 0.015), lisa('#2f7a33', 0.95));
    borda.position.set(x, h + 0.012, z);
    const miolo = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.84), new THREE.MeshStandardMaterial({ map: texPata('#4aa346'), roughness: 0.9 }));
    miolo.rotation.x = -Math.PI / 2; miolo.position.set(x, h + 0.032, z);
    this.grupo.add(borda, miolo);
  }

  private obstaculo(o: NonNullable<Pista['obstaculos']>[number]): void {
    if (o.tipo === 'gira-gira') {
      const g = new THREE.Group();
      const [cx, cz] = o.centro;
      const h = this.alturaEm(cx, cz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.04, 32), lisa('#326344', 0.8));
      base.position.y = 0.02;
      const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.52, 28), lisa('#ceb7ef', 0.45));
      eixo.position.y = 0.27;
      const topo = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 28), new THREE.MeshStandardMaterial({ map: texPata('#a77fe0'), roughness: 0.5 }));
      topo.position.y = 0.56;
      const chapeu = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 24), lisa('#ffd56b', 0.4));
      chapeu.position.y = 0.72;
      g.add(base, eixo, topo, chapeu);
      const pas = new THREE.Group();
      for (let i = 0; i < o.pas; i++) {
        const braco = new THREE.Group(); braco.rotation.y = -(i * Math.PI * 2) / o.pas;
        const comp = o.raio - 0.3;
        // pá listrada laranja e branco com bolinha amarela na ponta
        const n = 4;
        for (let k = 0; k < n; k++) {
          const seg = new THREE.Mesh(new RoundedBoxGeometry(comp / n + 0.01, 0.3, 0.26, 2, 0.08), lisa(k % 2 ? '#fffdf7' : '#ff9d52', 0.45));
          seg.position.set(0.3 + (comp / n) * (k + 0.5), 0.18, 0);
          braco.add(seg);
        }
        const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), lisa('#ffd56b', 0.35));
        ponta.position.set(o.raio - 0.02, 0.2, 0);
        braco.add(ponta);
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
      const n = 5;
      for (let k = 0; k < n; k++) {
        const seg = new THREE.Mesh(new RoundedBoxGeometry(len / n + 0.03, 0.36, 0.32, 2, 0.08), lisa(k % 2 ? '#fffdf7' : '#ff9d52', 0.45));
        seg.position.set(-len / 2 + (len / n) * (k + 0.5), 0.18, 0);
        g.add(seg);
      }
      for (const lado of [-1, 1]) {
        const roda = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), lisa('#ffd56b', 0.35));
        roda.position.set(lado * (len / 2 + 0.05), 0.2, 0);
        g.add(roda);
      }
      g.rotation.y = -Math.atan2(o.b[1] - o.a[1], o.b[0] - o.a[0]);
      g.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = true; });
      this.grupo.add(g);
      this.moveis.push({ malha: g, obst: o });
    }
  }

  /** Túnel em forma de casinha de cachorro (fica transparente quando a bola passa embaixo). */
  private casinha(t: NonNullable<Pista['tunel']>): void {
    const len = Math.hypot(t.ate[0] - t.de[0], t.ate[1] - t.de[1]);
    const cx = (t.de[0] + t.ate[0]) / 2, cz = (t.de[1] + t.ate[1]) / 2;
    const h = this.alturaEm(cx, cz);
    const g = new THREE.Group();
    const w = t.largura / 2 + 0.3;
    const telhas = texTelhas(); telhas.repeat.set(1.2, len * 2.2);
    const matTelhado = new THREE.MeshStandardMaterial({ map: telhas, roughness: 0.7, transparent: true });
    const matParede = new THREE.MeshStandardMaterial({ color: '#fff4dc', roughness: 0.8, transparent: true });
    const matEscuro = new THREE.MeshStandardMaterial({ color: '#2b3a2e', roughness: 1, transparent: true });
    const matCume = new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.5, transparent: true });
    for (const lado of [-1, 1]) {
      const agua = new THREE.Mesh(new RoundedBoxGeometry(w * 1.38, 0.08, len + 0.7, 2, 0.03), matTelhado);
      agua.position.set(lado * w * 0.52, 0.98, 0);
      agua.rotation.z = lado * -0.6;
      g.add(agua); this.telhado.push(agua);
      const parede = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.66, len, 2, 0.04), matParede);
      parede.position.set(lado * (t.largura / 2 + 0.12), 0.33, 0);
      g.add(parede); this.telhado.push(parede);
    }
    const cume = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len + 0.75, 12), matCume);
    cume.rotation.x = Math.PI / 2; cume.position.y = 1.36;
    g.add(cume); this.telhado.push(cume);
    for (const lado of [-1, 1]) {
      const forma = new THREE.Shape();
      forma.moveTo(-w, 0); forma.lineTo(w, 0); forma.lineTo(w, 0.66); forma.lineTo(0, 1.3); forma.lineTo(-w, 0.66); forma.lineTo(-w, 0);
      const arco = new THREE.Path(); arco.moveTo(-t.largura / 2 + 0.08, 0); arco.lineTo(-t.largura / 2 + 0.08, 0.36); arco.absarc(0, 0.36, t.largura / 2 - 0.08, Math.PI, 0, true); arco.lineTo(t.largura / 2 - 0.08, 0); forma.holes.push(arco);
      const frontao = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.1, bevelEnabled: false }), matParede);
      frontao.position.set(0, 0, lado * len / 2 - (lado > 0 ? 0 : 0.1));
      g.add(frontao); this.telhado.push(frontao);
      // contorno escuro do arco (lê como porta)
      const moldura = new THREE.Mesh(new THREE.TorusGeometry(t.largura / 2 - 0.06, 0.04, 8, 24, Math.PI), matEscuro);
      moldura.position.set(0, 0.36, lado * (len / 2 + 0.02));
      g.add(moldura); this.telhado.push(moldura);
    }
    const placa = new THREE.Mesh(new THREE.CircleGeometry(0.22, 28), new THREE.MeshStandardMaterial({ map: texPata('#ffd56b', '#193337'), roughness: 0.6, transparent: true }));
    placa.position.set(0, 0.92, len / 2 + 0.11);
    const aroPlaca = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 28), matEscuro);
    aroPlaca.position.copy(placa.position);
    g.add(placa, aroPlaca); this.telhado.push(placa, aroPlaca);
    g.position.set(cx, h, cz);
    g.rotation.y = -Math.atan2(t.ate[0] - t.de[0], -(t.ate[1] - t.de[1]));
    g.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = true; });
    this.grupo.add(g);
  }

  /** Lago com ondinhas, margem de pedrinhas e vitórias-régias. */
  private lago(poly: P2[]): void {
    const forma = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ShapeGeometry(forma, 8);
    const uv = geo.getAttribute('uv') as THREE.BufferAttribute, p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2.5, p.getY(i) / 2.5);
    this.texAgua = texAgua();
    const mat = new THREE.MeshStandardMaterial({ map: this.texAgua, roughness: 0.15, metalness: 0.05 });
    const agua = new THREE.Mesh(geo, mat);
    agua.rotation.x = -Math.PI / 2; agua.position.y = CHAO_Y + 0.1;
    this.grupo.add(agua); this.agua.push(agua);
    // pedrinhas pela margem
    const pedra = new THREE.DodecahedronGeometry(0.16, 0);
    const pedras = new THREE.InstancedMesh(pedra, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), 64);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3(), cor = new THREE.Color();
    let n = 0, sem = 3;
    const r = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < poly.length && n < 64; i++) {
      const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length];
      const len = Math.hypot(bx - ax, bz - az);
      for (let d = 0; d < len && n < 64; d += 0.42) {
        const t = d / len, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        if (this.fisica.pisoEm(x, z)) continue;
        const k = 0.7 + r() * 0.8;
        m.compose(pos.set(x + (r() - 0.5) * 0.12, CHAO_Y + 0.08, z + (r() - 0.5) * 0.12), q.setFromEuler(new THREE.Euler(r(), r() * 6, r())), s.set(k * 1.2, k * 0.6, k));
        pedras.setMatrixAt(n, m); pedras.setColorAt(n, cor.set(['#b9b2a5', '#a8a196', '#cfc8ba'][n % 3])); n++;
      }
    }
    pedras.count = n; pedras.castShadow = true;
    this.grupo.add(pedras);
    // vitórias-régias
    const folha = new THREE.CircleGeometry(0.26, 18, 0.3, Math.PI * 2 - 0.6); folha.rotateX(-Math.PI / 2);
    const matFolha = lisa('#4fa83d', 0.7);
    const xs = poly.map((v) => v[0]), zs = poly.map((v) => v[1]);
    for (let i = 0; i < 6; i++) {
      const x = Math.min(...xs) + 0.4 + r() * (Math.max(...xs) - Math.min(...xs) - 0.8), z = Math.min(...zs) + 0.4 + r() * (Math.max(...zs) - Math.min(...zs) - 0.8);
      if (this.fisica.pisoEm(x, z) || Math.abs(x) < 1.3) continue;
      const f = new THREE.Mesh(folha, matFolha);
      f.position.set(x, CHAO_Y + 0.115, z); f.rotation.y = r() * 6; f.scale.setScalar(0.7 + r() * 0.6);
      this.grupo.add(f);
      if (i % 2 === 0) { const flor = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), lisa('#ff9ad0', 0.5)); flor.position.set(x + 0.05, CHAO_Y + 0.16, z); this.grupo.add(flor); }
    }
  }

  /** Bola desapareceu no buraco: bandeira sobe girando. */
  comemorar(): void { this.levantarBandeira = 1; }
  reiniciarBandeira(): void { this.levantarBandeira = 0; this.haste.position.y = this.alturaEm(this.pista.buraco[0] + RAIO_BURACO * 1.5, this.pista.buraco[1]); this.haste.rotation.y = 0; }

  atualizar(t: number, dt: number, bolaX: number, bolaZ: number): void {
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
    for (const { malha, obst } of this.moveis) {
      if (obst.tipo === 'gira-gira') malha.rotation.y = -((obst.fase ?? 0) + obst.vel * this.fisica.tempo);
      else {
        const [s] = segmentosObstaculo(obst, this.fisica.tempo);
        malha.position.set((s.ax + s.bx) / 2, this.alturaEm((s.ax + s.bx) / 2, (s.az + s.bz) / 2), (s.az + s.bz) / 2);
      }
    }
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
    if (this.texAgua) { this.texAgua.offset.x = t * 0.02; this.texAgua.offset.y = Math.sin(t * 0.4) * 0.03; }
  }

  descartar(): void {
    this.grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); }
        if (o instanceof THREE.InstancedMesh) o.dispose();
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
