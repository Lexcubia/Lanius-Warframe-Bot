import { buildBilingualIndex, type BilingualNameIndex } from '@lanius/core';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 捆绑双语表 JSON 形态（DE PublicExport language 同键对精简）。
 */
type NameBilingualFile = {
  pairs?: Array<[string, string]>;
};

/**
 * 进程内单例索引（表约 5k 对，启动时一次加载即可）。
 */
let cachedIndex: BilingualNameIndex | null = null;

/**
 * 解析捆绑 `name-bilingual.json` 路径（兼容 tsx 源码与 tsup 产物旁路拷贝）。
 *
 * @returns 数据文件绝对路径
 * @throws 找不到捆绑表时抛出
 */
function resolveBundledPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // tsup onSuccess 拷到 dist/ 旁
    join(here, 'name-bilingual.json'),
    join(here, 'data/name-bilingual.json'),
    // 源码：adapters/names → ../../data
    join(here, '../../data/name-bilingual.json'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }
  throw new Error('Bundled name-bilingual.json not found (wiki/translate data)');
}

/**
 * 加载并缓存官方双语名称索引。
 *
 * @param options - 可选覆盖路径（测试用）
 * @returns 可查表索引
 */
export function loadBilingualNameIndex(options?: { path?: string }): BilingualNameIndex {
  if (cachedIndex && !options?.path) {
    return cachedIndex;
  }
  const path = options?.path ?? resolveBundledPath();
  const raw = JSON.parse(readFileSync(path, 'utf8')) as NameBilingualFile;
  const pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
  const index = buildBilingualIndex(pairs);
  if (!options?.path) {
    cachedIndex = index;
  }
  return index;
}

/**
 * 测试用：清空进程内缓存。
 *
 * @returns 无返回值
 */
export function resetBilingualNameIndexCacheForTests(): void {
  cachedIndex = null;
}
