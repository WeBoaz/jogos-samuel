import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Saída vai para a pasta servida pelo porteiro do portal: /jogo/ilha-dos-blocos/ (só a partir da BLK-065)
const saida = fileURLToPath(new URL('../../../../_privado/jogos/ilha-dos-blocos', import.meta.url));

export default defineConfig({
  base: './',
  // o core carrega os workers com new URL('assets/…', import.meta.url): pré-empacotar quebra o caminho no dev
  optimizeDeps: { exclude: ['@voxelize/core'], include: ['@voxelize/core > ndarray', '@voxelize/core > domurl', '@voxelize/core > events', '@voxelize/core > jsonfn', '@voxelize/core > noisejs', '@voxelize/core > omggif', '@voxelize/core > lz4js', '@voxelize/core > gl-vec3', '@voxelize/core > deepmerge', '@voxelize/core > uuid', '@voxelize/core > socket.io-client', '@voxelize/core > fflate', '@voxelize/core > zod', '@voxelize/core > @tweenjs/tween.js', '@voxelize/core > @voxelize/protocol', '@voxelize/core > @voxelize/physics-engine', '@voxelize/core > @voxelize/raycast', '@voxelize/core > @voxelize/aabb'] },
  build: { outDir: saida, emptyOutDir: true, assetsDir: 'assets', sourcemap: false, target: 'es2020', chunkSizeWarningLimit: 1600 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
