import type { QqKeyboardContent } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

/**
 * 帮助回复底部快捷按钮的构建选项。
 */
export type BuildHelpKeyboardOptions = {
  /** 界面语言（影响按钮标签与指令词） */
  locale: 'zh' | 'en';
  /** 是否点击后直接发送（单聊更可靠） */
  enter: boolean;
  /** 机器人 AppID（写入 keyboard.bot_appid） */
  botAppId: string;
};

/**
 * 构造帮助回复底部的常用查询快捷键盘。
 *
 * @param options - 语言、enter 与 AppID
 * @returns QQ keyboard content
 */
export function buildHelpShortcutKeyboard(options: BuildHelpKeyboardOptions): QqKeyboardContent {
  const zh = options.locale !== 'en';
  const enter = options.enter;

  const rowA = zh
    ? [
        { id: 'h-ws', label: '世界状态', command: '世界状态' },
        { id: 'h-fissures', label: '裂隙', command: '裂隙' },
        { id: 'h-invasions', label: '入侵', command: '入侵' },
        { id: 'h-nightwave', label: '电波', command: '电波' },
      ]
    : [
        { id: 'h-ws', label: 'Worldstate', command: 'worldstate' },
        { id: 'h-fissures', label: 'Fissures', command: 'fissures' },
        { id: 'h-invasions', label: 'Invasions', command: 'invasions' },
        { id: 'h-nightwave', label: 'Nightwave', command: 'nightwave' },
      ];

  const rowB = zh
    ? [
        { id: 'h-baro', label: '虚空商人', command: '虚空商人' },
        { id: 'h-varzia', label: '瓦奇娅', command: '瓦奇娅' },
        { id: 'h-tenet', label: '信条', command: '信条' },
        { id: 'h-coda', label: '终幕', command: '终幕' },
      ]
    : [
        { id: 'h-baro', label: 'Baro', command: 'baro' },
        { id: 'h-varzia', label: 'Varzia', command: 'varzia' },
        { id: 'h-tenet', label: 'Tenet', command: 'tenet' },
        { id: 'h-coda', label: 'Coda', command: 'coda' },
      ];

  const toBtn = (item: { id: string; label: string; command: string }) =>
    commandKeyboardButton({
      id: item.id,
      label: item.label,
      command: item.command,
      enter,
      reply: false,
      style: 1,
    });

  return {
    botAppId: options.botAppId,
    rows: [{ buttons: rowA.map(toBtn) }, { buttons: rowB.map(toBtn) }],
  };
}
