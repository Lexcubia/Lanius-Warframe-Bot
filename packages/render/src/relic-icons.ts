import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FissureEra } from '@lanius/core';

/**
 * 进程内 data URL 缓存，避免每次出图重复读盘。
 */
const dataUrlCache = new Map<FissureEra, string>();

/**
 * 读取已打包的官方导出遗物图标，转为 Satori 可用的 data URL。
 * 资源来自 PublicExport（`Lotus/Interface/Icons/Relics|Categories`），经 browse.wf 镜像落盘。
 *
 * @param era - 裂隙纪元
 * @returns `data:image/png;base64,…`；文件缺失时 `undefined`
 */
export function loadRelicIconDataUrl(era: FissureEra): string | undefined {
  const cached = dataUrlCache.get(era);
  if (cached) {
    return cached;
  }

  try {
    const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '../assets/relics');
    const bytes = readFileSync(join(assetsDir, `${era}.png`));
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    dataUrlCache.set(era, dataUrl);
    return dataUrl;
  } catch {
    return undefined;
  }
}
