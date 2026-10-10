/**
 * 为 Docker runner 阶段生成可独立安装的 package.json（外部 npm 依赖）。
 * 用法：`node scripts/prepare-runtime-package.mjs api|bot <outDir>`
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Bot 在打包 `@lanius/render` 后仍需的原生/字体运行时依赖。
 */
const BOT_RUNTIME_EXTRAS = {
  '@resvg/resvg-js': '^2.6.2',
  satori: '^0.12.1',
  '@fontsource/ibm-plex-sans': '^5.2.5',
  '@fontsource/noto-sans-sc': '^5.2.5',
  '@fontsource/rajdhani': '^5.2.5',
};

/**
 * 生成 runner 用 package.json（去掉 `@lanius/*`，必要时补齐 bot 外部依赖）。
 *
 * @param {string} appName - `api` 或 `bot`
 * @param {string} outDir - 输出目录（将写入 package.json）
 * @returns {void}
 */
function prepareRuntimePackage(appName, outDir) {
  if (appName !== 'api' && appName !== 'bot') {
    throw new Error(`unsupported app: ${appName}`);
  }

  const sourcePath = resolve(root, 'apps', appName, 'package.json');
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  /** @type {Record<string, string>} */
  const dependencies = { ...(source.dependencies ?? {}) };

  for (const key of Object.keys(dependencies)) {
    if (key.startsWith('@lanius/')) {
      delete dependencies[key];
    }
  }

  if (appName === 'bot') {
    Object.assign(dependencies, BOT_RUNTIME_EXTRAS);
  }

  const runtimePackage = {
    name: source.name,
    version: source.version,
    private: true,
    type: 'module',
    dependencies,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, 'package.json'),
    `${JSON.stringify(runtimePackage, null, 2)}\n`,
    'utf8',
  );
}

const appName = process.argv[2];
const outDir = process.argv[3];
if (!appName || !outDir) {
  console.error('usage: node scripts/prepare-runtime-package.mjs api|bot <outDir>');
  process.exit(1);
}

prepareRuntimePackage(appName, resolve(outDir));
console.log(`wrote runtime package.json for ${appName} -> ${outDir}`);
