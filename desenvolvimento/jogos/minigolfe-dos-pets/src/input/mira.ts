// ShotController (entrada): encostar em qualquer lugar, puxar para trás e soltar, como um estilingue. Funciona com mouse,
// toque e caneta (Pointer Events + captura), sem rolar a página. Soltar perto da bola ou
// cancelar o gesto não tacam. Teclado: ←/→ mira, ↑/↓ força, Enter/Espaço taca, Esc cancela.

export interface EstadoMira { ativa: boolean; angulo: number; forca: number; origem: 'toque' | 'teclado' | null }

export interface OpcoesMira {
  alvo: HTMLElement;
  /** ponto do chão sob o ponteiro (x,z) ou null; o jogo faz o raycast */
  noChao: (clientX: number, clientY: number) => [number, number] | null;
  bola: () => [number, number];
  pode: () => boolean;
  forcaMax: () => number;
  anguloInicial: () => number;
  aoTacar: (angulo: number, forca: number) => void;
  aoMudar?: (m: EstadoMira) => void;
}

const FRACAO_TELA = 0.36;       // arrastar 36% do menor lado da tela = força máxima
const FORCA_MINIMA = 0.07;
/** Letra minúscula independente de Shift/Caps Lock ('D' e 'd' são a mesma tecla). */
const tecla = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

export class Mira {
  readonly estado: EstadoMira = { ativa: false, angulo: 0, forca: 0, origem: null };
  private dedo: number | null = null;
  private inicio: [number, number] | null = null;   // ponto do chão onde o dedo encostou
  private inicioTela: [number, number] = [0, 0];     // e na tela (a força é medida em pixels)
  private teclas = new Set<string>();
  private limpadores: (() => void)[] = [];

  constructor(private o: OpcoesMira) {
    const ouvir = <K extends keyof HTMLElementEventMap>(alvo: HTMLElement | Window, tipo: K | string, fn: (e: never) => void, opc?: AddEventListenerOptions) => {
      alvo.addEventListener(tipo, fn as EventListener, opc);
      this.limpadores.push(() => alvo.removeEventListener(tipo, fn as EventListener, opc));
    };
    ouvir(o.alvo, 'pointerdown', (e: PointerEvent) => this.descer(e));
    ouvir(o.alvo, 'pointermove', (e: PointerEvent) => this.mover(e));
    ouvir(o.alvo, 'pointerup', (e: PointerEvent) => this.subir(e));
    ouvir(o.alvo, 'pointercancel', (e: PointerEvent) => { if (e.pointerId === this.dedo) this.cancelar(); });
    ouvir(o.alvo, 'lostpointercapture', (e: PointerEvent) => { if (e.pointerId === this.dedo) this.cancelar(); });
    ouvir(o.alvo, 'contextmenu', (e: Event) => e.preventDefault());
    ouvir(window, 'keydown', (e: KeyboardEvent) => this.teclaDesce(e));
    ouvir(window, 'keyup', (e: KeyboardEvent) => this.teclas.delete(tecla(e)));
    ouvir(window, 'blur', () => { this.teclas.clear(); this.cancelar(); });
  }

  get ouvintes(): number { return this.limpadores.length; }

  private descer(e: PointerEvent): void {
    if (this.dedo !== null || !this.o.pode() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    this.dedo = e.pointerId;
    try { this.o.alvo.setPointerCapture(e.pointerId); } catch { /* ok */ }
    this.estado.ativa = true; this.estado.forca = 0; this.estado.origem = 'toque';
    this.estado.angulo = this.o.anguloInicial();
    this.inicio = this.o.noChao(e.clientX, e.clientY);
    this.inicioTela = [e.clientX, e.clientY];
    this.o.aoMudar?.(this.estado);
  }
  private mover(e: PointerEvent): void {
    if (e.pointerId !== this.dedo) return;
    e.preventDefault();
    const p = this.o.noChao(e.clientX, e.clientY);
    if (!p) return;
    if (!this.inicio) { this.inicio = p; return; }
    // estilingue: puxar do ponto inicial para trás; a bola vai para o lado oposto
    const dx = this.inicio[0] - p[0], dz = this.inicio[1] - p[1];
    const d = Math.hypot(dx, dz);
    const px = Math.hypot(e.clientX - this.inicioTela[0], e.clientY - this.inicioTela[1]);
    const total = Math.max(120, Math.min(innerWidth, innerHeight) * FRACAO_TELA);
    this.estado.forca = Math.min(1, px / total) * this.o.forcaMax();
    if (d > 0.05 && px > 14) this.estado.angulo = Math.atan2(dx, -dz);
    else this.estado.forca = 0;
    this.o.aoMudar?.(this.estado);
  }
  private subir(e: PointerEvent): void {
    if (e.pointerId !== this.dedo) return;
    this.mover(e);
    this.dedo = null; this.inicio = null;
    try { this.o.alvo.releasePointerCapture(e.pointerId); } catch { /* ok */ }
    this.disparar();
  }
  private disparar(): void {
    const { angulo, forca } = this.estado;
    this.estado.ativa = false; this.estado.origem = null;
    this.o.aoMudar?.(this.estado);
    if (forca >= FORCA_MINIMA && this.o.pode()) this.o.aoTacar(angulo, forca);
  }
  /** Cancela sem tacar (gesto interrompido, menu aberto, perda de foco). */
  cancelar(): void {
    this.dedo = null; this.inicio = null;
    if (!this.estado.ativa) return;
    this.estado.ativa = false; this.estado.forca = 0; this.estado.origem = null;
    this.o.aoMudar?.(this.estado);
  }

  private teclaDesce(e: KeyboardEvent): void {
    const k = tecla(e);
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'a', 'd', 'w', 's'].includes(k)) return;
    if (!this.o.pode()) return;
    e.preventDefault();
    if (k === 'Enter' || k === ' ') {
      if (this.estado.ativa && this.estado.origem === 'teclado') this.disparar();
      else this.ativarTeclado();
      return;
    }
    this.teclas.add(k);
    this.ativarTeclado();
  }
  private ativarTeclado(): void {
    if (this.estado.ativa) return;
    this.estado.ativa = true; this.estado.origem = 'teclado';
    this.estado.angulo = this.o.anguloInicial();
    this.estado.forca = 0.35 * this.o.forcaMax();
    this.o.aoMudar?.(this.estado);
  }

  /** Chamado a cada quadro: teclas seguradas giram a mira e mudam a força. */
  atualizar(dt: number): void {
    if (!this.estado.ativa || this.estado.origem !== 'teclado') return;
    const t = this.teclas;
    if (t.has('ArrowLeft') || t.has('a')) this.estado.angulo -= 1.5 * dt;
    if (t.has('ArrowRight') || t.has('d')) this.estado.angulo += 1.5 * dt;
    if (t.has('ArrowUp') || t.has('w')) this.estado.forca = Math.min(this.o.forcaMax(), this.estado.forca + 0.6 * dt);
    if (t.has('ArrowDown') || t.has('s')) this.estado.forca = Math.max(0, this.estado.forca - 0.6 * dt);
    if (t.size) this.o.aoMudar?.(this.estado);
  }

  destruir(): void { this.limpadores.splice(0).forEach((f) => f()); }
}
