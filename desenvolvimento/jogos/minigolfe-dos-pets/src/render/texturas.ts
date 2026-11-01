// Texturas geradas em canvas (sem arquivos de imagem externos): grama aparada, terreno,
// madeira, tábuas da ponte, rampa com setas, telhas, água, bandeira com pegada e pelagem do gato.
import * as THREE from 'three';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function rnd(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function tex(c: HTMLCanvasElement, repetir = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}
function fibras(g: CanvasRenderingContext2D, r: () => number, n: number, w: number, h: number, hue: [number, number], luz: [number, number], alfa: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h;
    g.fillStyle = `hsla(${hue[0] + r() * (hue[1] - hue[0])}, 55%, ${luz[0] + r() * (luz[1] - luz[0])}%, ${alfa * (0.5 + r() * 0.5)})`;
    g.fillRect(x, y, 1.2, 2 + r() * 2);
  }
}

/** Feltro do green: verde mais escuro e saturado que o gramado, com faixas de corte. 1 repetição = 2 unidades. */
export function texGreen(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const r = rnd(11);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#3f9e3a' : '#4aab43'; g.fillRect(0, i * 64, 256, 64); }
  fibras(g, r, 2800, 256, 256, [105, 118], [36, 48], 0.5);
  return tex(c);
}

/** Rampa: green um pouco mais claro com setas ▲ apontando a subida (v cresce para a subida). */
export function texRampa(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const r = rnd(12);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#48aa40' : '#53b74a'; g.fillRect(0, i * 64, 256, 64); }
  fibras(g, r, 2000, 256, 256, [100, 115], [40, 52], 0.45);
  g.fillStyle = 'rgba(255, 253, 247, .42)';
  for (const y of [40, 168]) {
    g.beginPath(); g.moveTo(128, y - 30); g.lineTo(176, y + 22); g.lineTo(150, y + 22); g.lineTo(128, y - 2); g.lineTo(106, y + 22); g.lineTo(80, y + 22); g.closePath(); g.fill();
  }
  return tex(c);
}

/** Grama do terreno em volta: mais clara e amarelada que o green, para a pista se destacar. */
export function texGrama(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 512);
  const r = rnd(7);
  g.fillStyle = '#b5d98a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const cor = r() > 0.5 ? '160, 205, 110' : '196, 226, 140';
    gr.addColorStop(0, `rgba(${cor}, .4)`); gr.addColorStop(1, `rgba(${cor}, 0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 9000; i++) {
    const x = r() * 512, y = r() * 512;
    g.strokeStyle = `hsla(${75 + r() * 20}, ${42 + r() * 15}%, ${48 + r() * 22}%, .55)`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); g.stroke();
  }
  return tex(c);
}

/** Madeira com veios (bordas da pista) e faixa clara no topo. */
export function texMadeira(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 64);
  const r = rnd(3);
  g.fillStyle = '#c8874a'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 26; i++) {
    const y = r() * 64;
    g.strokeStyle = `rgba(120, 66, 30, ${0.18 + r() * 0.25})`;
    g.lineWidth = 0.8 + r() * 1.6;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 2 + (r() - 0.5));
    g.stroke();
  }
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(100,55,25,.4)'; g.beginPath(); g.ellipse(r() * 256, r() * 64, 4, 2, 0, 0, 7); g.fill(); }
  return tex(c);
}

/** Tábuas da ponte. */
export function texTabuas(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 256);
  const r = rnd(5);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(28, ${45 + r() * 10}%, ${48 + r() * 10}%)`;
    g.fillRect(0, i * 32, 128, 30);
    g.fillStyle = 'rgba(80, 45, 20, .55)'; g.fillRect(0, i * 32 + 30, 128, 2);
    g.fillStyle = 'rgba(60, 40, 25, .7)';
    g.beginPath(); g.arc(10, i * 32 + 15, 2.2, 0, 7); g.arc(118, i * 32 + 15, 2.2, 0, 7); g.fill();
  }
  return tex(c);
}

/** Terra/lateral das placas da pista, com a borda de grama em cima. */
export function texLateral(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 64);
  const r = rnd(9);
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, '#9b6b43'); gr.addColorStop(1, '#6e4a2f');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${60 + r() * 60}, ${40 + r() * 30}, 25, .5)`; g.fillRect(r() * 128, r() * 64, 2, 2); }
  g.fillStyle = '#4aab43'; g.fillRect(0, 0, 128, 6);
  return tex(c);
}

/** Telhas da casinha. */
export function texTelhas(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#e0634f' : '#c94f3d'; g.fillRect(0, i * 16, 128, 16);
    g.fillStyle = 'rgba(25, 51, 55, .25)'; g.fillRect(0, i * 16 + 14, 128, 2);
    for (let x = (i % 2) * 8; x < 128; x += 16) { g.fillStyle = 'rgba(25, 51, 55, .18)'; g.fillRect(x, i * 16, 1.5, 16); }
  }
  return tex(c);
}

/** Água com ondinhas claras (o deslocamento é animado). */
export function texAgua(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const r = rnd(17);
  const gr = g.createLinearGradient(0, 0, 256, 256);
  gr.addColorStop(0, '#2f9fd0'); gr.addColorStop(1, '#2b8fc4');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(220, 245, 255, .55)'; g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const x = r() * 256, y = r() * 256, w = 8 + r() * 18;
    g.lineWidth = 1.5 + r() * 1.5;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3, x + w, y); g.stroke();
  }
  return tex(c);
}

/** Bandeira laranja com pegada branca. */
export function texBandeira(cor = '#ff9d52'): THREE.CanvasTexture {
  const [c, g] = canvas(128, 96);
  g.fillStyle = cor; g.fillRect(0, 0, 128, 96);
  g.fillStyle = 'rgba(25, 51, 55, .18)'; g.fillRect(0, 84, 128, 12);
  pata(g, 64, 50, 1, '#fffdf7');
  return tex(c, false);
}

/** Pegada branca (tee, placa). */
export function texPata(fundo: string, cor = '#fffdf7'): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = fundo; g.fillRect(0, 0, 128, 128);
  pata(g, 64, 70, 1.4, cor);
  return tex(c, false);
}
function pata(g: CanvasRenderingContext2D, cx: number, cy: number, k: number, cor: string) {
  g.fillStyle = cor;
  g.beginPath(); g.ellipse(cx, cy + 6 * k, 16 * k, 13 * k, 0, 0, 7); g.fill();
  for (const [x, y] of [[-22, -16], [-8, -26], [8, -26], [22, -16]]) { g.beginPath(); g.ellipse(cx + x * k, cy + y * k, 6.5 * k, 8 * k, 0, 0, 7); g.fill(); }
}

/** Pelagem do gato amarelo com listras. */
export function texGato(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#f4b23f'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#d9822b'; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    g.lineWidth = 5 + (i % 3);
    g.beginPath(); g.moveTo(i * 15 - 4, 0); g.quadraticCurveTo(i * 15 + 6, 64, i * 15 - 2, 128); g.stroke();
  }
  return tex(c);
}

/** Céu em degradê (fundo da cena). */
export function texCeu(): THREE.CanvasTexture {
  const [c, g] = canvas(4, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5fb2e6'); gr.addColorStop(0.5, '#a3d8f2'); gr.addColorStop(0.78, '#e3f3f0'); gr.addColorStop(1, '#fbe6c2');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = tex(c, false);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/** Brilho suave redondo para partículas. */
export function texBrilho(): THREE.CanvasTexture {
  const [c, g] = canvas(64, 64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return tex(c, false);
}
