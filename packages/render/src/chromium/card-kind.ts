/**
 * QQ 模块卡片种类（与 `card-host` 挂载入口一致）。
 */
export type CardKind =
  | 'cycles'
  | 'fissures'
  | 'invasions'
  | 'nightwave'
  | 'bounties'
  | 'alerts'
  | 'arbitration'
  | 'archimedea'
  | 'circuit'
  | 'sortie'
  | 'archon'
  | 'help'
  | 'market'
  | 'riven'
  | 'voidTrader'
  | 'varzia'
  | 'weaponRotation'
  | 'wiki'
  | 'valence'
  /** SDJK Wave1 密列表卡（达沃/新闻/仲裁表/商店等） */
  | 'denseList';
