// Câmera elevada fixa em ângulo (sem girar livremente): enquadra a bola e o buraco juntos,
// alinhada com a linha bola→buraco entre tacadas, e acompanha a bola com suavidade.
import * as THREE from 'three';

export class CameraGolf {
  readonly cam: THREE.PerspectiveCamera;
  private alvo = new THREE.Vector3();
  private alvoDesejado = new THREE.Vector3();
  private dist = 10;
  private distDesejada = 10;
  private azimute = 0;          // radianos; 0 = câmera atrás (+z) olhando para −z
  private azimuteDesejado = 0;
  private inclinacao = 0.74;           // ~42° acima do horizonte: dá profundidade (rampa, casinha, céu)

  constructor() {
    this.cam = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
  }

  redimensionar(w: number, h: number): void {
    this.cam.aspect = w / h;
    this.cam.fov = w / h < 0.8 ? 52 : 38;
    this.cam.updateProjectionMatrix();
  }

  /** Enquadra os pontos (bola, buraco...) com margem; `alinhar` recalcula o ângulo da linha bola→buraco;
   *  `centro` (opcional) fixa o ponto de mira da câmera (ex.: 42% do caminho bola→buraco). */
  enquadrar(pontos: THREE.Vector3[], margem: number, alinharDe?: THREE.Vector3, alinharPara?: THREE.Vector3, centro?: THREE.Vector3): void {
    this.caixa.setFromPoints(pontos);
    if (centro) this.alvoDesejado.copy(centro); else this.caixa.getCenter(this.alvoDesejado);
    let raio = 0;
    for (const p of pontos) raio = Math.max(raio, Math.hypot(p.x - this.alvoDesejado.x, p.z - this.alvoDesejado.z));
    raio = Math.max(2.4, raio + margem);
    const vfov = THREE.MathUtils.degToRad(this.cam.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.cam.aspect);
    // a projeção encolhe a profundidade pela inclinação; compensa um pouco
    this.distDesejada = Math.min(24, raio / Math.sin(Math.min(vfov, hfov) / 2) * 0.74);
    if (alinharDe && alinharPara) {
      const dx = alinharPara.x - alinharDe.x, dz = alinharPara.z - alinharDe.z;
      if (Math.hypot(dx, dz) > 0.8) {
        let a = Math.atan2(dx, -dz);
        // menor volta
        while (a - this.azimute > Math.PI) a -= Math.PI * 2;
        while (a - this.azimute < -Math.PI) a += Math.PI * 2;
        this.azimuteDesejado = a;
      }
    }
  }

  /** Coloca a câmera no lugar sem animação (troca de pista). */
  pular(): void {
    this.alvo.copy(this.alvoDesejado); this.dist = this.distDesejada; this.azimute = this.azimuteDesejado;
    this.aplicar();
  }

  atualizar(dt: number): void {
    const k = 1 - Math.exp(-dt * 3.2);
    this.alvo.lerp(this.alvoDesejado, k);
    this.dist += (this.distDesejada - this.dist) * k;
    this.azimute += (this.azimuteDesejado - this.azimute) * (1 - Math.exp(-dt * 2.2));
    this.aplicar();
  }

  private aplicar(): void {
    const horiz = Math.cos(this.inclinacao) * this.dist, alt = Math.sin(this.inclinacao) * this.dist;
    // câmera fica "atrás" da direção de jogo
    this.cam.position.set(this.alvo.x - Math.sin(this.azimute) * horiz, this.alvo.y + alt, this.alvo.z + Math.cos(this.azimute) * horiz);
    this.cam.lookAt(this.alvo);
  }

  /** Converte um ponto de tela num ponto do plano horizontal y = altura. */
  noPlano(xNdc: number, yNdc: number, altura: number, saida: THREE.Vector3): boolean {
    this.raio.setFromCamera(this.ndc.set(xNdc, yNdc), this.cam);
    this.plano.set(this.cima, -altura);
    return this.raio.ray.intersectPlane(this.plano, saida) !== null;
  }
  private raio = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private plano = new THREE.Plane();
  private cima = new THREE.Vector3(0, 1, 0);
  private caixa = new THREE.Box3();
  get angulo(): number { return this.azimute; }
}
