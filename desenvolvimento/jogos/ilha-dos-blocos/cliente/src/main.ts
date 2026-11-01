// Ilha dos Blocos — controlador do cliente: conexão com o servidor da ilha, mundo, controles, barra e telas.
// Motor: @voxelize/core 3.0.0 (MIT). Regras de inventário em ./regras (puras, testadas).
import './ui/ui-blocos.css';
import './ui/ilha.css';
import * as THREE from 'three';
import * as VOXELIZE from '@voxelize/core';
import { AGUA, BARRA_INICIAL, BLOCOS, porId, type BlocoArte } from './catalogo';
import { desenhar, icone } from './texturas';
import { BARRA, criar, escolherNoCatalogo, usar, type Inventario } from './regras/inventario';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
// Endereço do servidor: fixo no build (VITE_ILHA_SERVIDOR); ?servidor= só vale com ?debug.
const SERVIDOR = (DEBUG && params.get('servidor')) || import.meta.env.VITE_ILHA_SERVIDOR || 'http://localhost:4100/';
const SEGREDO = import.meta.env.VITE_ILHA_SEGREDO || 'ilha-local';
const MUNDO = 'ilha';
const ALCANCE = 5;
const TOQUE = matchMedia('(pointer: coarse)').matches;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const telas = ['tInicio', 'tConexao', 'tPausa', 'tCatalogo'] as const;
type Tela = (typeof telas)[number] | null;
function mostrar(t: Tela) { for (const id of telas) $(id).hidden = id !== t; $('hud').hidden = t !== null && t !== 'tPausa' && t !== 'tCatalogo'; }

// ---------------- motor ----------------
const canvas = $<HTMLCanvasElement>('jogo');
const world = new VOXELIZE.World({ textureUnitDimension: 16 });
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const inputs = new VOXELIZE.Inputs<'jogo' | 'menu'>();
const controls = new VOXELIZE.RigidControls(camera, renderer.domElement, world, { initialPosition: [0.5, 48, 0.5], flyForce: 300 });
controls.connect(inputs, 'jogo');
const interacao = new VOXELIZE.VoxelInteract(controls.object, world, {
  highlightType: 'outline', highlightColor: new THREE.Color('#193337'), highlightOpacity: 0.7, reachDistance: ALCANCE,
  inverseDirection: true,   // o objeto dos controles aponta para +Z; a câmera olha para -Z
});
world.add(interacao);
// céu com as cores do kit: amanhecer, dia claro, entardecer e noite azulada (sem breu total para criança)
world.sky.setShadingPhases([
  { name: 'amanhecer', color: { top: '#7fa6dc', middle: '#ffb38a', bottom: '#cfe8f2' }, skyOffset: 0.05, voidOffset: 0.6, start: 0.2 },
  { name: 'dia', color: { top: '#6fb1f2', middle: '#c3e8f4', bottom: '#e8f6fb' }, skyOffset: 0, voidOffset: 0.6, start: 0.25 },
  { name: 'entardecer', color: { top: '#8a7fb8', middle: '#ff9d52', bottom: '#f5d6b8' }, skyOffset: 0.05, voidOffset: 0.6, start: 0.7 },
  { name: 'noite', color: { top: '#101c3a', middle: '#26345e', bottom: '#2f3f6b' }, skyOffset: 0.1, voidOffset: 0.6, start: 0.75 },
]);
world.sky.paint('bottom', VOXELIZE.artFunctions.drawSun());
world.sky.paint('top', VOXELIZE.artFunctions.drawStars());
world.sky.paint('top', VOXELIZE.artFunctions.drawMoon());
const network = new VOXELIZE.Network();
network.register(world);   // sem Chat: a Ilha não tem chat livre

// ---------------- estado do jogo ----------------
let inv: Inventario = criar(BARRA, true);
BARRA_INICIAL.forEach((nome, i) => { inv = escolherNoCatalogo(inv, i, BLOCOS.find((b) => b.nome === nome)!.id); });
let vaga = 0;
let conectado = false;
let iniciando: Promise<void> | null = null;

// ---------------- barra ----------------
const barra = $('barra');
const iconeCache = new Map<number, string>();
function iconeUrl(b: BlocoArte) {
  if (!iconeCache.has(b.id)) iconeCache.set(b.id, icone(b, 48).toDataURL());
  return iconeCache.get(b.id)!;
}
function montarBarra() {
  barra.replaceChildren(...inv.vagas.map((v, i) => {
    const bt = document.createElement('button');
    bt.className = 'vaga';
    bt.setAttribute('aria-pressed', String(i === vaga));
    const b = v ? porId(v.id) : undefined;
    bt.setAttribute('aria-label', `Vaga ${i + 1}${b ? `: ${b.nome}` : ' vazia'}`);
    bt.innerHTML = `<b>${i + 1}</b>`;
    if (b) { const im = new Image(); im.src = iconeUrl(b); im.alt = ''; im.width = im.height = 40; im.style.imageRendering = 'pixelated'; bt.append(im); }
    bt.addEventListener('click', (e) => { e.stopPropagation(); escolherVaga(i); });
    return bt;
  }));
}
let nomeTimer = 0;
function escolherVaga(i: number) {
  vaga = (i + BARRA) % BARRA;
  montarBarra();
  const b = inv.vagas[vaga] ? porId(inv.vagas[vaga]!.id) : undefined;
  $('nomeBloco').textContent = b?.nome ?? '';
  clearTimeout(nomeTimer);
  nomeTimer = window.setTimeout(() => { $('nomeBloco').textContent = ''; }, 1600);
}
for (let i = 1; i <= 9; i++) inputs.bind(`Digit${i}`, () => escolherVaga(i - 1), 'jogo');
inputs.scroll(() => escolherVaga(vaga - 1), () => escolherVaga(vaga + 1), 'jogo');

// ---------------- catálogo ----------------
function montarCatalogo() {
  $('vagaCatalogo').textContent = String(vaga + 1);
  $('gradeCatalogo').replaceChildren(...BLOCOS.map((b) => {
    const bt = document.createElement('button');
    const im = new Image(); im.src = iconeUrl(b); im.alt = ''; im.width = im.height = 44; im.style.imageRendering = 'pixelated';
    bt.append(im, document.createTextNode(b.nome));
    bt.addEventListener('click', () => { inv = escolherNoCatalogo(inv, vaga, b.id); montarBarra(); fecharCatalogo(); });
    return bt;
  }));
}
function abrirCatalogo() { if (!conectado) return; montarCatalogo(); controls.unlock(); mostrar('tCatalogo'); }
function fecharCatalogo() { mostrar(null); controls.lock(); escolherVaga(vaga); }
inputs.bind('KeyE', abrirCatalogo, 'jogo');

// ---------------- quebrar e colocar ----------------
function dentroDoJogador(vx: number, vy: number, vz: number) {
  const p = controls.object.position;
  const meia = controls.options.bodyWidth / 2, alto = controls.options.bodyHeight;
  const pe = p.y - alto * controls.options.eyeHeight;
  return vx + 1 > p.x - meia && vx < p.x + meia && vz + 1 > p.z - meia && vz < p.z + meia && vy + 1 > pe && vy < pe + alto;
}
function quebrar() {
  if (!interacao.target) return;
  const [vx, vy, vz] = interacao.target;
  world.updateVoxel(vx, vy, vz, 0, {});
}
function colocar() {
  const pot = interacao.potential;
  if (!pot) return;
  const [vx, vy, vz] = pot.voxel;
  if (dentroDoJogador(vx, vy, vz)) return aviso('Aí não: você está nesse lugar!');
  const r = usar(inv, vaga);
  if (r.id === null) return aviso('Escolha um bloco no catálogo (E).');
  inv = r.inv;
  world.updateVoxel(vx, vy, vz, r.id, { rotation: pot.rotation, yRotation: pot.yRotation });
}
inputs.click('left', quebrar, 'jogo');
inputs.click('right', colocar, 'jogo');
inputs.bind('KeyF', controls.toggleFly, 'jogo');

let avisoTimer = 0;
function aviso(txt: string) {
  const t = $('toast'); t.textContent = txt; t.hidden = false;
  clearTimeout(avisoTimer); avisoTimer = window.setTimeout(() => { t.hidden = true; }, 1800);
}

// ---------------- texturas ----------------
function textura(b: BlocoArte, face: 'topo' | 'lado' | 'baixo') {
  const t = new THREE.CanvasTexture(desenhar(b, face));
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  return t;
}
function aplicarTexturas() {
  for (const b of [...BLOCOS, AGUA]) {
    const temTopo = ['grama', 'tronco', 'bancada', 'fornalha', 'bau'].includes(b.desenho);
    if (temTopo) {
      world.applyBlockTexture(b.nome, ['py'], textura(b, 'topo'));
      world.applyBlockTexture(b.nome, ['ny'], textura(b, b.desenho === 'tronco' ? 'topo' : 'baixo'));
      world.applyBlockTexture(b.nome, ['px', 'nx', 'pz', 'nz'], textura(b, 'lado'));
    } else {
      world.applyBlockTexture(b.nome, ['px', 'nx', 'py', 'ny', 'pz', 'nz'], textura(b, 'lado'));
    }
  }
}

// ---------------- conexão ----------------
function telaConexao(titulo: string, texto: string, falhou: boolean) {
  $('conexaoTitulo').textContent = titulo; $('conexaoTexto').textContent = texto; $('conexaoAcoes').hidden = !falhou;
  mostrar('tConexao');
}
async function conectar(): Promise<void> {
  telaConexao('Chegando na ilha…', 'Preparando os blocos.', false);
  const tempo = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('demorou')), 12000));
  await Promise.race([network.connect(SERVIDOR, { secret: SEGREDO }), tempo]);
  await Promise.race([network.join(MUNDO), tempo]);
  await world.initialize();
  aplicarTexturas();
  conectado = true;
}
function entrar() {
  if (conectado) { mostrar(null); controls.lock(); return; }
  iniciando ??= conectar()
    .then(() => { mostrar(null); controls.lock(); escolherVaga(vaga); })
    .catch(() => {
      iniciando = null;
      try { network.disconnect(); } catch { /* já caiu */ }
      telaConexao('A ilha está dormindo 😴', 'Não deu para chegar na ilha agora. Tente de novo daqui a pouco.', true);
    });
}

// ---------------- pausa ----------------
controls.on('unlock', () => {
  if (!conectado) return;
  inputs.setNamespace('menu');
  if ($('tCatalogo').hidden) mostrar('tPausa');
});
controls.on('lock', () => { inputs.setNamespace('jogo'); mostrar(null); });
$('bEntrar').addEventListener('click', entrar);
$('bTentar').addEventListener('click', entrar);
$('bContinuar').addEventListener('click', () => controls.lock());
$('bPausa').addEventListener('click', (e) => { e.stopPropagation(); controls.unlock(); mostrar('tPausa'); });
$('bCatalogoPausa').addEventListener('click', abrirCatalogo);
$('bFecharCatalogo').addEventListener('click', fecharCatalogo);
if (TOQUE) $('avisoToque').hidden = false;

// ---------------- laço ----------------
function redimensionar() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', redimensionar);
redimensionar();
const direcao = new THREE.Vector3();
function passo() {
  if (!world.isInitialized) return;
  interacao.update();
  controls.update();
  world.update(controls.object.position, camera.getWorldDirection(direcao));
  renderer.render(world, camera);
}
function quadro() { requestAnimationFrame(quadro); passo(); }
requestAnimationFrame(quadro);
montarBarra();
mostrar('tInicio');

if (DEBUG) (window as unknown as { __ilha: object }).__ilha = {
  world, controls, network, interacao, VOXELIZE, THREE,
  get inv() { return inv; }, get vaga() { return vaga; }, get conectado() { return conectado; },
  entrar, escolherVaga, quebrar, colocar,
  /** Roda n quadros na mão (o painel oculto para o requestAnimationFrame). */
  avancar: async (n = 30) => { for (let i = 0; i < n; i++) { passo(); await new Promise((r) => setTimeout(r, 16)); } },
};
