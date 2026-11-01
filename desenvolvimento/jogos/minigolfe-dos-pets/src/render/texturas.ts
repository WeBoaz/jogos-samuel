// Texturas geradas em canvas (sem arquivos de imagem externos): grama aparada, terreno,
// madeira, tábuas da ponte, bandeira com pegada e pelagem listrada do gato.
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

/** Feltro do green com faixas de corte. 1 repetição = 2 unidades. */
export function texGreen(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const r = rnd(11);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#5fb84a' : '#68c152'; g.fillRect(0, i * 64, 256, 64); }
  for (let i = 0; i < 2600; i++) {
    const x = r() * 256, y = r() * 256, l = 50 + r() * 22;
    g.fillStyle = `hsla(${100 + r() * 14}, 52%, ${l}%, ${0.25 + r() * 0.3})`;
    g.fillRect(x, y, 1.2, 2 + r() * 2);
  }
  return tex(c);
}

/** Grama do terreno em volta, mais solta e variada. */
export function texGrama(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 512);
  const r = rnd(7);
  g.fillStyle = '#8acb61'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const cor = r() > 0.5 ? '120, 190, 80' : '150, 210, 100';
    gr.addColorStop(0, `rgba(${cor}, .35)`); gr.addColorStop(1, `rgba(${cor}, 0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 9000; i++) {
    const x = r() * 512, y = r() * 512;
    g.strokeStyle = `hsla(${88 + r() * 25}, ${45 + r() * 15}%, ${38 + r() * 26}%, .55)`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); g.stroke();
  }
  return tex(c);
}

/** Madeira clara com veios (bordas da pista). */
export function texMadeira(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 64);
  const r = rnd(3);
  g.fillStyle = '#d9a066'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 26; i++) {
    const y = r() * 64;
    g.strokeStyle = `rgba(150, 90, 45, ${0.15 + r() * 0.25})`;
    g.lineWidth = 0.8 + r() * 1.6;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 2 + (r() - 0.5));
    g.stroke();
  }
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(120,70,35,.35)'; g.beginPath(); g.ellipse(r() * 256, r() * 64, 4, 2, 0, 0, 7); g.fill(); }
  return tex(c);
}

/** Tábuas da ponte. */
export function texTabuas(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 256);
  const r = rnd(5);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(28, ${45 + r() * 10}%, ${50 + r() * 10}%)`;
    g.fillRect(0, i * 32, 128, 30);
    g.fillStyle = 'rgba(80, 45, 20, .55)'; g.fillRect(0, i * 32 + 30, 128, 2);
    g.fillStyle = 'rgba(60, 40, 25, .7)';
    g.beginPath(); g.arc(10, i * 32 + 15, 2.2, 0, 7); g.arc(118, i * 32 + 15, 2.2, 0, 7); g.fill();
  }
  return tex(c);
}

/** Terra/lateral das placas da pista. */
export function texLateral(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 64);
  const r = rnd(9);
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, '#9b6b43'); gr.addColorStop(1, '#6e4a2f');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${60 + r() * 60}, ${40 + r() * 30}, 25, .5)`; g.fillRect(r() * 128, r() * 64, 2, 2); }
  g.fillStyle = '#5fb84a'; g.fillRect(0, 0, 128, 6);
  return tex(c);
}

/** Bandeira laranja com pegada branca. */
export function texBandeira(cor = '#ff9d52'): THREE.CanvasTexture {
  const [c, g] = canvas(128, 96);
  g.fillStyle = cor; g.fillRect(0, 0, 128, 96);
  g.fillStyle = 'rgba(25, 51, 55, .18)'; g.fillRect(0, 84, 128, 12);
  g.fillStyle = '#fffdf7';
  g.beginPath(); g.ellipse(64, 56, 16, 13, 0, 0, 7); g.fill();
  for (const [x, y] of [[42, 34], [56, 24], [72, 24], [86, 34]]) { g.beginPath(); g.ellipse(x, y, 6.5, 8, 0, 0, 7); g.fill(); }
  return tex(c, false);
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
  gr.addColorStop(0, '#6cb8e6'); gr.addColorStop(0.55, '#a9dcf2'); gr.addColorStop(0.8, '#e6f4f2'); gr.addColorStop(1, '#fbe9c8');
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
