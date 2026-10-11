import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * 本地缓存的指令面板 ID（开放平台 GET 列表对部分机器人会返回空 records）。
 */
export type QqPanelIdStore = {
  c2c?: string;
  group?: string;
};

/**
 * 从 JSON 文件读取已保存的 panel_id。
 *
 * @param path - 绝对或相对路径；文件不存在时返回空对象
 * @returns 已保存的 ID 映射
 */
export function loadQqPanelIdStore(path: string): QqPanelIdStore {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    return {
      c2c: typeof raw.c2c === 'string' && raw.c2c.trim() ? raw.c2c.trim() : undefined,
      group:
        typeof raw.group === 'string' && raw.group.trim()
          ? raw.group.trim()
          : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * 将 panel_id 写入 JSON 文件（自动创建父目录）。
 *
 * @param path - 目标路径
 * @param store - 要持久化的 ID
 * @returns 无返回值
 */
export function saveQqPanelIdStore(path: string, store: QqPanelIdStore): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        c2c: store.c2c ?? '',
        group: store.group ?? '',
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}
