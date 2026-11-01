// Servidor da Ilha dos Blocos. Uso local:  ILHA_SEGREDO=... cargo run --release
// Variáveis: ILHA_PORTA (4100), ILHA_ENDERECO (127.0.0.1 — atrás do proxy na VPS), ILHA_SEGREDO (código da ilha;
// obrigatório em produção), ILHA_PRODUCAO (definida na VPS), ILHA_DADOS (pasta dos mundos, ./dados), ILHA_SEED (2026).
mod catalogo;
mod terreno;

use voxelize::{Server, Voxelize, World, WorldConfig};

fn var(nome: &str, padrao: &str) -> String {
    std::env::var(nome).unwrap_or_else(|_| padrao.to_owned())
}

const SEGREDO_LOCAL: &str = "ilha-local";
const MANHA: f32 = 9000.0; // de 24000 (dia inteiro)

/// Em produção (ou escutando fora do 127.0.0.1) o código da ilha precisa existir, não ser o de teste e ter 12+ caracteres.
fn conferir_segredo(segredo: &str, producao: bool, endereco: &str) -> Result<(), String> {
    if (producao || endereco != "127.0.0.1") && (segredo.trim().len() < 12 || segredo == SEGREDO_LOCAL) {
        return Err("defina ILHA_SEGREDO (código da ilha, 12+ caracteres) para rodar em produção".to_owned());
    }
    Ok(())
}

fn mundo_ilha(dados: &str, seed: u32) -> World {
    let config = WorldConfig::new()
        .seed(seed)
        .min_chunk([-5, -5])
        .max_chunk([4, 4]) // 160×160 blocos: a água na borda explica o limite
        .preload(true)
        .preload_radius(3)
        .max_height(96)
        .water_level(terreno::NIVEL_MAR as usize)
        .time_per_day(24000)
        .default_time(MANHA)
        .does_tick_time(false) // Criativo: sempre de dia (dia e noite chegam com a Sobrevivência)
        .saving(true)
        .save_dir(&format!("{dados}/mundos/ilha"))
        .build();
    let mut mundo = World::new("ilha", &config);
    mundo.pipeline_mut().add_stage(terreno::EstagioIlha);
    // o mundo salvo guarda a hora em stats.json; com o relógio parado, começa sempre de manhã
    mundo.stats_mut().set_time(MANHA);
    mundo
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let porta: u16 = var("ILHA_PORTA", "4100").parse().expect("ILHA_PORTA inválida");
    let endereco = var("ILHA_ENDERECO", "127.0.0.1");
    let segredo = var("ILHA_SEGREDO", SEGREDO_LOCAL);
    let dados = var("ILHA_DADOS", "./dados");
    let seed: u32 = var("ILHA_SEED", "2026").parse().expect("ILHA_SEED inválida");
    if let Err(erro) = conferir_segredo(&segredo, std::env::var("ILHA_PRODUCAO").is_ok(), &endereco) {
        eprintln!("{erro}");
        std::process::exit(2);
    }

    let registro = catalogo::registro();
    let mut servidor = Server::new().port(porta).addr(&endereco).secret(&segredo).registry(&registro).build();
    servidor.add_world(mundo_ilha(&dados, seed)).expect("não deu para criar o mundo da ilha");
    Voxelize::run(servidor).await
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn producao_exige_codigo_de_verdade() {
        assert!(conferir_segredo("ilha-local", false, "127.0.0.1").is_ok()); // dev local
        for ruim in ["", "   ", "ilha-local", "curto-123"] {
            assert!(conferir_segredo(ruim, true, "127.0.0.1").is_err(), "aceitou {ruim:?} em produção");
            assert!(conferir_segredo(ruim, false, "0.0.0.0").is_err(), "aceitou {ruim:?} escutando fora");
        }
        assert!(conferir_segredo("pato-coco-sapo-1234", true, "127.0.0.1").is_ok());
    }
}
