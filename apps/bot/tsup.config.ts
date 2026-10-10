import { defineConfig } from 'tsup';

/**
 * Bot 生产打包：打入 `@lanius/*` workspace 源码。
 * 含原生绑定的依赖（如 `@resvg/resvg-js`）保持 external。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  clean: true,
  sourcemap: true,
  noExternal: [/^@lanius\//],
  external: [
    '@resvg/resvg-js',
    'satori',
    '@fontsource/ibm-plex-sans',
    '@fontsource/noto-sans-sc',
    '@fontsource/rajdhani',
  ],
});
