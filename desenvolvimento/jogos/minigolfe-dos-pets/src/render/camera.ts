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
  private readonly inclinacao = 0.92;  // ~53° acima do horizonte

  constructor() {
    this.cam = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
  }

  redimensionar(w: number, h: number): void {
    this.cam.aspect = w / h;
    this.cam.fov = w / h < 0.8 ? 54 : 42;
    this.cam.updateProjectionMatrix();
  }

  /** Enquadra os pontos (bola, buraco...) com margem; `alinhar` recalcula o ângulo da linha bola→buraco. */
  enquadrar(pontos: THREE.Vector3[], margem: number, alinharDe?: THREE.Vector3, alinharPara?: THREE.Vector3): void {
    const caixa = new THREE.Box3().setFromPoints(pontos);
    caixa.getCenter(this.alvoDesejado);
    const tam = new THREE.Vector3(); caixa.getSize(tam);
    const raio = Math.max(2.6, Math.hypot(tam.x, tam.z) / 2 + margem);
    const vfov = THREE.MathUtils.degToRad(this.cam.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.cam.aspect);
    // a projeção encolhe a profundidade pela inclinação; compensa um pouco
    this.distDesejada = Math.min(26, raio / Math.sin(Math.min(vfov, hfov) / 2) * 0.82);
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
    const r = new THREE.Raycaster();
    r.setFromCamera(new THREE.Vector2(xNdc, yNdc), this.cam);
    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -altura);
    return r.ray.intersectPlane(plano, saida) !== null;
  }
  get angulo(): number { return this.azimute; }
}
