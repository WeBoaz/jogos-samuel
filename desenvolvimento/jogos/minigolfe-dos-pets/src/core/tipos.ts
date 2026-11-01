// Tipos do núcleo do Minigolfe dos Pets. Nada aqui conhece Three.js nem o DOM.
// Plano do chão: x (direita) e z (para baixo na tela; o buraco costuma estar em z negativo).

export type P2 = [number, number];

/** Pedaço de chão. Plano: h(x,z) = h0 + gx·x + gz·z. Rampas usam `rampa` para montar gx/gz. */
export interface Piso {
  poly: P2[];                 // polígono convexo ou não, em ordem (horário ou anti-horário)
  h?: number;                 // altura do piso plano (padrão 0)
  rampa?: { eixo: 'x' | 'z'; de: number; ate: number; h0: number; h1: number };
  ponte?: boolean;            // só visual (tábuas)
}

export interface Parede {
  a: P2;
  b: P2;
  esp?: number;               // meia espessura (padrão 0.12)
  alta?: number;              // altura visual (padrão 0.32)
  tipo?: 'madeira' | 'para-choque' | 'pedra';
}

export type Obstaculo =
  | { tipo: 'gira-gira'; centro: P2; raio: number; vel: number; pas: number; fase?: number }
  | { tipo: 'portao'; a: P2; b: P2; desloc: P2; periodo: number; fase?: number };

export interface Pista {
  id: number;
  nome: string;
  icone: string;
  par: number;
  tee: P2;
  buraco: P2;
  pisos: Piso[];
  paredes: Parede[];
  obstaculos?: Obstaculo[];
  agua?: P2[][];              // só visual: onde a bola cai se sair do chão
  tunel?: { de: P2; ate: P2; largura: number };
  dica?: string;
}

export interface Ajustes {
  velMax: number;             // velocidade da tacada com força 1
  capturaBuraco: number;      // abaixo desta velocidade a bola cai no buraco
  ima: number;                // 0 = sem ajuda; raio extra que puxa a bola devagar para o buraco
}

export type EventoFisica =
  | { tipo: 'parede'; forca: number; x: number; z: number }
  | { tipo: 'borda'; x: number; z: number }
  | { tipo: 'buraco' }
  | { tipo: 'fora'; x: number; z: number }
  | { tipo: 'parou' };
