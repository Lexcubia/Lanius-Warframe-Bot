import { SubscribableModuleIdSchema, type ModuleId } from '@lanius/core';
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
 * 单颗快捷按钮描述（标签与根命令）。
 */
type HelpShortcut = {
  /** 按钮稳定 id */
  id: string;
  /** 按钮展示文案 */
  label: string;
  /** 写入输入框/直发的根命令（无前导 `/`） */
  command: string;
};

/**
 * Wave0–3 已在固定行覆盖的 ModuleId（含交易/轮换）。
 * Wave4 若把更多 id 写入 `SubscribableModuleIdSchema`，且不在本集合，则追加「订阅类」快捷行。
 */
const COVERED_BY_STATIC_ROWS = new Set<ModuleId>([
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'sortie',
  'archon',
  'circuit',
  'bounties',
  'arbitration',
  'alerts',
  'archimedea',
  'timers',
  'dailyDeals',
  'news',
  'incarnon',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'ducats',
  'relic',
  'wiki',
  'translate',
  'valence',
  'subscribe',
  'help',
]);

/**
 * 可订阅 ModuleId → 帮助键盘中英按钮（仅用于 Wave4 增量行）。
 */
const SUBSCRIBE_SHORTCUT_META: Partial<Record<ModuleId, { zh: HelpShortcut; en: HelpShortcut }>> = {
  worldstate: {
    zh: { id: 'h-sub-ws', label: '世界状态', command: '世界状态' },
    en: { id: 'h-sub-ws', label: 'Worldstate', command: 'worldstate' },
  },
  sortie: {
    zh: { id: 'h-sub-sortie', label: '突击', command: '突击' },
    en: { id: 'h-sub-sortie', label: 'Sortie', command: 'sortie' },
  },
  archon: {
    zh: { id: 'h-sub-archon', label: '执行官', command: '执行官' },
    en: { id: 'h-sub-archon', label: 'Archon', command: 'archon' },
  },
  arbitration: {
    zh: { id: 'h-sub-arb', label: '仲裁', command: '仲裁' },
    en: { id: 'h-sub-arb', label: 'Arbitration', command: 'arbitration' },
  },
  alerts: {
    zh: { id: 'h-sub-alerts', label: '警报', command: '警报' },
    en: { id: 'h-sub-alerts', label: 'Alerts', command: 'alerts' },
  },
  invasions: {
    zh: { id: 'h-sub-inv', label: '入侵', command: '入侵' },
    en: { id: 'h-sub-inv', label: 'Invasions', command: 'invasions' },
  },
  nightwave: {
    zh: { id: 'h-sub-nw', label: '电波', command: '电波' },
    en: { id: 'h-sub-nw', label: 'Nightwave', command: 'nightwave' },
  },
  bounties: {
    zh: { id: 'h-sub-bounty', label: '赏金', command: '赏金' },
    en: { id: 'h-sub-bounty', label: 'Bounties', command: 'bounties' },
  },
  news: {
    zh: { id: 'h-sub-news', label: '新闻', command: '新闻' },
    en: { id: 'h-sub-news', label: 'News', command: 'news' },
  },
  dailyDeals: {
    zh: { id: 'h-sub-darvo', label: '达沃', command: '达沃' },
    en: { id: 'h-sub-darvo', label: 'Darvo', command: 'darvo' },
  },
  events: {
    zh: { id: 'h-sub-events', label: '活动', command: '活动' },
    en: { id: 'h-sub-events', label: 'Events', command: 'events' },
  },
  calendar1999: {
    zh: { id: 'h-sub-cal', label: '日历', command: '日历' },
    en: { id: 'h-sub-cal', label: 'Calendar', command: 'calendar' },
  },
  incarnon: {
    zh: { id: 'h-sub-inc', label: '灵化', command: '灵化' },
    en: { id: 'h-sub-inc', label: 'Incarnon', command: 'incarnon' },
  },
  steelPath: {
    zh: { id: 'h-sub-steel', label: '钢铁', command: '钢铁之路' },
    en: { id: 'h-sub-steel', label: 'Steel', command: 'steelpath' },
  },
  sliverShop: {
    zh: { id: 'h-sub-sliver', label: '碎银', command: '碎银' },
    en: { id: 'h-sub-sliver', label: 'Sliver', command: 'sliver' },
  },
  incursions: {
    zh: { id: 'h-sub-incur', label: '侵袭', command: '侵袭' },
    en: { id: 'h-sub-incur', label: 'Incursions', command: 'incursions' },
  },
};

/**
 * 将快捷描述转为 QQ keyboard 按钮。
 *
 * @param item - 按钮 id / 标签 / 命令
 * @param enter - 是否点击直发
 * @returns QQ 按钮
 */
function toBtn(item: HelpShortcut, enter: boolean): ReturnType<typeof commandKeyboardButton> {
  return commandKeyboardButton({
    id: item.id,
    label: item.label,
    command: item.command,
    enter,
    reply: false,
    style: 1,
  });
}

/**
 * 按每行最多 4 颗切分按钮行（避免单行过挤）。
 *
 * @param items - 快捷列表
 * @param enter - 是否直发
 * @returns keyboard rows
 */
function chunkRows(
  items: readonly HelpShortcut[],
  enter: boolean,
): Array<{ buttons: ReturnType<typeof commandKeyboardButton>[] }> {
  const rows: Array<{ buttons: ReturnType<typeof commandKeyboardButton>[] }> = [];
  for (let i = 0; i < items.length; i += 4) {
    rows.push({ buttons: items.slice(i, i + 4).map((item) => toBtn(item, enter)) });
  }
  return rows;
}

/**
 * Wave4 合入后：对已开放订阅、但静态行未覆盖的 ModuleId 追加快捷。
 *
 * @param zh - 是否中文标签
 * @returns 增量快捷（可能为空）
 */
function wave4SubscribeExtras(zh: boolean): HelpShortcut[] {
  const extras: HelpShortcut[] = [];
  for (const moduleId of SubscribableModuleIdSchema.options) {
    if (COVERED_BY_STATIC_ROWS.has(moduleId)) {
      continue;
    }
    const meta = SUBSCRIBE_SHORTCUT_META[moduleId];
    if (!meta) {
      continue;
    }
    extras.push(zh ? meta.zh : meta.en);
  }
  return extras;
}

/**
 * 构造帮助回复底部的常用查询快捷键盘（Wave0–3 固定行 + Wave4 订阅增量）。
 *
 * @param options - 语言、enter 与 AppID
 * @returns QQ keyboard content
 */
export function buildHelpShortcutKeyboard(options: BuildHelpKeyboardOptions): QqKeyboardContent {
  const zh = options.locale !== 'en';
  const enter = options.enter;

  /** 周期 / 裂隙 / 入侵 / 电波 */
  const rowCycles: HelpShortcut[] = zh
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

  /** Wave 任务链：突击 / 执行官 / 回廊 / 仲裁 */
  const rowMissions: HelpShortcut[] = zh
    ? [
        { id: 'h-sortie', label: '突击', command: '突击' },
        { id: 'h-archon', label: '执行官', command: '执行官' },
        { id: 'h-circuit', label: '回廊', command: '回廊' },
        { id: 'h-arb', label: '仲裁', command: '仲裁' },
      ]
    : [
        { id: 'h-sortie', label: 'Sortie', command: 'sortie' },
        { id: 'h-archon', label: 'Archon', command: 'archon' },
        { id: 'h-circuit', label: 'Circuit', command: 'circuit' },
        { id: 'h-arb', label: 'Arbitration', command: 'arbitration' },
      ];

  /** Wave1 日常高频：时效 / 达沃 / 赏金 / 灵化 */
  const rowDaily: HelpShortcut[] = zh
    ? [
        { id: 'h-timers', label: '时效', command: '时效' },
        { id: 'h-darvo', label: '达沃', command: '达沃' },
        { id: 'h-bounties', label: '赏金', command: '赏金' },
        { id: 'h-incarnon', label: '灵化', command: '灵化' },
      ]
    : [
        { id: 'h-timers', label: 'Timers', command: 'timers' },
        { id: 'h-darvo', label: 'Darvo', command: 'darvo' },
        { id: 'h-bounties', label: 'Bounties', command: 'bounties' },
        { id: 'h-incarnon', label: 'Incarnon', command: 'incarnon' },
      ];

  /** 商人与轮换 */
  const rowTraders: HelpShortcut[] = zh
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

  /** Wave2–3 工具：杜卡德 / 遗物 / wiki / 翻译；次行融合 / 警报 / 订阅 / 新闻 */
  const rowTools: HelpShortcut[] = zh
    ? [
        { id: 'h-ducats', label: '金垃圾', command: '金垃圾' },
        { id: 'h-relic', label: '遗物', command: '遗物' },
        { id: 'h-wiki', label: 'wiki', command: 'wiki' },
        { id: 'h-tr', label: '翻译', command: '翻译' },
      ]
    : [
        { id: 'h-ducats', label: 'Ducats', command: 'ducats' },
        { id: 'h-relic', label: 'Relic', command: 'relic' },
        { id: 'h-wiki', label: 'Wiki', command: 'wiki' },
        { id: 'h-tr', label: 'Translate', command: 'translate' },
      ];

  const rowMore: HelpShortcut[] = zh
    ? [
        { id: 'h-valence', label: '融合', command: '武器融合' },
        { id: 'h-alerts', label: '警报', command: '警报' },
        { id: 'h-news', label: '新闻', command: '新闻' },
        { id: 'h-sub', label: '订阅', command: '订阅 列表' },
      ]
    : [
        { id: 'h-valence', label: 'Valence', command: 'valence' },
        { id: 'h-alerts', label: 'Alerts', command: 'alerts' },
        { id: 'h-news', label: 'News', command: 'news' },
        { id: 'h-sub', label: 'Subscribe', command: 'subscribe list' },
      ];

  const staticRows = [rowCycles, rowMissions, rowDaily, rowTraders, rowTools, rowMore].map(
    (row) => ({ buttons: row.map((item) => toBtn(item, enter)) }),
  );

  const extras = wave4SubscribeExtras(zh);
  const extraRows = chunkRows(extras, enter);

  return {
    botAppId: options.botAppId,
    rows: [...staticRows, ...extraRows],
  };
}
