import { normalizeName } from '@lanius/core';

/**
 * 玩法 / 活动中文词（与世界状态指令口径对齐；优先于模糊物品前缀命中）。
 */
const PLAY_ACTIVITIES_ZH = [
  '仲裁',
  '虚空裂缝',
  '虚空裂隙',
  '裂缝',
  '裂隙',
  '九重天',
  '钢铁之路',
  '执刑官猎杀',
  '执刑官',
  '执行官',
  '突击',
  '午夜电波',
  '电波',
  '赏金',
  '入侵',
  '警报',
  '夜灵平野',
  '夜灵平原',
  '奥布山谷',
  '魔胎之境',
  '双衍王境',
  '虚空风暴',
  '沉沦之地',
  '无尽回廊',
  '回廊',
  '扎里曼',
] as const;

/**
 * 常见玩法英文 → 中文灰机页面词。
 */
const PLAY_EN_TO_ZH: Readonly<Record<string, string>> = {
  arbitration: '仲裁',
  arbitrations: '仲裁',
  'void fissure': '虚空裂缝',
  fissure: '虚空裂缝',
  fissures: '虚空裂缝',
  sortie: '突击',
  'archon hunt': '执刑官猎杀',
  archon: '执刑官猎杀',
  nightwave: '午夜电波',
  'steel path': '钢铁之路',
  bounty: '赏金',
  bounties: '赏金',
  invasion: '入侵',
  invasions: '入侵',
  alert: '警报',
  alerts: '警报',
  duviri: '双衍王境',
  zariman: '扎里曼',
  'plains of eidolon': '夜灵平野',
  'orb vallis': '奥布山谷',
  'cambion drift': '魔胎之境',
  'void storm': '虚空风暴',
  'the circuit': '无尽回廊',
  circuit: '无尽回廊',
};

/**
 * 玩法词归一化集合。
 */
const PLAY_NORM = new Set(PLAY_ACTIVITIES_ZH.map((t) => normalizeName(t)));

/**
 * 若查询是玩法 / 任务类型词，返回用于 wiki 的中文页面词；否则空串。
 *
 * @param query - 用户查询
 * @returns 中文玩法词或空串
 */
export function resolvePlayTerm(query: string): string {
  const q = query.trim();
  if (!q) {
    return '';
  }
  const enKey = q.toLowerCase().replace(/\s+/g, ' ');
  const fromEn = PLAY_EN_TO_ZH[enKey];
  if (fromEn) {
    return fromEn;
  }
  return PLAY_NORM.has(normalizeName(q)) ? q : '';
}
