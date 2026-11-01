// QA de desenvolvimento — save.ts não tinha teste. "QA-Sn" provam defeito (falham até a correção).
import { describe, expect, it } from 'vitest';
import { Save, SCHEMA, padrao, perfilLocal, validar } from '../src/storage/save';

class Memoria implements Storage {
  m = new Map<string, string>();
  falharLer = false; falharGravar = false;
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { if (this.falharLer) throw new Error('SecurityError'); return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { if (this.falharGravar) throw new Error('QuotaExceededError'); this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('Save — validação do schema', () => {
  it('lixo, tipos errados e schema diferente voltam ao padrão', () => {
    for (const bruto of [null, 3, 'x', [], { schemaVersion: 0 }, { schemaVersion: '1' }, { schemaVersion: SCHEMA + 1, prefs: { som: false } }])
      expect(validar(bruto)).toEqual(padrao());
  });

  it('mantém campos válidos e descarta inválidos campo a campo', () => {
    const d = validar({ schemaVersion: SCHEMA, prefs: { som: false, modos: ['normal', 'assistido', 'normal', 'normal'], jogadores: 3 } });
    expect(d.prefs).toEqual({ som: false, modos: ['normal', 'assistido', 'normal', 'normal'], jogadores: 3 });
    for (const jogadores of [0, 5, 2.5, '2', NaN]) expect(validar({ schemaVersion: SCHEMA, prefs: { jogadores } }).prefs.jogadores).toBe(1);
    expect(validar({ schemaVersion: SCHEMA, prefs: { som: 'false', modos: ['turbo', 'normal'] } }).prefs).toMatchObject({ som: true, modos: ['assistido', 'normal', 'normal', 'normal'] });
  });

  it('recordes: chave e valores fora do formato são descartados; __proto__ não polui', () => {
    const bruto = JSON.parse(`{"schemaVersion":${SCHEMA},"melhores":{
      "circuito-normal":{"tacadas":17.4,"par":18,"jogadores":2,"modo":"normal","data":"2026-11-01T10:00"},
      "__proto__":{"tacadas":3,"par":3},
      "Com Espaço":{"tacadas":3,"par":3},
      "pista-1-normal":{"tacadas":0,"par":2},
      "pista-2-normal":{"tacadas":900,"par":3},
      "pista-3-normal":{"tacadas":"5","par":3},
      "pista-4-normal":5
    }}`);
    const d = validar(bruto);
    expect(Object.keys(d.melhores)).toEqual(['circuito-normal']);
    expect(d.melhores['circuito-normal']).toEqual({ tacadas: 17, par: 18, jogadores: 2, modo: 'normal', data: '2026-11-01' });
    expect(({} as Record<string, unknown>).tacadas).toBeUndefined();
  });
});

describe('Save — armazenamento', () => {
  it('chave versionada por perfil', () => {
    expect(new Save(new Memoria(), 'samuel').chave).toBe('samuel:minigolfe-dos-pets:samuel:v1');
    expect(perfilLocal('', 'a=1; samuel_perfil=player2; b=2')).toBe('player2');
    expect(perfilLocal('', 'samuel_perfil=../x')).toBe('convidado');
    expect(perfilLocal('?perfil=player2', '')).toBe('player2');            // o player do portal passa na URL
    expect(perfilLocal('?perfil=../x', 'samuel_perfil=samuel')).toBe('samuel');
  });

  it('grava e relê; recorde só quando melhora', () => {
    const mem = new Memoria();
    const s = new Save(mem, 'samuel');
    expect(s.registrar('circuito-normal', 20, 18, 1, 'normal')).toBe(true);
    expect(s.registrar('circuito-normal', 20, 18, 1, 'normal')).toBe(false);
    expect(s.registrar('circuito-normal', 22, 18, 1, 'normal')).toBe(false);
    expect(s.registrar('circuito-normal', 19, 18, 1, 'normal')).toBe(true);
    const s2 = new Save(mem, 'samuel');
    expect(s2.dados.melhores['circuito-normal'].tacadas).toBe(19);
    expect(new Save(mem, 'player2').dados.melhores).toEqual({});
  });

  it('sem armazenamento, leitura ou gravação falhando: não lança e o jogo segue', () => {
    const nulo = new Save(null, 'samuel');
    expect(nulo.funciona).toBe(false);
    expect(nulo.gravar()).toBe(false);
    expect(nulo.registrar('circuito-normal', 10, 18, 1, 'normal')).toBe(true);

    const leitura = new Memoria(); leitura.falharLer = true;
    const s1 = new Save(leitura, 'samuel');
    expect(s1.funciona).toBe(false);
    expect(s1.dados).toEqual(padrao());

    const gravacao = new Memoria(); gravacao.falharGravar = true;
    const s2 = new Save(gravacao, 'samuel');
    expect(() => s2.registrar('circuito-normal', 10, 18, 1, 'normal')).not.toThrow();
    expect(s2.gravar()).toBe(false);
    expect(s2.funciona).toBe(false);
  });

  it('QA-S1: JSON corrompido é descartado, mas não deve marcar o armazenamento como quebrado', () => {
    const mem = new Memoria();
    mem.setItem('samuel:minigolfe-dos-pets:samuel:v1', '{quebrado');
    const s = new Save(mem, 'samuel');
    expect(s.dados).toEqual(padrao());
    // hoje: funciona=false → menu mostra "Este navegador não deixa guardar o recorde" embora grave normalmente
    expect(s.gravar()).toBe(true);
    expect(s.funciona).toBe(true);
  });
});

describe('Save — duas abas no mesmo perfil (RV-MG-003)', () => {
  it('A registra recorde e B (aberta antes) muda preferência: o recorde de A fica', () => {
    const mem = new Memoria();
    const a = new Save(mem, 'samuel');
    const b = new Save(mem, 'samuel');
    expect(a.registrar('circuito-normal', 20, 18, 1, 'normal')).toBe(true);
    b.dados.prefs.som = false;
    b.gravar();
    const relido = new Save(mem, 'samuel').dados;
    expect(relido.melhores['circuito-normal'].tacadas).toBe(20);
    expect(relido.prefs.som).toBe(false);                     // preferência: vale a última aba que gravou
  });

  it('B não chama de recorde um resultado pior que o que A já gravou', () => {
    const mem = new Memoria();
    const a = new Save(mem, 'samuel');
    const b = new Save(mem, 'samuel');
    a.registrar('circuito-normal', 20, 18, 1, 'normal');
    expect(b.registrar('circuito-normal', 25, 18, 1, 'normal')).toBe(false);
    expect(b.registrar('pista-1-normal', 3, 2, 1, 'normal')).toBe(true);
    const relido = new Save(mem, 'samuel').dados.melhores;
    expect(relido['circuito-normal'].tacadas).toBe(20);
    expect(relido['pista-1-normal'].tacadas).toBe(3);
  });

  it('disco corrompido por outra aba não derruba a gravação', () => {
    const mem = new Memoria();
    const a = new Save(mem, 'samuel');
    mem.setItem(a.chave, '{quebrado');
    expect(a.registrar('circuito-normal', 19, 18, 1, 'normal')).toBe(true);
    expect(new Save(mem, 'samuel').dados.melhores['circuito-normal'].tacadas).toBe(19);
  });
});
