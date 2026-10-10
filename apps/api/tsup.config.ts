import { defineConfig } from 'tsup';

/**
 * API 生产打包：将 workspace 包打进产物，避免运行时依赖 `@lanius/*` 的 TS 源码导出。
 * `warframe-worldstate-data` 体积较大且含数据文件，保持 external。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  clean: true,
  sourcemap: true,
  noExternal: [/^@lanius\//],
  external: ['warframe-worldstate-data', 'warframe-worldstate-data/utilities'],
});
