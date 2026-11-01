// Servidor da Ilha dos Blocos. Uso local:  ILHA_SEGREDO=... cargo run --release
// Variáveis: ILHA_PORTA (4100), ILHA_ENDERECO (127.0.0.1 — atrás do proxy na VPS), ILHA_SEGREDO (obrigatória fora
// do modo local), ILHA_DADOS (pasta dos mundos, ./dados), ILHA_SEED (2026).
mod catalogo;
mod terreno;

use voxelize::{Server, Voxelize, World, WorldConfig};

fn var(nome: &str, padrao: &str) -> String {
    std::env::var(nome).unwrap_or_else(|_| padrao.to_owned())
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
        .default_time(9000.0)
        .saving(true)
        .save_dir(&format!("{dados}/mundos/ilha"))
        .build();
    let mut mundo = World::new("ilha", &config);
    mundo.pipeline_mut().add_stage(terreno::EstagioIlha);
    mundo
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let porta: u16 = var("ILHA_PORTA", "4100").parse().expect("ILHA_PORTA inválida");
    let endereco = var("ILHA_ENDERECO", "127.0.0.1");
    let segredo = var("ILHA_SEGREDO", "ilha-local");
    let dados = var("ILHA_DADOS", "./dados");
    let seed: u32 = var("ILHA_SEED", "2026").parse().expect("ILHA_SEED inválida");
    if endereco != "127.0.0.1" && segredo == "ilha-local" {
        panic!("defina ILHA_SEGREDO para escutar fora do 127.0.0.1");
    }

    let registro = catalogo::registro();
    let mut servidor = Server::new().port(porta).addr(&endereco).secret(&segredo).registry(&registro).build();
    servidor.add_world(mundo_ilha(&dados, seed)).expect("não deu para criar o mundo da ilha");
    Voxelize::run(servidor).await
}
