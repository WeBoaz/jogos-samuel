const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
const segura = (p, sel, ms, id) => p.evaluate(async ({ sel, ms, id }) => { const el = document.querySelector(sel); const q = el.getBoundingClientRect(); const ev = (t) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', isPrimary: false, clientX: q.x + q.width / 2, clientY: q.y + q.height / 2, bubbles: true, cancelable: true })); const I = window.__ilha; const a = I.controls.object.position.y; ev('pointerdown'); await new Promise((f) => setTimeout(f, ms)); const b = I.controls.object.position.y; ev('pointerup'); return +((b - a) / (ms / 1000)).toFixed(1); }, { sel, ms, id });
(async () => {
  const b = await webkit.launch(); const r = {};
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message.slice(0, 100)));
  await p.goto('http://localhost:5190/?debug'); await p.tap('#bEntrar');
  await p.waitForFunction(() => window.__ilha?.conectado && window.__ilha.emJogo, null, { timeout: 30000 }); await p.waitForTimeout(1500);
  await p.tap('[data-acao="voar"]'); await p.waitForTimeout(800);
  r.subir = await segura(p, '[data-acao="pular"]', 1250, 51);
  await p.waitForTimeout(300);
  r.descer = await segura(p, '[data-acao="descer"]', 1000, 52);
  // volta ao meio voando: depois consegue andar e parar de voar sem encalhar
  await p.evaluate(() => { const I = window.__ilha; I.controls.teleport(95, 40, 0); }); await p.waitForTimeout(4000);
  r.depoisDaVolta = await p.evaluate(() => ({ pos: window.__ilha.controls.object.position.toArray().map((v) => +v.toFixed(1)), gravidade: window.__ilha.controls.body.gravityMultiplier, aviso: document.getElementById('toast').textContent }));
  r.andaDepoisDaVolta = await p.evaluate(async () => { const I = window.__ilha; const z = document.querySelector('.joy-zona'); const q = z.getBoundingClientRect(); const x0 = q.left + q.width / 2, y0 = q.top + q.height / 2;
    const ev = (t, x, y) => z.dispatchEvent(new PointerEvent(t, { pointerId: 53, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    const a = I.controls.object.position.clone(); ev('pointerdown', x0, y0); ev('pointermove', x0, y0 - 70); await new Promise((f) => setTimeout(f, 1000)); const d = I.controls.object.position.clone(); ev('pointerup', x0, y0 - 70); return +Math.hypot(d.x - a.x, d.z - a.z).toFixed(1); });
  await p.waitForTimeout(2000);
  // joystick encostado na borda esquerda: parado não anda, e puxando para a borda anda
  r.borda = await p.evaluate(async () => { const I = window.__ilha; const z = document.querySelector('.joy-zona'); const q = z.getBoundingClientRect(); const x = q.left + 6, y = q.top + q.height / 2;
    const ev = (t, xx) => z.dispatchEvent(new PointerEvent(t, { pointerId: 54, pointerType: 'touch', isPrimary: true, clientX: xx, clientY: y, bubbles: true, cancelable: true }));
    const a = I.controls.object.position.clone(); ev('pointerdown', x); await new Promise((f) => setTimeout(f, 700)); const m = I.controls.object.position.clone();
    ev('pointermove', q.left); await new Promise((f) => setTimeout(f, 700)); const d = I.controls.object.position.clone(); ev('pointerup', q.left);
    return { parado: +Math.hypot(m.x - a.x, m.z - a.z).toFixed(2), puxandoParaBorda: +Math.hypot(d.x - m.x, d.z - m.z).toFixed(2), eixo: I.toque.estado.eixo }; });
  r.erros = erros;
  // computador: E logo depois de voltar ao jogo não reabre a pausa por cima do catálogo
  const d = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  await d.goto('http://localhost:5190/?debug'); await d.click('#bEntrar'); await d.waitForFunction(() => window.__ilha?.conectado, null, { timeout: 30000 }); await d.waitForTimeout(1200);
  await d.evaluate(() => { const I = window.__ilha; I.controls.isLocked = true; document.getElementById('bContinuar').click(); });
  await d.waitForTimeout(150); await d.evaluate(() => document.getElementById('bPausa').click()); await d.evaluate(() => document.getElementById('bCatalogoPausa').click());
  await d.waitForTimeout(900);
  r.computadorCatalogoContinua = await d.evaluate(() => !document.getElementById('tCatalogo').hidden && document.getElementById('tPausa').hidden);
  console.log(JSON.stringify(r)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
