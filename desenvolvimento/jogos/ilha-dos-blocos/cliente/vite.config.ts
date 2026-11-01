import { defineConfig, type Plugin } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
      this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_NOTICES.txt', source: topo + partes.join('\n\n') + '\n' });
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
