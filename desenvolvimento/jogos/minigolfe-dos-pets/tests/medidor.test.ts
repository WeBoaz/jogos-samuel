// Estatística do medidor ?fps (a parte de tela só roda no navegador).
import { describe, expect, it } from 'vitest';
import { Acumulador, estatisticas, passou } from '../src/ui/medidor';

describe('Medidor — estatísticas de quadros', () => {
  it('60 FPS estáveis passam na meta', () => {
    const e = estatisticas(new Array(600).fill(1000 / 60));
    expect(e.mediaFps).toBeCloseTo(60, 5);
    expect(Math.abs(e.p95ms - 1000 / 60)).toBeLessThanOrEqual(0.25);   // resolução do histograma
    expect(e.quedas).toBe(0);
    expect(passou(e)).toBe(true);
  });

  it('média boa com 6% de travadas reprova pelo p95', () => {
    const ms = [...new Array(940).fill(16.7), ...new Array(60).fill(60)];
    const e = estatisticas(ms);
    expect(e.mediaFps).toBeGreaterThan(30);
    expect(e.p95ms).toBeCloseTo(60, 0);
    expect(e.quedas).toBe(60);
    expect(passou(e)).toBe(false);
  });

  it('30 FPS cravados passam; 25 FPS não', () => {
    expect(passou(estatisticas(new Array(300).fill(1000 / 30)))).toBe(true);
    expect(estatisticas(new Array(300).fill(1000 / 30)).abaixo30).toBe(0);
    expect(passou(estatisticas(new Array(300).fill(40)))).toBe(false);
  });

  it('vazio não quebra', () => {
    expect(estatisticas([])).toMatchObject({ quadros: 0, mediaFps: 0 });
  });

  it('travadas longas entram na conta (não são descartadas) e o p95 acima de 250 ms sai exato', () => {
    const e = estatisticas([...new Array(90).fill(16.7), ...new Array(10).fill(1200)]);
    expect(e.travadas).toBe(10);
    expect(e.p95ms).toBe(1200);
    expect(passou(e)).toBe(false);
  });

  it('p95 do histograma fica a até 0,25 ms do exato', () => {
    const ms = Array.from({ length: 5000 }, (_, i) => 8 + ((i * 7919) % 400) / 10);   // 8 a 48 ms espalhados
    const exato = ms.slice().sort((a, b) => a - b)[Math.ceil(ms.length * 0.95) - 1];
    expect(Math.abs(estatisticas(ms).p95ms - exato)).toBeLessThanOrEqual(0.25);
  });

  it('custo por quadro não cresce com o histórico (108 mil amostras)', () => {
    const a = new Acumulador();
    for (let i = 0; i < 108000; i++) a.adicionar(16 + (i % 7));
    const t0 = performance.now();
    for (let k = 0; k < 100; k++) { a.adicionar(16.6); a.resultado(); }
    expect((performance.now() - t0) / 100).toBeLessThan(0.5);   // ms por quadro+leitura, bem abaixo de 1 quadro
  });
});
