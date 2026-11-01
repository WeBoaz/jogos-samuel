// Cena base: renderizador, céu, luz do sol com sombra suave, terreno e decoração
// (árvores, arbustos, flores, pedras, nuvens e morros ao fundo). A decoração é refeita por pista
// e evita o chão da pista e a água.
import * as THREE from 'three';
import type { P2, Pista } from '../core/tipos';
import { dentro } from '../core/fisica';
import { texCeu, texGrama } from './texturas';

export const CHAO_Y = -0.36;

export interface Limites { x0: number; x1: number; z0: number; z1: number }
export function limitesDaPista(p: Pista): Limites {
  const pts: P2[] = p.pisos.flatMap((q) => q.poly);
  return {
    x0: Math.min(...pts.map((q) => q[0])), x1: Math.max(...pts.map((q) => q[0])),
    z0: Math.min(...pts.map((q) => q[1])), z1: Math.max(...pts.map((q) => q[1])),
  };
}

function rnd(seed: number) { let s = seed; return () => (s = (s * 16807 + 11) % 2147483647) / 2147483647; }

export class Mundo {
  readonly renderer: THREE.WebGLRenderer;
  readonly cena = new THREE.Scene();
  readonly sol: THREE.DirectionalLight;
  private decoracao = new THREE.Group();
  private nuvens = new THREE.Group();
  private qualidade = 2;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Neutral preserva as cores do kit (o ACES deixava o laranja com cara de bege)
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.cena.background = texCeu();
    this.cena.fog = new THREE.Fog('#d9eff3', 26, 62);

    const ceu = new THREE.HemisphereLight('#d6ecff', '#7a9a56', 0.95);
    this.cena.add(ceu);
    this.sol = new THREE.DirectionalLight('#fff0d4', 1.9);
    this.sol.position.set(7, 14, 6);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    this.sol.shadow.bias = -0.0004;
    this.sol.shadow.normalBias = 0.025;
    this.sol.shadow.radius = 4;
    this.cena.add(this.sol, this.sol.target);
    const contra = new THREE.DirectionalLight('#cfe3ff', 0.45);
    contra.position.set(-6, 5, -8);
    this.cena.add(contra);

    // terreno
    const grama = texGrama(); grama.repeat.set(18, 18);
    const terreno = new THREE.Mesh(new THREE.CircleGeometry(70, 64), new THREE.MeshStandardMaterial({ map: grama, roughness: 0.95 }));
    terreno.rotation.x = -Math.PI / 2; terreno.position.y = CHAO_Y; terreno.receiveShadow = true;
    this.cena.add(terreno);
    this.criarMorros();
    this.criarNuvens();
    this.cena.add(this.decoracao, this.nuvens);
  }

  /** Ajusta a câmera de sombra e refaz a decoração em volta da pista. */
  prepararPista(p: Pista, livres: P2[] = []): void {
    const L = limitesDaPista(p);
    const cx = (L.x0 + L.x1) / 2, cz = (L.z0 + L.z1) / 2;
    const raio = Math.max(L.x1 - L.x0, L.z1 - L.z0) / 2 + 3;
    this.sol.target.position.set(cx, 0, cz);
    this.sol.position.set(cx + 7, 14, cz + 6);
    const cam = this.sol.shadow.camera;
    cam.left = -raio; cam.right = raio; cam.top = raio; cam.bottom = -raio; cam.near = 1; cam.far = 40;
    cam.updateProjectionMatrix();
    this.refazerDecoracao(p, L, livres);
  }

  private refazerDecoracao(p: Pista, L: Limites, livres: P2[]): void {
    // libera geometria, material e buffers de instância da decoração anterior (sem vazamento na GPU)
    this.decoracao.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        for (const mt of Array.isArray(o.material) ? o.material : [o.material]) mt.dispose();
        if (o instanceof THREE.InstancedMesh) o.dispose();
      }
    });
    this.decoracao.clear();
    // caixa da pista + água (o lago é maior que os pisos)
    const todos: P2[] = [...p.pisos.flatMap((q) => q.poly), ...(p.agua ?? []).flat()];
    const B = { x0: Math.min(...todos.map((q) => q[0])), x1: Math.max(...todos.map((q) => q[0])), z0: Math.min(...todos.map((q) => q[1])), z1: Math.max(...todos.map((q) => q[1])) };
    const r = rnd(p.id * 97 + 13);
    const ocupado = (x: number, z: number, folga: number) => {
      if (x > B.x0 - folga && x < B.x1 + folga && z > B.z0 - folga && z < B.z1 + folga) {
        for (const q of p.pisos) if (dentro(q.poly, x, z, folga)) return true;
        for (const a of p.agua ?? []) if (dentro(a, x, z, folga)) return true;
      }
      for (const [lx, lz] of livres) if (Math.hypot(x - lx, z - lz) < 1.1) return true;   // lugar dos pets
      return false;
    };
    const sorteia = (n: number, rMin: number, rMax: number, folga: number) => {
      const cx = (L.x0 + L.x1) / 2, cz = (L.z0 + L.z1) / 2;
      const out: [number, number][] = [];
      for (let t = 0; out.length < n && t < n * 30; t++) {
        const a = r() * Math.PI * 2, d = rMin + r() * (rMax - rMin);
        const x = cx + Math.cos(a) * d * ((L.x1 - L.x0) / 2 + 2) / 4, z = cz + Math.sin(a) * d * ((L.z1 - L.z0) / 2 + 2) / 4;
        if (!ocupado(x, z, folga) && out.every(([ox, oz]) => Math.hypot(ox - x, oz - z) > folga * 1.4)) out.push([x, z]);
      }
      return out;
    };

    // árvores redondas: tronco + 3 copas facetadas (InstancedMesh por parte); pinheiros: 3 cones
    const todasArvores = sorteia(30, 4.6, 9.5, 1.1);
    const arvores = todasArvores.filter((_, i) => i % 3 !== 2), pinheiros = todasArvores.filter((_, i) => i % 3 === 2);
    const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1, 7), new THREE.MeshStandardMaterial({ color: '#8b5a35', roughness: 0.9 }), todasArvores.length);
    const copaGeo = new THREE.IcosahedronGeometry(0.62, 1);
    const copaMat = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
    const copas = new THREE.InstancedMesh(copaGeo, copaMat, arvores.length * 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3(), cor = new THREE.Color();
    const verdes = ['#4f9d3a', '#5fae45', '#3f8c37', '#6bbd4e', '#82c45a'];
    arvores.forEach(([x, z], i) => {
      const k = 0.8 + r() * 0.8;
      m.compose(pos.set(x, CHAO_Y + 0.5 * k, z), q.identity(), s.set(k, k, k)); tronco.setMatrixAt(i, m);
      for (let c = 0; c < 3; c++) {
        const kk = k * (1 - c * 0.22) * (0.9 + r() * 0.25);
        m.compose(pos.set(x + (r() - 0.5) * 0.2, CHAO_Y + k * (1.05 + c * 0.55), z + (r() - 0.5) * 0.2), q.setFromEuler(new THREE.Euler(r(), r() * 6, r())), s.set(kk, kk * 0.92, kk));
        copas.setMatrixAt(i * 3 + c, m);
        copas.setColorAt(i * 3 + c, cor.set(['#3f8c37', '#55a640', '#6bbd4e'][c]).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.05));
      }
    });
    const conesGeo = new THREE.ConeGeometry(0.7, 1.1, 8);
    const cones = new THREE.InstancedMesh(conesGeo, new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), pinheiros.length * 3);
    pinheiros.forEach(([x, z], i) => {
      const k = 0.9 + r() * 0.7, j = arvores.length + i;
      m.compose(pos.set(x, CHAO_Y + 0.4 * k, z), q.identity(), s.set(k * 0.8, k * 0.8, k * 0.8)); tronco.setMatrixAt(j, m);
      for (let c = 0; c < 3; c++) {
        const kk = k * (1 - c * 0.25);
        m.compose(pos.set(x, CHAO_Y + k * (1.0 + c * 0.6), z), q.setFromEuler(new THREE.Euler(0, r() * 6, 0)), s.set(kk, kk, kk));
        cones.setMatrixAt(i * 3 + c, m);
        cones.setColorAt(i * 3 + c, cor.set(['#2f7a3a', '#3a8c43', '#4a9e4c'][c]));
      }
    });
    tronco.castShadow = copas.castShadow = cones.castShadow = true;
    this.decoracao.add(tronco, copas, cones);

    // arbustos
    const arb = sorteia(34, 3.2, 8, 0.55);
    const arbustos = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), arb.length * 2);
    arb.forEach(([x, z], i) => {
      for (let c = 0; c < 2; c++) {
        const k = 0.7 + r() * 0.6;
        m.compose(pos.set(x + c * 0.25, CHAO_Y + 0.18 * k, z + (r() - 0.5) * 0.2), q.identity(), s.set(k, k * 0.75, k));
        arbustos.setMatrixAt(i * 2 + c, m); arbustos.setColorAt(i * 2 + c, cor.set(verdes[Math.floor(r() * 5)]).offsetHSL(0, 0, -0.04));
      }
    });
    arbustos.castShadow = true;
    this.decoracao.add(arbustos);

    // flores (cores do kit) em tufos
    const tufos = sorteia(60, 2.4, 9, 0.35);
    const nFlores = tufos.length * 5;
    const petalas = new THREE.CircleGeometry(0.075, 5); petalas.rotateX(-Math.PI / 2);
    const flores = new THREE.InstancedMesh(petalas, new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide }), nFlores);
    const miolos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffd56b', roughness: 0.5 }), nFlores);
    const caules = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), new THREE.MeshStandardMaterial({ color: '#4c8f36' }), nFlores);
    const coresFlor = ['#ffffff', '#ff9ad0', '#ceb7ef', '#ff9d52', '#fffdf7', '#ff7a7a'];
    let n = 0;
    for (const [x, z] of tufos) {
      const c = coresFlor[Math.floor(r() * coresFlor.length)];
      for (let k = 0; k < 5; k++, n++) {
        const fx = x + (r() - 0.5) * 0.5, fz = z + (r() - 0.5) * 0.5, h = 0.12 + r() * 0.12;
        m.compose(pos.set(fx, CHAO_Y + h, fz), q.setFromEuler(new THREE.Euler(0, r() * 6, 0)), s.set(1, 1, 1)); flores.setMatrixAt(n, m); flores.setColorAt(n, cor.set(c));
        m.compose(pos.set(fx, CHAO_Y + h + 0.012, fz), q.identity(), s.set(1, 1, 1)); miolos.setMatrixAt(n, m);
        m.compose(pos.set(fx, CHAO_Y + h / 2, fz), q.identity(), s.set(1, h, 1)); caules.setMatrixAt(n, m);
      }
    }
    this.decoracao.add(flores, miolos, caules);

    // pedras
    const ped = sorteia(12, 3, 8, 0.5);
    const pedras = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: '#a8a39a', roughness: 0.95, flatShading: true }), ped.length);
    ped.forEach(([x, z], i) => { const k = 0.6 + r() * 0.9; m.compose(pos.set(x, CHAO_Y + 0.08 * k, z), q.setFromEuler(new THREE.Euler(r(), r() * 6, r())), s.set(k * 1.2, k * 0.7, k)); pedras.setMatrixAt(i, m); });
    pedras.castShadow = true; pedras.receiveShadow = true;
    this.decoracao.add(pedras);
  }

  private criarMorros(): void {
    const mats = [new THREE.MeshStandardMaterial({ color: '#8fca6c', roughness: 1, flatShading: true }), new THREE.MeshStandardMaterial({ color: '#79b85c', roughness: 1, flatShading: true })];
    const r = rnd(5);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + r() * 0.3, d = 44 + r() * 10;
      const morro = new THREE.Mesh(new THREE.SphereGeometry(8 + r() * 6, 12, 8), mats[i % 2]);
      morro.scale.set(1, 0.35 + r() * 0.25, 1);
      morro.position.set(Math.cos(a) * d, CHAO_Y - 1, Math.sin(a) * d);
      this.cena.add(morro);
    }
  }

  private criarNuvens(): void {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.25, flatShading: true });
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const r = rnd(21);
    for (let i = 0; i < 9; i++) {
      const nuvem = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const b = new THREE.Mesh(geo, mat);
        const kk = 1 + r() * 1.2;
        b.scale.set(kk * 1.3, kk * 0.8, kk);
        b.position.set(k * 1.4 - 2, r() * 0.6, r() * 0.8);
        nuvem.add(b);
      }
      const a = r() * Math.PI * 2, d = 18 + r() * 18;
      nuvem.position.set(Math.cos(a) * d, 11 + r() * 5, Math.sin(a) * d);
      nuvem.userData.vel = 0.15 + r() * 0.2;
      this.nuvens.add(nuvem);
    }
  }

  atualizar(dt: number): void {
    for (const n of this.nuvens.children) {
      n.position.x += n.userData.vel * dt;
      if (n.position.x > 40) n.position.x = -40;
    }
  }

  /** Qualidade adaptativa: aparelho sofrendo → menos pixels e sombra menor. */
  reduzirQualidade(): boolean {
    if (this.qualidade === 0) return false;
    this.qualidade--;
    if (this.qualidade === 1) this.renderer.setPixelRatio(1);
    if (this.qualidade === 0) { this.sol.shadow.mapSize.set(1024, 1024); this.sol.shadow.map?.dispose(); this.sol.shadow.map = null; }
    return true;
  }
  get nivelQualidade(): number { return this.qualidade; }
}
