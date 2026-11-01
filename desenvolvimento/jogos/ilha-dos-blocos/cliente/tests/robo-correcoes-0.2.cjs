// Confere as correções da rodada 1 da 0.2 no toque (WebKit emulado). Física medida com o rAF real (sem avancar()).
const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
const perfil = process.argv[2] || 'iPhone 13';
const esperar = (p, ms) => p.waitForTimeout(ms);
(async () => {
  const b = await webkit.launch(); const p = await (await b.newContext({ ...devices[perfil] })).newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message.slice(0, 120)));
  await p.goto('http://localhost:5190/?debug'); await p.tap('#bEntrar');
  await p.waitForFunction(() => window.__ilha?.conectado && window.__ilha.emJogo, null, { timeout: 30000 }); await esperar(p, 1500);
  const r = { perfil };
  // (P1-1) tocar numa vaga com a mira num bloco não quebra o bloco
  await p.evaluate(() => window.__ilha.controls.setDirection(1, -0.8, 0.3)); await esperar(p, 400);
  const alvo = await p.evaluate(() => window.__ilha.interacao.target);
  const q = await p.locator('.vaga:nth-child(4)').boundingBox(); await p.touchscreen.tap(q.x + q.width / 2, q.y + q.height / 2); await esperar(p, 400);
  const t = await p.locator('#bCatalogoToque').boundingBox(); await p.touchscreen.tap(t.x + t.width / 2, t.y + t.height / 2); await esperar(p, 300);
  await p.tap('#bFecharCatalogo'); await esperar(p, 300);
  r.tocarVagaNaoQuebra = alvo ? await p.evaluate((v) => window.__ilha.world.getVoxelAt(...v) !== 0, alvo) : 'sem alvo';
  // (UX P1-2) vagas ≥ 44 px, nada sobreposto
  r.vagas = await p.evaluate(() => { const v = [...document.querySelectorAll('.vaga')].map((e) => e.getBoundingClientRect()); return { min: Math.round(Math.min(...v.map((q) => Math.min(q.width, q.height)))) }; });
  r.sobreposicoes = await p.evaluate(() => {
    const els = { barra: document.getElementById('barra'), cat: document.getElementById('bCatalogoToque'), pausa: document.getElementById('bPausa'), joy: document.querySelector('.joy-base'), acoes: document.querySelector('.acoes-toque'), voo: document.querySelector('.acoes-voo') };
    const c = Object.fromEntries(Object.entries(els).map(([k, e]) => [k, e.getBoundingClientRect()])); const n = Object.keys(c); const s = [];
    for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) { const a = c[n[i]], d = c[n[j]]; if (a.left < d.right && d.left < a.right && a.top < d.bottom && d.top < a.bottom) s.push(n[i] + '×' + n[j]); }
    return s; });
  // (UX P1-1) aviso compacto e sem cortar
  await p.evaluate(() => { const I = window.__ilha; I.controls.setDirection(0.05, -1, 0.05); }); await esperar(p, 300);
  const c = await p.locator('[data-acao="colocar"]').boundingBox(); await p.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2); await esperar(p, 200);
  r.aviso = await p.evaluate(() => { const t = document.getElementById('toast'); const q = t.getBoundingClientRect(); return t.hidden ? 'oculto' : { texto: t.textContent.slice(0, 40), w: Math.round(q.width), h: Math.round(q.height), cabe: q.left >= 0 && q.right <= innerWidth }; });
  await p.screenshot({ path: `${process.argv[3]}/${perfil.replace(/\W+/g, '-')}-aviso.png` });
  // (REV P1-2) voar, descer até pousar: o botão segue o motor
  const voar = await p.locator('[data-acao="voar"]').boundingBox(); await p.touchscreen.tap(voar.x + voar.width / 2, voar.y + voar.height / 2); await esperar(p, 900);
  r.voandoDepoisDeLigar = await p.evaluate(() => document.getElementById('toque').classList.contains('voando'));
  const y0 = await p.evaluate(() => window.__ilha.controls.object.position.y);
  // segura "descer" com Pointer Event (toque longo)
  await p.evaluate(async () => { const el = document.querySelector('[data-acao="descer"]'); const q = el.getBoundingClientRect(); const ev = (t) => el.dispatchEvent(new PointerEvent(t, { pointerId: 44, pointerType: 'touch', isPrimary: false, clientX: q.x + 10, clientY: q.y + 10, bubbles: true, cancelable: true })); ev('pointerdown'); await new Promise((f) => setTimeout(f, 2500)); ev('pointerup'); });
  await esperar(p, 600);
  r.pousou = await p.evaluate(() => ({ classeVoando: document.getElementById('toque').classList.contains('voando'), gravidade: window.__ilha.controls.body.gravityMultiplier }));
  // velocidade de voo: liga o voo e anda para frente 1,5 s
  await p.touchscreen.tap(voar.x + voar.width / 2, voar.y + voar.height / 2); await esperar(p, 900);
  r.velVoo = await p.evaluate(async () => { const I = window.__ilha; const z = document.querySelector('.joy-zona'); const q = z.getBoundingClientRect(); const x0 = q.left + q.width * 0.5, y0 = q.top + q.height * 0.5;
    const ev = (t, x, y) => z.dispatchEvent(new PointerEvent(t, { pointerId: 45, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    const a = I.controls.object.position.clone(); ev('pointerdown', x0, y0); ev('pointermove', x0, y0 - 70); await new Promise((f) => setTimeout(f, 1500)); const d = I.controls.object.position.clone(); ev('pointerup', x0, y0 - 70);
    return +(Math.hypot(d.x - a.x, d.z - a.z) / 1.5).toFixed(1); });
  await p.touchscreen.tap(voar.x + voar.width / 2, voar.y + voar.height / 2); await esperar(p, 1500);
  // (UX P1-4) polegar parado na borda não anda
  r.bordaParado = await p.evaluate(async () => { const I = window.__ilha; const z = document.querySelector('.joy-zona'); const q = z.getBoundingClientRect();
    const ev = (t) => z.dispatchEvent(new PointerEvent(t, { pointerId: 46, pointerType: 'touch', isPrimary: true, clientX: q.left + 12, clientY: q.bottom - 12, bubbles: true, cancelable: true }));
    const a = I.controls.object.position.clone(); ev('pointerdown'); await new Promise((f) => setTimeout(f, 800)); const d = I.controls.object.position.clone(); ev('pointerup');
    return +Math.hypot(d.x - a.x, d.z - a.z).toFixed(2); });
  // velocidade andando
  r.velAndar = await p.evaluate(async () => { const I = window.__ilha; const z = document.querySelector('.joy-zona'); const q = z.getBoundingClientRect(); const x0 = q.left + q.width * 0.5, y0 = q.top + q.height * 0.5;
    const ev = (t, x, y) => z.dispatchEvent(new PointerEvent(t, { pointerId: 47, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    ev('pointerdown', x0, y0); ev('pointermove', x0 + 70, y0); await new Promise((f) => setTimeout(f, 400)); const a = I.controls.object.position.clone(); await new Promise((f) => setTimeout(f, 1000)); const d = I.controls.object.position.clone(); ev('pointerup', x0 + 70, y0);
    return +Math.hypot(d.x - a.x, d.z - a.z).toFixed(1); });
  r.erros = erros; console.log(JSON.stringify(r)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
