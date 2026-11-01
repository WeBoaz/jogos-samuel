// Prova no motor WebKit (Safari) com emulação de iPhone — não substitui aparelho real.
const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
const out = process.argv[2];
const URL = 'http://127.0.0.1:8770/jogo/minigolfe-dos-pets/index.html?debug&fps=10';
(async () => {
  const b = await webkit.launch();
  const r = { motor: `WebKit ${b.version()}`, erros: [], passos: [] };
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') r.erros.push(m.text()); });
  p.on('pageerror', (e) => r.erros.push('pageerror: ' + e.message));
  const t0 = Date.now();
  await p.goto(URL);
  await p.waitForSelector('#bJogar', { state: 'visible' });
  r.passos.push(`menu visível em ${Date.now() - t0} ms`);
  r.webgl = await p.evaluate(() => { const g = document.getElementById('jogo').getContext('webgl2') || document.getElementById('jogo').getContext('webgl'); return !!g; });
  r.ua = await p.evaluate(() => navigator.userAgent);
  r.rolagem = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight }));
  await p.screenshot({ path: `${out}/1-menu-retrato.png` });
  await p.tap('#bJogar');
  await p.waitForFunction(() => window.__minigolfe?.estado === 'jogando');
  await p.waitForTimeout(2500);
  r.passos.push('toque em JOGAR → estado jogando');
  // gesto estilingue: Pointer Events tipo touch SINTÉTICOS no canvas (o WebKit do Playwright não arrasta toque nativo)
  const antes = await p.evaluate(() => window.__minigolfe.partida.tacadasDoJogador?.(0) ?? JSON.stringify(window.__minigolfe.fisica.bola));
  await p.evaluate(async () => {
    const c = document.getElementById('jogo'); const r = c.getBoundingClientRect();
    const ev = (tipo, x, y) => c.dispatchEvent(new PointerEvent(tipo, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: tipo === 'pointerup' ? 0 : 1 }));
    const x0 = r.left + r.width / 2, y0 = r.top + r.height * 0.45;
    ev('pointerdown', x0, y0);
    for (let i = 1; i <= 12; i++) { ev('pointermove', x0, y0 + i * 14); await new Promise((f) => setTimeout(f, 16)); }
    ev('pointerup', x0, y0 + 168);
  });
  await p.waitForTimeout(400);
  r.bolaAndou = await p.evaluate(() => window.__minigolfe.fisica.bola.movendo || window.__minigolfe.partida.tacadasNaPista?.() > 0);
  r.passos.push(`gesto de mira (touch sintético) → bola em movimento: ${r.bolaAndou}`);
  await p.screenshot({ path: `${out}/2-tacada.png` });
  await p.waitForFunction(() => !window.__minigolfe.fisica.bola.movendo, null, { timeout: 25000 }).catch(() => r.passos.push('bola não parou em 25 s'));
  await p.tap('#bPausa');
  r.pausado = await p.evaluate(() => window.__minigolfe.pausado);
  await p.screenshot({ path: `${out}/3-pausa.png` });
  await p.tap('#bContinuar');
  r.continuou = await p.evaluate(() => !window.__minigolfe.pausado);
  r.passos.push(`pausa: ${r.pausado} · continuar: ${r.continuou}`);
  // termina o circuito pelo atalho de depuração para chegar ao fim e ao save
  await p.evaluate(() => { const g = window.__minigolfe; for (let k = 0; k < 60 && g.estado !== 'fim'; k++) { if (g.estado === 'placar') g.proxima(); else if (!g.fisica.bola.movendo && g.partida.podeTacar()) g.tacar(g.anguloParaBuraco(), 0.5); g.avancar(3); } });
  r.fim = await p.evaluate(() => window.__minigolfe.estado);
  r.save = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('samuel:minigolfe-dos-pets:')).map((k) => [k, JSON.parse(localStorage.getItem(k)).melhores]));
  await p.screenshot({ path: `${out}/4-fim.png` });
  await p.tap('#bDeNovo').catch(() => {});
  await p.waitForTimeout(1500);
  r.deNovo = await p.evaluate(() => window.__minigolfe.estado);
  r.passos.push(`fim: ${r.fim} · jogar de novo → ${r.deNovo}`);
  await p.waitForTimeout(9000);
  r.medidor = await p.evaluate(() => ({ barra: document.getElementById('medidor')?.textContent, resumo: document.querySelector('#medidorResumo pre')?.textContent }));
  await p.screenshot({ path: `${out}/5-medidor.png` });
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(800);
  r.deitado = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight }));
  await p.screenshot({ path: `${out}/6-deitado.png` });
  await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('samuel:minigolfe-dos-pets:')) localStorage.removeItem(k); });
  await b.close();
  console.log(JSON.stringify(r, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
