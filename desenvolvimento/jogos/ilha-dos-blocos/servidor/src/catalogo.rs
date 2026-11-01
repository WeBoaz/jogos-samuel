// Catálogo da Ilha dos Blocos: os 32 blocos da seção 6 do plano + água. IDs fixos (nunca reaproveitar um ID:
// o mundo salvo guarda o número). Nomes em português são a identidade lida pelo cliente para as texturas.
use voxelize::{AABBServerExt, Block, BlockFaces, Registry, AABB};

pub struct Def {
    pub id: u32,
    pub nome: &'static str,
    pub tipo: Tipo,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Tipo {
    Solido,
    Vidro,
    Folhas,
    Luz,
    Porta,
}

pub const AGUA: u32 = 40;

pub const BLOCOS: [Def; 32] = [
    Def { id: 1, nome: "Grama", tipo: Tipo::Solido },
    Def { id: 2, nome: "Terra", tipo: Tipo::Solido },
    Def { id: 3, nome: "Pedra", tipo: Tipo::Solido },
    Def { id: 4, nome: "Areia", tipo: Tipo::Solido },
    Def { id: 5, nome: "Cascalho", tipo: Tipo::Solido },
    Def { id: 6, nome: "Argila", tipo: Tipo::Solido },
    Def { id: 7, nome: "Tronco claro", tipo: Tipo::Solido },
    Def { id: 8, nome: "Tronco escuro", tipo: Tipo::Solido },
    Def { id: 9, nome: "Folhas claras", tipo: Tipo::Folhas },
    Def { id: 10, nome: "Folhas escuras", tipo: Tipo::Folhas },
    Def { id: 11, nome: "Tábuas claras", tipo: Tipo::Solido },
    Def { id: 12, nome: "Tábuas escuras", tipo: Tipo::Solido },
    Def { id: 13, nome: "Tijolo", tipo: Tipo::Solido },
    Def { id: 14, nome: "Vidro", tipo: Tipo::Vidro },
    Def { id: 15, nome: "Pedra talhada", tipo: Tipo::Solido },
    Def { id: 16, nome: "Carvão", tipo: Tipo::Solido },
    Def { id: 17, nome: "Minério comum", tipo: Tipo::Solido },
    Def { id: 18, nome: "Minério raro", tipo: Tipo::Solido },
    Def { id: 19, nome: "Bloco de metal", tipo: Tipo::Solido },
    Def { id: 20, nome: "Bloco de cristal", tipo: Tipo::Solido },
    Def { id: 21, nome: "Neve", tipo: Tipo::Solido },
    Def { id: 22, nome: "Gelo", tipo: Tipo::Vidro },
    Def { id: 23, nome: "Lã clara", tipo: Tipo::Solido },
    Def { id: 24, nome: "Lã escura", tipo: Tipo::Solido },
    Def { id: 25, nome: "Lã vermelha", tipo: Tipo::Solido },
    Def { id: 26, nome: "Lã azul", tipo: Tipo::Solido },
    Def { id: 27, nome: "Lã verde", tipo: Tipo::Solido },
    Def { id: 28, nome: "Lâmpada", tipo: Tipo::Luz },
    Def { id: 29, nome: "Porta", tipo: Tipo::Porta },
    Def { id: 30, nome: "Bancada", tipo: Tipo::Solido },
    Def { id: 31, nome: "Fornalha", tipo: Tipo::Solido },
    Def { id: 32, nome: "Baú", tipo: Tipo::Solido },
];

pub fn id(nome: &str) -> u32 {
    BLOCOS.iter().find(|b| b.nome == nome).map(|b| b.id).unwrap_or_else(|| panic!("bloco sem cadastro: {nome}"))
}

fn bloco(d: &Def) -> Block {
    let b = Block::new(d.nome).id(d.id);
    match d.tipo {
        Tipo::Solido => b.build(),
        Tipo::Vidro | Tipo::Folhas => b.is_see_through(true).is_transparent(true).light_reduce(false).build(),
        Tipo::Luz => b.torch_light_level(14).build(),
        // porta: painel fino que deixa passar (v1). Abrir/fechar entra com as interações (BLK-040).
        Tipo::Porta => {
            let faces = BlockFaces::six_faces().scale_z(0.2).offset_z(0.4).build();
            b.faces(&faces)
                .aabbs(&[AABB::from_faces(&faces)])
                .is_passable(true)
                .is_transparent(true)
                .y_rotatable(true)
                .build()
        }
    }
}

pub fn registro() -> Registry {
    let mut r = Registry::new();
    let blocos: Vec<Block> = BLOCOS.iter().map(bloco).collect();
    r.register_blocks(&blocos);
    r.register_block(
        &Block::new("Água")
            .id(AGUA)
            .is_fluid(true)
            .is_passable(true)
            .is_see_through(true)
            .is_transparent(true)
            .aabbs(&[])
            .build(),
    );
    r
}

#[cfg(test)]
mod testes {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn trinta_e_dois_blocos_com_ids_e_nomes_unicos() {
        assert_eq!(BLOCOS.len(), 32);
        let ids: HashSet<u32> = BLOCOS.iter().map(|b| b.id).collect();
        let nomes: HashSet<&str> = BLOCOS.iter().map(|b| b.nome).collect();
        assert_eq!(ids.len(), 32);
        assert_eq!(nomes.len(), 32);
        assert!(!ids.contains(&0) && !ids.contains(&AGUA));
    }

    #[test]
    fn registro_tem_todos_os_blocos() {
        let r = registro();
        for b in BLOCOS.iter() {
            assert_eq!(r.get_block_by_name(b.nome).id, b.id);
        }
        assert_eq!(r.get_block_by_name("Água").id, AGUA);
    }
}
