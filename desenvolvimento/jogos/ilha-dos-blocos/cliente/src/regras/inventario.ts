// Inventário da Ilha: regras puras (sem Three.js nem DOM), testadas em tests/inventario.test.ts.
// Toda operação devolve um inventário NOVO; o antigo fica intacto. Nenhuma operação cria ou some com itens,
// a não ser `adicionar`/`retirar`, que dizem exatamente quanto entrou ou saiu.
export const PILHA_MAX = 64;
export const BARRA = 9;

export interface Pilha { id: number; qtd: number }
export type Vaga = Pilha | null;
export interface Inventario { vagas: Vaga[]; infinito: boolean }

export function criar(tamanho = BARRA * 4, infinito = false): Inventario {
  return { vagas: Array.from({ length: tamanho }, () => null), infinito };
}

const copiar = (inv: Inventario): Inventario => ({ ...inv, vagas: inv.vagas.map((v) => (v ? { ...v } : null)) });
const valida = (inv: Inventario, i: number) => Number.isInteger(i) && i >= 0 && i < inv.vagas.length;

/** Total de um item somando todas as vagas. */
export function contar(inv: Inventario, id: number): number {
  return inv.vagas.reduce((s, v) => s + (v && v.id === id ? v.qtd : 0), 0);
}

/** Põe `qtd` do item: completa pilhas existentes, depois ocupa vagas vazias. Devolve o que não coube. */
export function adicionar(inv: Inventario, id: number, qtd: number): { inv: Inventario; sobra: number } {
  if (!Number.isInteger(qtd) || qtd <= 0 || id <= 0) return { inv, sobra: Math.max(0, qtd | 0) };
  const n = copiar(inv);
  let resta = qtd;
  for (const v of n.vagas) if (resta && v && v.id === id && v.qtd < PILHA_MAX) { const p = Math.min(resta, PILHA_MAX - v.qtd); v.qtd += p; resta -= p; }
  for (let i = 0; i < n.vagas.length && resta; i++) if (!n.vagas[i]) { const p = Math.min(resta, PILHA_MAX); n.vagas[i] = { id, qtd: p }; resta -= p; }
  return { inv: n, sobra: resta };
}

/** Tira `qtd` do item (das últimas vagas para as primeiras). Tudo ou nada: se não houver o bastante, não mexe. */
export function retirar(inv: Inventario, id: number, qtd: number): { inv: Inventario; ok: boolean } {
  if (inv.infinito) return { inv, ok: true };
  if (!Number.isInteger(qtd) || qtd <= 0 || contar(inv, id) < qtd) return { inv, ok: false };
  const n = copiar(inv);
  let resta = qtd;
  for (let i = n.vagas.length - 1; i >= 0 && resta; i--) {
    const v = n.vagas[i];
    if (v && v.id === id) { const p = Math.min(resta, v.qtd); v.qtd -= p; resta -= p; if (v.qtd === 0) n.vagas[i] = null; }
  }
  return { inv: n, ok: true };
}

/** Usa um item de uma vaga (colocar bloco). No modo infinito a vaga não diminui. */
export function usar(inv: Inventario, i: number): { inv: Inventario; id: number | null } {
  if (!valida(inv, i) || !inv.vagas[i]) return { inv, id: null };
  const id = inv.vagas[i]!.id;
  if (inv.infinito) return { inv, id };
  const n = copiar(inv);
  n.vagas[i]!.qtd -= 1;
  if (n.vagas[i]!.qtd === 0) n.vagas[i] = null;
  return { inv: n, id };
}

/** Arrasta a vaga `de` para `para`: junta se for o mesmo item (até a pilha encher), senão troca. */
export function mover(inv: Inventario, de: number, para: number): Inventario {
  if (!valida(inv, de) || !valida(inv, para) || de === para || !inv.vagas[de]) return inv;
  const n = copiar(inv);
  const a = n.vagas[de]!, b = n.vagas[para];
  if (b && b.id === a.id) {
    const p = Math.min(a.qtd, PILHA_MAX - b.qtd);
    b.qtd += p; a.qtd -= p;
    if (a.qtd === 0) n.vagas[de] = null;
  } else {
    n.vagas[para] = a; n.vagas[de] = b;
  }
  return n;
}

/** Divide a pilha ao meio para uma vaga vazia. Sem vaga vazia ou pilha de 1, não muda nada. */
export function dividir(inv: Inventario, de: number, para: number): Inventario {
  if (!valida(inv, de) || !valida(inv, para) || de === para) return inv;
  const a = inv.vagas[de];
  if (!a || a.qtd < 2 || inv.vagas[para]) return inv;
  const n = copiar(inv);
  const metade = Math.floor(a.qtd / 2);
  n.vagas[de]!.qtd -= metade;
  n.vagas[para] = { id: a.id, qtd: metade };
  return n;
}

/** Criativo: coloca o bloco escolhido no catálogo direto numa vaga (substitui o que havia). */
export function escolherNoCatalogo(inv: Inventario, vaga: number, id: number): Inventario {
  if (!inv.infinito || !valida(inv, vaga) || id <= 0) return inv;
  const n = copiar(inv);
  n.vagas[vaga] = { id, qtd: 1 };
  return n;
}

/** Valida o que veio do servidor/armazenamento; o que estiver fora do formato vira vaga vazia. */
export function validar(bruto: unknown, idsConhecidos: Set<number>, tamanho = BARRA * 4): Inventario {
  const inv = criar(tamanho);
  if (!bruto || typeof bruto !== 'object') return inv;
  const b = bruto as { vagas?: unknown; infinito?: unknown };
  inv.infinito = b.infinito === true;
  if (Array.isArray(b.vagas)) {
    b.vagas.slice(0, tamanho).forEach((v, i) => {
      if (v && typeof v === 'object') {
        const { id, qtd } = v as Pilha;
        if (idsConhecidos.has(id) && Number.isInteger(qtd) && qtd > 0 && qtd <= PILHA_MAX) inv.vagas[i] = { id, qtd };
      }
    });
  }
  return inv;
}
