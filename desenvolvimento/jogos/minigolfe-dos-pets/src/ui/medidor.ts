// Medidor de quadros (?fps), só para teste em aparelho real. Nada sai do aparelho: o resumo aparece na tela
// e quem testa copia à mão. Conta só o tempo com a aba visível; a meta é média ≥ 30 FPS e p95 ≤ 40 ms.
// ?fps sozinho = resumo após 5 min visíveis; ?fps=<segundos> muda isso (10 a 1800) para testes rápidos.
export const DURACAO_TESTE = 300;
const QUEDA_MS = 50;                  // quadro mais lento que 20 FPS conta como queda

export interface Estatisticas { quadros: number; segundos: number; mediaFps: number; p95ms: number; quedas: number; abaixo30: number }

/** Estatística dos intervalos entre quadros (ms). Pura, para testar sem navegador. */
export function estatisticas(ms: ArrayLike<number>): Estatisticas {
  const n = ms.length;
  if (!n) return { quadros: 0, segundos: 0, mediaFps: 0, p95ms: 0, quedas: 0, abaixo30: 0 };
  let soma = 0, quedas = 0, abaixo30 = 0;
  for (let i = 0; i < n; i++) { soma += ms[i]; if (ms[i] > QUEDA_MS) quedas++; if (ms[i] > 1000 / 30 + 0.5) abaixo30++; }
  const ordenado = Array.from(ms).sort((a, b) => a - b);
  const p95ms = ordenado[Math.min(n - 1, Math.ceil(n * 0.95) - 1)];
  return { quadros: n, segundos: soma / 1000, mediaFps: (n * 1000) / soma, p95ms, quedas, abaixo30: abaixo30 / n };
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
  private ms: number[] = [];
  private ultimo = 0;
  private proximaTela = 0;
  private resumido = false;
  private caixa = document.createElement('div');
  private versao = '?';

  constructor(private gl: WebGLRenderingContext | WebGL2RenderingContext, private extra: () => string, private duracao = DURACAO_TESTE) {
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
    if (this.ultimo) { const dt = agora - this.ultimo; if (dt > 0 && dt < 1000) this.ms.push(dt); }
    this.ultimo = agora;
    if (agora < this.proximaTela) return;
    this.proximaTela = agora + 500;
    const e = estatisticas(this.ms);
    const recentes = estatisticas(this.ms.slice(-120));
    const falta = Math.max(0, this.duracao - e.segundos);
    this.caixa.textContent = `${recentes.mediaFps.toFixed(0)} FPS · média ${e.mediaFps.toFixed(1)} · p95 ${e.p95ms.toFixed(1)} ms · quedas ${e.quedas}`
      + ` · ${this.extra()}` + (this.resumido ? '' : ` · resumo em ${Math.ceil(falta)} s`);
    if (!this.resumido && falta === 0) this.mostrarResumo(e);
  }

  private mostrarResumo(e: Estatisticas): void {
    this.resumido = true;
    const texto = [
      `Minigolfe dos Pets — teste de quadros`,
      `versão: ${this.versao}`,
      `aparelho: ${this.aparelho()}`,
      `tempo visível: ${e.segundos.toFixed(0)} s · quadros: ${e.quadros}`,
      `média: ${e.mediaFps.toFixed(1)} FPS · p95: ${e.p95ms.toFixed(1)} ms (${(1000 / e.p95ms).toFixed(0)} FPS)`,
      `quedas (> ${QUEDA_MS} ms): ${e.quedas} · quadros abaixo de 30 FPS: ${(e.abaixo30 * 100).toFixed(1)}%`,
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
