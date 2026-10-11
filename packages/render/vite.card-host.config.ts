import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const pkgRoot = dirname(fileURLToPath(import.meta.url));

/**
 * 预构建 QQ 卡片宿主页（生产截图用静态资源，避免运行时 Vite）。
 *
 * @returns Vite 配置
 */
export default defineConfig({
  root: resolve(pkgRoot, 'card-host'),
  base: './',
  plugins: [vue()],
  resolve: {
    dedupe: ['vue'],
  },
  build: {
    outDir: resolve(pkgRoot, 'dist/card-host'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
