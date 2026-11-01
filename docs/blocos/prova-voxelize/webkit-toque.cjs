const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
(async () => {
  const b = await webkit.launch(); const ctx = await b.newContext({ ...devices['iPad (gen 7) landscape'] }); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message.slice(0, 200)));
  await p.goto('http://127.0.0.1:8892/provas/voxelize-dist/index.html?servidor=http://localhost:4000/&world=flat&debug');
  await p.waitForFunction(() => { try { return window.__vx.network.joined && window.__vx.world.getVoxelAt(2, 50, 2) === 160; } catch { return false; } }, null, { timeout: 40000 });
  const r = await p.evaluate(async () => {
    const { world, controls, VOXELIZE } = window.__vx;
    const espera = (ms) => new Promise((f) => setTimeout(f, ms));
    // a demo usa os controles de teclado/mouse; desliga para não brigar com os de toque
    controls.isLocked = false;
    const m = new VOXELIZE.MobileRigidControls(controls.camera, document.querySelector('canvas'), world, {});
    const p0 = controls.object.position; m.teleport(p0.x, p0.y + 1, p0.z);
    const passo = async (n) => { for (let i = 0; i < n; i++) { m.update(); await espera(16); } };
    await passo(40);
    const a = m.object.position.clone();
    m.setMovementVector(0, 1); await passo(90); m.setMovementVector(0, 0);
    const b = m.object.position.clone();
    await passo(20);
    const yChao = m.object.position.y;
    m.setJumping(true); await passo(12); const c = m.object.position.clone(); m.setJumping(false);
    const metodos = Object.getOwnPropertyNames(m).filter((k) => typeof m[k] === 'function' && /^set|look/i.test(k));
    return { andou: +Math.hypot(b.x - a.x, b.z - a.z).toFixed(2), subiu_no_pulo: +(c.y - yChao).toFixed(2), metodos };
  });
  console.log(JSON.stringify({ ...r, erros }, null, 2)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
