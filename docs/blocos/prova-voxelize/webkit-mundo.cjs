const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
(async () => {
  const b = await webkit.launch(); const r = { motor: 'WebKit ' + b.version() , erros: [] };
  for (const perfil of ['iPad (gen 7) landscape', 'iPhone 13']) {
    const ctx = await b.newContext({ ...devices[perfil] }); const p = await ctx.newPage();
    p.on('pageerror', (e) => r.erros.push(perfil + ': ' + e.message.slice(0, 160)));
    p.on('console', (m) => m.type() === 'error' && r.erros.push(perfil + ': ' + m.text().slice(0, 160)));
    const t0 = Date.now();
    await p.goto('http://127.0.0.1:8892/provas/voxelize-dist/index.html?servidor=http://localhost:4000/&world=flat&debug');
    const ok = await p.waitForFunction(() => { try { return window.__vx && window.__vx.network.joined && window.__vx.world.getVoxelAt(2, 50, 2) === 160; } catch { return false; } }, null, { timeout: 40000 }).then(() => true, () => false);
    r[perfil] = { mundoComBlocos: ok, ms: Date.now() - t0, webgl2: await p.evaluate(() => !!document.createElement('canvas').getContext('webgl2')) };
    if (ok) {
      await p.evaluate(() => window.__vx.world.updateVoxel(6, 50, 6, window.__vx.world.getBlockByName('Glass').id, {}));
      await p.waitForTimeout(1500);
      r[perfil].colocouVidro = await p.evaluate(() => window.__vx.world.getVoxelAt(6, 50, 6));
    }
    await p.screenshot({ path: process.argv[2] + '/' + perfil.replace(/\W+/g, '-') + '.png' });
    await ctx.close();
  }
  console.log(JSON.stringify(r, null, 2)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
