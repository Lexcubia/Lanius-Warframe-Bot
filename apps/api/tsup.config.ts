import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const apiRoot = dirname(fileURLToPath(import.meta.url));

/**
 * API 生产打包：将 workspace 包打进单文件产物，供 Node runner 直接执行。
 * `warframe-worldstate-data` 体积较大且含数据文件，保持 external。
 *
 * `node:sqlite` 通过 `createRequire` 在源码中间接加载（见 db/client.ts），
 * esbuild 无法静态分析，无需在此声明 external。
 *
 * Wave3：将 `name-bilingual.json` 拷到 `dist/`，供运行时双语查表。
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
  async onSuccess() {
    const dist = join(apiRoot, 'dist');
    await mkdir(dist, { recursive: true });
    await copyFile(
      join(apiRoot, 'src/data/name-bilingual.json'),
      join(dist, 'name-bilingual.json'),
    );
  },
});
