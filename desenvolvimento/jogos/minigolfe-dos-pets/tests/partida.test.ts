import { describe, expect, it } from 'vitest';
import { Partida, apelido } from '../src/core/partida';
import { PARES } from '../src/content/pistas';

describe('TurnManager + Scorecard', () => {
  it('troca de jogador uma única vez por jogador terminado', () => {
    const p = new Partida(3, PARES, 'normal');
    expect(p.vez).toBe(0);
    p.tacar(); p.parou();
    expect(p.vez).toBe(0);                 // errou: continua o mesmo jogador
    p.tacar(); p.acertou();
    expect(p.vez).toBe(0);                 // comemorando: ainda não trocou
    const r = p.continuar();
    expect(r.trocouJogador).toBe(true);
    expect(p.vez).toBe(1);
    expect(p.continuar().trocouJogador).toBe(false);   // chamada repetida não troca de novo
    expect(p.vez).toBe(1);
    expect(p.trocasDeVez).toBe(1);
  });

  it('não registra tacada com a bola andando nem depois do fim', () => {
    const p = new Partida(1, PARES, 'normal');
    expect(p.tacar()).toBe(true);
    expect(p.tacar()).toBe(false);
    expect(p.tacadasAgora).toBe(1);
  });

  it('placar fecha corretamente depois das seis pistas', () => {
    const p = new Partida(2, PARES, 'normal');
    const jogadas = [[2, 3], [3, 4], [1, 3], [3, 2], [4, 3], [4, 5]]; // [j1, j2] por pista
    for (let pista = 0; pista < 6; pista++) {
      for (let j = 0; j < 2; j++) {
        expect(p.pista).toBe(pista); expect(p.vez).toBe(j);
        for (let t = 1; t < jogadas[pista][j]; t++) { p.tacar(); p.parou(); }
        p.tacar(); p.acertou(); p.continuar();
      }
    }
    expect(p.fase).toBe('fim');
    expect(p.total(0)).toBe(17);
    expect(p.total(1)).toBe(20);
    expect(p.ranking().map((r) => r.jogador)).toEqual([0, 1]);
    expect(p.parTotal()).toBe(PARES.reduce((a, b) => a + b, 0));
  });

  it('limite de tacadas passa a vez sem travar a partida', () => {
    const p = new Partida(2, PARES, 'assistido');
    const lim = p.limite();
    let r = { trocouJogador: false } as ReturnType<Partida['parou']>;
    for (let i = 0; i < lim; i++) { p.tacar(); r = p.parou(); }
    expect(r.estourouLimite).toBe(true);
    expect(p.tacadas[0][0]).toBe(lim);
    // durante o aviso a vez ainda não passou e NÃO há tacada (era o P0: tacada no aviso travava a partida)
    expect(p.vez).toBe(0);
    expect(p.podeTacar()).toBe(false);
    expect(p.tacar()).toBe(false);
    expect(p.continuar().trocouJogador).toBe(true);
    expect(p.vez).toBe(1);
    expect(p.tacadas[1][0]).toBe(0);
  });

  it('cada jogador tem o próprio jeito de jogar (limite e penalidade por jogador)', () => {
    const p = new Partida(2, [2], ['assistido', 'normal']);
    expect(p.modo).toBe('assistido'); expect(p.limite()).toBe(5);
    p.tacar(); p.acertou(); p.continuar();
    expect(p.modo).toBe('normal'); expect(p.limite()).toBe(6);
    p.tacar(); p.parou(true);
    expect(p.tacadasAgora).toBe(2);
  });

  it('última pista: limite estourado leva ao fim só depois do continuar()', () => {
    const p = new Partida(1, [2], 'normal');
    for (let i = 0; i < p.limite(); i++) { p.tacar(); p.parou(); }
    expect(p.fase).toBe('encerrou');
    expect(p.proximoPasso()).toBe('fim');
    expect(p.continuar().fim).toBe(true);
    expect(p.fase).toBe('fim');
  });

  it('água: Normal soma penalidade, Assistido não', () => {
    const n = new Partida(1, PARES, 'normal'); n.tacar(); n.parou(true);
    expect(n.tacadasAgora).toBe(2);
    const a = new Partida(1, PARES, 'assistido'); a.tacar(); a.parou(true);
    expect(a.tacadasAgora).toBe(1);
  });

  it('empate fica na mesma posição', () => {
    const p = new Partida(2, [2], 'normal');
    p.tacar(); p.acertou(); p.continuar();
    p.tacar(); p.acertou(); p.continuar();
    expect(p.ranking().map((r) => r.posicao)).toEqual([1, 1]);
    const q = new Partida(3, [2], 'normal');
    q.tacar(); q.acertou(); q.continuar();
    q.tacar(); q.acertou(); q.continuar();
    q.tacar(); q.parou(); q.tacar(); q.acertou(); q.continuar();
    expect(q.ranking().map((r) => r.posicao)).toEqual([1, 1, 2]);   // posição densa: ninguém vira "4º"

  });

  it('apelidos são sempre positivos', () => {
    expect(apelido(1, 3)).toBe('DE PRIMEIRA! 🎯');
    expect(apelido(3, 3)).toBe('NA META! ⭐');
    expect(apelido(9, 3)).toBe('CONSEGUIU! 🎉');
  });
});
