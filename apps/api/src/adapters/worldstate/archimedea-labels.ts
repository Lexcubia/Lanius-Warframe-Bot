import type { LocalizedName } from '@lanius/core';

/**
 * 科研偏差 / 风险 / 个人修正的展示名覆盖。
 * 上游 Conquests 键为短 CamelCase；裸 `languageString(key)` 会与其它表碰撞，故不用 WFCD 裸查。
 * 中文优先对齐灰机 wiki「科研」页常见译名；未知键回退为人读英文。
 */
const ARCHIMEDEA_MODIFIER_LABELS: Record<string, LocalizedName> = {
  // —— 个人修正（Variables）——
  NoPets: { zh: '禁用同伴', en: 'No Pets Allowed' },
  DullBlades: { zh: '钝重兵刃', en: 'Dull Blades' },
  AntiGuard: { zh: '超宏衰减', en: 'Dropped Guard' },
  ContactDamage: { zh: '二次伤害', en: 'Secondary Wounds' },
  RangeDebuff: { zh: '射程减益', en: 'Range Debuff' },
  AnemicShields: { zh: '贫血护盾', en: 'Anemic Shields' },
  Gearless: { zh: '携带装备限制', en: 'Gear Embargo' },
  AbilityLockout: { zh: '技能禁用', en: 'Powerless' },
  // —— 偏差（Deviation）——
  FortifiedFoes: { zh: '坚不可摧', en: 'Fortified Foes' },
  NecramechActivation: { zh: '殁世机甲激活', en: 'Necramech Activation' },
  FragileNodes: { zh: '脆弱节点', en: 'Fragile Nodes' },
  TechrotConjunction: { zh: '科腐联结', en: 'Techrot Conjunction' },
  ExplosiveEnergy: { zh: '爆炸能量', en: 'Explosive Energy' },
  TankReinforcements: { zh: '坦克增援', en: 'Tank Reinforcements' },
  // —— 风险变量（Risks）——
  AcceleratedEnemies: { zh: '加速敌军', en: 'Accelerated Enemies' },
  EMPBlackHole: { zh: 'EMP 黑洞', en: 'EMP Black Hole' },
  Deflectors: { zh: '偏转护盾', en: 'Deflectors' },
  Voidburst: { zh: '虚空爆发', en: 'Voidburst' },
  Quicksand: { zh: '流沙', en: 'Quicksand' },
  AntiMaterialWeapons: { zh: '反器材武器', en: 'Anti-Material Weapons' },
  InfectedTechrot: { zh: '感染科腐', en: 'Infected Techrot' },
  MiasmiteHive: { zh: '自爆虫群', en: 'Miasmite Hive' },
  PointBlank: { zh: '近距射击', en: 'Point Blank' },
  HeavyWarfare: { zh: '重装作战', en: 'Heavy Warfare' },
  CompetitionSpillover: { zh: '竞争外溢', en: 'Competition Spillover' },
  ShieldedFoes: { zh: '护盾敌军', en: 'Shielded Foes' },
  BoldVenture: { zh: '激进冒险', en: 'Bold Venture' },
  BolsteredBelligerents: { zh: '强化好战', en: 'Bolstered Belligerents' },
};

/**
 * 将 CamelCase / SCREAMING_SNAKE 键转为可读英文短语。
 *
 * @param key - 上游短键（如 `FortifiedFoes` / `EMPBlackHole`）
 * @returns 空格分隔的 Title Case；空键返回空串
 */
function humanizeModifierKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) {
    return '';
  }
  // 保留连续大写缩写（EMP），再在大小写边界插空格
  return trimmed
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 解析科研偏差 / 风险 / 个人修正键为双语显示名。
 *
 * @param key - 上游 Variables / deviation / risks 短键
 * @returns 中英显示名；未知键英文为人读短语，中文暂同英文
 */
export function resolveArchimedeaModifierLabel(key: string): LocalizedName {
  const trimmed = key.trim();
  if (!trimmed) {
    return { zh: trimmed, en: trimmed };
  }
  const known = ARCHIMEDEA_MODIFIER_LABELS[trimmed];
  if (known) {
    return known;
  }
  const en = humanizeModifierKey(trimmed) || trimmed;
  return { zh: en, en };
}
