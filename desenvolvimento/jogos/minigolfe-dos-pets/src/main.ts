// Minigolfe dos Pets — controlador do jogo: telas, laço com passo fixo, turnos, efeitos e save.
import './ui/ui-blocos.css';
import './ui/minigolfe.css';
import * as THREE from 'three';
import { Fisica, PASSO, RAIO_BOLA, dentro } from './core/fisica';
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
import { Medidor } from './ui/medidor';

/** Cada jogador tem o próprio jeito: "com ajuda" (prévia longa, ímã, rampa amiga) ou "desafio". */
const AJUSTES: Record<Modo, Ajustes> = {
  assistido: { velMax: 10, capturaBuraco: 5.4, ima: 0.55, rampaGravidade: 0.6 },
  normal: { velMax: 11, capturaBuraco: 3.4, ima: 0, rampaGravidade: 1 },
};
const FORCA_MAX: Record<Modo, number> = { assistido: 0.92, normal: 1 };
const PREVIA_SEG: Record<Modo, number> = { assistido: 6, normal: 0.32 };
const NOME_MODO: Record<Modo, string> = { assistido: '🐾 com ajuda', normal: '⭐ desafio' };
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const CAPA = params.has('capa');
const FPS = params.has('fps');
const FPS_SEG = Math.min(1800, Math.max(10, Number(params.get('fps')) || 300));
const EMBUTIDO = (() => { try { return window.top !== window; } catch { return true; } })();

type Estado = 'menu' | 'jogando' | 'placar' | 'fim';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

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
  private modos: Modo[] = this.save.dados.prefs.modos.slice();
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
  private posPets: [P2, P2] = [[0, 0], [0, 0]];
  private mediaQuadro = 16;
  private tempoMedida = 0;
  private ouvintesDom = 0;
  private confirmando: HTMLElement | null = null;
  private entrada: Mira;
  private medidor: Medidor | null = null;

  constructor() {
    if (EMBUTIDO) document.body.classList.add('embutido');
    this.mundo.cena.add(this.bola.malha, this.miraVisual.grupo, this.efeitos.grupo, this.dog.grupo, this.gato.grupo);
    Som.ligar(this.save.dados.prefs.som);
    this.entrada = new Mira({
      alvo: this.canvas,
      noChao: (cx, cy) => this.noChao(cx, cy),
      bola: () => [this.fisica.bola.x, this.fisica.bola.z],
      pode: () => this.podeTacar(),
      forcaMax: () => FORCA_MAX[this.partida?.modo ?? 'assistido'],
      anguloInicial: () => this.anguloParaBuraco(),
      aoTacar: (a, f) => this.tacar(a, f),
      aoMudar: (m) => this.mudouMira(m.ativa, m.angulo, m.forca),
    });
    this.ligarDom();
    this.redimensionar();
    this.montarMenu();
    this.carregarPista(PISTAS[0], true);
    if (FPS) this.medidor = new Medidor(this.mundo.renderer.getContext(), () => {
      const r = this.mundo.renderer;
      return `qualidade ${this.mundo.nivelQualidade} · ${r.info.render.calls} draw calls · ${r.domElement.width}×${r.domElement.height} px`;
    }, FPS_SEG, () => this.pausado || this.estado !== 'jogando');
    requestAnimationFrame(() => this.quadro());
    $('carregando').remove();
    if (CAPA) this.modoCapa(); else this.mostrarTela('tMenu');
  }

  private podeTacar(): boolean {
    return this.estado === 'jogando' && !this.pausado && !!this.partida?.podeTacar() && !this.fisica.bola.movendo && !this.fisica.bola.noBuraco;
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
    this.ouvir($('bRecomecar'), 'click', (e) => this.comConfirmacao(e.currentTarget as HTMLElement, () => this.novaPartida()));
    this.ouvir($('bMenuPausa'), 'click', (e) => this.comConfirmacao(e.currentTarget as HTMLElement, () => this.irMenu()));
    this.ouvir($('bMenuPlacar'), 'click', (e) => this.comConfirmacao(e.currentTarget as HTMLElement, () => this.irMenu()));
    this.ouvir($('bMenuFim'), 'click', () => this.irMenu());
    this.ouvir($('bDeNovo'), 'click', () => this.novaPartida());
    this.ouvir($('bProxima'), 'click', () => { Som.clique(); this.iniciarPistaAtual(); });
    for (const id of ['bSom', 'bSomMenu', 'bSomPausa', 'bSomFim']) this.ouvir($(id), 'click', () => {
      const on = !Som.ligado; Som.ligar(on); this.save.dados.prefs.som = on; this.save.gravar(); this.atualizarBotaoSom();
    });
    this.ouvir($('oJogadores'), 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opcao'); if (!b) return;
      this.nJogadores = Number(b.dataset.n); Som.clique(); this.montarMenu();
    });
    this.ouvir($('oModos'), 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.modo-btn'); if (!b) return;
      const i = Number(b.dataset.j);
      this.modos[i] = this.modos[i] === 'assistido' ? 'normal' : 'assistido'; Som.clique(); this.montarMenu();
    });
    this.ouvir($('oPistas'), 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pista-btn'); if (!b) return;
      this.escolha = b.dataset.p === 'circuito' ? 'circuito' : Number(b.dataset.p); Som.clique(); this.montarMenu();
      this.carregarPista(this.escolha === 'circuito' ? PISTAS[0] : PISTAS[this.escolha], true);
    });
    this.atualizarBotaoSom();
  }

  /** Primeiro toque arma a confirmação; segundo toque (em até 3 s) executa. Sem partida em andamento, executa direto. */
  private comConfirmacao(btn: HTMLElement, acao: () => void): void {
    const andamento = this.partida && this.partida.fase !== 'fim' && (this.partida.pista > 0 || this.partida.total(0) > 0 || this.partida.vez > 0);
    if (!andamento || this.confirmando === btn) { this.desarmarConfirmacao(); acao(); return; }
    this.desarmarConfirmacao();
    this.confirmando = btn;
    btn.dataset.texto = btn.textContent ?? '';
    btn.textContent = 'Toque de novo para confirmar';
    btn.classList.add('confirmar');
    setTimeout(() => { if (this.confirmando === btn) this.desarmarConfirmacao(); }, 3000);
  }
  private desarmarConfirmacao(): void {
    const b = this.confirmando; this.confirmando = null;
    if (b) { b.textContent = b.dataset.texto ?? b.textContent; b.classList.remove('confirmar'); }
  }

  private atualizarBotaoSom(): void {
    for (const id of ['bSom', 'bSomMenu', 'bSomPausa', 'bSomFim']) {
      const b = $(id); b.textContent = Som.ligado ? '🔊' : '🔇'; b.setAttribute('aria-label', Som.ligado ? 'Som ligado' : 'Som desligado');
    }
  }

  private chaveCircuito(modo: Modo): string { return `${this.escolha === 'circuito' ? 'circuito' : 'pista-' + PISTAS[this.escolha].id}-${modo}`; }

  private montarMenu(): void {
    for (const b of $('oJogadores').querySelectorAll<HTMLButtonElement>('.opcao')) b.setAttribute('aria-pressed', String(Number(b.dataset.n) === this.nJogadores));
    const cores = ['🧡', '💜', '💚', '💙'];
    $('oModos').innerHTML = Array.from({ length: this.nJogadores }, (_, i) =>
      `<button class="modo-btn ${this.modos[i]}" data-j="${i}" aria-label="Jogador ${i + 1}: ${NOME_MODO[this.modos[i]]}. Toque para trocar."><span class="quem">${cores[i]} ${i + 1}</span><span class="jeito">${NOME_MODO[this.modos[i]]}</span></button>`).join('');
    const cont = $('oPistas');
    if (!cont.children.length) {
      cont.innerHTML = `<button class="pista-btn circuito" data-p="circuito"><span class="ic">⛳</span>Todas as 6</button>` +
        PISTAS.map((p, i) => `<button class="pista-btn" data-p="${i}" aria-label="Pista ${p.id}: ${p.nome}"><span class="ic">${p.icone}</span>${p.rotulo}</button>`).join('');
    }
    for (const b of cont.querySelectorAll<HTMLButtonElement>('.pista-btn')) b.setAttribute('aria-pressed', String(b.dataset.p === String(this.escolha)));
    const recs = (['assistido', 'normal'] as Modo[]).map((m) => [m, this.save.dados.melhores[this.chaveCircuito(m)]] as const).filter(([, r]) => r);
    $('recorde').hidden = !recs.length;
    $('recorde').textContent = '🏆 ' + recs.map(([m, r]) => `${m === 'assistido' ? '🐾' : '⭐'} ${r!.tacadas}`).join(' · ');
    $('avisoSave').hidden = this.save.funciona;
  }

  private mostrarTela(id: string | null): void {
    for (const t of ['tMenu', 'tPlacar', 'tPausa', 'tFim']) $(t).hidden = t !== id;
    $('hud').hidden = this.estado !== 'jogando' || id !== null;   // HUD só durante a jogada
    this.medirHud();
    if (id) { this.entrada.cancelar(); $('dica').hidden = true; $('forca').hidden = true; }
    this.desarmarConfirmacao();
  }

  private limparMensagens(): void {
    for (const id of ['aviso', 'toast', 'dica', 'forca']) $(id).hidden = true;
  }

  // ---------------- partida ----------------
  private novaPartida(): void {
    this.pistas = this.escolha === 'circuito' ? PISTAS : [PISTAS[this.escolha]];
    this.partida = new Partida(this.nJogadores, this.pistas.map((p) => p.par), this.modos.slice(0, this.nJogadores));
    this.save.dados.prefs.modos = this.modos.slice(); this.save.dados.prefs.jogadores = this.nJogadores; this.save.gravar();
    this.esperas = []; this.efeitos.limpar(); this.limparMensagens(); this.pausado = false;
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
    this.camera.pular();
    this.aviso(`${pista.icone} PISTA ${pista.id}`, `${pista.nome} · meta ⭐ ${pista.par}`, 2.2);
    if (pista.dica) this.esperar(2.4, () => { if ($('dica').hidden && this.partida.fase === 'mirando') this.toast(pista.dica!, 2.6); });
  }

  private carregarPista(pista: Pista, soFundo: boolean): void {
    this.pista3d?.descartar();
    this.fisica = new Fisica(pista, AJUSTES[this.partida?.modo ?? 'assistido']);
    this.pista3d = new Pista3D(pista, this.fisica);
    this.mundo.cena.add(this.pista3d.grupo);
    this.pistaCarregada = pista.id;
    // pets ao lado do tee, fora da pista: largura local na linha do tee (não a do polígono inteiro)
    const [tx, tz] = pista.tee;
    const pisoTee = pista.pisos.find((p) => dentro(p.poly, tx, tz)) ?? pista.pisos[0];
    let xe = tx, xd = tx;
    while (dentro(pisoTee.poly, xe - 0.05, tz, 0) && xe > tx - 10) xe -= 0.05;
    while (dentro(pisoTee.poly, xd + 0.05, tz, 0) && xd < tx + 10) xd += 0.05;
    this.posPets = [[xe - 0.8, tz - 0.4], [xd + 0.8, tz - 0.1]];
    this.petsNoTee();
    this.mundo.prepararPista(pista, this.posPets);
    this.efeitos.limpar();
    this.bola.malha.visible = !soFundo;
    this.miraVisual.esconder();
    this.enquadrarPistaInteira();
    this.camera.pular();
  }

  private petsNoTee(): void {
    const [d, g] = this.posPets;
    // virados para a pista e um pouco para a câmera (dá para ver o rosto)
    this.dog.colocar(d[0], CHAO_Y, d[1], Math.PI / 2 + 0.55);
    this.gato.colocar(g[0], CHAO_Y, g[1], -Math.PI / 2 - 0.55);
  }

  private enquadrarPistaInteira(): void {
    const pista = this.fisica.pista, L = limitesDaPista(pista);
    this.camera.enquadrar([v3(L.x0, 0, L.z0), v3(L.x1, 0.5, L.z1)], 0.4, v3(pista.tee[0], 0, pista.tee[1]), v3(pista.buraco[0], 0, pista.buraco[1]));
  }

  /** Bola no tee, ajustes do jogador da vez, cor, câmera alinhada. */
  private prepararVez(noTee: boolean): void {
    const pista = this.pistas[this.partida.pista];
    this.fisica.ajustes = AJUSTES[this.partida.modo];
    if (noTee) { this.fisica.colocar(...pista.tee); this.efeitos.limparRastro(); this.pista3d?.reiniciarBandeira(); this.petsNoTee(); }
    this.sumindo = 0;
    this.bola.malha.visible = true;
    this.bola.cor(this.partida.jogador.cor);
    this.atualizarHud();
    this.enquadrarParaTacada();
    this.atualizarDica();
  }

  private enquadrarParaTacada(): void {
    const b = this.fisica.bola, pista = this.fisica.pista, [hx, hz] = pista.buraco;
    const pb = v3(b.x, this.fisica.altura(b.x, b.z), b.z), ph = v3(hx, this.fisica.altura(hx + 0.6, hz), hz);
    const pontos = [pb, ph, ...(pista.foco ?? []).filter(([fx, fz]) => Math.hypot(fx - b.x, fz - b.z) < 9).map(([fx, fz]) => v3(fx, 0, fz))];
    // centro a 42% do caminho bola→buraco: a bola fica no terço de baixo, com espaço para puxar
    this.camera.enquadrar(pontos, 1.3, pb, ph, pb.clone().lerp(ph, 0.42));
  }

  /** Mede onde o HUD termina (ele quebra em 2 linhas no celular) e põe força/dica/aviso logo abaixo. */
  private medirHud(): void {
    const hud = $('hud');
    if (hud.hidden) return;
    let baixo = 0;
    for (const el of hud.querySelectorAll<HTMLElement>('.painel, .topo-btns')) baixo = Math.max(baixo, el.getBoundingClientRect().bottom);
    if (baixo > 0) document.documentElement.style.setProperty('--abaixo-hud', `${Math.round(baixo + 10)}px`);
  }

  private atualizarHud(): void {
    const p = this.partida, pista = this.pistas[p.pista];
    $('hPistaTxt').textContent = this.pistas.length > 1 ? `${p.pista + 1}/${this.pistas.length}` : `${pista.id}`;
    $('hPar').textContent = `⭐ ${pista.par}`;
    $('hNome').textContent = p.jogador.nome;
    $('hNum').textContent = p.jogador.curto;
    $('hCor').style.background = p.jogador.cor;
    $('hTacadas').textContent = String(p.tacadasAgora);
    $('hModo').textContent = p.modo === 'assistido' ? '🐾' : '⭐';
    $('hJogador').setAttribute('aria-label', `Vez do ${p.jogador.nome} (${NOME_MODO[p.modo]}), ${plural(p.tacadasAgora, 'tacada', 'tacadas')}`);
    this.medirHud();
  }

  /** A mão de "puxe e solte" aparece na 1ª tacada de cada jogador e, para quem joga com ajuda, em cada pista. */
  private atualizarDica(): void {
    const p = this.partida;
    const mostrar = this.podeTacar() && !this.entrada.estado.ativa && $('aviso').hidden && p.tacadasAgora === 0 && (p.total(p.vez) === 0 || p.modo === 'assistido');
    $('dica').hidden = !mostrar;
  }

  private tacar(angulo: number, forca: number): void {
    if (!this.podeTacar()) return;
    const b = this.fisica.bola;
    this.ultimoPouso = [b.x, b.z];
    if (!this.fisica.tacar(angulo, forca)) return;
    this.partida.tacar();
    Som.tacada(forca);
    this.miraVisual.esconder();
    this.atualizarHud();
    $('dica').hidden = true; $('forca').hidden = true;
  }

  private mudouMira(ativa: boolean, angulo: number, forca: number): void {
    const modo = this.partida?.modo ?? 'assistido';
    $('forca').hidden = !ativa;
    if (ativa) { $('dica').hidden = true; $('aviso').hidden = true; }
    $('forcaBarra').style.width = `${Math.round((forca / FORCA_MAX[modo]) * 100)}%`;
    this.previa = ativa && forca > 0.02 ? this.fisica.previa(angulo, forca, PREVIA_SEG[modo]) : [];
    if (!ativa) this.atualizarDica();
  }

  private anguloParaBuraco(): number {
    const b = this.fisica.bola, [hx, hz] = this.fisica.pista.buraco;
    if (this.partida?.modo === 'assistido') return Math.atan2(hx - b.x, -(hz - b.z));
    return this.camera.angulo;
  }

  private tratarEventos(evs: EventoFisica[]): void {
    for (const e of evs) {
      if (e.tipo === 'parede') {
        Som.parede(e.forca);
        if (e.forca > 0.25) this.efeitos.puf(e.x, this.fisica.altura(this.fisica.bola.x, this.fisica.bola.z) + 0.15, e.z, 'poeira', 4);
      } else if (e.tipo === 'borda') {
        Som.borda();
        // só diz "Quase!" se a bola não cair logo em seguida
        this.esperar(0.6, () => { if (!this.fisica.bola.noBuraco && this.partida.fase !== 'acertou') this.toast('Quase! 😮', 1.2); });
      } else if (e.tipo === 'buraco') {
        this.acertou();
      } else if (e.tipo === 'fora') {
        Som.agua();
        this.efeitos.puf(e.x, CHAO_Y + 0.15, e.z, 'agua', 14);
        this.bola.malha.visible = false;
        this.aviso('SPLASH! 💦', this.partida.modo === 'normal' ? 'volta para onde estava · +1 tacada' : 'volta para onde estava', 1.6);
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
    // os pets correm até o buraco para comemorar (dentro do quadro)
    const lado = (dx: number, dz: number): P2 => {
      for (const k of [1, 0.75, 0.5]) { const x = hx + dx * k, z = hz + dz * k; if (this.fisica.pisoEm(x, z)) return [x, z]; }
      return [hx + dx * 0.4, hz + dz * 0.4];
    };
    const pd = lado(-0.95, 0.55), pg = lado(0.95, 0.35);
    this.dog.colocar(pd[0], this.fisica.altura(pd[0], pd[1]), pd[1], 0.6);
    this.gato.colocar(pg[0], this.fisica.altura(pg[0], pg[1]), pg[1], -0.6);
    this.dog.comemorar(); this.gato.comemorar();
    this.camera.enquadrar([v3(hx, h, hz), v3(pd[0], h, pd[1]), v3(pg[0], h, pg[1])], 1.6, undefined, undefined, v3(hx, h, hz + 0.4));
    this.esperar(0.3, () => Som.latido());
    this.esperar(0.7, () => Som.miau());
    this.aviso(apelido(p.tacadasAgora, pista.par), `${p.jogador.icone} ${p.jogador.nome}: ${plural(p.tacadasAgora, 'tacada', 'tacadas')}`, 2.3);
    this.esperar(2.5, () => this.trocar(p.continuar()));
  }

  private depoisDaTacada(r: ResultadoTacada): void {
    if (r.estourouLimite) {
      // a vez só passa depois do aviso: durante ele não há tacada (fase "encerrou")
      const prox = this.partida.proximoPasso();
      const j = this.partida.jogadores[this.partida.vez + 1];
      const sub = prox === 'vez' ? `agora é a vez do ${j.icone} ${j.curto}` : prox === 'pista' ? 'vamos para a próxima pista ▶' : 'fim do jogo! 🎉';
      this.aviso('BOA TENTATIVA! 👍', sub, 1.8);
      this.esperar(1.8, () => this.trocar(this.partida.continuar()));
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
      const j = this.partida.jogador;
      this.aviso(`VEZ DO ${j.icone} ${j.curto}!`, `${j.nome} · ${NOME_MODO[j.modo]}`, 1.9);
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
    this.limparMensagens();
    this.enquadrarPistaInteira();
    this.mostrarTela('tPlacar');
  }

  private tabelaPlacar(ate: number): string {
    const p = this.partida;
    const estreito = innerWidth < 560;
    const cols = this.pistas.map((q, i) => ({ q, i })).filter(({ i }) => !estreito || i <= ate);
    const lider = Math.min(...p.jogadores.map((_, k) => p.totalAte(k, ate)));
    const cab = cols.map(({ q, i }) => `<th${i === ate ? ' class="agora"' : ''}><span class="ic">${q.icone}</span>${q.id}</th>`).join('');
    const linhas = p.jogadores.map((j, k) => {
      const cel = cols.map(({ i }) => `<td${i === ate ? ' class="agora"' : ''}>${i <= ate ? (p.tacadas[k][i] ?? '–') + (p.acertos[k][i] ? '' : '<small>·</small>') : ''}</td>`).join('');
      const tot = p.totalAte(k, ate);
      return `<tr><td class="nome"><i class="bolinha" style="background:${j.cor}">${j.curto}</i><span class="txt"> ${j.nome}</span>${tot === lider && p.jogadores.length > 1 ? ' 👑' : ''}</td>${cel}<td class="total">${tot}</td></tr>`;
    }).join('');
    const metas = cols.map(({ q }) => `<td>${q.par}</td>`).join('');
    return `<table><tr><th></th>${cab}<th>Total</th></tr><tr class="meta"><td class="nome">meta ⭐</td>${metas}<td></td></tr>${linhas}</table>`;
  }

  private terminar(): void {
    this.estado = 'fim';
    const p = this.partida;
    const rank = p.ranking();
    const medalhas = ['🥇', '🥈', '🥉', '🏅'];
    $('podio').innerHTML = rank.map((r) => {
      const j = p.jogadores[r.jogador];
      const buracos = p.acertos[r.jogador].filter(Boolean).length;
      return `<div class="linha"><span class="medalha">${medalhas[r.posicao - 1]}</span><span class="nome"><i class="bolinha" style="background:${j.cor}">${j.curto}</i>${j.nome}<small>${NOME_MODO[j.modo]} · 🎯 ${buracos} de ${p.pares.length}</small></span><span class="pts">${r.total}<small>${r.total === 1 ? 'tacada' : 'tacadas'}</small></span></div>`;
    }).join('');
    // recorde separado por jeito de jogar (com ajuda e desafio não competem entre si)
    const novos: Modo[] = [];
    for (const m of ['assistido', 'normal'] as Modo[]) {
      const deste = rank.filter((r) => p.jogadores[r.jogador].modo === m);
      if (deste.length && this.save.registrar(this.chaveCircuito(m), deste[0].total, p.parTotal(), p.jogadores.length, m)) novos.push(m);
    }
    $('fimSelo').hidden = !novos.length;
    $('fimSelo').textContent = `🏆 novo recorde ${novos.map((m) => (m === 'assistido' ? '🐾' : '⭐')).join(' ')}!`;
    $('fimTitulo').textContent = this.pistas.length > 1 ? 'FIM DO CIRCUITO! 🎉' : 'PISTA COMPLETA! 🎉';
    $('fimBarra').textContent = this.pistas.length > 1 ? 'fim_do_circuito.exe' : 'fim_da_pista.exe';
    Som.vitoria();
    this.limparMensagens();
    this.petsNoTee();
    this.dog.comemorar(); this.gato.comemorar();
    this.enquadrarPistaInteira();
    this.mostrarTela('tFim');
  }

  private irMenu(): void {
    this.estado = 'menu'; this.pausado = false; this.esperas = [];
    this.efeitos.limpar(); this.limparMensagens();
    this.bola.malha.visible = false; this.miraVisual.esconder();
    this.petsNoTee();
    this.enquadrarPistaInteira();
    this.montarMenu();
    this.mostrarTela('tMenu');
  }

  private pausar(sim: boolean): void {
    if (this.estado !== 'jogando') return;
    this.pausado = sim;
    this.entrada.cancelar();
    $('pausaSub').textContent = `⛳ pista ${this.partida.pista + 1} de ${this.pistas.length} · ${this.partida.jogador.icone} ${this.partida.jogador.nome}`;
    this.mostrarTela(sim ? 'tPausa' : null);
    if (!sim) this.atualizarDica();
  }

  // ---------------- utilidades de tela ----------------
  private aviso(txt: string, sub: string, seg: number): void {
    const a = $('aviso');
    a.innerHTML = `${txt}<small>${sub}</small>`;
    a.hidden = false; a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
    const id = Symbol();
    (a as HTMLElement & { _id?: symbol })._id = id;
    this.esperar(seg, () => { if ((a as HTMLElement & { _id?: symbol })._id === id) { a.hidden = true; if (this.estado === 'jogando') this.atualizarDica(); } });
    if (this.estado === 'jogando') $('dica').hidden = true;
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
    const v = this.tmp;
    const h = this.fisica.altura(this.fisica.bola.x, this.fisica.bola.z);
    if (!this.camera.noPlano(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1, h, v)) return null;
    return [v.x, v.z];
  }
  private tmp = new THREE.Vector3();
  private tmpOlhar = new THREE.Vector3();

  private redimensionar(): void {
    const w = innerWidth, h = innerHeight;
    this.mundo.renderer.setSize(w, h, false);
    this.camera.redimensionar(w, h);
    this.medirHud();
  }

  // ---------------- laço ----------------
  private quadro(): void {
    requestAnimationFrame(() => this.quadro());
    const dtReal = Math.min(this.relogio.getDelta(), 0.1);
    this.avancar(dtReal);
    this.mundo.renderer.render(this.mundo.cena, this.camera.cam);
    this.medidor?.quadro(performance.now());
    // qualidade adaptativa (ignora os primeiros segundos de cada pista, quando os shaders compilam)
    this.mediaQuadro += (dtReal * 1000 - this.mediaQuadro) * 0.05;
    this.tempoMedida += dtReal;
    if (this.tempoMedida > 5 && this.mediaQuadro > 26 && !document.hidden) { this.tempoMedida = 0; this.mundo.reduzirQualidade(); }
  }

  /** Avança a simulação e a animação dt segundos (público para testes com ?debug). */
  avancar(dt: number): void {
    const t = this.relogio.elapsedTime;
    const rodando = this.estado === 'jogando' && !this.pausado;
    const passarEsperas = (d: number) => { for (const e of this.esperas.slice()) { e.t -= d; if (e.t <= 0) { const i = this.esperas.indexOf(e); if (i >= 0) { this.esperas.splice(i, 1); e.fn(); } } } };
    if (rodando) {
      this.acumulador += dt;
      let passos = 0;
      while (this.acumulador >= PASSO && passos < 14) {
        const antesX = this.fisica.bola.x, antesZ = this.fisica.bola.z;
        this.tratarEventos(this.fisica.passo(PASSO));
        this.bola.rolar(this.fisica.bola.x - antesX, this.fisica.bola.z - antesZ);
        passarEsperas(PASSO);
        this.acumulador -= PASSO; passos++;
      }
      if (passos === 14) this.acumulador = 0;   // limite de recuperação: não acelera depois de travar
    } else if (this.estado !== 'jogando') {
      this.fisica.tempo += dt;                  // menu/placar/fim: obstáculos seguem vivos no fundo
      passarEsperas(dt);
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
    if (b.movendo && this.estado === 'jogando') {
      const [hx, hz] = this.fisica.pista.buraco;
      const pb = v3(b.x, hy, b.z), ph = v3(hx, hy, hz);
      this.camera.enquadrar([pb, ph], 1.4, undefined, undefined, pb.clone().lerp(ph, 0.35));
    }
    this.camera.atualizar(animDt);
    this.pista3d?.atualizar(t, animDt, b.x, b.z);
    const olhar = this.bola.malha.visible ? this.bola.malha.position : this.tmpOlhar.set(this.fisica.pista.buraco[0], 0, this.fisica.pista.buraco[1]);
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
    this.partida = new Partida(1, [pista.par], 'normal');
    const [hx, hz] = pista.buraco;
    this.fisica.colocar(hx - 0.45, hz + 1.25);
    this.bola.malha.visible = true; this.bola.cor('#ff9d52');
    const h = this.fisica.altura(hx, hz);
    this.dog.colocar(hx - 1.0, h, hz + 0.45, 0.75);
    this.gato.colocar(hx + 1.0, h, hz + 0.15, -0.75);
    this.camera.enquadrar([v3(hx - 1.6, h, hz + 1.8), v3(hx + 1.6, h, hz - 0.9)], 0.25, v3(hx, 0, hz + 6), v3(hx, 0, hz), v3(hx, h, hz + 0.6));
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
      configurar: (n: number, modos: Modo | Modo[], escolha: 'circuito' | number) => {
        jogo.nJogadores = n; jogo.modos = Array.isArray(modos) ? [...modos, 'assistido', 'assistido', 'assistido'].slice(0, 4) as Modo[] : [modos, modos, modos, modos];
        jogo.escolha = escolha; jogo.montarMenu();
      },
      jogar: () => jogo.novaPartida(),
      tacar: (a: number, f: number) => jogo.tacar(a, f),
      anguloParaBuraco: () => jogo.anguloParaBuraco(),
      avancar: (seg: number) => { for (let t = 0; t < seg; t += 1 / 30) jogo.avancar(1 / 30); },
      proxima: () => jogo.iniciarPistaAtual(),
      menu: () => jogo.irMenu(),
      pausar: (s: boolean) => jogo.pausar(s),
      qualidade: () => jogo.mundo.nivelQualidade,
      info: () => ({ ...jogo.mundo.renderer.info.render, ...jogo.mundo.renderer.info.memory }),
    };
  }
}

const jogo = new Jogo();
if (DEBUG) (window as unknown as { __minigolfe: ReturnType<Jogo['api']> }).__minigolfe = jogo.api();
