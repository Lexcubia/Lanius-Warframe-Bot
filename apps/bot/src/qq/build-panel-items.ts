import { LANIUS_COMMAND_CATALOG } from '@lanius/core';
import type { QqPanelCommandItem } from '@lanius/qq-official';

/**
 * 将 Lanius 指令目录映射为官方「指令面板」条目。
 * `模式` 拆成「模式 文本 / 模式 图片」两条，便于一点即发完整用法。
 *
 * @returns 可供 `syncQqCommandPanels` 使用的指令项列表
 */
export function buildQqPanelItems(): QqPanelCommandItem[] {
  const items: QqPanelCommandItem[] = [];
  for (const entry of LANIUS_COMMAND_CATALOG) {
    if (entry.id === 'mode') {
      items.push({ name: '模式 文本', desc: '切换为文本回复' });
      items.push({ name: '模式 图片', desc: '切换为图片卡片' });
      continue;
    }
    const name = entry.roots[0] ?? entry.command.replace(/^\//, '');
    items.push({
      name,
      desc: entry.summary.zh,
    });
  }
  return items;
}
