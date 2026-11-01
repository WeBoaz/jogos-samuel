// Geração da ilha por seed: mesma seed → mesmos blocos, em qualquer ordem de chunks (só depende de x, z e seed).
// Ilha redonda com morros suaves, praia de areia, água rasa em volta até a borda do mundo, árvores e veios de minério.
use voxelize::{Chunk, ChunkStage, Resources, Space, Vec3, VoxelAccess};

use crate::catalogo::{id, AGUA};

pub const NIVEL_MAR: i32 = 24;
pub const RAIO_ILHA: f32 = 54.0;

/// Hash inteiro determinístico (sem depender de bibliotecas que podem mudar entre versões).
fn hash(x: i32, z: i32, seed: u32, canal: u32) -> u32 {
    let mut h = (x as u32).wrapping_mul(0x27d4_eb2d)
        ^ (z as u32).wrapping_mul(0x1656_67b1)
        ^ seed.wrapping_mul(0x9e37_79b9)
        ^ canal.wrapping_mul(0x85eb_ca6b);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2c1b_3c6d);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297a_2d39);
    h ^ (h >> 15)
}

fn aleatorio(x: i32, z: i32, seed: u32, canal: u32) -> f32 {
    hash(x, z, seed, canal) as f32 / u32::MAX as f32
}

/// Ruído de valor suave (interpolação cúbica) numa grade de `escala` blocos.
fn ruido(x: f32, z: f32, escala: f32, seed: u32, canal: u32) -> f32 {
    let (gx, gz) = (x / escala, z / escala);
    let (x0, z0) = (gx.floor() as i32, gz.floor() as i32);
    let (tx, tz) = (gx - x0 as f32, gz - z0 as f32);
    let s = |t: f32| t * t * (3.0 - 2.0 * t);
    let v = |dx: i32, dz: i32| aleatorio(x0 + dx, z0 + dz, seed, canal);
    let a = v(0, 0) + (v(1, 0) - v(0, 0)) * s(tx);
    let b = v(0, 1) + (v(1, 1) - v(0, 1)) * s(tx);
    a + (b - a) * s(tz)
}

/// Altura do topo do terreno em (x, z). Abaixo de NIVEL_MAR fica coberto de água.
pub fn altura(x: i32, z: i32, seed: u32) -> i32 {
    let (fx, fz) = (x as f32, z as f32);
    let d = (fx * fx + fz * fz).sqrt();
    let borda = ruido(fx, fz, 18.0, seed, 7) * 10.0 - 5.0; // contorno irregular
    let dentro = 1.0 - ((d + borda) / RAIO_ILHA).clamp(0.0, 1.4);
    let morros = ruido(fx, fz, 24.0, seed, 1) * 7.0 + ruido(fx, fz, 9.0, seed, 2) * 2.0;
    let base = NIVEL_MAR as f32 - 2.0 + dentro * 7.0 + morros * dentro.max(0.0);
    base.round().clamp(2.0, 60.0) as i32
}

/// Tem árvore com tronco em (x, z)? Grade de 7×7 com uma posição sorteada por célula, só em grama.
pub fn arvore_em(x: i32, z: i32, seed: u32) -> bool {
    let (cx, cz) = (x.div_euclid(7), z.div_euclid(7));
    let ox = (hash(cx, cz, seed, 11) % 5) as i32 + 1;
    let oz = (hash(cx, cz, seed, 12) % 5) as i32 + 1;
    let chance = aleatorio(cx, cz, seed, 13);
    x == cx * 7 + ox && z == cz * 7 + oz && chance < 0.55 && altura(x, z, seed) > NIVEL_MAR + 1
        && (x * x + z * z) > 36 // praça livre no nascimento
}

pub struct EstagioIlha;

impl ChunkStage for EstagioIlha {
    fn name(&self) -> String {
        "Ilha".to_owned()
    }

    fn process(&self, mut chunk: Chunk, recursos: Resources, _: Option<Space>) -> Chunk {
        let seed = recursos.config.seed;
        let (grama, terra, pedra, areia) = (id("Grama"), id("Terra"), id("Pedra"), id("Areia"));
        let (cascalho, carvao, minerio) = (id("Cascalho"), id("Carvão"), id("Minério comum"));
        let (tronco, folhas) = (id("Tronco claro"), id("Folhas claras"));
        let Vec3(min_x, _, min_z) = chunk.min;
        let Vec3(max_x, _, max_z) = chunk.max;

        for vx in min_x..max_x {
            for vz in min_z..max_z {
                let h = altura(vx, vz, seed);
                let praia = h <= NIVEL_MAR + 1;
                for vy in 0..=h {
                    let bloco = if vy == h {
                        if h < NIVEL_MAR - 2 { cascalho } else if praia { areia } else { grama }
                    } else if vy >= h - 3 {
                        if praia { areia } else { terra }
                    } else {
                        let r = aleatorio(vx * 31 + vy, vz, seed, 21);
                        if r < 0.012 { carvao } else if r < 0.018 { minerio } else { pedra }
                    };
                    chunk.set_voxel(vx, vy, vz, bloco);
                }
                for vy in (h + 1)..=NIVEL_MAR {
                    chunk.set_voxel(vx, vy, vz, AGUA);
                }
                if arvore_em(vx, vz, seed) {
                    let alto = 4 + (hash(vx, vz, seed, 14) % 2) as i32;
                    for dy in 1..=alto {
                        chunk.set_voxel(vx, h + dy, vz, tronco);
                    }
                    // copa: folhas que passarem da borda do chunk viram `exceeded_changes` (o motor aplica)
                    for dx in -2i32..=2 {
                        for dz in -2i32..=2 {
                            for dy in (alto - 1)..=(alto + 1) {
                                let canto = dx.abs() == 2 && dz.abs() == 2;
                                if canto || (dy == alto + 1 && (dx.abs() > 1 || dz.abs() > 1)) {
                                    continue;
                                }
                                if dx == 0 && dz == 0 && dy <= alto {
                                    continue;
                                }
                                chunk.set_voxel(vx + dx, h + dy, vz + dz, folhas);
                            }
                        }
                    }
                }
            }
        }
        chunk
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn mesma_seed_mesma_ilha_e_seeds_diferentes_mudam() {
        let a: Vec<i32> = (-60..60).step_by(5).flat_map(|x| (-60..60).step_by(5).map(move |z| altura(x, z, 2026))).collect();
        let b: Vec<i32> = (-60..60).step_by(5).flat_map(|x| (-60..60).step_by(5).map(move |z| altura(x, z, 2026))).collect();
        let c: Vec<i32> = (-60..60).step_by(5).flat_map(|x| (-60..60).step_by(5).map(move |z| altura(x, z, 7))).collect();
        assert_eq!(a, b);
        assert_ne!(a, c);
    }

    #[test]
    fn centro_e_terra_firme_e_borda_e_agua() {
        for seed in [1u32, 2026, 99999] {
            assert!(altura(0, 0, seed) > NIVEL_MAR, "centro alagado na seed {seed}");
            assert!(altura(78, 0, seed) < NIVEL_MAR, "borda seca na seed {seed}");
        }
    }

    #[test]
    fn tem_arvores_e_nascimento_livre() {
        let n = (-50..50).flat_map(|x| (-50..50).map(move |z| (x, z))).filter(|&(x, z)| arvore_em(x, z, 2026)).count();
        assert!(n >= 20, "poucas árvores: {n}");
        assert!(!(-4..=4).any(|x| (-4..=4).any(|z| arvore_em(x, z, 2026))));   // raio² ≤ 36 livre
    }
}
