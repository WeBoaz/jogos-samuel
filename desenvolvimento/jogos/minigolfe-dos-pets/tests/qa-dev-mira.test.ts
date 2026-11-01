// QA de desenvolvimento — ShotController (src/input/mira.ts) com um DOM mínimo de mentira (EventTarget).
// "QA-Mn" provam defeito (falham até a correção).
import { beforeEach, describe, expect, it } from 'vitest';
import { Mira } from '../src/input/mira';

const g = globalThis as unknown as { window: EventTarget; innerWidth: number; innerHeight: number };

function evento(tipo: string, props: Record<string, unknown> = {}): Event {
  const e = new Event(tipo, { cancelable: true });
  Object.assign(e, props);
  return e;
}

function montar() {
  const alvo = Object.assign(new EventTarget(), {
    capturado: new Set<number>(),
    setPointerCapture(id: number) { this.capturado.add(id); },
    releasePointerCapture(id: number) { this.capturado.delete(id); },
  });
  const tacadas: [number, number][] = [];
  const ctl = { pode: true };
  const mira = new Mira({
    alvo: alvo as unknown as HTMLElement,
    noChao: (x, y) => [x / 100, y / 100],
    bola: () => [0, 0],
    pode: () => ctl.pode,
    forcaMax: () => 1,
    anguloInicial: () => 0,
    aoTacar: (a, f) => tacadas.push([a, f]),
  });
  const p = (tipo: string, id: number, x: number, y: number, extra: Record<string, unknown> = {}) =>
    alvo.dispatchEvent(evento(tipo, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', button: 0, ...extra }));
  const k = (tipo: 'keydown' | 'keyup', key: string) => g.window.dispatchEvent(evento(tipo, { key }));
  return { mira, alvo, tacadas, ctl, p, k };
}

beforeEach(() => { g.window = new EventTarget(); g.innerWidth = 800; g.innerHeight = 600; });

describe('Mira — toque/mouse', () => {
  it('puxar para trás e soltar taca uma vez, para o lado oposto', () => {
    const { tacadas, p } = montar();
    p('pointerdown', 1, 400, 300);
    p('pointermove', 1, 400, 400);
    p('pointerup', 1, 400, 400);
    expect(tacadas.length).toBe(1);
    expect(tacadas[0][0]).toBeCloseTo(0);          // puxou para +z → bola vai para −z
    expect(tacadas[0][1]).toBeGreaterThan(0.3);
  });

  it('voltar o dedo para perto do início, pointercancel ou perder a captura não tacam', () => {
    const { tacadas, p, mira } = montar();
    p('pointerdown', 1, 400, 300); p('pointermove', 1, 400, 420); p('pointermove', 1, 404, 305); p('pointerup', 1, 404, 305);
    p('pointerdown', 2, 400, 300); p('pointermove', 2, 400, 420); p('pointercancel', 2, 400, 420); p('pointerup', 2, 400, 420);
    p('pointerdown', 3, 400, 300); p('pointermove', 3, 400, 420); p('lostpointercapture', 3, 400, 420); p('pointerup', 3, 400, 420);
    expect(tacadas).toEqual([]);
    expect(mira.estado.ativa).toBe(false);
  });

  it('multitoque: o segundo dedo é ignorado', () => {
    const { tacadas, p } = montar();
    p('pointerdown', 1, 400, 300);
    p('pointerdown', 2, 100, 100); p('pointermove', 2, 100, 400); p('pointerup', 2, 100, 400);
    expect(tacadas).toEqual([]);
    p('pointermove', 1, 400, 420); p('pointerup', 1, 400, 420);
    expect(tacadas.length).toBe(1);
  });

  it('botão direito não começa mira; pode()=false na hora de soltar não taca', () => {
    const { tacadas, p, ctl } = montar();
    p('pointerdown', 1, 400, 300, { pointerType: 'mouse', button: 2 }); p('pointermove', 1, 400, 420); p('pointerup', 1, 400, 420);
    p('pointerdown', 2, 400, 300, { pointerType: 'mouse' }); p('pointermove', 2, 400, 420); ctl.pode = false; p('pointerup', 2, 400, 420);
    expect(tacadas).toEqual([]);
  });

  it('perda de foco cancela o gesto e libera o próximo toque', () => {
    const { tacadas, p, mira } = montar();
    p('pointerdown', 1, 400, 300); p('pointermove', 1, 400, 420);
    g.window.dispatchEvent(evento('blur'));
    p('pointerup', 1, 400, 420);
    expect(tacadas).toEqual([]);
    expect(mira.estado.ativa).toBe(false);
    p('pointerdown', 2, 400, 300); p('pointermove', 2, 400, 420); p('pointerup', 2, 400, 420);
    expect(tacadas.length).toBe(1);
  });

  it('destruir remove todos os ouvintes', () => {
    const { mira, tacadas, p } = montar();
    expect(mira.ouvintes).toBe(9);
    mira.destruir();
    p('pointerdown', 1, 400, 300); p('pointermove', 1, 400, 420); p('pointerup', 1, 400, 420);
    expect(tacadas).toEqual([]);
  });
});

describe('Mira — teclado', () => {
  it('Enter ativa, setas mudam, Enter taca; Esc (via cancelar) não taca', () => {
    const { mira, tacadas, k } = montar();
    k('keydown', 'Enter');
    expect(mira.estado.ativa).toBe(true);
    k('keydown', 'ArrowRight'); mira.atualizar(0.5); k('keyup', 'ArrowRight');
    expect(mira.estado.angulo).toBeCloseTo(0.75);
    k('keydown', 'Enter');
    expect(tacadas.length).toBe(1);
    k('keydown', 'Enter'); mira.cancelar();
    expect(tacadas.length).toBe(1);
  });

  it('QA-M1: soltar "d" com Shift apertado não pode deixar a mira girando sozinha', () => {
    const { mira, k } = montar();
    k('keydown', 'd');                     // começa a girar
    mira.atualizar(0.1);
    k('keydown', 'Shift');
    k('keyup', 'D');                       // com Shift, o navegador manda key="D" no keyup
    k('keyup', 'Shift');
    const antes = mira.estado.angulo;
    mira.atualizar(1);                     // ninguém está apertando nada
    // hoje: 'd' fica preso no Set (keyup apagou 'D'), a mira gira 1,5 rad/s até um blur
    expect(mira.estado.angulo).toBeCloseTo(antes);
  });
});
