const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
(async () => {
  const b = await webkit.launch(); const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] }); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message)); p.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await p.goto('http://127.0.0.1:8770/jogo/minigolfe-dos-pets/index.html?debug&fps=10');
  await p.waitForSelector('#bJogar', { state: 'visible' }); await p.tap('#bJogar');
  await p.waitForFunction(() => window.__minigolfe?.estado === 'jogando');
  await p.waitForTimeout(12000);
  const jogando = await p.evaluate(() => ({ painel: !!document.getElementById('medidorResumo'), barra: document.getElementById('medidor').textContent }));
  await p.tap('#bPausa'); await p.waitForTimeout(700);
  const pausado = await p.evaluate(() => { const r = document.getElementById('medidorResumo'); const b = r?.getBoundingClientRect(); return { painel: !!r, area: b ? Math.round(100 * b.width * b.height / (innerWidth * innerHeight)) + '%' : null, texto: r?.querySelector('pre').textContent }; });
  await p.screenshot({ path: process.argv[2] + '/pausa-deitado.png' });
  await p.tap('#medidorResumo .btn.sec'); const fechou = await p.evaluate(() => !document.getElementById('medidorResumo'));
  await p.tap('#bContinuar'); const voltou = await p.evaluate(() => !window.__minigolfe.pausado);
  await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('samuel:minigolfe-dos-pets:')) localStorage.removeItem(k); });
  console.log(JSON.stringify({ erros, jogando, pausado, fechou, voltou }, null, 2)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
