import { defineConfig } from 'tsup';

/**
 * API 生产打包：将 workspace 包打进单文件产物，供 Node runner 直接执行。
 * `warframe-worldstate-data` 体积较大且含数据文件，保持 external。
 *
 * `node:sqlite` 通过 `createRequire` 在源码中间接加载（见 db/client.ts），
 * esbuild 无法静态分析，无需在此声明 external。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  sourcemap: true,
  noExternal: [/^@lanius\//],
  external: ['warframe-worldstate-data', 'warframe-worldstate-data/utilities'],
});
