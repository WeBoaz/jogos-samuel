// O cliente e o servidor precisam concordar em cada ID e nome (o mundo salvo guarda o número).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AGUA, BARRA_INICIAL, BLOCOS } from '../src/catalogo';

const rs = readFileSync(fileURLToPath(new URL('../../servidor/src/catalogo.rs', import.meta.url)), 'utf8');
const doServidor = [...rs.matchAll(/Def \{ id: (\d+), nome: "([^"]+)"/g)].map((m) => ({ id: Number(m[1]), nome: m[2] }));

describe('Catálogo', () => {
  it('32 blocos, iguais aos do servidor', () => {
    expect(doServidor).toHaveLength(32);
    expect(BLOCOS.map(({ id, nome }) => ({ id, nome }))).toEqual(doServidor);
  });

  it('água com o mesmo ID do servidor', () => {
    expect(rs).toContain(`pub const AGUA: u32 = ${AGUA.id};`);
  });

  it('barra inicial só com blocos do catálogo', () => {
    expect(BARRA_INICIAL).toHaveLength(9);
    for (const n of BARRA_INICIAL) expect(BLOCOS.some((b) => b.nome === n)).toBe(true);
  });
});
