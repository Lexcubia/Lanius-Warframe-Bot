import { defineConfig } from 'tsup';

/**
 * Bot 生产打包：打入 `@lanius/*` workspace 源码。
 * 含原生绑定 / 浏览器驱动的依赖保持 external。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  sourcemap: true,
  noExternal: [/^@lanius\//],
  external: [
    // 出图宿主仍经 Playwright + Vite 加载 card-host；字体仅 Noto 打包进宿主
    '@fontsource/noto-sans-sc',
    'playwright',
    'vite',
    '@vitejs/plugin-vue',
    'vue',
    // CJS 第三方依赖：保持 external，避免被卷入 ESM 产物后
    // 触发 "Dynamic require of \"process\" is not supported"（yaml 等）
    'yaml',
  ],
});
