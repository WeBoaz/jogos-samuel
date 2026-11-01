// Minigolfe dos Pets — controlador do jogo: telas, laço com passo fixo, turnos, efeitos e save.
import './ui/ui-blocos.css';
import './ui/minigolfe.css';
import * as THREE from 'three';
import { Fisica, PASSO, RAIO_BOLA } from './core/fisica';
import { Partida, apelido, type Modo, type ResultadoTacada } from './core/partida';
import type { Ajustes, EventoFisica, P2, Pista } from './core/tipos';
import { PISTAS } from './content/pistas';
import { Mundo, CHAO_Y, limitesDaPista } from './render/mundo';
import { Pista3D } from './render/pista3d';
import { Doguinho, Gatinho } from './render/pets';
import { Bola, Efeitos, Mira as MiraVisual } from './render/efeitos';
import { CameraGolf } from './render/camera';
import { Mira } from './input/mira';
import { Som } from './audio/som';
import { Save } from './storage/save';
import { dentro } from './core/fisica';

const AJUSTES: Record<Modo, Ajustes> = {
  assistido: { velMax: 8.2, capturaBuraco: 5.4, ima: 0.55 },
  normal: { velMax: 11, capturaBuraco: 4.2, ima: 0 },
};
const FORCA_MAX: Record<Modo, number> = { assistido: 0.9, normal: 1 };
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const CAPA = params.has('capa');

type Estado = 'menu' | 'jogando' | 'placar' | 'fim';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

class Jogo {
  private canvas = $<HTMLCanvasElement>('jogo');
  private mundo = new Mundo(this.canvas);
  private camera = new CameraGolf();
  private bola = new Bola();
  private miraVisual = new MiraVisual();
  private efeitos = new Efeitos();
  private dog = new Doguinho();
  private gato = new Gatinho();
  private save = new Save();
  private relogio = new THREE.Clock();

  private estado: Estado = 'menu';
  private pausado = false;
  private modo: Modo = this.save.dados.prefs.modo;
  private nJogadores = this.save.dados.prefs.jogadores;
  private escolha: 'circuito' | number = 'circuito';
  private pistas: Pista[] = PISTAS;
  private partida!: Partida;
  private fisica!: Fisica;
  private pista3d: Pista3D | null = null;
  private pistaCarregada = -1;
  private acumulador = 0;
  private esperas: { t: number; fn: () => void }[] = [];
  private ultimoPouso: P2 = [0, 0];
  private sumindo = 0;          // animação da bola caindo no copo
  private previa: P2[] = [];
  private tacadasTotais = 0;
  private mediaQuadro = 16;
  private tempoMedida = 0;
  private ouvintesDom = 0;
  private entrada: Mira;

  constructor() {
    this.mundo.cena.add(this.bola.malha, this.miraVisual.grupo, this.efeitos.grupo, this.dog.grupo, this.gato.grupo);
    Som.ligar(this.save.dados.prefs.som);
    this.entrada = new Mira({
      alvo: this.canvas,
      noChao: (cx, cy) => this.noChao(cx, cy),
      bola: () => [this.fisica.bola.x, this.fisica.bola.z],
      pode: () => this.estado === 'jogando' && !this.pausado && !!this.partida?.podeTacar() && !this.fisica.bola.movendo,
      forcaMax: () => FORCA_MAX[this.modo],
      anguloInicial: () => this.anguloParaBuraco(),
      aoTacar: (a, f) => this.tacar(a, f),
      aoMudar: (m) => this.mudouMira(m.ativa, m.angulo, m.forca),
    });
    this.ligarDom();
    this.redimensionar();
    this.montarMenu();
    // primeira pista no fundo do menu
    this.carregarPista(PISTAS[0], true);
    requestAnimationFrame(() => this.quadro());
    $('carregando').remove();
    if (CAPA) this.modoCapa(); else this.mostrarTela('tMenu');
  }

  // ---------------- DOM ----------------
  private ouvir(alvo: EventTarget, tipo: string, fn: (e: Event) => void): void { alvo.addEventListener(tipo, fn); this.ouvintesDom++; }

  private ligarDom(): void {
    this.ouvir(window, 'resize', () => this.redimensionar());
    this.ouvir(document, 'visibilitychange', () => { if (document.hidden) this.pausar(true); });
    this.ouvir(window, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if ((k === 'p' || k === 'P' || k === 'Escape') && this.estado === 'jogando') {
        if (k === 'Escape' && this.entrada.estado.ativa) { this.entrada.cancelar(); return; }
        this.pausar(!this.pausado);
      }
    });
    this.ouvir($('bJogar'), 'click', () => { Som.desbloquear(); Som.clique(); this.novaPartida(); });
    this.ouvir($('bPausa'), 'click', () => this.pausar(true));
    this.ouvir($('bContinuar'), 'click', () => this.pausar(false));
    this.ouvir($('bRecomecar'), 'click', () => this.novaPartida());
    this.ouvir($('bMenuPausa'), 'click', () => this.irMenu());
    this.ouvir($('bMenuPlacar'), 'click', () => this.irMenu());
    this.ouvir($('bMenuFim'), 'click', () => this.irMenu());
    this.ouvir($('bDeNovo'), 'click', () => this.novaPartida());
    this.ouvir($('bProxima'), 'click', () => { Som.clique(); this.iniciarPistaAtual(); });
    this.ouvir($('bSom'), 'click', () => {
      const on = !Som.ligado; Som.ligar(on); this.save.dados.prefs.som = on; this.save.gravar(); this.atualizarBotaoSom();
    });
    this.ouvir($('oJogadores'), 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opcao'); if (!b) return;
      this.nJogadores = Number(b.dataset.n); Som.clique(); this.montarMenu();
    });
    this.ouvir($('oModo'), 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opcao'); if (!b) return;
      this.modo = b.dataset.modo as Modo; Som.clique(); this.montarMenu();
    });
    this.ouvir($('oPistas'), 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pista-btn'); if (!b) return;
      this.escolha = b.dataset.p === 'circuito' ? 'circuito' : Number(b.dataset.p); Som.clique(); this.montarMenu();
      const alvo = this.escolha === 'circuito' ? PISTAS[0] : PISTAS[this.escolha];
      this.carregarPista(alvo, true);
    });
    this.atualizarBotaoSom();
  }

  private atualizarBotaoSom(): void {
    const b = $('bSom'); b.textContent = Som.ligado ? '🔊' : '🔇'; b.setAttribute('aria-label', Som.ligado ? 'Som ligado' : 'Som desligado');
  }

  private chaveCircuito(): string { return `${this.escolha === 'circuito' ? 'circuito' : 'pista-' + PISTAS[this.escolha].id}-${this.modo}`; }

  private montarMenu(): void {
    for (const b of $('oJogadores').querySelectorAll<HTMLButtonElement>('.opcao')) b.setAttribute('aria-pressed', String(Number(b.dataset.n) === this.nJogadores));
    for (const b of $('oModo').querySelectorAll<HTMLButtonElement>('.opcao')) b.setAttribute('aria-pressed', String(b.dataset.modo === this.modo));
    const cont = $('oPistas');
    if (!cont.children.length) {
      cont.innerHTML = `<button class="pista-btn circuito" data-p="circuito"><span class="ic">⛳</span>Todas as 6</button>` +
        PISTAS.map((p, i) => `<button class="pista-btn" data-p="${i}" aria-label="Pista ${p.id}: ${p.nome}"><span class="ic">${p.icone}</span>${p.id}. ${p.nome.split(' ')[0]}</button>`).join('');
    }
    for (const b of cont.querySelectorAll<HTMLButtonElement>('.pista-btn')) b.setAttribute('aria-pressed', String(b.dataset.p === String(this.escolha)));
    const melhor = this.save.dados.melhores[this.chaveCircuito()];
    $('recorde').hidden = !melhor;
    if (melhor) $('recorde').textContent = `🏆 recorde ${melhor.tacadas} tacadas`;
    $('avisoSave').hidden = this.save.funciona;
  }

  private mostrarTela(id: string | null): void {
    for (const t of ['tMenu', 'tPlacar', 'tPausa', 'tFim']) $(t).hidden = t !== id;
    $('hud').hidden = !(this.estado === 'jogando' || this.estado === 'placar') || id === 'tMenu';
    if (id) this.entrada.cancelar();
  }

  // ---------------- partida ----------------
  private novaPartida(): void {
    this.pistas = this.escolha === 'circuito' ? PISTAS : [PISTAS[this.escolha]];
    this.partida = new Partida(this.nJogadores, this.pistas.map((p) => p.par), this.modo);
    this.save.dados.prefs.modo = this.modo; this.save.dados.prefs.jogadores = this.nJogadores; this.save.gravar();
    this.esperas = []; this.efeitos.limpar(); this.pausado = false;
    this.estado = 'jogando';
    this.pistaCarregada = -1;
    this.iniciarPistaAtual();
  }

  private iniciarPistaAtual(): void {
    this.estado = 'jogando';
    this.mostrarTela(null);
    const pista = this.pistas[this.partida.pista];
    if (this.pistaCarregada !== pista.id || !this.pista3d) this.carregarPista(pista, false);
    this.prepararVez(true);
    this.aviso(`${pista.icone} PISTA ${pista.id}`, `${pista.nome} · par ${pista.par}`, 2.2);
    if (pista.dica && (this.modo === 'assistido' || pista.id === 1)) this.esperar(2.4, () => this.toast(pista.dica!, 2.6));
  }

  private carregarPista(pista: Pista, soFundo: boolean): void {
    this.pista3d?.descartar();
    this.fisica = new Fisica(pista, AJUSTES[this.modo]);
    this.pista3d = new Pista3D(pista, this.fisica);
    this.mundo.cena.add(this.pista3d.grupo);
    this.pistaCarregada = pista.id;
    // pets ao lado do tee, fora da pista
    const pisoTee = pista.pisos.find((p) => dentro(p.poly, pista.tee[0], pista.tee[1])) ?? pista.pisos[0];
    const xs = pisoTee.poly.map((q) => q[0]);
    const posDog: P2 = [Math.min(...xs) - 0.75, pista.tee[1] - 0.5];
    const posGato: P2 = [Math.max(...xs) + 0.75, pista.tee[1] - 0.1];
    this.dog.colocar(posDog[0], CHAO_Y, posDog[1], Math.PI / 2 - 0.3);
    this.gato.colocar(posGato[0], CHAO_Y, posGato[1], -Math.PI / 2 + 0.3);
    this.mundo.prepararPista(pista, [posDog, posGato]);
    this.efeitos.limpar();
    this.bola.malha.visible = !soFundo;
    this.miraVisual.esconder();
    const L = limitesDaPista(pista);
    const pts = [new THREE.Vector3(L.x0, 0, L.z0), new THREE.Vector3(L.x1, 0.5, L.z1)];
    this.camera.enquadrar(pts, 0.6, new THREE.Vector3(...[pista.tee[0], 0, pista.tee[1]] as [number, number, number]), new THREE.Vector3(pista.buraco[0], 0, pista.buraco[1]));
    this.camera.pular();
  }

  /** Bola no tee (ou onde parou), cor do jogador, câmera alinhada. */
  private prepararVez(noTee: boolean): void {
    const pista = this.pistas[this.partida.pista];
    if (noTee) { this.fisica.colocar(...pista.tee); this.efeitos.limparRastro(); this.pista3d?.reiniciarBandeira(); }
    this.sumindo = 0;
    this.bola.malha.visible = true;
    this.bola.cor(this.partida.jogador.cor);
    this.atualizarHud();
    this.enquadrarParaTacada();
    this.atualizarDica();
  }

  private enquadrarParaTacada(): void {
    const b = this.fisica.bola, [hx, hz] = this.fisica.pista.buraco;
    const pb = new THREE.Vector3(b.x, this.fisica.altura(b.x, b.z), b.z), ph = new THREE.Vector3(hx, this.fisica.altura(hx + 0.6, hz), hz);
    this.camera.enquadrar([pb, ph], 1.7, pb, ph);
  }

  private atualizarHud(): void {
    const p = this.partida, pista = this.pistas[p.pista];
    $('hPistaTxt').textContent = this.pistas.length > 1 ? `${p.pista + 1}/${this.pistas.length}` : `${pista.id}`;
    $('hPar').textContent = `par ${pista.par}`;
    $('hNome').textContent = p.jogador.nome;
    $('hCor').style.background = p.jogador.cor;
    $('hTacadas').textContent = String(p.tacadasAgora);
    $('hJogador').setAttribute('aria-label', `Vez do ${p.jogador.nome}, ${p.tacadasAgora} tacadas`);
  }

  private atualizarDica(): void {
    const mostrar = this.estado === 'jogando' && !this.pausado && this.partida.podeTacar() && !this.entrada.estado.ativa && (this.tacadasTotais < 2 || (!this.save.dados.prefs.viuDica && this.tacadasTotais < 4));
    $('dica').hidden = !mostrar;
  }

  private tacar(angulo: number, forca: number): void {
    const b = this.fisica.bola;
    this.ultimoPouso = [b.x, b.z];
    if (!this.fisica.tacar(angulo, forca)) return;
    this.partida.tacar();
    this.tacadasTotais++;
    if (this.tacadasTotais >= 3 && !this.save.dados.prefs.viuDica) { this.save.dados.prefs.viuDica = true; this.save.gravar(); }
    Som.tacada(forca);
    this.miraVisual.esconder();
    this.atualizarHud();
    this.atualizarDica();
    $('forca').hidden = true;
  }

  private mudouMira(ativa: boolean, angulo: number, forca: number): void {
    $('forca').hidden = !ativa;
    $('forcaBarra').style.width = `${Math.round((forca / FORCA_MAX[this.modo]) * 100)}%`;
    if (ativa && forca > 0.02) this.previa = this.fisica.previa(angulo, forca, this.modo === 'assistido' ? 2.4 : 0.32);
    else this.previa = [];
    this.atualizarDica();
  }

  private anguloParaBuraco(): number {
    const b = this.fisica.bola, [hx, hz] = this.fisica.pista.buraco;
    // aponta para onde a câmera olha (mais intuitivo); no Assistido, direto para o buraco
    if (this.modo === 'assistido') return Math.atan2(hx - b.x, -(hz - b.z));
    return this.camera.angulo;
  }

  private tratarEventos(evs: EventoFisica[]): void {
    for (const e of evs) {
      if (e.tipo === 'parede') {
        Som.parede(e.forca);
        if (e.forca > 0.25) this.efeitos.puf(e.x, this.fisica.altura(this.fisica.bola.x, this.fisica.bola.z) + 0.15, e.z, 'poeira', 4);
      } else if (e.tipo === 'borda') {
        Som.borda();
        this.toast('Quase! 😮', 1.2);
      } else if (e.tipo === 'buraco') {
        this.acertou();
      } else if (e.tipo === 'fora') {
        Som.agua();
        this.efeitos.puf(e.x, CHAO_Y + 0.15, e.z, 'agua', 14);
        this.bola.malha.visible = false;
        this.aviso('SPLASH! 💦', this.modo === 'normal' ? 'volta para onde estava (+1)' : 'volta para onde estava', 1.6);
        this.esperar(1.3, () => {
          this.fisica.colocar(...this.ultimoPouso);
          this.bola.malha.visible = true;
          this.depoisDaTacada(this.partida.parou(true));
        });
      } else if (e.tipo === 'parou') {
        this.depoisDaTacada(this.partida.parou(false));
      }
    }
  }

  private acertou(): void {
    const p = this.partida, pista = this.pistas[p.pista];
    p.acertou();
    const [hx, hz] = pista.buraco;
    const h = this.fisica.altura(hx + 0.6, hz);
    this.sumindo = 0.001;
    Som.buraco();
    this.efeitos.confetes(hx, h, hz);
    this.efeitos.puf(hx, h + 0.2, hz, 'brilho', 10);
    this.pista3d?.comemorar();
    this.dog.comemorar(); this.gato.comemorar();
    this.esperar(0.3, () => Som.latido());
    this.esperar(0.7, () => Som.miau());
    this.aviso(apelido(p.tacadasAgora, pista.par), `${p.jogador.nome}: ${p.tacadasAgora} ${p.tacadasAgora === 1 ? 'tacada' : 'tacadas'}`, 2.3);
    this.esperar(2.5, () => this.depoisDaTacada(p.continuar()));
  }

  private depoisDaTacada(r: ResultadoTacada): void {
    if (r.estourouLimite) {
      this.aviso('TUDO BEM! 👍', 'vamos para o próximo', 1.6);
      this.esperar(1.6, () => this.trocar(r));
      return;
    }
    this.trocar(r);
  }

  private trocar(r: ResultadoTacada): void {
    if (r.fim) { this.terminar(); return; }
    if (r.trocouPista) { this.mostrarPlacar(); return; }
    if (r.trocouJogador) {
      Som.vez();
      this.prepararVez(true);
      this.aviso(`VEZ DO ${this.partida.jogador.nome.toUpperCase()}`, `${this.partida.jogador.icone} sua bolinha tem esta cor`, 1.8);
      return;
    }
    // mesmo jogador, próxima tacada de onde a bola parou
    this.atualizarHud();
    this.enquadrarParaTacada();
    this.atualizarDica();
  }

  private mostrarPlacar(): void {
    this.estado = 'placar';
    const feita = this.partida.pista - 1;
    $('placarTitulo').textContent = `PISTA ${this.pistas[feita].id} ✓`;
    $('tabela').innerHTML = this.tabelaPlacar(feita);
    $('bProxima').textContent = `Pista ${this.pistas[this.partida.pista].id} ▶`;
    this.mostrarTela('tPlacar');
  }

  private tabelaPlacar(ate: number): string {
    const p = this.partida;
    const cab = this.pistas.map((q, i) => `<th${i === ate ? ' class="agora"' : ''}>${q.icone}<br>${q.id}</th>`).join('');
    const linhas = p.jogadores.map((j, k) => {
      const cel = this.pistas.map((_, i) => `<td${i === ate ? ' class="agora"' : ''}>${i <= ate ? p.tacadas[k][i] ?? '–' : ''}</td>`).join('');
      const tot = p.tacadas[k].slice(0, ate + 1).reduce<number>((s, t) => s + (t ?? 0), 0);
      return `<tr><td class="nome"><i class="bolinha" style="background:${j.cor}"></i> ${j.nome}</td>${cel}<td class="total">${tot}</td></tr>`;
    }).join('');
    const pares = this.pistas.map((q) => `<td>${q.par}</td>`).join('');
    return `<table><tr><th></th>${cab}<th>Total</th></tr><tr><td class="nome">par</td>${pares}<td>${p.parTotal()}</td></tr>${linhas}</table>`;
  }

  private terminar(): void {
    this.estado = 'fim';
    const p = this.partida;
    const rank = p.ranking();
    const medalhas = ['🥇', '🥈', '🥉', '🎖️'];
    $('podio').innerHTML = rank.map((r) => {
      const j = p.jogadores[r.jogador];
      return `<div class="linha"><span class="medalha">${medalhas[r.posicao - 1]}</span><span class="nome"><i class="bolinha" style="background:${j.cor}"></i>${j.nome}</span><span class="pts">${r.total}<small>tacadas</small></span></div>`;
    }).join('');
    const melhorTotal = rank[0].total;
    const recorde = this.save.registrar(this.chaveCircuito(), melhorTotal, p.parTotal(), p.jogadores.length, p.modo);
    $('fimSelo').hidden = !recorde;
    $('fimSelo').textContent = '🏆 novo recorde!';
    $('fimTitulo').textContent = this.pistas.length > 1 ? 'FIM DO CIRCUITO! 🎉' : 'PISTA COMPLETA! 🎉';
    Som.vitoria();
    this.dog.comemorar(); this.gato.comemorar();
    this.efeitos.confetes(this.fisica.bola.x, 0.5, this.fisica.bola.z);
    this.mostrarTela('tFim');
  }

  private irMenu(): void {
    this.estado = 'menu'; this.pausado = false; this.esperas = [];
    this.efeitos.limpar();
    this.bola.malha.visible = false; this.miraVisual.esconder();
    $('dica').hidden = true; $('forca').hidden = true; $('aviso').hidden = true;
    this.montarMenu();
    this.mostrarTela('tMenu');
  }

  private pausar(sim: boolean): void {
    if (this.estado !== 'jogando') return;
    this.pausado = sim;
    this.entrada.cancelar();
    this.mostrarTela(sim ? 'tPausa' : null);
    this.atualizarDica();
  }

  // ---------------- utilidades de tela ----------------
  private aviso(txt: string, sub: string, seg: number): void {
    const a = $('aviso');
    a.innerHTML = `${txt}<small>${sub}</small>`;
    a.hidden = false; a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
    const id = Symbol();
    (a as HTMLElement & { _id?: symbol })._id = id;
    this.esperar(seg, () => { if ((a as HTMLElement & { _id?: symbol })._id === id) a.hidden = true; });
  }
  private toast(txt: string, seg: number): void {
    const t = $('toast');
    t.textContent = txt; t.hidden = false;
    const id = Symbol(); (t as HTMLElement & { _id?: symbol })._id = id;
    this.esperar(seg, () => { if ((t as HTMLElement & { _id?: symbol })._id === id) t.hidden = true; });
  }
  /** Espera no relógio do jogo (pausa congela). */
  private esperar(seg: number, fn: () => void): void { this.esperas.push({ t: seg, fn }); }

  private noChao(cx: number, cy: number): [number, number] | null {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3();
    const h = this.fisica.altura(this.fisica.bola.x, this.fisica.bola.z);
    if (!this.camera.noPlano(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1, h, v)) return null;
    return [v.x, v.z];
  }

  private redimensionar(): void {
    const w = innerWidth, h = innerHeight;
    this.mundo.renderer.setSize(w, h, false);
    this.camera.redimensionar(w, h);
  }

  // ---------------- laço ----------------
  private quadro(): void {
    requestAnimationFrame(() => this.quadro());
    const dtReal = Math.min(this.relogio.getDelta(), 0.1);
    this.avancar(dtReal);
    this.mundo.renderer.render(this.mundo.cena, this.camera.cam);
    // qualidade adaptativa
    this.mediaQuadro += (dtReal * 1000 - this.mediaQuadro) * 0.05;
    this.tempoMedida += dtReal;
    if (this.tempoMedida > 4 && this.mediaQuadro > 26 && !document.hidden) { this.tempoMedida = 0; this.mundo.reduzirQualidade(); }
  }

  /** Avança a simulação e a animação dt segundos (público para testes com ?debug). */
  avancar(dt: number): void {
    const t = this.relogio.elapsedTime;
    const rodando = this.estado === 'jogando' && !this.pausado;
    if (rodando) {
      this.acumulador += dt;
      let passos = 0;
      while (this.acumulador >= PASSO && passos < 14) {
        const antesX = this.fisica.bola.x, antesZ = this.fisica.bola.z;
        this.tratarEventos(this.fisica.passo(PASSO));
        this.bola.rolar(this.fisica.bola.x - antesX, this.fisica.bola.z - antesZ);
        for (const e of this.esperas.slice()) { e.t -= PASSO; if (e.t <= 0) { this.esperas.splice(this.esperas.indexOf(e), 1); e.fn(); } }
        this.acumulador -= PASSO; passos++;
      }
      if (passos === 14) this.acumulador = 0;   // limite de recuperação: não acelera depois de travar
    } else if (this.estado !== 'jogando') {
      // menu/placar/fim: obstáculos e bandeira continuam vivos no fundo
      this.fisica.tempo += dt;
      for (const e of this.esperas.slice()) { e.t -= dt; if (e.t <= 0) { this.esperas.splice(this.esperas.indexOf(e), 1); e.fn(); } }
    }
    const animDt = this.pausado ? 0 : dt;
    this.entrada.atualizar(animDt);
    const b = this.fisica.bola;
    const hy = this.fisica.altura(b.x, b.z);
    let y = hy + RAIO_BOLA;
    if (b.noBuraco) {
      if (this.sumindo > 0 && this.sumindo < 1) this.sumindo = Math.min(1, this.sumindo + animDt * 3.5);
      y = this.fisica.altura(b.x + 0.6, b.z) + RAIO_BOLA - this.sumindo * 0.45;
      if (this.sumindo >= 1) this.bola.malha.visible = false;
    }
    this.bola.malha.position.set(b.x, y, b.z);
    if (b.movendo && Math.random() < 0.6) this.efeitos.marcarRastro(b.x, y - RAIO_BOLA * 0.6, b.z);
    const mira = this.entrada.estado;
    if (mira.ativa && this.estado === 'jogando' && !this.pausado) {
      this.miraVisual.mostrar(b.x, hy, b.z, mira.angulo, mira.forca, this.previa, (x, z) => this.fisica.altura(x, z), t);
    } else this.miraVisual.esconder();
    if (b.movendo) this.camera.enquadrar([new THREE.Vector3(b.x, hy, b.z), new THREE.Vector3(this.fisica.pista.buraco[0], hy, this.fisica.pista.buraco[1])], 1.7);
    this.camera.atualizar(animDt || dt * 0);
    this.pista3d?.atualizar(t, animDt, b.x, b.z);
    const olhar = this.bola.malha.visible ? this.bola.malha.position : new THREE.Vector3(this.fisica.pista.buraco[0], 0, this.fisica.pista.buraco[1]);
    this.dog.olhar(olhar); this.gato.olhar(olhar);
    this.dog.atualizar(t, animDt, 0); this.gato.atualizar(t, animDt, 1.7);
    this.efeitos.atualizar(animDt);
    this.mundo.atualizar(animDt);
  }

  // ---------------- capa (1200×675) ----------------
  private modoCapa(): void {
    document.body.classList.add('capa');
    for (const id of ['hud', 'tMenu']) $(id).hidden = true;
    const pista = PISTAS[Number(params.get('capa')) || 3];
    this.carregarPista(pista, false);
    this.escolha = 'circuito';
    this.partida = new Partida(1, [pista.par], 'normal');
    this.fisica.colocar(pista.buraco[0] + 0.9, pista.buraco[1] + 1.4);
    this.bola.malha.visible = true; this.bola.cor('#ff9d52');
    const [hx, hz] = pista.buraco;
    this.dog.colocar(hx - 1.6, this.fisica.altura(hx, hz), hz + 0.6, 0.9);
    this.gato.colocar(hx + 1.8, this.fisica.altura(hx, hz), hz + 0.2, -0.9);
    const pb = new THREE.Vector3(hx, 0.4, hz + 0.9);
    this.camera.enquadrar([pb.clone().add(new THREE.Vector3(-2.2, 0, 1.4)), pb.clone().add(new THREE.Vector3(2.4, 0, -1.2))], 0.2, new THREE.Vector3(hx, 0, hz + 6), new THREE.Vector3(hx, 0, hz));
    this.camera.pular();
  }

  // ---------------- depuração (?debug) ----------------
  api() {
    return {
      get estado() { return jogo.estado; },
      get pausado() { return jogo.pausado; },
      get partida() { return jogo.partida; },
      get fisica() { return jogo.fisica; },
      get mira() { return jogo.entrada.estado; },
      get esperas() { return jogo.esperas.length; },
      ouvintes: () => ({ dom: jogo.ouvintesDom, mira: jogo.entrada.ouvintes }),
      configurar: (n: number, modo: Modo, escolha: 'circuito' | number) => { jogo.nJogadores = n; jogo.modo = modo; jogo.escolha = escolha; jogo.montarMenu(); },
      jogar: () => jogo.novaPartida(),
      tacar: (a: number, f: number) => jogo.tacar(a, f),
      anguloParaBuraco: () => jogo.anguloParaBuraco(),
      avancar: (seg: number) => { for (let t = 0; t < seg; t += 1 / 30) jogo.avancar(1 / 30); },
      proxima: () => jogo.iniciarPistaAtual(),
      menu: () => jogo.irMenu(),
      pausar: (s: boolean) => jogo.pausar(s),
      qualidade: () => jogo.mundo.nivelQualidade,
      info: () => jogo.mundo.renderer.info.render,
    };
  }
}

const jogo = new Jogo();
if (DEBUG) (window as unknown as { __minigolfe: ReturnType<Jogo['api']> }).__minigolfe = jogo.api();
