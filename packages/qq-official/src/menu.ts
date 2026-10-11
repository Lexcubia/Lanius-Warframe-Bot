import type { QqOpenApiOptions } from './open-api.js';
import { qqOpenApiJson, truncateWeightedChars } from './open-api.js';

/**
 * 同步到官方「自定义菜单」的一条发送型按钮。
 */
export type QqMenuSendItem = {
  /** 按钮展示名（加权 ≤10：中文计 2）。 */
  name: string;
  /** 点击后填入输入框的文本。 */
  sendMessage: string;
};

/**
 * 同步全局自定义菜单的选项（仅 C2C 单聊底部菜单）。
 */
export type SyncQqCustomMenuOptions = QqOpenApiOptions & {
  /** 一级发送按钮；超出时收入「更多」子菜单。 */
  items: readonly QqMenuSendItem[];
  /** 可选官网链接（https）。 */
  siteUrl?: string;
};

/**
 * 自定义菜单同步结果。
 */
export type SyncQqCustomMenuResult = {
  action: 'updated' | 'failed';
  version?: number;
  detail?: string;
};

/**
 * 覆盖写入全局自定义菜单（单聊底部）。
 * 一级最多 10 项：主指令靠前，「更多」折叠模式类指令，可选官网 link。
 *
 * @param options - 凭据与菜单项
 * @returns 同步结果
 */
export async function syncQqCustomMenu(
  options: SyncQqCustomMenuOptions,
): Promise<SyncQqCustomMenuResult> {
  try {
    const primary = options.items.slice(0, 6).map((item) => ({
      type: 'send_message' as const,
      name: truncateWeightedChars(item.name, 10),
      send_message: item.sendMessage,
    }));

    const overflow = options.items.slice(6).map((item) => ({
      type: 'send_message' as const,
      name: truncateWeightedChars(item.name, 14),
      send_message: item.sendMessage,
    }));

    const menuItems: Array<Record<string, unknown>> = [...primary];

    if (overflow.length > 0) {
      menuItems.push({
        type: 'menu',
        name: truncateWeightedChars('更多', 10),
        sub_menu_items: overflow.slice(0, 5),
      });
    }

    if (options.siteUrl?.startsWith('https://')) {
      menuItems.push({
        type: 'link',
        name: truncateWeightedChars('官网', 10),
        link: options.siteUrl,
      });
    }

    const response = await qqOpenApiJson<{ version?: number }>(
      options,
      'PUT',
      '/v2/menu',
      { menu: { items: menuItems.slice(0, 10) } },
    );
    return { action: 'updated', version: response.version };
  } catch (error) {
    return {
      action: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
