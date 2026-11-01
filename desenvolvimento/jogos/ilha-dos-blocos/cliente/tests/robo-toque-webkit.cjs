// Ilha no modo toque (WebKit, emulação de iPhone/iPad): joystick, olhar, quebrar/colocar, voar, catálogo e pausa.
// Arrastos com Pointer Events touch sintéticos (o Playwright não arrasta toque nativo no WebKit); toques simples com tap().
const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
const perfil = process.argv[3] || 'iPhone 13';
(async () => {
  const b = await webkit.launch();
  const ctx = await b.newContext({ ...devices[perfil] });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', (e) => erros.push(e.message.slice(0, 140)));
  await p.goto('http://localhost:5190/?debug');
  const r = { perfil, viewport: p.viewportSize() };
  r.modoToque = await p.evaluate(() => window.__ilha.MODO_TOQUE);
  r.dicas = await p.evaluate(() => ({ toque: !document.querySelector('.dica-icones.so-toque').hidden, teclado: !document.querySelector('.dica-icones.so-teclado').hidden }));
  await p.tap('#bEntrar');
  await p.waitForFunction(() => window.__ilha?.conectado && window.__ilha.emJogo, null, { timeout: 30000 });
  await p.evaluate(() => window.__ilha.avancar(90));
  await p.screenshot({ path: `${process.argv[2]}/${perfil.replace(/\W+/g, '-')}-jogo.png` });
  // geometria: nada se sobrepõe e alvos ≥ 44 px
  r.layout = await p.evaluate(() => {
    const ids = ['barra', 'bPausa', 'bCatalogoToque'];
    const sel = ['.joy-base', '.acoes-toque', '.acoes-voo'];
    const caixas = {};
    for (const id of ids) caixas[id] = document.getElementById(id).getBoundingClientRect().toJSON();
    for (const s of sel) caixas[s] = document.querySelector(s).getBoundingClientRect().toJSON();
    const nomes = Object.keys(caixas); const sobre = [];
    for (let i = 0; i < nomes.length; i++) for (let j = i + 1; j < nomes.length; j++) {
      const a = caixas[nomes[i]], c = caixas[nomes[j]];
      if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) sobre.push(`${nomes[i]}×${nomes[j]}`);
    }
    const pequenos = [...document.querySelectorAll('.toque .acao, .vaga, #bPausa, #bCatalogoToque')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect()).filter((q) => q.width < 34 || q.height < 34).length;
    const fora = Object.entries(caixas).filter(([, q]) => q.left < 0 || q.top < 0 || q.right > innerWidth || q.bottom > innerHeight).map(([n]) => n);
    return { sobreposicoes: sobre, menoresQue34: pequenos, foraDaTela: fora };
  });
  const toqueEm = async (sel) => { const q = await p.locator(sel).boundingBox(); return [q.x + q.width / 2, q.y + q.height / 2]; };
  const arrastar = (alvoSel, x0, y0, dx, dy, passos, segurar) => p.evaluate(async ({ alvoSel, x0, y0, dx, dy, passos, segurar }) => {
    const alvo = document.querySelector(alvoSel);
    const ev = (t, x, y) => alvo.dispatchEvent(new PointerEvent(t, { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: t === 'pointerup' ? 0 : 1 }));
    ev('pointerdown', x0, y0);
    for (let i = 1; i <= passos; i++) { ev('pointermove', x0 + dx * i / passos, y0 + dy * i / passos); await window.__ilha.avancar(1); }
    await window.__ilha.avancar(segurar);
    ev('pointerup', x0 + dx, y0 + dy);
    await window.__ilha.avancar(5);
  }, { alvoSel, x0, y0, dx, dy, passos, segurar });
  const vp = p.viewportSize();
  // 1) joystick para frente
  const pos0 = await p.evaluate(() => window.__ilha.controls.object.position.toArray());
  await arrastar('.joy-zona', vp.width * 0.16, vp.height * 0.82, 0, -60, 6, 60);
  const pos1 = await p.evaluate(() => window.__ilha.controls.object.position.toArray());
  r.andou = +Math.hypot(pos1[0] - pos0[0], pos1[2] - pos0[2]).toFixed(2);
  // 2) olhar: arrastar à direita vira a câmera
  const dir0 = await p.evaluate(() => window.__ilha.controls.camera.getWorldDirection(new window.__ilha.THREE.Vector3()).toArray());
  await arrastar('#olharZona', vp.width * 0.7, vp.height * 0.4, 80, 60, 8, 5);
  const dir1 = await p.evaluate(() => window.__ilha.controls.camera.getWorldDirection(new window.__ilha.THREE.Vector3()).toArray());
  r.virouCamera_graus = +(Math.acos(Math.min(1, dir0[0] * dir1[0] + dir0[1] * dir1[1] + dir0[2] * dir1[2])) * 180 / Math.PI).toFixed(1);
  // 3) olhar para o chão perto e colocar/quebrar com os botões
  await p.evaluate(async () => { const I = window.__ilha; const c = I.controls.object.position; I.controls.setDirection(1, -0.55, 0.3); await I.avancar(20); });
  const alvoAntes = await p.evaluate(() => window.__ilha.interacao.potential?.voxel ?? null);
  const [cx, cy] = await toqueEm('[data-acao="colocar"]'); await p.touchscreen.tap(cx, cy); await p.evaluate(() => window.__ilha.avancar(30));
  r.colocou = alvoAntes ? await p.evaluate((v) => window.__ilha.world.getBlockById(window.__ilha.world.getVoxelAt(...v))?.name, alvoAntes) : null;
  const alvoQuebrar = await p.evaluate(async () => { await window.__ilha.avancar(5); return window.__ilha.interacao.target; });
  const [qx, qy] = await toqueEm('[data-acao="quebrar"]'); await p.touchscreen.tap(qx, qy); await p.evaluate(() => window.__ilha.avancar(30));
  r.quebrou = alvoQuebrar ? await p.evaluate((v) => window.__ilha.world.getVoxelAt(...v) === 0, alvoQuebrar) : null;
  // 4) voar liga o botão de descer
  const [vx, vy] = await toqueEm('[data-acao="voar"]'); await p.touchscreen.tap(vx, vy); await p.evaluate(() => window.__ilha.avancar(20));
  r.voarMostraDescer = await p.evaluate(() => getComputedStyle(document.querySelector('[data-acao="descer"]')).display !== 'none');
  await p.touchscreen.tap(vx, vy); await p.evaluate(() => window.__ilha.avancar(20));
  // 5) barra por toque, catálogo e pausa
  const terceira = await toqueEm('.vaga:nth-child(3)'); await p.touchscreen.tap(...terceira);
  r.vagaEscolhida = await p.evaluate(() => window.__ilha.vaga);
  await p.tap('#bCatalogoToque');
  r.catalogoAbriu = await p.isVisible('#tCatalogo'); r.parouDeJogar = await p.evaluate(() => !window.__ilha.emJogo);
  await p.screenshot({ path: `${process.argv[2]}/${perfil.replace(/\W+/g, '-')}-catalogo.png` });
  await p.tap('#gradeCatalogo button:nth-child(20)');
  r.catalogoFechouEVoltou = await p.evaluate(() => document.getElementById('tCatalogo').hidden && window.__ilha.emJogo);
  await p.tap('#bPausa'); r.pausou = await p.isVisible('#tPausa');
  await p.tap('#bContinuar'); r.continuou = await p.evaluate(() => window.__ilha.emJogo && document.getElementById('tPausa').hidden);
  // limpa o bloco de teste
  if (alvoAntes && r.colocou) await p.evaluate(async (v) => { window.__ilha.world.updateVoxel(...v, 0, {}); await window.__ilha.avancar(10); }, alvoAntes);
  r.erros = erros;
  console.log(JSON.stringify(r, null, 2)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
