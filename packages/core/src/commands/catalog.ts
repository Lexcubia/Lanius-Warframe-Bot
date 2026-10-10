import type { LocalizedName } from '../dto/worldstate.js';
import type { HelpDto, HelpLine } from '../dto/help.js';

/**
 * 帮助条目中的参数说明。
 */
export type CommandParamDef = {
  /** 参数名（展示用，如 `mode`） */
  name: string;
  /** 是否必填 */
  required: boolean;
  /** 参数含义 */
  description: LocalizedName;
  /** 可选取值列表（展示用） */
  choices?: string[];
};

/**
 * 单条 QQ / 帮助目录中的指令定义（每条指令独立根，无总前缀）。
 */
export type CommandDef = {
  /** 稳定 id，供解析与测试使用 */
  id: 'worldstate' | 'invasions' | 'nightwave' | 'mode' | 'help';
  /** 帮助页主展示命令（含前导 `/`） */
  command: string;
  /** 可触发的根词（不含 `/`，大小写不敏感的英文别名小写书写） */
  roots: readonly string[];
  /** 一句话摘要 */
  summary: LocalizedName;
  /** 用法行 */
  usage: LocalizedName;
  /** 参数说明（可空） */
  params: readonly CommandParamDef[];
  /** 示例调用 */
  examples: readonly string[];
};

/**
 * Lanius Bot 指令目录：每条指令独立根命令，统一供 API 帮助 / Bot 解析 / Web 帮助页使用。
 */
export const LANIUS_COMMAND_CATALOG: readonly CommandDef[] = [
  {
    id: 'worldstate',
    command: '/世界状态',
    roots: ['世界状态', 'worldstate', 'ws'],
    summary: {
      zh: '查看国际服世界状态（入侵 + 夜浪）',
      en: 'International world state (invasions + Nightwave)',
    },
    usage: {
      zh: '/世界状态',
      en: '/worldstate',
    },
    params: [],
    examples: ['/世界状态', '/worldstate', '/ws'],
  },
  {
    id: 'invasions',
    command: '/入侵',
    roots: ['入侵', 'invasions', 'invasion'],
    summary: {
      zh: '查看当前活跃入侵进度与阵营',
      en: 'List active invasions and progress',
    },
    usage: {
      zh: '/入侵',
      en: '/invasions',
    },
    params: [],
    examples: ['/入侵', '/invasions'],
  },
  {
    id: 'nightwave',
    command: '/夜浪',
    roots: ['夜浪', 'nightwave', 'nw'],
    summary: {
      zh: '查看夜浪赛季挑战',
      en: 'Show Nightwave season challenges',
    },
    usage: {
      zh: '/夜浪',
      en: '/nightwave',
    },
    params: [],
    examples: ['/夜浪', '/nightwave', '/nw'],
  },
  {
    id: 'mode',
    command: '/模式',
    roots: ['模式', 'mode'],
    summary: {
      zh: '切换本会话 QQ 回复模式',
      en: 'Switch QQ reply mode for this session',
    },
    usage: {
      zh: '/模式 <文本|图片>',
      en: '/mode <text|image>',
    },
    params: [
      {
        name: 'mode',
        required: true,
        description: {
          zh: '回复形态：`文本` 纯文字，`图片` 优先发卡片图（失败降级文本）',
          en: 'Reply shape: `text` for plain text, `image` for card PNG (falls back to text)',
        },
        choices: ['文本', '图片', 'text', 'image'],
      },
    ],
    examples: ['/模式 文本', '/模式 图片', '/mode text', '/mode image'],
  },
  {
    id: 'help',
    command: '/帮助',
    roots: ['帮助', 'help'],
    summary: {
      zh: '显示全部指令、用法与参数说明',
      en: 'List all commands, usage, and parameters',
    },
    usage: {
      zh: '/帮助',
      en: '/help',
    },
    params: [],
    examples: ['/帮助', '/help'],
  },
] as const;

/**
 * 将指令目录转换为 `GET /v1/help` 载荷。
 *
 * @returns 供客户端展示的帮助 DTO
 */
export function buildHelpDto(): HelpDto {
  const lines: HelpLine[] = LANIUS_COMMAND_CATALOG.map((entry) => ({
    id: entry.id,
    command: entry.command,
    aliases: entry.roots
      .filter((root) => `/${root}` !== entry.command)
      .map((root) => `/${root}`),
    summary: entry.summary,
    usage: entry.usage,
    params: entry.params.map((param) => ({
      name: param.name,
      required: param.required,
      description: param.description,
      choices: param.choices,
    })),
    examples: [...entry.examples],
  }));

  return {
    title: {
      zh: 'Lanius 指令帮助',
      en: 'Lanius command help',
    },
    intro: {
      zh: '每条指令为独立根命令（可带前导 `/`）。在 QQ 中直接发送根命令即可，无需总前缀。',
      en: 'Each command is its own root (optional leading `/`). Send the root in QQ — no global prefix.',
    },
    lines,
  };
}

/**
 * 按根词（已去掉前导 `/`）查找指令定义。
 *
 * @param root - 消息首词（英文建议小写）
 * @returns 匹配的指令，或 `undefined`
 */
export function findCommandByRoot(root: string): CommandDef | undefined {
  const key = root.trim().toLowerCase();
  if (!key) {
    return undefined;
  }
  return LANIUS_COMMAND_CATALOG.find((entry) =>
    entry.roots.some((candidate) => candidate.toLowerCase() === key),
  );
}
