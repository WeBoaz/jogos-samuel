// controles-toque.js — joystick à esquerda + botões de ação à direita, com multitoque.
// Fonte única em desenvolvimento/compartilhado/; cada jogo leva uma CÓPIA para a própria pasta.
// Usa Pointer Events: cada dedo tem o seu pointerId, então andar e apertar uma ação ao mesmo
// tempo funciona. O jogo lê `estado.eixo` e `estado.botoes` no passo da simulação.
//
//   const toque = criarControlesToque({ raiz: document.querySelector('.toque'), aoApertar: (nome) => {...} });
//   ... toque.estado.eixo.x, toque.estado.eixo.y (−1..1), toque.estado.botoes.has('golpe')
//   toque.destruir();   // ao sair do jogo; no reinício basta toque.soltarTudo()

const RAIO = 52;          // px que o pino anda até o eixo valer 1
const ZONA_MORTA = 0.18;  // dedo parado perto do centro não mexe o herói

export function criarControlesToque({ raiz, aoApertar = () => {}, aoSoltar = () => {} }) {
  const zona = raiz.querySelector('.joy-zona');
  const base = raiz.querySelector('.joy-base');
  const pino = raiz.querySelector('.joy-pino');
  const estado = { eixo: { x: 0, y: 0 }, botoes: new Set(), usandoToque: false };
  const dedosBotao = new Map();   // pointerId → nome da ação
  let dedoJoy = null, centro = null;
  const limpadores = [];
  const ouvir = (alvo, tipo, fn, opc) => { alvo.addEventListener(tipo, fn, opc); limpadores.push(() => alvo.removeEventListener(tipo, fn, opc)); };

  const marcarToque = (e) => {
    if (e.pointerType === 'touch' && !estado.usandoToque) { estado.usandoToque = true; document.body.classList.add('modo-toque'); }
  };
  if (matchMedia('(pointer: coarse)').matches) { estado.usandoToque = true; document.body.classList.add('modo-toque'); }
  ouvir(window, 'pointerdown', marcarToque, { capture: true });

  // ---- joystick flutuante: a base aparece embaixo do polegar ----
  function soltarJoy() {
    dedoJoy = null; centro = null; estado.eixo.x = 0; estado.eixo.y = 0;
    zona.classList.remove('ativo'); base.style.left = ''; base.style.top = '';
    pino.style.setProperty('--jx', '0px'); pino.style.setProperty('--jy', '0px');
  }
  ouvir(zona, 'pointerdown', (e) => {
    if (dedoJoy !== null) return;
    e.preventDefault();
    dedoJoy = e.pointerId;
    try { zona.setPointerCapture(e.pointerId); } catch {}
    const r = zona.getBoundingClientRect();
    // a base desenhada fica dentro da tela, mas o centro lógico é onde o dedo encostou:
    // polegar parado perto da borda não anda sozinho
    const x = Math.min(Math.max(e.clientX - r.left, 76), r.width - 40);
    const y = Math.min(Math.max(e.clientY - r.top, 40), r.height - 76);
    base.style.left = x + 'px'; base.style.top = y + 'px';
    // …mas a pelo menos 16 px da borda da zona: dá para andar NA DIREÇÃO da borda mesmo encostando nela, e o polegar
    // parado ali não passa da zona morta (16 px ≈ 0,3 do raio; parado a 6 px da borda o eixo fica abaixo do limiar)
    centro = { x: Math.min(Math.max(e.clientX, r.left + 16), r.right - 16), y: Math.min(Math.max(e.clientY, r.top + 16), r.bottom - 16) };
    zona.classList.add('ativo');
  });
  ouvir(zona, 'pointermove', (e) => {
    if (e.pointerId !== dedoJoy || !centro) return;
    let dx = e.clientX - centro.x, dy = e.clientY - centro.y;
    const d = Math.hypot(dx, dy);
    if (d > RAIO) { dx = dx / d * RAIO; dy = dy / d * RAIO; }
    pino.style.setProperty('--jx', dx + 'px'); pino.style.setProperty('--jy', dy + 'px');
    const m = Math.min(d, RAIO) / RAIO;
    if (m < ZONA_MORTA) { estado.eixo.x = 0; estado.eixo.y = 0; return; }
    const k = (m - ZONA_MORTA) / (1 - ZONA_MORTA) / (Math.min(d, RAIO) || 1);
    estado.eixo.x = dx * k; estado.eixo.y = dy * k;
  });
  for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    ouvir(zona, tipo, (e) => { if (e.pointerId === dedoJoy) soltarJoy(); });
  }

  // ---- botões de ação ----
  function soltarBotao(id) {
    const nome = dedosBotao.get(id);
    if (!nome) return;
    dedosBotao.delete(id);
    if (![...dedosBotao.values()].includes(nome)) {
      estado.botoes.delete(nome);
      raiz.querySelector(`[data-acao="${nome}"]`)?.classList.remove('on');
      aoSoltar(nome);
    }
  }
  for (const btn of raiz.querySelectorAll('[data-acao]')) {
    const nome = btn.dataset.acao;
    ouvir(btn, 'pointerdown', (e) => {
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch {}
      dedosBotao.set(e.pointerId, nome);
      if (!estado.botoes.has(nome)) { estado.botoes.add(nome); btn.classList.add('on'); aoApertar(nome); }
    });
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) ouvir(btn, tipo, (e) => soltarBotao(e.pointerId));
    ouvir(btn, 'contextmenu', (e) => e.preventDefault());
  }

  function soltarTudo() {
    soltarJoy();
    for (const id of [...dedosBotao.keys()]) soltarBotao(id);
  }
  // perdeu o foco (trocou de aba, notificação): nada fica "apertado"
  ouvir(window, 'blur', soltarTudo);
  ouvir(document, 'visibilitychange', () => { if (document.hidden) soltarTudo(); });

  // recarga visual: valor 0..1 (1 = acabou de usar)
  function recarga(nome, fracao) {
    const btn = raiz.querySelector(`[data-acao="${nome}"]`);
    if (!btn) return;
    btn.style.setProperty('--r', Math.max(0, Math.min(1, fracao)).toFixed(3));
    btn.dataset.pronto = fracao > 0 ? 'nao' : 'sim';
  }

  return { estado, soltarTudo, recarga, destruir: () => { soltarTudo(); limpadores.splice(0).forEach((f) => f()); } };
}
