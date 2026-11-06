import { LANIUS_COMMAND_CATALOG, type ModuleId } from '@lanius/core';
import type { QqMenuSendItem, QqPanelCommandItem } from '@lanius/qq-official';

/**
 * QQ 指令面板「说明」专用短文案（与帮助页 `summary` 分离）。
 * 开放平台按加权计长：中文约 2、其余 1，上限 30（约 15 汉字）。
 * 此处保持明显低于上限，避免依赖运行时截断产生半截句。
 */
/**
 * 已挂目录的模块面板短说明（预留 ModuleId 无目录项，故用 Partial）。
 */
const PANEL_DESC_ZH: Readonly<Partial<Record<ModuleId, string>>> = {
  worldstate: '开放世界周期与节点',
  fissures: '虚空裂隙列表与筛选',
  invasions: '活跃入侵进度与阵营',
  nightwave: '午夜电波赛季挑战',
  sortie: '每日突击任务链',
  archon: '执行官狩猎任务链',
  circuit: '回廊本周可选奖励',
  bounties: '开放世界赏金列表',
  arbitration: '当前仲裁节点',
  alerts: '当前警报任务',
  archimedea: '精英与时光科研',
  voidTrader: '虚空商人位置与货架',
  varzia: '瓦奇娅金满仓货架',
  tenetRotation: '信条武器轮换与订阅',
  codaRotation: '终幕武器轮换与订阅',
  subscribe: '订阅或退订模块推送',
  market: 'WM 在线卖单排行',
  riven: 'WM 紫卡在线拍卖',
  marketTrend: '物品价格趋势',
  marketRank: '市场成交排行',
  ducats: '杜卡德垃圾榜',
  rivenAnalysis: '紫卡词条卷度分析',
  rivenRanges: '紫卡词条数值范围',
  rivenSplice: '紫卡融合配方',
  disposition: '紫卡倾向对照',
  lichAuctions: '玄骸武器拍卖',
  relic: '遗物奖励查询',
  parts: '部件反查遗物',
  openRelic: '开核桃裂隙推荐',
  help: '指令帮助与模块详解',
  // —— Wave1 日常 / 轮换 ——
  timers: '开放世界时效总览',
  dailyDeals: '达沃每日特惠',
  news: '官方新闻与热修',
  kuva: '赤毒虹吸节点',
  synthTargets: '希图斯结合目标',
  construction: '舰队建造进度',
  voidStorms: '九重天虚空风暴',
  events: '限时活动列表',
  conclave: '武形秘仪挑战',
  clanRewards: '氏族周奖励加成',
  flashSales: '商城闪购礼包',
  arbTable: '仲裁约十四日排期',
  calendar1999: '一九九九日历',
  steelPath: '钢铁精华兑换',
  sliverShop: '裂罅碎块商店',
  descendia: '沉沦之地本周层',
  incursions: '钢路每日侵袭',
  incarnon: '本周灵化武器',
  acrithis: '言录使周常货架',
  // —— Wave3 ——
  wiki: '灰机维基深链短简介',
  translate: '中英官方名称对照',
  valence: '效价融合计算器',
};

/**
 * 将 Lanius 指令目录映射为官方「指令面板」条目。
 *
 * @returns 可供 `syncQqCommandPanels` 使用的指令项列表
 */
export function buildQqPanelItems(): QqPanelCommandItem[] {
  const items: QqPanelCommandItem[] = [];
  for (const entry of LANIUS_COMMAND_CATALOG) {
    const name = entry.roots[0] ?? entry.command.replace(/^\//, '');
    items.push({
      name,
      desc: PANEL_DESC_ZH[entry.id] ?? entry.summary.zh.slice(0, 15),
    });
  }
  return items;
}

/**
 * 将指令目录映射为单聊「自定义菜单」发送项。
 *
 * @returns 可供 `syncQqCustomMenu` 使用的按钮列表
 */
export function buildQqMenuItems(): QqMenuSendItem[] {
  const items: QqMenuSendItem[] = [];
  for (const entry of LANIUS_COMMAND_CATALOG) {
    const name = entry.roots[0] ?? entry.command.replace(/^\//, '');
    items.push({
      name,
      sendMessage: name,
    });
  }
  return items;
}
