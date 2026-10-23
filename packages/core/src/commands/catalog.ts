import type { LocalizedName } from '../dto/worldstate.js';
import type { HelpDto, HelpLine } from '../dto/help.js';
import type { ModuleId } from '../modules.js';

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
  /** 稳定 id，与 ModuleId 对齐 */
  id: ModuleId;
  /** 帮助页主展示命令（含前导 `/`） */
  command: string;
  /** 可触发的根词（书写时省略前导 `/`；英文别名小写） */
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
      zh: '查看开放世界周期（地球 / 平原 / 魔胎 / 山谷 / 双衍 / 扎里曼）',
      en: 'Open-world cycles (Earth / Cetus / Cambion / Vallis / Duviri / Zariman)',
    },
    usage: {
      zh: '/世界状态',
      en: '/worldstate',
    },
    params: [],
    examples: ['/世界状态', '/worldstate', '/ws'],
  },
  {
    id: 'fissures',
    command: '/虚空裂隙',
    roots: ['虚空裂隙', '裂隙', 'fissures', 'fissure'],
    summary: {
      zh: '查看虚空裂隙；可按纪元 / 任务类型 / 普通·钢铁·九重天筛选',
      en: 'Void Fissures; filter by era, mission type, and path',
    },
    usage: {
      zh: '/虚空裂隙 [纪元] [任务] [普通|钢铁|九重天]',
      en: '/fissures [era] [mission] [normal|steel|empyrean]',
    },
    params: [
      {
        name: 'era',
        required: false,
        description: {
          zh: '遗物纪元：古纪/前纪/中纪/后纪/安魂/全能（可多选）',
          en: 'Relic era: lith/meso/neo/axi/requiem/omnia',
        },
        choices: ['古纪', '前纪', '中纪', '后纪', '安魂', '全能'],
      },
      {
        name: 'mission',
        required: false,
        description: {
          zh: '任务类型短名，如 生存 / 歼灭 / 间谍',
          en: 'Mission type, e.g. survival / exterminate / spy',
        },
      },
      {
        name: 'path',
        required: false,
        description: {
          zh: '路径档：普通 / 钢铁之路 / 九重天',
          en: 'Path: normal / steel path / empyrean',
        },
        choices: ['普通', '钢铁之路', '九重天'],
      },
    ],
    examples: [
      '/虚空裂隙',
      '/裂隙 古纪',
      '/裂隙 钢铁之路',
      '/裂隙 生存',
      '/裂隙 古纪 钢铁',
      '/fissures lith steel',
    ],
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
    command: '/午夜电波',
    roots: ['午夜电波', '电波', '夜浪', 'nightwave', 'nw'],
    summary: {
      zh: '查看午夜电波赛季挑战',
      en: 'Show Nightwave season challenges',
    },
    usage: {
      zh: '/午夜电波',
      en: '/nightwave',
    },
    params: [],
    examples: ['/午夜电波', '/电波', '/nightwave', '/nw'],
  },
  {
    id: 'sortie',
    command: '/突击',
    roots: ['突击', 'sortie'],
    summary: {
      zh: '查看每日突击 Boss 与任务链',
      en: 'Daily Sortie boss and mission chain',
    },
    usage: { zh: '/突击', en: '/sortie' },
    params: [],
    examples: ['/突击', '/sortie'],
  },
  {
    id: 'archon',
    command: '/执行官',
    roots: ['执行官', 'archon', 'archonhunt'],
    summary: {
      zh: '查看执行官狩猎（Archon Hunt）',
      en: 'Archon Hunt missions',
    },
    usage: { zh: '/执行官', en: '/archon' },
    params: [],
    examples: ['/执行官', '/archon'],
  },
  {
    id: 'circuit',
    command: '/回廊',
    roots: ['回廊', 'circuit'],
    summary: {
      zh: '查看回廊 / Circuit 本周可选奖励',
      en: 'The Circuit weekly reward choices',
    },
    usage: { zh: '/回廊', en: '/circuit' },
    params: [],
    examples: ['/回廊', '/circuit'],
  },
  {
    id: 'bounties',
    command: '/赏金',
    roots: ['赏金', 'bounty', 'bounties'],
    summary: {
      zh: '查看开放世界赏金（平原 / 金星 / 火卫二等）',
      en: 'Open-world syndicate bounties',
    },
    usage: {
      zh: '/赏金 [地图]',
      en: '/bounties [map]',
    },
    params: [
      {
        name: 'map',
        required: false,
        description: {
          zh: '可选地图：平原 / 金星 / 火卫二 等',
          en: 'Optional map filter: Cetus / Vallis / Deimos',
        },
      },
    ],
    examples: ['/赏金', '/赏金 平原', '/bounties'],
  },
  {
    id: 'arbitration',
    command: '/仲裁',
    roots: ['仲裁', 'arbitration', 'arb'],
    summary: {
      zh: '查看当前仲裁节点（社区源，经 Lanius 封装）',
      en: 'Current Arbitration (community source via Lanius)',
    },
    usage: { zh: '/仲裁', en: '/arbitration' },
    params: [],
    examples: ['/仲裁', '/arbitration', '/arb'],
  },
  {
    id: 'alerts',
    command: '/警报',
    roots: ['警报', 'alerts', 'alert'],
    summary: {
      zh: '查看当前警报（独立模块；无则空态）',
      en: 'Active alerts (standalone; empty state when none)',
    },
    usage: { zh: '/警报', en: '/alerts' },
    params: [],
    examples: ['/警报', '/alerts'],
  },
  {
    id: 'archimedea',
    command: '/科研',
    roots: ['科研', '精英科研', '时光科研', 'archimedea', 'deeparchimedea'],
    summary: {
      zh: '查看精英科研与时光科研（独立于警报）',
      en: 'Deep / Temporal Archimedea (separate from alerts)',
    },
    usage: {
      zh: '/科研 | /精英科研 | /时光科研',
      en: '/archimedea | /精英科研 | /时光科研',
    },
    params: [],
    examples: ['/科研', '/精英科研', '/时光科研', '/archimedea'],
  },
  {
    id: 'voidTrader',
    command: '/虚空商人',
    roots: ['虚空商人', '奸商', 'baro', 'voidtrader'],
    summary: {
      zh: '查看虚空商人（Baro）位置、倒计时与货架',
      en: 'Void Trader (Baro) location, timer, and inventory',
    },
    usage: { zh: '/虚空商人', en: '/baro' },
    params: [],
    examples: ['/虚空商人', '/奸商', '/baro'],
  },
  {
    id: 'varzia',
    command: '/瓦奇娅',
    roots: ['瓦奇娅', 'varzia', 'primevault'],
    summary: {
      zh: '查看瓦奇娅当前金满仓货架',
      en: 'Varzia Prime Vault trader inventory',
    },
    usage: { zh: '/瓦奇娅', en: '/varzia' },
    params: [],
    examples: ['/瓦奇娅', '/varzia'],
  },
  {
    id: 'tenetRotation',
    command: '/信条轮换',
    roots: ['信条轮换', '信条', 'tenet'],
    summary: {
      zh: '查看信条武器轮换（可订阅推送并设频率）',
      en: 'Tenet weapon rotation (subscribable)',
    },
    usage: { zh: '/信条轮换', en: '/tenet' },
    params: [],
    examples: ['/信条轮换', '/tenet'],
  },
  {
    id: 'codaRotation',
    command: '/终幕轮换',
    roots: ['终幕轮换', '终幕', 'coda'],
    summary: {
      zh: '查看终幕武器轮换（可订阅推送并设频率）',
      en: 'Coda weapon rotation (subscribable)',
    },
    usage: { zh: '/终幕轮换', en: '/coda' },
    params: [],
    examples: ['/终幕轮换', '/coda'],
  },
  {
    id: 'subscribe',
    command: '/订阅',
    roots: ['订阅', 'subscribe', 'sub'],
    summary: {
      zh: '订阅/退订模块推送（裂隙、商人、轮换等）',
      en: 'Subscribe/unsubscribe module push alerts',
    },
    usage: {
      zh: '/订阅 [列表|退订] <模块> [变更时|每小时|每天|每周]',
      en: '/subscribe [list|off] <module> [on_change|hourly|daily|weekly]',
    },
    params: [
      {
        name: 'action',
        required: false,
        description: {
          zh: '`列表` 查看；`退订` 取消；省略则订阅',
          en: '`list` / `off`; omit to subscribe',
        },
        choices: ['列表', '退订', 'list', 'off'],
      },
      {
        name: 'module',
        required: false,
        description: {
          zh: '模块：裂隙/虚空商人/瓦奇娅/信条/终幕',
          en: 'fissures / voidTrader / varzia / tenet / coda',
        },
      },
      {
        name: 'frequency',
        required: false,
        description: {
          zh: '提醒频率（轮换类推荐每天/每周）',
          en: 'Push frequency for rotations',
        },
        choices: ['变更时', '每小时', '每天', '每周', 'on_change', 'hourly', 'daily', 'weekly'],
      },
    ],
    examples: ['/订阅 列表', '/订阅 裂隙', '/订阅 信条 每天', '/订阅 退订 终幕'],
  },
  {
    id: 'market',
    command: '/wm',
    roots: ['wm', '市场', 'market'],
    summary: {
      zh: '锁定一件 WM 物品的在线/游戏中卖单（价升序，每页 10；点私聊N 插入 /w）',
      en: 'Lock one WM item; online/ingame sell orders (price↑, 10/page; W# inserts /w)',
    },
    usage: {
      zh: '/wm <物品名> [等级=N] [p=页码] [私聊=N]',
      en: '/wm <item> [rank=N] [p=page] [whisper=N]',
    },
    params: [
      {
        name: 'query',
        required: true,
        description: {
          zh: '物品中英文名或 slug（WFM zh-hans/英文索引；多命中取评分最高一件）',
          en: 'Item name (WFM zh-hans/en) or slug; best single match (sets preferred)',
        },
      },
      {
        name: '等级 / rank',
        required: false,
        description: {
          zh: '模组等级过滤，如 等级=5',
          en: 'Optional mod rank filter, e.g. rank=5',
        },
      },
      {
        name: 'p / 页',
        required: false,
        description: {
          zh: '页码（从 1；可用翻页按钮重放）',
          en: 'Page number (from 1; keyboard replays filters)',
        },
      },
      {
        name: '私聊 / whisper',
        required: false,
        description: {
          zh: '本页卖单序号（回退）；优先点消息内「私聊N」标签，直接插入输入框且不带 @',
          en: 'Order index fallback; prefer in-message W# chips that insert /w without @bot',
        },
      },
    ],
    examples: [
      '/wm 红晶',
      '/wm 拉特昂',
      '/wm Nova Prime 一套',
      '/wm 持续力 等级=10',
      '/wm 拉特昂 私聊=1',
    ],
  },
  {
    id: 'riven',
    command: '/zk',
    roots: ['zk', '紫卡', 'riven'],
    summary: {
      zh: '锁定一件武器的在线/游戏中紫卡拍卖（价升序，每页 10；点私聊N 插入 /w）',
      en: 'Lock one weapon; online/ingame riven auctions (price↑, 10/page; W# inserts /w)',
    },
    usage: {
      zh: '/zk <武器名> [等级=N] [段位=N] [循环=N] [p=页码] [私聊=N]',
      en: '/zk <weapon> [rank=N] [mastery=N] [rerolls=N] [p=page] [whisper=N]',
    },
    params: [
      {
        name: 'query',
        required: true,
        description: {
          zh: '武器中英文名或 url_name（WFM 官方译名，如「拉特昂」）',
          en: 'Weapon name (WFM zh-hans/en) or url_name; best single match',
        },
      },
      {
        name: '等级 / rank',
        required: false,
        description: {
          zh: '紫卡等级过滤',
          en: 'Riven mod rank filter',
        },
      },
      {
        name: '段位 / mastery',
        required: false,
        description: {
          zh: '段位需求过滤',
          en: 'Mastery rank filter',
        },
      },
      {
        name: '循环 / rerolls',
        required: false,
        description: {
          zh: '循环次数（精确）；或 minRerolls / maxRerolls',
          en: 'Exact rerolls; or minRerolls / maxRerolls',
        },
      },
      {
        name: 'p / 页',
        required: false,
        description: {
          zh: '页码（从 1；可用翻页按钮重放）',
          en: 'Page number (from 1; keyboard replays filters)',
        },
      },
      {
        name: '私聊 / whisper',
        required: false,
        description: {
          zh: '本页拍卖序号（回退）；优先点消息内「私聊N」标签插入 /w（不带 @）',
          en: 'Auction index fallback; prefer in-message W# chips (insert /w, no @bot)',
        },
      },
    ],
    examples: [
      '/zk 拉特昂',
      '/zk latron 等级=0 段位=8',
      '/zk 拉特昂 循环=2 p=2',
      '/zk 拉特昂 私聊=1',
    ],
  },
  {
    id: 'help',
    command: '/帮助',
    roots: ['帮助', 'help'],
    summary: {
      zh: '显示指令帮助（可指定模块详解）',
      en: 'Show command help (optional module detail)',
    },
    usage: {
      zh: '/帮助 [模块id|根命令]',
      en: '/help [module id|root]',
    },
    params: [
      {
        name: 'module',
        required: false,
        description: {
          zh: '模块 id 或根命令，如 `zk`、`wm`、`世界状态`；省略则总览',
          en: 'Module id or root, e.g. `zk`, `wm`; omit for overview',
        },
      },
    ],
    examples: ['/帮助', '/help', '/help zk', '/帮助 wm'],
  },
] as const;

/**
 * 将指令目录转换为 `GET /v1/help` 载荷。
 *
 * @param options - 可选过滤：仅保留指定模块，或排除 disabled id
 * @returns 供客户端展示的帮助 DTO
 */
export function buildHelpDto(options?: {
  moduleId?: ModuleId;
  enabledIds?: ReadonlySet<string>;
}): HelpDto {
  let catalog = [...LANIUS_COMMAND_CATALOG];
  if (options?.enabledIds) {
    catalog = catalog.filter((entry) => options.enabledIds!.has(entry.id));
  }
  if (options?.moduleId) {
    catalog = catalog.filter((entry) => entry.id === options.moduleId);
  }

  const lines: HelpLine[] = catalog.map((entry) => ({
    id: entry.id,
    command: entry.command,
    aliases: entry.roots.filter((root) => `/${root}` !== entry.command).map((root) => `/${root}`),
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

  if (options?.moduleId && lines[0]) {
    return {
      title: {
        zh: `帮助 · ${lines[0].command}`,
        en: `Help · ${lines[0].command}`,
      },
      intro: lines[0].summary,
      lines,
    };
  }

  return {
    title: {
      zh: 'Lanius 指令帮助',
      en: 'Lanius command help',
    },
    intro: {
      zh: '每条指令为独立根命令（可带前导 `/`）。发送 `/帮助 zk` 可查看指定模块详解。',
      en: 'Each command is its own root. Send `/help zk` for a module detail card.',
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

/**
 * 将用户输入的模块 token 解析为 ModuleId。
 *
 * @param token - 模块 id、根命令或别名
 * @returns ModuleId 或 undefined
 */
export function resolveModuleToken(token: string): ModuleId | undefined {
  const key = token.trim().replace(/^\/+/, '').toLowerCase();
  if (!key) {
    return undefined;
  }
  const byId = LANIUS_COMMAND_CATALOG.find((entry) => entry.id === key);
  if (byId) {
    return byId.id;
  }
  return findCommandByRoot(key)?.id;
}
