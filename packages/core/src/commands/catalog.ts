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
 *
 * Wave2 预留 ModuleId（relic / 紫卡分析等）刻意**不**出现在本目录，
 * 避免无 handler 的空指令；见 `RESERVED_MODULE_IDS`（`packages/core/src/modules.ts`）。
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
    roots: [
      '科研',
      '精英科研',
      '时光科研',
      'archimedea',
      'deeparchimedea',
      'temporalarchimedea',
      'deep',
      'temporal',
      'hex',
    ],
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
    roots: ['zk', '紫卡', 'riven', 'rm', 'wmr', 'wr'],
    summary: {
      zh: '锁定一件武器的在线/游戏中紫卡拍卖（价升序；点私聊N 插入 /w）。rm/rivens.market 已停服，改走 WFM',
      en: 'Lock one weapon; online/ingame riven auctions. rm/rivens.market is offline → WFM',
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
      '/rm 绝路',
    ],
  },
  {
    id: 'timers',
    command: '/时效',
    roots: ['时效', '周报', 'timers'],
    summary: { zh: '查看开放世界与日常时效总览', en: 'Open-world and daily timers overview' },
    usage: { zh: '/时效', en: '/timers' },
    params: [],
    examples: ['/时效', '/周报', '/timers'],
  },
  {
    id: 'dailyDeals',
    command: '/达沃',
    roots: ['达沃', '每日特惠', 'dailydeals', 'darvo'],
    summary: { zh: '查看达沃每日特惠', en: "Darvo's Daily Deals" },
    usage: { zh: '/达沃', en: '/darvo' },
    params: [],
    examples: ['/达沃', '/每日特惠', '/darvo'],
  },
  {
    id: 'news',
    command: '/新闻',
    roots: ['新闻', '最近新闻', '最近更新', 'news'],
    summary: { zh: '查看官方新闻与热修公告', en: 'Official news and hotfixes' },
    usage: { zh: '/新闻', en: '/news' },
    params: [],
    examples: ['/新闻', '/news'],
  },
  {
    id: 'kuva',
    command: '/赤毒',
    roots: ['赤毒', '血紊', 'kuva'],
    summary: {
      zh: '赤毒/血紊虹吸（社区源停摆时提示）',
      en: 'Kuva siphons (stalled source notice)',
    },
    usage: { zh: '/赤毒', en: '/kuva' },
    params: [],
    examples: ['/赤毒', '/kuva'],
  },
  {
    id: 'synthTargets',
    command: '/结合目标',
    roots: ['结合目标', '结合仪式', 'synth', 'synthtargets'],
    summary: { zh: '查看希图斯结合仪式目标', en: 'Simaris synthesis targets' },
    usage: { zh: '/结合目标', en: '/synth' },
    params: [],
    examples: ['/结合目标', '/synth'],
  },
  {
    id: 'construction',
    command: '/舰队进度',
    roots: ['舰队进度', '建造进度', 'construction'],
    summary: { zh: '查看巴罗尔/利刃豺狼舰队建造进度', en: 'Fomorian / Razorback construction' },
    usage: { zh: '/舰队进度', en: '/construction' },
    params: [],
    examples: ['/舰队进度', '/construction'],
  },
  {
    id: 'voidStorms',
    command: '/九重天',
    roots: ['九重天', '异变', '虚空风暴', '航道星舰', 'voidstorms'],
    summary: { zh: '查看九重天虚空风暴', en: 'Empyrean void storms' },
    usage: { zh: '/九重天', en: '/voidstorms' },
    params: [],
    examples: ['/九重天', '/虚空风暴', '/voidstorms'],
  },
  {
    id: 'events',
    command: '/活动',
    roots: ['活动', '限时活动', 'events'],
    summary: { zh: '查看限时活动', en: 'Limited-time events' },
    usage: { zh: '/活动', en: '/events' },
    params: [],
    examples: ['/活动', '/events'],
  },
  {
    id: 'conclave',
    command: '/武形秘仪',
    roots: ['武形秘仪', '武形', '秘仪', 'conclave'],
    summary: { zh: '查看武形秘仪挑战', en: 'Conclave challenges' },
    usage: { zh: '/武形秘仪', en: '/conclave' },
    params: [],
    examples: ['/武形秘仪', '/conclave'],
  },
  {
    id: 'clanRewards',
    command: '/氏族奖励',
    roots: ['氏族奖励', '氏族', 'clanrewards'],
    summary: { zh: '查看氏族周奖励加成', en: 'Clan weekly vault bonuses' },
    usage: { zh: '/氏族奖励', en: '/clan' },
    params: [],
    examples: ['/氏族奖励', '/氏族'],
  },
  {
    id: 'flashSales',
    command: '/商城折扣',
    roots: ['商城折扣', '礼包', 'flashsales'],
    summary: { zh: '查看商城闪购礼包', en: 'Market flash sales' },
    usage: { zh: '/商城折扣', en: '/flashsales' },
    params: [],
    examples: ['/商城折扣', '/礼包'],
  },
  {
    id: 'arbTable',
    command: '/仲裁表',
    roots: ['仲裁表', 'arbtable'],
    summary: {
      zh: '查看约 14 日仲裁排期（含评级）',
      en: '~14-day arbitration schedule with tiers',
    },
    usage: { zh: '/仲裁表', en: '/arbtable' },
    params: [],
    examples: ['/仲裁表', '/arbtable'],
  },
  {
    id: 'calendar1999',
    command: '/日历',
    roots: ['日历', '1999日历', 'calendar'],
    summary: { zh: '查看 1999 日历', en: '1999 calendar' },
    usage: { zh: '/日历', en: '/calendar' },
    params: [],
    examples: ['/日历', '/1999日历', '/calendar'],
  },
  {
    id: 'steelPath',
    command: '/钢铁之路',
    roots: ['钢铁之路', '钢精', 'steelpath'],
    summary: { zh: '查看 Teshin 钢铁精华兑换', en: 'Teshin Steel Essence shop' },
    usage: { zh: '/钢铁之路', en: '/steelpath' },
    params: [],
    examples: ['/钢铁之路', '/钢精'],
  },
  {
    id: 'sliverShop',
    command: '/碎银兑换',
    roots: ['碎银兑换', '碎银', 'slivershop'],
    summary: { zh: '查看 Palladino 裂罅碎块商店', en: 'Palladino Riven Sliver shop' },
    usage: { zh: '/碎银兑换', en: '/sliver' },
    params: [],
    examples: ['/碎银兑换', '/碎银'],
  },
  {
    id: 'descendia',
    command: '/沉沦之地',
    roots: ['沉沦之地', '炼狱塔', '炼狱', '沉沦', 'descendia'],
    summary: { zh: '查看沉沦之地本周层数', en: 'Descendia weekly floors' },
    usage: { zh: '/沉沦之地', en: '/descendia' },
    params: [],
    examples: ['/沉沦之地', '/炼狱塔'],
  },
  {
    id: 'incursions',
    command: '/侵袭',
    roots: ['侵袭', '钢路侵袭', '钢铁侵袭', 'incursions'],
    summary: { zh: '查看钢铁之路每日侵袭节点', en: 'Steel Path daily incursions' },
    usage: { zh: '/侵袭', en: '/incursions' },
    params: [],
    examples: ['/侵袭', '/钢路侵袭'],
  },
  {
    id: 'incarnon',
    command: '/灵化',
    roots: ['灵化', '本周灵化', '灵化轮换', 'incarnon'],
    summary: { zh: '查看本周钢铁回廊灵化武器', en: 'Weekly Circuit Incarnon weapons' },
    usage: { zh: '/灵化', en: '/incarnon' },
    params: [],
    examples: ['/灵化', '/本周灵化'],
  },
  {
    id: 'acrithis',
    command: '/言录使',
    roots: ['言录使', 'acrithis', 'acrichis'],
    summary: { zh: '查看言录使周常货架', en: 'Acrithis weekly offerings' },
    usage: { zh: '/言录使', en: '/acrithis' },
    params: [],
    examples: ['/言录使', '/acrithis'],
  },
  {
    id: 'marketTrend',
    command: '/趋势',
    roots: ['趋势', 'wm趋势', '价格趋势', '紫卡趋势', 'trend'],
    summary: {
      zh: '查看物品近 48 小时 / 90 天价格趋势（WFM 成交统计）',
      en: 'Item price trend (48h / 90d WFM closed stats)',
    },
    usage: { zh: '/趋势 <物品名>', en: '/trend <item>' },
    params: [
      {
        name: 'query',
        required: true,
        description: { zh: '物品中英文名或 slug', en: 'Item name or slug' },
      },
    ],
    examples: ['/趋势 膛线', '/trend primed_continuity'],
  },
  {
    id: 'marketRank',
    command: '/排行',
    roots: ['排行', '市场排行', 'rank'],
    summary: {
      zh: '市场成交中位价排行（抽样缓存；可按分类）',
      en: 'Market median-price ranks (sampled cache; by category)',
    },
    usage: { zh: '/排行 [分类] [p=页]', en: '/rank [category] [p=page]' },
    params: [
      {
        name: 'category',
        required: false,
        description: {
          zh: '甲/卡/部件/赋能/主武/副武/近战/遗物',
          en: 'warframe/mod/part/arcane/primary/secondary/melee/relic',
        },
        choices: ['甲', '卡', '部件', '赋能', '主武', '副武', '近战', '遗物'],
      },
      {
        name: 'p / 页',
        required: false,
        description: { zh: '页码', en: 'Page number' },
      },
    ],
    examples: ['/排行', '/排行 部件', '/rank mod p=2'],
  },
  {
    id: 'ducats',
    command: '/金垃圾',
    roots: ['金垃圾', '银垃圾', '铜垃圾', 'ducats', '杜卡德垃圾'],
    summary: {
      zh: '杜卡德/白金垃圾榜（金/银/铜面值）',
      en: 'Ducats-per-platinum junk board (gold/silver/bronze)',
    },
    usage: { zh: '/金垃圾|银垃圾|铜垃圾 [p=页]', en: '/ducats [gold|silver|bronze] [p=page]' },
    params: [
      {
        name: 'tier',
        required: false,
        description: { zh: '档位（根命令已带时可省略）', en: 'Tier' },
        choices: ['金', '银', '铜', 'gold', 'silver', 'bronze'],
      },
    ],
    examples: ['/金垃圾', '/银垃圾 p=2', '/ducats bronze'],
  },
  {
    id: 'rivenAnalysis',
    command: '/紫卡分析',
    roots: ['紫卡分析', 'analysis', '分析紫卡'],
    summary: {
      zh: '紫卡词条卷度分析（文字输入；识图行可选）',
      en: 'Riven roll analysis (text; optional OCR lines)',
    },
    usage: {
      zh: '/紫卡分析 <武器> <+词条 数值…> [-词条 数值…]',
      en: '/analysis <weapon> <+stat value…> [-stat value…]',
    },
    params: [
      {
        name: 'text',
        required: true,
        description: {
          zh: '武器名与词条数值，如「绝路 暴击几率 180 -装填速度 40」',
          en: 'Weapon + stats, e.g. "rubico crit_chance 180 -reload_speed 40"',
        },
      },
    ],
    examples: ['/紫卡分析 绝路 暴击几率 180 暴击伤害 100 -射速 40'],
  },
  {
    id: 'rivenRanges',
    command: '/词条范围',
    roots: ['词条范围', '紫卡范围', '紫卡词条范围', 'ranges'],
    summary: {
      zh: '查看某武器类可 roll 词条数值区间（统一倾向 1.2）',
      en: 'Possible riven stat ranges for a weapon class (D=1.2)',
    },
    usage: { zh: '/词条范围 <武器名|rifle|melee…>', en: '/ranges <weapon|class>' },
    params: [
      {
        name: 'query',
        required: true,
        description: { zh: '武器名或类名', en: 'Weapon name or class' },
      },
    ],
    examples: ['/词条范围 绝路', '/ranges melee'],
  },
  {
    id: 'rivenSplice',
    command: '/紫卡融合',
    roots: ['紫卡融合', '紫卡拼接', '融合词条', '拼接词条', 'splice'],
    summary: {
      zh: 'Riven Splicer 融合配方查询',
      en: 'Riven Splicer recipe lookup',
    },
    usage: { zh: '/紫卡融合 [词条|武器类]', en: '/splice [stat|class]' },
    params: [
      {
        name: 'query',
        required: false,
        description: { zh: '过滤词条或武器类', en: 'Filter by stat or class' },
      },
    ],
    examples: ['/紫卡融合', '/紫卡融合 毒气伤害', '/splice melee'],
  },
  {
    id: 'disposition',
    command: '/倾向',
    roots: ['倾向', '紫卡倾向', 'disposition'],
    summary: {
      zh: '查询武器旧倾向与统一 1.2 缩放',
      en: 'Legacy disposition vs unified 1.2 scale',
    },
    usage: { zh: '/倾向 <武器名>', en: '/disposition <weapon>' },
    params: [
      {
        name: 'query',
        required: true,
        description: { zh: '武器中英文名', en: 'Weapon name' },
      },
    ],
    examples: ['/倾向 绝路', '/disposition rubico'],
  },
  {
    id: 'lichAuctions',
    command: '/玄骸',
    roots: ['玄骸', 'xh', 'lich'],
    summary: {
      zh: '赤毒 / 信条 / 终幕玄骸武器拍卖',
      en: 'Kuva / Tenet / Coda lich auctions',
    },
    usage: { zh: '/玄骸 <武器> [元素] [伤害上限] [p=页]', en: '/xh <weapon> [element] [dmg] [p=page]' },
    params: [
      {
        name: 'query',
        required: true,
        description: { zh: '玄骸武器名', en: 'Lich weapon name' },
      },
    ],
    examples: ['/玄骸 赤毒怒雷', '/xh 信条弧电离子枪 辐射', '/xh kuva_bramma 50'],
  },
  {
    id: 'relic',
    command: '/遗物',
    roots: ['遗物', '核桃', 'relic'],
    summary: {
      zh: '查询遗物奖励表或按纪元列表',
      en: 'Relic rewards or list by era',
    },
    usage: { zh: '/遗物 <遗物名|纪元>', en: '/relic <name|era>' },
    params: [
      {
        name: 'query',
        required: false,
        description: { zh: '遗物名（如 古纪 A1）或纪元；空则帮助', en: 'Relic or era; empty for help' },
      },
    ],
    examples: ['/遗物 古纪 A1', '/遗物 后纪', '/relic axi a2'],
  },
  {
    id: 'parts',
    command: '/部件',
    roots: ['部件', '零件', '组件', 'parts'],
    summary: {
      zh: '按部件名反查所属遗物',
      en: 'Prime part → relic sources',
    },
    usage: { zh: '/部件 <部件名>', en: '/parts <part>' },
    params: [
      {
        name: 'query',
        required: true,
        description: { zh: '部件中文名', en: 'Part name' },
      },
    ],
    examples: ['/部件 Ash Prime 头部神经光元蓝图', '/parts Forma'],
  },
  {
    id: 'openRelic',
    command: '/开核桃',
    roots: ['开核桃', '开裂缝', 'openrelic', 'openRelic'],
    summary: {
      zh: '结合当前裂隙推荐可开遗物纪元',
      en: 'Farm tips from active fissures by relic era',
    },
    usage: { zh: '/开核桃', en: '/openrelic' },
    params: [],
    examples: ['/开核桃', '/openrelic'],
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
  {
    id: 'wiki',
    command: '/wiki',
    roots: ['wiki', 'wk', '维基'],
    summary: {
      zh: '灰机维基深链与短简介（非全文镜像）',
      en: 'Huiji wiki deep-link + short intro (not a full mirror)',
    },
    usage: {
      zh: '/wiki <关键词>',
      en: '/wiki <keyword>',
    },
    params: [
      {
        name: 'q',
        required: true,
        description: {
          zh: '物品 / 玩法关键词（官方中英名优先）',
          en: 'Item or activity keyword (official EN/ZH names)',
        },
      },
    ],
    examples: ['/wiki 夜灵平野', '/wiki Ash', '/维基 仲裁'],
  },
  {
    id: 'translate',
    command: '/翻译',
    roots: ['翻译', 'translate', 'tr'],
    summary: {
      zh: '中英名称对照（DE PublicExport 官方 language 同键对）',
      en: 'EN↔ZH name lookup (DE PublicExport language pairs)',
    },
    usage: {
      zh: '/翻译 <名称>',
      en: '/translate <name>',
    },
    params: [
      {
        name: 'q',
        required: true,
        description: {
          zh: '官方中文或英文名称',
          en: 'Official Chinese or English name',
        },
      },
    ],
    examples: ['/翻译 腐蚀投射', '/translate Corrosive Projection'],
  },
  {
    id: 'valence',
    command: '/武器融合',
    roots: ['武器融合', '融合', 'valence', '效价融合'],
    summary: {
      zh: '玄骸 / 信条 / 终幕效价融合计算',
      en: 'Kuva / Tenet / Coda valence fusion calculator',
    },
    usage: {
      zh: '/武器融合 <元素%> <元素%> ｜ /武器融合 <%>',
      en: '/valence <elem%> <elem%> | /valence <%>',
    },
    params: [
      {
        name: 'materials',
        required: false,
        description: {
          zh: '两把：`电60 火58`；一把：`44` 规划到满值次数',
          en: 'Two: `elec60 heat58`; one: `44` steps-to-cap plan',
        },
      },
    ],
    examples: ['/武器融合 电60 火58', '/融合 44', '/valence 60 58'],
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
