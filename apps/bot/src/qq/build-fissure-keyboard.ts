import type { QqKeyboardContent } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

/**
 * 裂隙 Markdown 快捷按钮的构建选项。
 */
export type BuildFissureKeyboardOptions = {
  /** 界面语言（影响按钮标签与指令词） */
  locale: 'zh' | 'en';
  /**
   * 是否点击后直接发送。
   * 官方文档：`enter` 在单聊更可靠；群聊常仅插入输入框。
   */
  enter: boolean;
  /** 机器人 AppID（写入 keyboard.bot_appid） */
  botAppId: string;
};

/**
 * 构造虚空裂隙回复底部的快捷筛选键盘（路径档 + 纪元）。
 * 按钮为指令型（type=2），点击插入 `/裂隙 …` 等价正文供快速调用。
 *
 * @param options - 语言、enter 与 AppID
 * @returns QQ keyboard content
 */
export function buildFissureShortcutKeyboard(
  options: BuildFissureKeyboardOptions,
): QqKeyboardContent {
  const zh = options.locale !== 'en';
  const enter = options.enter;
  const root = zh ? '裂隙' : 'fissures';

  const pathRow = zh
    ? [
        { id: 'f-all', label: '全部', command: root },
        { id: 'f-normal', label: '普通', command: `${root} 普通` },
        { id: 'f-steel', label: '钢铁', command: `${root} 钢铁` },
        { id: 'f-emp', label: '九重天', command: `${root} 九重天` },
      ]
    : [
        { id: 'f-all', label: 'All', command: root },
        { id: 'f-normal', label: 'Normal', command: `${root} normal` },
        { id: 'f-steel', label: 'Steel', command: `${root} steel` },
        { id: 'f-emp', label: 'Empyrean', command: `${root} empyrean` },
      ];

  const eraRowA = zh
    ? [
        { id: 'f-lith', label: '古纪', command: `${root} 古纪` },
        { id: 'f-meso', label: '前纪', command: `${root} 前纪` },
        { id: 'f-neo', label: '中纪', command: `${root} 中纪` },
        { id: 'f-axi', label: '后纪', command: `${root} 后纪` },
        { id: 'f-req', label: '安魂', command: `${root} 安魂` },
      ]
    : [
        { id: 'f-lith', label: 'Lith', command: `${root} lith` },
        { id: 'f-meso', label: 'Meso', command: `${root} meso` },
        { id: 'f-neo', label: 'Neo', command: `${root} neo` },
        { id: 'f-axi', label: 'Axi', command: `${root} axi` },
        { id: 'f-req', label: 'Requiem', command: `${root} requiem` },
      ];

  const eraRowB = zh
    ? [{ id: 'f-omnia', label: '全能', command: `${root} 全能` }]
    : [{ id: 'f-omnia', label: 'Omnia', command: `${root} omnia` }];

  /**
   * 将简表项转为指令按钮。
   *
   * @param item - id/label/command
   * @returns keyboard 按钮
   */
  const toBtn = (item: {
    id: string;
    label: string;
    command: string;
  }) =>
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
    rows: [
      { buttons: pathRow.map(toBtn) },
      { buttons: eraRowA.map(toBtn) },
      { buttons: eraRowB.map(toBtn) },
    ],
  };
}

/**
 * 裂隙图片回复后附带的短 Markdown 提示（按钮挂载所需正文）。
 *
 * @param locale - 语言
 * @returns Markdown content
 */
export function fissureShortcutMarkdownHint(locale: 'zh' | 'en'): string {
  return locale === 'en'
    ? '**Fissure filters** — tap a button to run a quick command'
    : '**裂隙快捷筛选** — 点按钮快速调用指令';
}
