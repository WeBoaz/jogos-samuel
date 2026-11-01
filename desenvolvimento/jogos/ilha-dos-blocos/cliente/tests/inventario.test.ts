// Regras do inventário: nada se cria nem se perde fora de adicionar/retirar (matriz: "Inventário").
import { describe, expect, it } from 'vitest';
import { PILHA_MAX, adicionar, contar, criar, dividir, escolherNoCatalogo, mover, retirar, usar, validar } from '../src/regras/inventario';

const total = (inv: ReturnType<typeof criar>) => inv.vagas.reduce((s, v) => s + (v?.qtd ?? 0), 0);

describe('Inventário — adicionar e retirar', () => {
  it('completa pilhas antes de abrir vagas e devolve a sobra', () => {
    let { inv, sobra } = adicionar(criar(3), 7, 70);
    expect(sobra).toBe(0);
    expect(inv.vagas).toEqual([{ id: 7, qtd: 64 }, { id: 7, qtd: 6 }, null]);
    ({ inv, sobra } = adicionar(inv, 7, 200));
    expect(sobra).toBe(200 - (3 * PILHA_MAX - 70));
    expect(contar(inv, 7)).toBe(3 * PILHA_MAX);
  });

  it('retirar é tudo ou nada', () => {
    const { inv } = adicionar(criar(4), 3, 10);
    const falha = retirar(inv, 3, 11);
    expect(falha.ok).toBe(false);
    expect(falha.inv).toBe(inv);
    const ok = retirar(inv, 3, 10);
    expect(ok.ok).toBe(true);
    expect(contar(ok.inv, 3)).toBe(0);
  });

  it('quantidades inválidas não mexem', () => {
    const inv = criar(2);
    for (const q of [0, -3, 2.5, NaN]) {
      expect(adicionar(inv, 1, q).inv).toBe(inv);
      expect(retirar(inv, 1, q).ok).toBe(false);
    }
  });

  it('não altera o inventário original', () => {
    const a = adicionar(criar(2), 1, 5).inv;
    const copia = JSON.stringify(a);
    adicionar(a, 1, 50); usar(a, 0); mover(a, 0, 1); dividir(a, 0, 1);
    expect(JSON.stringify(a)).toBe(copia);
  });
});

describe('Inventário — mover, dividir e usar sem duplicar', () => {
  it('mover junta o mesmo item até encher e troca itens diferentes', () => {
    let inv = criar(3);
    inv = adicionar(inv, 1, 60).inv;           // vaga 0: 60
    inv.vagas[1] = { id: 1, qtd: 10 };
    inv.vagas[2] = { id: 2, qtd: 5 };
    const antes = total(inv);
    const junto = mover(inv, 1, 0);
    expect(junto.vagas[0]).toEqual({ id: 1, qtd: 64 });
    expect(junto.vagas[1]).toEqual({ id: 1, qtd: 6 });
    expect(total(junto)).toBe(antes);
    const trocado = mover(inv, 2, 0);
    expect(trocado.vagas[0]).toEqual({ id: 2, qtd: 5 });
    expect(trocado.vagas[2]).toEqual({ id: 1, qtd: 60 });
    expect(total(trocado)).toBe(antes);
  });

  it('dividir só para vaga vazia e conserva o total', () => {
    let inv = adicionar(criar(3), 4, 9).inv;
    const d = dividir(inv, 0, 2);
    expect(d.vagas[0]).toEqual({ id: 4, qtd: 5 });
    expect(d.vagas[2]).toEqual({ id: 4, qtd: 4 });
    expect(dividir(d, 0, 2)).toBe(d);            // destino ocupado: nada muda
    inv = adicionar(criar(2), 4, 1).inv;
    expect(dividir(inv, 0, 1)).toBe(inv);        // pilha de 1
  });

  it('usar tira um; no Criativo (infinito) não tira', () => {
    const normal = usar(adicionar(criar(2), 9, 1).inv, 0);
    expect(normal.id).toBe(9);
    expect(normal.inv.vagas[0]).toBeNull();
    const criativo = escolherNoCatalogo(criar(9, true), 3, 14);
    const r = usar(criativo, 3);
    expect(r.id).toBe(14);
    expect(r.inv.vagas[3]).toEqual({ id: 14, qtd: 1 });
    expect(usar(criativo, 0).id).toBeNull();     // vaga vazia
  });

  it('catálogo só funciona no Criativo', () => {
    const inv = criar(9);
    expect(escolherNoCatalogo(inv, 0, 3)).toBe(inv);
  });
});

describe('Inventário — validação do que vem de fora', () => {
  it('descarta itens desconhecidos, quantidades estranhas e excesso de vagas', () => {
    const ids = new Set([1, 2, 3]);
    const inv = validar({ infinito: true, vagas: [{ id: 1, qtd: 5 }, { id: 99, qtd: 1 }, { id: 2, qtd: 0 }, { id: 3, qtd: 65 }, 'x', { id: 2, qtd: 3 }] }, ids, 5);
    expect(inv.infinito).toBe(true);
    expect(inv.vagas).toEqual([{ id: 1, qtd: 5 }, null, null, null, null]);
    expect(validar(null, ids).vagas.every((v) => v === null)).toBe(true);
  });
});
