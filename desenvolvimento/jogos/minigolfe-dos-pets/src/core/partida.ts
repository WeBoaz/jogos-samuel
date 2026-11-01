// TurnManager + Scorecard. Regras puras: quem joga, quantas tacadas, quando troca de jogador e de pista.
// Cada jogador joga a pista inteira (até acertar ou chegar ao limite); depois passa a vez.
// Só existe uma bola na pista por vez. Cada jogador tem o próprio jeito de jogar (com ajuda ou desafio),
// então a família inteira joga junta.

export type Modo = 'assistido' | 'normal';
/** mirando → rolando → (acertou | encerrou) → continuar() passa a vez; 'fim' depois da última pista */
export type Fase = 'mirando' | 'rolando' | 'acertou' | 'encerrou' | 'fim';

export interface Jogador { nome: string; curto: string; cor: string; icone: string; modo: Modo }

export const JOGADORES_PADRAO: Omit<Jogador, 'modo'>[] = [
  { nome: 'Jogador 1', curto: '1', cor: '#ff9d52', icone: '🧡' },
  { nome: 'Jogador 2', curto: '2', cor: '#a77fe0', icone: '💜' },
  { nome: 'Jogador 3', curto: '3', cor: '#5cbf3f', icone: '💚' },
  { nome: 'Jogador 4', curto: '4', cor: '#3f9fd8', icone: '💙' },
];

export interface ResultadoTacada { trocouJogador: boolean; trocouPista: boolean; fim: boolean; estourouLimite: boolean }
const NADA: ResultadoTacada = { trocouJogador: false, trocouPista: false, fim: false, estourouLimite: false };

export class Partida {
  readonly jogadores: Jogador[];
  readonly pares: number[];
  /** tacadas[jogador][pista] — null = ainda não jogou */
  readonly tacadas: (number | null)[][];
  /** acertou[jogador][pista] — false quando passou a vez pelo limite */
  readonly acertos: boolean[][];
  pista = 0;
  vez = 0;
  fase: Fase = 'mirando';
  trocasDeVez = 0;            // contador para testes (troca acontece uma vez por jogador terminado)

  constructor(nJogadores: number, pares: number[], modos: Modo | Modo[]) {
    const n = Math.max(1, Math.min(4, Math.floor(nJogadores)));
    this.jogadores = JOGADORES_PADRAO.slice(0, n).map((j, i) => ({ ...j, modo: Array.isArray(modos) ? (modos[i] ?? 'assistido') : modos }));
    this.pares = pares.slice();
    this.tacadas = this.jogadores.map(() => pares.map(() => null));
    this.acertos = this.jogadores.map(() => pares.map(() => false));
    this.tacadas[0][0] = 0;
  }

  get jogador(): Jogador { return this.jogadores[this.vez]; }
  get modo(): Modo { return this.jogador.modo; }
  get tacadasAgora(): number { return this.tacadas[this.vez][this.pista] ?? 0; }
  limite(pista = this.pista, j = this.vez): number { return this.pares[pista] + (this.jogadores[j].modo === 'assistido' ? 3 : 4); }
  get modos(): Modo[] { return this.jogadores.map((j) => j.modo); }

  podeTacar(): boolean { return this.fase === 'mirando'; }

  /** Registra a tacada. Devolve false se não era hora (bola andando, trocando de vez, partida acabou). */
  tacar(): boolean {
    if (!this.podeTacar()) return false;
    this.tacadas[this.vez][this.pista] = this.tacadasAgora + 1;
    this.fase = 'rolando';
    return true;
  }

  /** Bola parou fora do buraco. `fora` = caiu na água/fora do chão (Desafio soma 1 de penalidade). */
  parou(fora = false): ResultadoTacada {
    if (this.fase !== 'rolando') return { ...NADA, fim: this.fase === 'fim' };
    if (fora && this.modo === 'normal') this.tacadas[this.vez][this.pista] = this.tacadasAgora + 1;
    if (this.tacadasAgora >= this.limite()) {
      // não passa a vez aqui: a tela mostra o aviso e depois chama continuar() (como no acerto)
      this.tacadas[this.vez][this.pista] = this.limite();
      this.fase = 'encerrou';
      return { ...NADA, estourouLimite: true };
    }
    this.fase = 'mirando';
    return NADA;
  }

  /** Bola caiu no buraco. */
  acertou(): ResultadoTacada {
    if (this.fase !== 'rolando') return { ...NADA, fim: this.fase === 'fim' };
    this.acertos[this.vez][this.pista] = true;
    this.fase = 'acertou';
    return NADA;
  }

  /** Depois da comemoração ou do aviso de limite: passa para o próximo jogador ou pista. */
  continuar(): ResultadoTacada {
    if (this.fase !== 'acertou' && this.fase !== 'encerrou') return { ...NADA, fim: this.fase === 'fim' };
    return { ...this.passarVez(), estourouLimite: false };
  }

  /** O que acontece no próximo continuar() — para o texto do aviso. */
  proximoPasso(): 'vez' | 'pista' | 'fim' {
    if (this.vez + 1 < this.jogadores.length) return 'vez';
    return this.pista + 1 < this.pares.length ? 'pista' : 'fim';
  }

  private passarVez(): Omit<ResultadoTacada, 'estourouLimite'> {
    this.trocasDeVez++;
    if (this.vez + 1 < this.jogadores.length) {
      this.vez++;
      this.tacadas[this.vez][this.pista] = 0;
      this.fase = 'mirando';
      return { trocouJogador: true, trocouPista: false, fim: false };
    }
    if (this.pista + 1 < this.pares.length) {
      this.pista++;
      this.vez = 0;
      this.tacadas[0][this.pista] = 0;
      this.fase = 'mirando';
      return { trocouJogador: true, trocouPista: true, fim: false };
    }
    this.fase = 'fim';
    return { trocouJogador: false, trocouPista: false, fim: true };
  }

  total(j: number): number { return this.tacadas[j].reduce<number>((s, t) => s + (t ?? 0), 0); }
  parTotal(): number { return this.pares.reduce((s, p) => s + p, 0); }
  /** Total até a pista `ate` (inclusive). */
  totalAte(j: number, ate: number): number { return this.tacadas[j].slice(0, ate + 1).reduce<number>((s, t) => s + (t ?? 0), 0); }
  /** Ranking: menos tacadas primeiro; empate fica junto (posição densa: 1,1,2). */
  ranking(): { jogador: number; total: number; posicao: number }[] {
    const lista = this.jogadores.map((_, j) => ({ jogador: j, total: this.total(j), posicao: 0 }));
    lista.sort((a, b) => a.total - b.total || a.jogador - b.jogador);
    lista.forEach((l, i) => { l.posicao = i === 0 ? 1 : l.total === lista[i - 1].total ? lista[i - 1].posicao : lista[i - 1].posicao + 1; });
    return lista;
  }
}

/** Nome divertido para o resultado de uma pista (sem humilhar e sem jargão). */
export function apelido(tacadas: number, par: number): string {
  if (tacadas === 1) return 'DE PRIMEIRA! 🎯';
  const d = tacadas - par;
  if (d <= -1) return 'INCRÍVEL! ⭐';
  if (d === 0) return 'NA META! ⭐';
  if (d === 1) return 'MUITO BEM!';
  return 'CONSEGUIU! 🎉';
}
