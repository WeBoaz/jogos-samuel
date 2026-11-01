// Medidor de quadros (?fps), só para teste em aparelho real. Nada sai do aparelho: o resumo aparece na tela
// e quem testa copia à mão. Conta só o tempo com a aba visível; a meta é média ≥ 30 FPS e p95 ≤ 40 ms.
// ?fps sozinho = resumo após 5 min visíveis; ?fps=<segundos> muda isso (10 a 1800) para testes rápidos.
// O painel do resumo só abre quando o jogo deixa (pausa, menu, fim), para não cobrir uma tacada.
export const DURACAO_TESTE = 300;
const QUEDA_MS = 50;                  // quadro mais lento que 20 FPS conta como queda

export interface Estatisticas { quadros: number; segundos: number; mediaFps: number; p95ms: number; quedas: number; abaixo30: number; travadas: number }

const FAIXA = 0.25, FAIXAS = 1000;    // histograma de 0 a 250 ms em faixas de 0,25 ms; acima disso guarda o valor exato

/** Acumula os intervalos entre quadros com custo fixo por quadro: o medidor não pode pesar no que mede. */
export class Acumulador {
  private n = 0; private soma = 0; private quedas = 0; private abaixo30 = 0; private travadas = 0;
  private hist = new Uint32Array(FAIXAS);
  private longos: number[] = [];      // > 250 ms: raros num jogo que roda
  adicionar(ms: number): void {
    this.n++; this.soma += ms;
    if (ms > QUEDA_MS) this.quedas++;
    if (ms > 1000 / 30 + 0.5) this.abaixo30++;
    if (ms >= 1000) this.travadas++;
    const i = Math.floor(ms / FAIXA);
    if (i < FAIXAS) this.hist[i]++; else this.longos.push(ms);
  }
  resultado(): Estatisticas {
    const n = this.n;
    if (!n) return { quadros: 0, segundos: 0, mediaFps: 0, p95ms: 0, quedas: 0, abaixo30: 0, travadas: 0 };
    const alvo = Math.ceil(n * 0.95);
    let acum = 0, p95ms = 0, i = 0;
    for (; i < FAIXAS; i++) { acum += this.hist[i]; if (acum >= alvo) { p95ms = (i + 1) * FAIXA; break; } }
    if (i === FAIXAS) { const l = this.longos.slice().sort((a, b) => a - b); p95ms = l[Math.min(l.length - 1, alvo - acum - 1)]; }
    return { quadros: n, segundos: this.soma / 1000, mediaFps: (n * 1000) / this.soma, p95ms, quedas: this.quedas, abaixo30: this.abaixo30 / n, travadas: this.travadas };
  }
}

/** Atalho para testes: estatística de uma lista de intervalos (ms). */
export function estatisticas(ms: ArrayLike<number>): Estatisticas {
  const a = new Acumulador();
  for (let i = 0; i < ms.length; i++) a.adicionar(ms[i]);
  return a.resultado();
}

export const passou = (e: Estatisticas) => e.mediaFps >= 29.9 && e.p95ms <= 40;   // 29,9: arredondamento de 1000/30

function navegador(ua: string): string {
  const m = /(Edg|OPR|SamsungBrowser|Firefox|FxiOS|CriOS|Chrome|Version)\/([\d.]+)/.exec(ua);
  const nome = m ? ({ Edg: 'Edge', OPR: 'Opera', FxiOS: 'Firefox iOS', CriOS: 'Chrome iOS', Version: 'Safari' } as Record<string, string>)[m[1]] ?? m[1] : '?';
  const so = /iPhone|iPad|iPod/.test(ua) ? `iOS ${(/OS (\d+[_\d]*)/.exec(ua)?.[1] ?? '?').replace(/_/g, '.')}`
    : /Android ([\d.]+)/.exec(ua)?.[0] ?? (/Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : 'outro');
  return `${nome} ${m?.[2].split('.').slice(0, 2).join('.') ?? ''} · ${so}`;
}

export class Medidor {
  private total = new Acumulador();
  private recentes = new Float32Array(120);   // anel dos últimos quadros, para o FPS do momento
  private nRecentes = 0;
  private ultimo = 0;
  private proximaTela = 0;
  private resumido = false;
  private pronto: Estatisticas | null = null;
  private caixa = document.createElement('div');
  private versao = '?';

  constructor(private gl: WebGLRenderingContext | WebGL2RenderingContext, private extra: () => string, private duracao = DURACAO_TESTE, private podeMostrar: () => boolean = () => true) {
    this.caixa.id = 'medidor';
    this.caixa.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.caixa);
    fetch('release.json', { cache: 'no-store' }).then((r) => r.json()).then((j) => { this.versao = String(j.release_id ?? '?'); }).catch(() => {});
    document.addEventListener('visibilitychange', () => { this.ultimo = 0; });
  }

  private aparelho(): string {
    const dbg = this.gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = dbg ? String(this.gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '?';
    return `${navegador(navigator.userAgent)} · tela ${screen.width}×${screen.height} @${devicePixelRatio}x · janela ${innerWidth}×${innerHeight} · GPU ${gpu}`;
  }

  quadro(agora: number): void {
    if (document.hidden) { this.ultimo = 0; return; }
    // com a aba visível, todo intervalo conta, inclusive travadas longas (a volta de segundo plano zera `ultimo`)
    if (this.ultimo && agora > this.ultimo) {
      const dt = agora - this.ultimo;
      this.total.adicionar(dt);
      this.recentes[this.nRecentes++ % this.recentes.length] = dt;
    }
    this.ultimo = agora;
    if (agora < this.proximaTela) return;
    this.proximaTela = agora + 500;
    const e = this.total.resultado();
    let somaRec = 0; const nRec = Math.min(this.nRecentes, this.recentes.length);
    for (let i = 0; i < nRec; i++) somaRec += this.recentes[i];
    const recentes = { mediaFps: nRec ? (nRec * 1000) / somaRec : 0 };
    const falta = Math.max(0, this.duracao - e.segundos);
    if (!this.pronto && falta === 0) this.pronto = e;          // congela o resultado no fim do tempo
    const fim = this.resumido ? '' : this.pronto ? ' · RESUMO PRONTO: toque em II' : ` · resumo em ${Math.ceil(falta)} s`;
    this.caixa.textContent = `${recentes.mediaFps.toFixed(0)} FPS · média ${e.mediaFps.toFixed(1)} · p95 ${e.p95ms.toFixed(1)} ms · quedas ${e.quedas}`
      + ` · ${this.extra()}` + fim;
    if (this.pronto && !this.resumido && this.podeMostrar()) this.mostrarResumo(this.pronto);
  }

  private mostrarResumo(e: Estatisticas): void {
    this.resumido = true;
    const texto = [
      `Minigolfe dos Pets — teste de quadros`,
      `versão: ${this.versao}`,
      `aparelho: ${this.aparelho()}`,
      `tempo visível: ${e.segundos.toFixed(0)} s · quadros: ${e.quadros}`,
      `média: ${e.mediaFps.toFixed(1)} FPS · p95: ${e.p95ms.toFixed(1)} ms (${(1000 / e.p95ms).toFixed(0)} FPS)`,
      `quedas (> ${QUEDA_MS} ms): ${e.quedas} · travadas (≥ 1 s): ${e.travadas} · quadros abaixo de 30 FPS: ${(e.abaixo30 * 100).toFixed(1)}%`,
      `${this.extra()}`,
      `meta (média ≥ 30 e p95 ≤ 40 ms): ${passou(e) ? 'CUMPRIDA' : 'NÃO cumprida'}`,
    ].join('\n');
    const painel = document.createElement('div');
    painel.id = 'medidorResumo';
    const pre = document.createElement('pre');
    pre.textContent = texto;
    const copiar = document.createElement('button');
    copiar.type = 'button'; copiar.className = 'btn'; copiar.textContent = 'Copiar';
    copiar.addEventListener('click', () => {
      navigator.clipboard?.writeText(texto).then(() => { copiar.textContent = 'Copiado ✓'; }, () => { copiar.textContent = 'Selecione o texto'; });
    });
    const fechar = document.createElement('button');
    fechar.type = 'button'; fechar.className = 'btn sec'; fechar.textContent = 'Fechar';
    fechar.addEventListener('click', () => painel.remove());
    painel.append(pre, copiar, fechar);
    document.body.appendChild(painel);
  }
}
