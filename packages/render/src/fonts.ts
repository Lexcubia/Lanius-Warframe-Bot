import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/**
 * Satori 渲染 Lanius 卡片时使用的字体缓冲。
 */
export type CardFonts = {
  display: ArrayBuffer;
  body: ArrayBuffer;
  cjk: ArrayBuffer;
};

/**
 * 从已安装的 `@fontsource/*` 包加载字体文件。
 *
 * @returns display / body / CJK 三套字体缓冲
 * @throws Error 当字体文件无法解析或读取时抛出
 */
export function loadCardFonts(): CardFonts {
  return {
    display: readFontPackage('@fontsource/rajdhani', 'files/rajdhani-latin-600-normal.woff'),
    body: readFontPackage(
      '@fontsource/ibm-plex-sans',
      'files/ibm-plex-sans-latin-400-normal.woff',
    ),
    cjk: readFontPackage(
      '@fontsource/noto-sans-sc',
      'files/noto-sans-sc-chinese-simplified-400-normal.woff',
    ),
  };
}

/**
 * 读取 `@fontsource` 包根目录下的相对字体路径。
 *
 * @param packageName - node_modules 中的 npm 包名
 * @param relativePath - 包内字体相对路径
 * @returns 可供 Satori `fonts[].data` 使用的 ArrayBuffer
 */
function readFontPackage(packageName: string, relativePath: string): ArrayBuffer {
  const pkgJson = require.resolve(`${packageName}/package.json`);
  const filePath = join(dirname(pkgJson), relativePath);
  const buffer = readFileSync(filePath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
