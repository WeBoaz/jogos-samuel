// TurnManager + Scorecard. Regras puras: quem joga, quantas tacadas, quando troca de jogador e de pista.
// Cada jogador joga a pista inteira (até acertar ou chegar ao limite); depois passa a vez.
// Só existe uma bola na pista por vez.

export type Modo = 'assistido' | 'normal';
export type Fase = 'mirando' | 'rolando' | 'acertou' | 'fim';

export interface Jogador { nome: string; cor: string; icone: string }

export const JOGADORES_PADRAO: Jogador[] = [
  { nome: 'Jogador 1', cor: '#ff9d52', icone: '🧡' },
  { nome: 'Jogador 2', cor: '#ceb7ef', icone: '💜' },
  { nome: 'Jogador 3', cor: '#b9ed80', icone: '💚' },
  { nome: 'Jogador 4', cor: '#7fc8e8', icone: '💙' },
];

export interface ResultadoTacada { trocouJogador: boolean; trocouPista: boolean; fim: boolean; estourouLimite: boolean }

export class Partida {
  readonly jogadores: Jogador[];
  readonly pares: number[];
  readonly modo: Modo;
  /** tacadas[jogador][pista] — null = ainda não jogou */
  readonly tacadas: (number | null)[][];
  pista = 0;
  vez = 0;
  fase: Fase = 'mirando';
  trocasDeVez = 0;            // contador para testes (troca acontece uma vez por jogador terminado)

  constructor(nJogadores: number, pares: number[], modo: Modo) {
    const n = Math.max(1, Math.min(4, Math.floor(nJogadores)));
    this.jogadores = JOGADORES_PADRAO.slice(0, n);
    this.pares = pares.slice();
    this.modo = modo;
    this.tacadas = this.jogadores.map(() => pares.map(() => null));
    this.tacadas[0][0] = 0;
  }

  get jogador(): Jogador { return this.jogadores[this.vez]; }
  get tacadasAgora(): number { return this.tacadas[this.vez][this.pista] ?? 0; }
  limite(pista = this.pista): number { return this.pares[pista] + (this.modo === 'assistido' ? 3 : 4); }

  podeTacar(): boolean { return this.fase === 'mirando'; }

  /** Registra a tacada. Devolve false se não era hora (bola andando, partida acabou). */
  tacar(): boolean {
    if (!this.podeTacar()) return false;
    this.tacadas[this.vez][this.pista] = this.tacadasAgora + 1;
    this.fase = 'rolando';
    return true;
  }

  /** Bola parou fora do buraco. `fora` = caiu na água/fora do chão (Normal soma 1 de penalidade). */
  parou(fora = false): ResultadoTacada {
    if (this.fase !== 'rolando') return { trocouJogador: false, trocouPista: false, fim: this.fase === 'fim', estourouLimite: false };
    if (fora && this.modo === 'normal') this.tacadas[this.vez][this.pista] = this.tacadasAgora + 1;
    if (this.tacadasAgora >= this.limite()) {
      this.tacadas[this.vez][this.pista] = this.limite();
      return { ...this.passarVez(), estourouLimite: true };
    }
    this.fase = 'mirando';
    return { trocouJogador: false, trocouPista: false, fim: false, estourouLimite: false };
  }

  /** Bola caiu no buraco. */
  acertou(): ResultadoTacada {
    if (this.fase !== 'rolando') return { trocouJogador: false, trocouPista: false, fim: this.fase === 'fim', estourouLimite: false };
    this.fase = 'acertou';
    return { trocouJogador: false, trocouPista: false, fim: false, estourouLimite: false };
  }

  /** Depois da comemoração: passa para o próximo jogador ou pista. */
  continuar(): ResultadoTacada {
    if (this.fase !== 'acertou') return { trocouJogador: false, trocouPista: false, fim: this.fase === 'fim', estourouLimite: false };
    return { ...this.passarVez(), estourouLimite: false };
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
  /** Ranking: menos tacadas primeiro; empate fica junto (mesma posição). */
  ranking(): { jogador: number; total: number; posicao: number }[] {
    const lista = this.jogadores.map((_, j) => ({ jogador: j, total: this.total(j), posicao: 0 }));
    lista.sort((a, b) => a.total - b.total || a.jogador - b.jogador);
    lista.forEach((l, i) => { l.posicao = i > 0 && l.total === lista[i - 1].total ? lista[i - 1].posicao : i + 1; });
    return lista;
  }
}

/** Nome divertido para o resultado de uma pista (sem humilhar). */
export function apelido(tacadas: number, par: number): string {
  if (tacadas === 1) return 'BURACO EM UMA!';
  const d = tacadas - par;
  if (d <= -2) return 'INCRÍVEL!';
  if (d === -1) return 'MUITO BEM!';
  if (d === 0) return 'NO PAR!';
  if (d === 1) return 'BOA!';
  return 'CONSEGUIU!';
}
