// O Doguinho (Jack Russell branco e marrom) e o Gatinho (amarelo tigrado), modelados com formas
// arredondadas. Ficam ao lado do tee, olham a bola, abanam o rabo e pulam quando a bola cai.
import * as THREE from 'three';
import { texGato } from './texturas';

const lisa = (cor: string, rough = 0.75) => new THREE.MeshStandardMaterial({ color: cor, roughness: rough });

function olho(): THREE.Group {
  const g = new THREE.Group();
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), lisa('#1d1a17', 0.25));
  const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  brilho.position.set(0.012, 0.014, 0.028);
  g.add(iris, brilho);
  return g;
}

export class Pet {
  readonly grupo = new THREE.Group();
  protected cabeca = new THREE.Group();
  protected rabo = new THREE.Group();
  protected corpo = new THREE.Group();
  private pulo = 0;
  private alvoOlhar = new THREE.Vector3();
  private baseY = 0;

  colocar(x: number, y: number, z: number, olhandoPara: number): void {
    this.grupo.scale.setScalar(1.45);
    this.grupo.position.set(x, y, z);
    this.grupo.rotation.y = olhandoPara;
    this.baseY = y;
  }
  olhar(p: THREE.Vector3): void { this.alvoOlhar.copy(p); }
  comemorar(): void { this.pulo = 1.6; }

  atualizar(t: number, dt: number, fase: number): void {
    // respiração e rabo
    this.corpo.scale.y = 1 + Math.sin(t * 2.4 + fase) * 0.025;
    const anima = this.pulo > 0 ? 18 : 7;
    this.rabo.rotation.y = Math.sin(t * anima + fase) * (this.pulo > 0 ? 0.9 : 0.45);
    // cabeça segue a bola (limitado)
    const local = this.grupo.worldToLocal(this.alvoOlhar.clone());
    const yaw = Math.max(-0.9, Math.min(0.9, Math.atan2(local.x, local.z)));
    this.cabeca.rotation.y += (yaw - this.cabeca.rotation.y) * Math.min(1, dt * 5);
    this.cabeca.rotation.z = Math.sin(t * 1.3 + fase) * 0.05;
    // pulo de alegria
    if (this.pulo > 0) {
      this.pulo -= dt;
      const ciclo = (this.pulo % 0.53) / 0.53;
      this.grupo.position.y = this.baseY + Math.sin(ciclo * Math.PI) * 0.32;
      this.grupo.rotation.z = Math.sin(t * 20) * 0.06;
      if (this.pulo <= 0) { this.grupo.position.y = this.baseY; this.grupo.rotation.z = 0; }
    }
  }
}

export class Doguinho extends Pet {
  constructor() {
    super();
    const branco = lisa('#f8f4ea'), marrom = lisa('#8a5532'), preto = lisa('#1d1a17', 0.3), laranja = lisa('#ff9d52', 0.5);
    const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 8, 16), branco);
    tronco.rotation.x = Math.PI / 2; tronco.position.y = 0.34;
    const mancha = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), marrom);
    mancha.scale.set(1, 0.6, 1.1); mancha.position.set(0.02, 0.46, -0.08);
    this.corpo.add(tronco, mancha);
    for (const [x, z] of [[-0.09, 0.15], [0.09, 0.15], [-0.09, -0.15], [0.09, -0.15]]) {
      const perna = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 4, 8), branco);
      perna.position.set(x, 0.14, z);
      const pata = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), branco);
      pata.scale.set(1, 0.6, 1.25); pata.position.set(x, 0.035, z + 0.015);
      this.corpo.add(perna, pata);
    }
    // cabeça
    const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), branco);
    cranio.scale.set(1, 0.95, 0.95);
    const manchaOlho = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), marrom);
    manchaOlho.position.set(0.07, 0.05, 0.07); manchaOlho.scale.set(1, 1, 0.7);
    const focinho = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), branco);
    focinho.scale.set(1, 0.75, 1.1); focinho.position.set(0, -0.05, 0.14);
    const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), preto);
    nariz.position.set(0, -0.01, 0.24);
    const oe = olho(), od = olho();
    oe.position.set(-0.065, 0.05, 0.135); od.position.set(0.065, 0.05, 0.135);
    for (const lado of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), marrom);
      orelha.scale.set(0.7, 1, 0.35); orelha.position.set(lado * 0.13, 0.1, 0.02); orelha.rotation.z = lado * 0.6;
      this.cabeca.add(orelha);
    }
    const lingua = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), lisa('#ff8fa3', 0.5));
    lingua.scale.set(1, 0.4, 1.3); lingua.position.set(0, -0.1, 0.2);
    this.cabeca.add(cranio, manchaOlho, focinho, nariz, oe, od, lingua);
    this.cabeca.position.set(0, 0.56, 0.2);
    const coleira = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 20), laranja);
    coleira.position.set(0, 0.45, 0.17); coleira.rotation.x = Math.PI / 2.4;
    const medalha = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 14), lisa('#ffd56b', 0.25));
    medalha.rotation.x = Math.PI / 2; medalha.position.set(0, 0.38, 0.27);
    // rabo para cima
    const cauda = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), branco);
    cauda.position.set(0, 0.08, 0); cauda.rotation.x = -0.5;
    const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), marrom); ponta.position.set(0, 0.17, -0.05);
    this.rabo.add(cauda, ponta); this.rabo.position.set(0, 0.42, -0.25);
    this.grupo.add(this.corpo, this.cabeca, coleira, medalha, this.rabo);
    this.grupo.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; } });
  }
}

export class Gatinho extends Pet {
  constructor() {
    super();
    const pelo = new THREE.MeshStandardMaterial({ map: texGato(), roughness: 0.8 });
    const creme = lisa('#fff1d2'), rosa = lisa('#ff9ab0', 0.5), preto = lisa('#1d1a17', 0.3);
    // sentado: corpo inclinado
    const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.22, 8, 16), pelo);
    tronco.position.set(0, 0.28, -0.02); tronco.rotation.x = 0.35;
    const peito = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), creme);
    peito.position.set(0, 0.3, 0.1); peito.scale.set(1, 1.2, 0.6);
    this.corpo.add(tronco, peito);
    for (const x of [-0.07, 0.07]) {
      const perna = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.14, 4, 8), pelo);
      perna.position.set(x, 0.1, 0.1);
      const pata = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), creme);
      pata.scale.set(1, 0.6, 1.2); pata.position.set(x, 0.03, 0.13);
      this.corpo.add(perna, pata);
    }
    for (const x of [-0.12, 0.12]) {
      const coxa = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), pelo);
      coxa.scale.set(0.8, 0.8, 1.2); coxa.position.set(x, 0.1, -0.06);
      this.corpo.add(coxa);
    }
    const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), pelo);
    cranio.scale.set(1.08, 0.94, 0.95);
    const focinho = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), creme);
    focinho.scale.set(1.3, 0.8, 0.8); focinho.position.set(0, -0.05, 0.12);
    const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), rosa);
    nariz.position.set(0, -0.025, 0.18);
    const oe = olho(), od = olho();
    oe.scale.set(1, 1.25, 1); od.scale.set(1, 1.25, 1);
    (oe.children[0] as THREE.Mesh).material = (od.children[0] as THREE.Mesh).material = lisa('#5aa84a', 0.2);
    const pupila = () => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), preto); p.scale.set(0.5, 1.6, 0.5); p.position.z = 0.03; return p; };
    oe.add(pupila()); od.add(pupila());
    oe.position.set(-0.06, 0.03, 0.125); od.position.set(0.06, 0.03, 0.125);
    for (const lado of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), pelo);
      orelha.position.set(lado * 0.09, 0.15, 0); orelha.rotation.z = lado * -0.35;
      const dentroOrelha = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), rosa);
      dentroOrelha.position.set(lado * 0.09, 0.145, 0.02); dentroOrelha.rotation.z = lado * -0.35;
      this.cabeca.add(orelha, dentroOrelha);
      for (const dy of [-0.01, 0.015]) {
        const bigode = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 4), lisa('#ffffff', 0.4));
        bigode.rotation.z = Math.PI / 2 + lado * dy * 6; bigode.position.set(lado * 0.1, -0.05 + dy, 0.13);
        this.cabeca.add(bigode);
      }
    }
    this.cabeca.add(cranio, focinho, nariz, oe, od);
    this.cabeca.position.set(0, 0.52, 0.06);
    // rabo comprido curvado
    const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0.05, -0.14), new THREE.Vector3(0.14, 0.2, -0.2), new THREE.Vector3(0.12, 0.36, -0.12)]);
    const cauda = new THREE.Mesh(new THREE.TubeGeometry(curva, 20, 0.032, 8), pelo);
    this.rabo.add(cauda); this.rabo.position.set(0, 0.1, -0.15);
    this.grupo.add(this.corpo, this.cabeca, this.rabo);
    this.grupo.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; } });
  }
}
