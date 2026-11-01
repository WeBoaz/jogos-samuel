import { defineConfig, type Plugin } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Crates Rust compiladas no voxelize_wasm_mesher_bg.wasm (dentro do mesh-worker do @voxelize/core). Levantadas com
// `cargo tree -e normal --target wasm32-unknown-unknown` em crates/wasm-mesher (Voxelize 3.0.0); proc-macros ficam de fora
// (só rodam na compilação). As de licença dupla MIT/Apache-2.0 são usadas nos termos da MIT.
const CRATES_WASM = [
  'voxelize-wasm-mesher, voxelize-mesher, voxelize-core 3.0.0 (MIT)',
  'wasm-bindgen 0.2, wasm-bindgen-shared 0.2, js-sys 0.3 (MIT OR Apache-2.0)',
  'serde 1.0, serde_core 1.0 (MIT OR Apache-2.0), serde-wasm-bindgen 0.6 (MIT)',
  'console_error_panic_hook 0.1, hashbrown 0.14, ahash 0.8, allocator-api2 0.2, bumpalo 3, cfg-if 1, once_cell 1 (MIT OR Apache-2.0)',
  'futures-core, futures-task, futures-util 0.3, pin-project-lite 0.2 (MIT OR Apache-2.0), slab 0.4 (MIT)',
  'zerocopy 0.8 (BSD-2-Clause OR Apache-2.0 OR MIT)',
  'biblioteca padrão do Rust: core, alloc, std (MIT OR Apache-2.0)',
];
const MIT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

/** Gera THIRD_PARTY_NOTICES.txt com a licença de cada pacote que de fato entrou no bundle. */
function avisosDeLicenca(): Plugin {
  return {
    name: 'avisos-de-licenca',
    apply: 'build',
    generateBundle(_, bundle) {
      const pastas = new Set<string>();
      for (const saida of Object.values(bundle)) {
        if (saida.type !== 'chunk') continue;
        for (const bruto of Object.keys(saida.modules)) {
          const id = bruto.replace(/^\0/, '').split('?')[0];   // módulos virtuais do Rollup (ex.: \0…?commonjs-exports)
          const i = id.lastIndexOf('/node_modules/');
          if (i < 0) continue;
          const resto = id.slice(i + 14).split('/');
          const nome = resto[0].startsWith('@') ? `${resto[0]}/${resto[1]}` : resto[0];
          const pasta = id.slice(0, i + 14) + nome;
          if (existsSync(join(pasta, 'package.json'))) pastas.add(pasta);
        }
      }
      const partes = [...pastas].sort().map((pasta) => {
        const pkg = JSON.parse(readFileSync(join(pasta, 'package.json'), 'utf8'));
        const arq = readdirSync(pasta).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f));
        const texto = arq ? readFileSync(join(pasta, arq), 'utf8').trim() : `Licença declarada: ${pkg.license ?? 'não informada'}`;
        return `===== ${pkg.name} ${pkg.version} (${pkg.license ?? '?'})\n${texto}`;
      });
      const topo = [
        'Ilha dos Blocos — samuel.tech. Avisos de terceiros dos pacotes incluídos neste jogo (gerado no build).',
        'Arte, texturas, sons e regras do jogo: próprios. Os workers em assets/ vêm do @voxelize/core (mesma licença MIT).',
        '',
      ].join('\n');
      const wasm = [
        '===== Crates Rust dentro de assets/mesh-worker (voxelize_wasm_mesher_bg.wasm), nos termos da licença MIT',
        ...CRATES_WASM.map((c) => `- ${c}`),
        'Copyright (c) os autores e contribuidores de cada crate listada (ver o repositório de cada uma em crates.io).',
        '',
        MIT,
      ].join('\n');
      this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_NOTICES.txt', source: topo + partes.join('\n\n') + '\n\n' + wasm + '\n' });
    },
  };
}

// Saída vai para a pasta servida pelo porteiro do portal: /jogo/ilha-dos-blocos/ (só a partir da BLK-065)
const saida = fileURLToPath(new URL('../../../../_privado/jogos/ilha-dos-blocos', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [avisosDeLicenca()],
  // o core carrega os workers com new URL('assets/…', import.meta.url): pré-empacotar quebra o caminho no dev
  optimizeDeps: { exclude: ['@voxelize/core'], include: ['@voxelize/core > ndarray', '@voxelize/core > domurl', '@voxelize/core > events', '@voxelize/core > jsonfn', '@voxelize/core > noisejs', '@voxelize/core > omggif', '@voxelize/core > lz4js', '@voxelize/core > gl-vec3', '@voxelize/core > deepmerge', '@voxelize/core > uuid', '@voxelize/core > socket.io-client', '@voxelize/core > fflate', '@voxelize/core > zod', '@voxelize/core > @tweenjs/tween.js', '@voxelize/core > @voxelize/protocol', '@voxelize/core > @voxelize/physics-engine', '@voxelize/core > @voxelize/raycast', '@voxelize/core > @voxelize/aabb'] },
  build: { outDir: saida, emptyOutDir: true, assetsDir: 'assets', sourcemap: false, target: 'es2020', chunkSizeWarningLimit: 1600 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
