// Estatística do medidor ?fps (a parte de tela só roda no navegador).
import { describe, expect, it } from 'vitest';
import { estatisticas, passou } from '../src/ui/medidor';

describe('Medidor — estatísticas de quadros', () => {
  it('60 FPS estáveis passam na meta', () => {
    const e = estatisticas(new Array(600).fill(1000 / 60));
    expect(e.mediaFps).toBeCloseTo(60, 5);
    expect(e.p95ms).toBeCloseTo(16.67, 1);
    expect(e.quedas).toBe(0);
    expect(passou(e)).toBe(true);
  });

  it('média boa com 6% de travadas reprova pelo p95', () => {
    const ms = [...new Array(940).fill(16.7), ...new Array(60).fill(60)];
    const e = estatisticas(ms);
    expect(e.mediaFps).toBeGreaterThan(30);
    expect(e.p95ms).toBe(60);
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
});
