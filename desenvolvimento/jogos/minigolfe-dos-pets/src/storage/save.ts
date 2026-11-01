// Save local: melhor placar por circuito e preferências. Chave samuel:minigolfe-dos-pets:<perfil>:v1.
// Nunca guarda objetos de física/renderização. Se o armazenamento falhar, o jogo continua.
import type { Modo } from '../core/partida';

export const SCHEMA = 1;
export interface Melhor { tacadas: number; par: number; jogadores: number; modo: Modo; data: string }
export interface Dados {
  schemaVersion: number;
  melhores: Record<string, Melhor>;
  prefs: { som: boolean; modos: Modo[]; jogadores: number };
}

export function padrao(): Dados {
  return { schemaVersion: SCHEMA, melhores: {}, prefs: { som: true, modos: ['assistido', 'normal', 'normal', 'normal'], jogadores: 1 } };
}

/** Valida o que veio do armazenamento; qualquer campo estranho volta ao padrão sem quebrar. */
export function validar(bruto: unknown): Dados {
  const d = padrao();
  if (!bruto || typeof bruto !== 'object') return d;
  const b = bruto as Partial<Dados>;
  if (b.schemaVersion !== SCHEMA) return d;
  if (b.prefs && typeof b.prefs === 'object') {
    if (typeof b.prefs.som === 'boolean') d.prefs.som = b.prefs.som;
    if (Array.isArray(b.prefs.modos)) b.prefs.modos.slice(0, 4).forEach((m, i) => { if (m === 'assistido' || m === 'normal') d.prefs.modos[i] = m; });
    if (Number.isInteger(b.prefs.jogadores) && b.prefs.jogadores >= 1 && b.prefs.jogadores <= 4) d.prefs.jogadores = b.prefs.jogadores;
  }
  if (b.melhores && typeof b.melhores === 'object') {
    for (const [k, v] of Object.entries(b.melhores)) {
      if (/^[a-z0-9-]{1,40}$/.test(k) && v && Number.isFinite(v.tacadas) && v.tacadas > 0 && v.tacadas < 500 && Number.isFinite(v.par)) {
        d.melhores[k] = { tacadas: Math.round(v.tacadas), par: Math.round(v.par), jogadores: Number(v.jogadores) || 1, modo: v.modo === 'normal' ? 'normal' : 'assistido', data: String(v.data ?? '').slice(0, 10) };
      }
    }
  }
  return d;
}

/** Explorador do portal: o player passa ?perfil=<id> (o cookie do portal é HttpOnly e o jogo não o lê). */
export function perfilLocal(busca = typeof location !== 'undefined' ? location.search : '', cookie = typeof document !== 'undefined' ? document.cookie : ''): string {
  const daUrl = new URLSearchParams(busca).get('perfil');
  if (daUrl && /^[a-z0-9-]{1,24}$/.test(daUrl)) return daUrl;
  const m = /(?:^|;\s*)samuel_perfil=([a-z0-9-]{1,24})/.exec(cookie);
  return m ? m[1] : 'convidado';
}

export class Save {
  readonly chave: string;
  dados: Dados;
  funciona = true;
  constructor(private armazenamento: Storage | null = safeStorage(), perfil = perfilLocal()) {
    this.chave = `samuel:minigolfe-dos-pets:${perfil}:v${SCHEMA}`;
    this.dados = padrao();
    if (!this.armazenamento) { this.funciona = false; return; }
    let txt: string | null = null;
    try { txt = this.armazenamento.getItem(this.chave); } catch { this.funciona = false; return; }
    // conteúdo corrompido só volta ao padrão; o armazenamento continua valendo
    try { if (txt) this.dados = validar(JSON.parse(txt)); } catch { this.dados = padrao(); }
  }
  gravar(): boolean {
    try { this.armazenamento?.setItem(this.chave, JSON.stringify(this.dados)); return !!this.armazenamento; }
    catch { this.funciona = false; return false; }
  }
  /** Registra o resultado; devolve true se é recorde novo para o circuito. */
  registrar(circuito: string, tacadas: number, par: number, jogadores: number, modo: Modo): boolean {
    const atual = this.dados.melhores[circuito];
    if (atual && atual.tacadas <= tacadas) return false;
    this.dados.melhores[circuito] = { tacadas, par, jogadores, modo, data: new Date().toISOString().slice(0, 10) };
    this.gravar();
    return true;
  }
}

function safeStorage(): Storage | null {
  try { const s = window.localStorage; const k = '__mg_teste'; s.setItem(k, '1'); s.removeItem(k); return s; } catch { return null; }
}
