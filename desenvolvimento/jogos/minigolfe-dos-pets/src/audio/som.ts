// Sons sintetizados com Web Audio (nenhum arquivo de áudio). Volume baixo por padrão.
// O contexto só nasce no primeiro toque/clique (regra dos navegadores).

let ctx: AudioContext | null = null;
let mestre: GainNode | null = null;
let ligado = true;

function iniciar(): AudioContext | null {
  if (!ligado) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
      mestre = ctx.createGain(); mestre.gain.value = 0.22; mestre.connect(ctx.destination);
    } catch { return null; }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tom(freq: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.5, deslizarPara?: number, atraso = 0): void {
  const c = iniciar(); if (!c || !mestre) return;
  const t0 = c.currentTime + atraso;
  const o = c.createOscillator(), g = c.createGain();
  o.type = tipo; o.frequency.setValueAtTime(freq, t0);
  if (deslizarPara) o.frequency.exponentialRampToValueAtTime(deslizarPara, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(mestre);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function ruido(dur: number, filtro: number, vol = 0.4, atraso = 0): void {
  const c = iniciar(); if (!c || !mestre) return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtro;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(mestre);
  src.start(c.currentTime + atraso);
}

export const Som = {
  desbloquear(): void { iniciar(); },
  get ligado(): boolean { return ligado; },
  ligar(v: boolean): void { ligado = v; if (!v && ctx) void ctx.suspend(); if (v) iniciar(); },
  tacada(forca: number): void { tom(180 + forca * 120, 0.09, 'triangle', 0.6, 90); ruido(0.05, 2500, 0.25); },
  parede(forca: number): void { tom(240 + Math.random() * 40, 0.07, 'square', 0.12 + forca * 0.2, 160); },
  borda(): void { tom(900, 0.06, 'sine', 0.25); tom(700, 0.08, 'sine', 0.2, undefined, 0.05); },
  buraco(): void { [523, 659, 784, 1046].forEach((f, i) => tom(f, 0.22, 'triangle', 0.35, undefined, i * 0.09)); ruido(0.12, 600, 0.2); },
  agua(): void { ruido(0.45, 1300, 0.45); tom(420, 0.25, 'sine', 0.15, 160); },
  clique(): void { tom(660, 0.05, 'triangle', 0.25); },
  vez(): void { tom(587, 0.1, 'triangle', 0.3); tom(784, 0.14, 'triangle', 0.3, undefined, 0.1); },
  vitoria(): void { [523, 659, 784, 659, 784, 1046].forEach((f, i) => tom(f, 0.25, 'triangle', 0.35, undefined, i * 0.13)); },
  latido(): void { tom(520, 0.08, 'sawtooth', 0.12, 380); tom(560, 0.09, 'sawtooth', 0.1, 400, 0.14); },
  miau(): void { tom(700, 0.32, 'sine', 0.16, 950); },
};
