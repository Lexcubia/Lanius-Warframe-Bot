import { createHash } from 'node:crypto';

import {
  applyFissureQueryFilter,
  parseBountyMapTokens,
  parseFissureFilterTokens,
  pickLocalized,
  WorldstateCycleFilterSchema,
  type Locale,
  type OpenWorldCycleDto,
  type PushDispatchDto,
  type PushFrequency,
  type Realm,
  type SubscribableModuleId,
  type WorldstateCycleFilter,
  type WorldstateDto,
} from '@lanius/core';

import type { LaniusDb } from '../db/client.js';
import {
  listEnabledSubscriptionRows,
  markSubscriptionPushed,
  type SubscriptionRow,
} from '../db/subscriptions.js';
import type { RotationService } from './rotation-service.js';
import type { TraderService } from './trader-service.js';
import type { WorldstateService } from './worldstate-service.js';

/**
 * 推送服务依赖。
 */
export type PushServiceDeps = {
  db: LaniusDb;
  worldstateService: WorldstateService;
  traderService: TraderService;
  rotationService: RotationService;
  realm: Realm;
  locale: Locale;
};

/**
 * 待下行条目（含指纹，供 ack）。
 */
export type PushPending = PushDispatchDto & { fingerprint: string };

/**
 * 单模块快照（指纹 + 推送文案）。
 */
type ModuleSnapshot = { fingerprint: string; text: string };

/**
 * 按订阅频率检查变更并生成 QQ 下行文本。
 * Wave 4：对齐 SDJK `PUSH_EVENTS` 全量已接线事件（文本推送）。
 */
export class PushService {
  private readonly db: LaniusDb;
  private readonly worldstateService: WorldstateService;
  private readonly traderService: TraderService;
  private readonly rotationService: RotationService;
  private readonly realm: Realm;
  private readonly locale: Locale;

  /**
   * @param deps - DB 与查询服务
   */
  constructor(deps: PushServiceDeps) {
    this.db = deps.db;
    this.worldstateService = deps.worldstateService;
    this.traderService = deps.traderService;
    this.rotationService = deps.rotationService;
    this.realm = deps.realm;
    this.locale = deps.locale;
  }

  /**
   * 扫描启用订阅，返回需要推送的下行列表。
   *
   * @param nowMs - 当前时间
   * @returns 待发送条目
   */
  async collectDue(nowMs: number = Date.now()): Promise<PushPending[]> {
    const rows = listEnabledSubscriptionRows(this.db);
    if (rows.length === 0) {
      return [];
    }

    const base = await this.buildBaseSnapshots();
    const due: PushPending[] = [];

    for (const row of rows) {
      const moduleId = row.module_id as SubscribableModuleId;
      const filterArgs = (row.filter_args ?? '').trim();
      const snap = this.resolveSnapshot(moduleId, filterArgs, base);
      if (!snap) {
        continue;
      }
      if (!isDue(row, snap.fingerprint, nowMs)) {
        continue;
      }
      due.push({
        subscriptionId: row.id,
        scene: row.scene as 'group' | 'c2c',
        targetId: row.target_id,
        moduleId,
        text: snap.text,
        fingerprint: snap.fingerprint,
      });
    }

    return due;
  }

  /**
   * 确认推送已发出，更新指纹与时间。
   *
   * @param subscriptionId - 订阅 id
   * @param fingerprint - 本次内容指纹
   * @returns 无返回值
   */
  acknowledge(subscriptionId: number, fingerprint: string): void {
    markSubscriptionPushed(this.db, subscriptionId, fingerprint, new Date().toISOString());
  }

  /**
   * 拉取各模块原始快照（未套筛选）。
   *
   * @returns 模块 → 快照
   */
  private async buildBaseSnapshots(): Promise<
    Partial<Record<SubscribableModuleId, ModuleSnapshot>> & {
      _ws: WorldstateDto;
      _cycles: Record<WorldstateCycleFilter, ModuleSnapshot | undefined>;
    }
  > {
    const locale = this.locale;
    const realm = this.realm;
    const out: Partial<Record<SubscribableModuleId, ModuleSnapshot>> = {};

    const wsResult = await this.worldstateService.getWorldstate(realm, locale);
    const ws = wsResult.data;

    out.fissures = snapshotFissures(ws.fissures, locale, null);

    const cycles: Record<WorldstateCycleFilter, ModuleSnapshot | undefined> = {
      cetus: undefined,
      vallis: undefined,
      cambion: undefined,
      earth: undefined,
      duviri: undefined,
    };
    for (const cycle of ws.cycles) {
      const parsed = WorldstateCycleFilterSchema.safeParse(cycle.id);
      if (!parsed.success) {
        continue;
      }
      cycles[parsed.data] = snapshotCycle(cycle, locale);
    }
    // 无筛选的 worldstate：全部周期状态联合指纹
    const allCycleKey = ws.cycles
      .map((c) => `${c.id}|${c.state}|${c.expiry}`)
      .sort()
      .join(';');
    out.worldstate = {
      fingerprint: hashFingerprint(allCycleKey),
      text: formatCyclesPush(ws.cycles, locale),
    };

    if (ws.sortie) {
      const sid = ws.sortie.id;
      out.sortie = {
        fingerprint: hashFingerprint(`sortie|${sid}`),
        text: formatSortiePush(ws.sortie, locale),
      };
    }
    if (ws.archon) {
      out.archon = {
        fingerprint: hashFingerprint(`archon|${ws.archon.id}`),
        text: formatArchonPush(ws.archon, locale),
      };
    }
    if (ws.arbitration) {
      const arb = ws.arbitration;
      const key = [
        arb.nodeKey ?? '',
        arb.missionTypeKey ?? '',
        arb.enemyKey ?? '',
        arb.expiry ?? '',
      ].join('|');
      out.arbitration = {
        fingerprint: hashFingerprint(`arb|${key}`),
        text: formatArbitrationPush(arb, locale),
      };
    }

    out.alerts = {
      fingerprint: hashFingerprint(
        ws.alerts
          .map((a) => a.id)
          .sort()
          .join(';'),
      ),
      text: formatAlertsPush(ws.alerts, locale),
    };
    out.invasions = {
      fingerprint: hashFingerprint(
        ws.invasions
          .map((i) => i.id)
          .sort()
          .join(';'),
      ),
      text: formatInvasionsPush(ws.invasions, locale),
    };
    out.news = {
      fingerprint: hashFingerprint(
        ws.news
          .map((n) => n.id)
          .sort()
          .join(';'),
      ),
      text: formatNewsPush(ws.news, locale),
    };
    out.dailyDeals = {
      fingerprint: hashFingerprint(
        ws.dailyDeals
          .map((d) => `${d.uniqueName}|${d.salePrice ?? ''}|${d.expiry ?? ''}`)
          .sort()
          .join(';'),
      ),
      text: formatDailyDealsPush(ws.dailyDeals, locale),
    };
    out.events = {
      fingerprint: hashFingerprint(
        ws.events
          .map((e) => e.id)
          .sort()
          .join(';'),
      ),
      text: formatEventsPush(ws.events, locale),
    };
    if (ws.calendar1999) {
      const cal = ws.calendar1999;
      const daySig = cal.days
        .map(
          (d) =>
            `${d.date ?? d.day ?? ''}:${(d.events ?? [])
              .map((e) => e.name?.en ?? e.ref ?? '')
              .join(',')}`,
        )
        .join(';');
      out.calendar1999 = {
        fingerprint: hashFingerprint(`cal|${cal.season ?? ''}|${cal.expiry ?? ''}|${daySig}`),
        text: formatCalendarPush(cal, locale),
      };
    }
    if (ws.nightwave) {
      const nw = ws.nightwave;
      const chKey = nw.activeChallenges
        .map((c) => `${c.id}|${c.title?.en ?? ''}`)
        .sort()
        .join(';');
      out.nightwave = {
        fingerprint: hashFingerprint(`nw|${nw.season ?? ''}|${chKey}`),
        text: formatNightwavePush(nw, locale),
      };
    }

    out.bounties = snapshotBounties(ws.bounties, locale, null);

    try {
      const baro = await this.traderService.getVoidTrader(realm, locale);
      const baroKey = [
        baro.data.active ? '1' : '0',
        baro.data.node.en,
        baro.data.expiry,
        ...baro.data.inventory.map((i) => i.name.en),
      ].join('|');
      out.voidTrader = {
        fingerprint: hashFingerprint(baroKey),
        text: formatVoidTraderPush(baro.data, locale),
      };
    } catch {
      // 商人源失败：本轮跳过，不影响其它模块
    }

    try {
      const varzia = await this.traderService.getVarzia(realm, locale);
      const varziaKey = [
        varzia.data.active ? '1' : '0',
        varzia.data.expiry ?? '',
        ...varzia.data.inventory.map((i) => i.name.en),
      ].join('|');
      out.varzia = {
        fingerprint: hashFingerprint(varziaKey),
        text: formatVarziaPush(varzia.data, locale),
      };
    } catch {
      // 瓦奇娅失败跳过
    }

    try {
      const tenet = await this.rotationService.getRotation('tenet');
      out.tenetRotation = {
        fingerprint: hashFingerprint(
          `${tenet.periodEnd}|${tenet.offerings.map((o) => `${o.name.en}:${o.element ?? ''}:${o.bonusPct ?? ''}`).join('|')}`,
        ),
        text: formatRotationPush(tenet, locale),
      };
    } catch {
      // 信条失败跳过
    }

    try {
      const coda = await this.rotationService.getRotation('coda');
      out.codaRotation = {
        fingerprint: hashFingerprint(
          `${coda.periodEnd}|${coda.offerings.map((o) => `${o.name.en}:${o.element ?? ''}:${o.bonusPct ?? ''}`).join('|')}`,
        ),
        text: formatRotationPush(coda, locale),
      };
    } catch {
      // 终幕失败跳过
    }

    try {
      const steel = this.worldstateService.getSteelPathShop();
      const weeklyKey = steel.weekly.map((o) => `${o.name.en}:${o.cost ?? ''}`).join('|');
      out.steelPath = {
        fingerprint: hashFingerprint(`steel|${steel.nextReset ?? ''}|${weeklyKey}`),
        text: formatShopPush(steel, locale),
      };
    } catch {
      // 钢精失败跳过
    }

    try {
      const sliver = this.worldstateService.getSliverShop();
      out.sliverShop = {
        fingerprint: hashFingerprint(`sliver|${sliver.nextReset ?? ''}`),
        text: formatShopPush(sliver, locale),
      };
    } catch {
      // 碎银失败跳过
    }

    try {
      const incarnon = this.worldstateService.getIncarnon();
      out.incarnon = {
        fingerprint: hashFingerprint(
          `incarnon|${incarnon.weekIndex}|${incarnon.current.map((w) => w.name.en).join('|')}`,
        ),
        text: formatIncarnonPush(incarnon, locale),
      };
    } catch {
      // 灵化失败跳过
    }

    try {
      const incursions = await this.worldstateService.getIncursions(realm);
      out.incursions = {
        fingerprint: hashFingerprint(
          `inc|${incursions.expiry ?? ''}|${incursions.nodes
            .map((n) => n.nodeKey)
            .sort()
            .join(',')}`,
        ),
        text: formatIncursionsPush(incursions, locale),
      };
    } catch {
      // 侵袭失败跳过
    }

    return { ...out, _ws: ws, _cycles: cycles };
  }

  /**
   * 按模块与筛选解析最终快照（裂隙/赏金/周期需套 filter）。
   *
   * @param moduleId - 可订阅模块
   * @param filterArgs - 筛选原文（可空）
   * @param base - 基础快照包
   * @returns 快照或 undefined
   */
  private resolveSnapshot(
    moduleId: SubscribableModuleId,
    filterArgs: string,
    base: Awaited<ReturnType<PushService['buildBaseSnapshots']>>,
  ): ModuleSnapshot | undefined {
    if (moduleId === 'worldstate' && filterArgs) {
      const cycle = WorldstateCycleFilterSchema.safeParse(filterArgs);
      if (cycle.success) {
        return base._cycles[cycle.data];
      }
    }
    if (moduleId === 'fissures' && filterArgs) {
      return snapshotFissures(base._ws.fissures, this.locale, filterArgs);
    }
    if (moduleId === 'bounties' && filterArgs) {
      return snapshotBounties(base._ws.bounties, this.locale, filterArgs);
    }
    if (moduleId === 'arbitration' && filterArgs && base.arbitration) {
      const arb = base._ws.arbitration;
      if (!arb) {
        return undefined;
      }
      if (!arbitrationMatchesFilter(arb, filterArgs)) {
        // 当前仲裁不匹配筛选：保持指纹不变语义——用「无匹配」稳定指纹，避免刷屏
        return {
          fingerprint: hashFingerprint(`arb-miss|${filterArgs}`),
          text:
            this.locale === 'zh'
              ? `【Lanius · 仲裁】当前场次不匹配筛选「${filterArgs}」`
              : `[Lanius · Arbitration] current slot misses filter "${filterArgs}"`,
        };
      }
      return base.arbitration;
    }
    return base[moduleId];
  }
}

/**
 * 判断订阅是否到期应推送。
 *
 * @param row - 订阅行
 * @param fingerprint - 当前内容指纹
 * @param nowMs - 当前时间
 * @returns 是否应推送
 */
function isDue(row: SubscriptionRow, fingerprint: string, nowMs: number): boolean {
  const frequency = row.frequency as PushFrequency;
  if (frequency === 'on_change') {
    return row.last_fingerprint !== fingerprint;
  }
  const intervalMs = frequencyIntervalMs(frequency);
  if (row.last_pushed_at == null) {
    return true;
  }
  const last = Date.parse(row.last_pushed_at);
  if (!Number.isFinite(last)) {
    return true;
  }
  return nowMs - last >= intervalMs;
}

/**
 * 频率对应最小间隔。
 *
 * @param frequency - 推送频率
 * @returns 毫秒
 */
function frequencyIntervalMs(frequency: Exclude<PushFrequency, 'on_change'>): number {
  switch (frequency) {
    case 'hourly':
      return 60 * 60 * 1000;
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * 计算内容指纹。
 *
 * @param raw - 稳定序列化串
 * @returns sha256 十六进制前 32 位
 */
function hashFingerprint(raw: string): string {
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * 裂隙快照（可带筛选）。
 *
 * @param fissures - 裂隙列表
 * @param locale - 语言
 * @param filterArgs - 筛选原文或 null
 * @returns 快照
 */
function snapshotFissures(
  fissures: WorldstateDto['fissures'],
  locale: Locale,
  filterArgs: string | null,
): ModuleSnapshot {
  let rows = fissures;
  if (filterArgs) {
    const filter = parseFissureFilterTokens(filterArgs.split(/\s+/).filter(Boolean));
    rows = applyFissureQueryFilter(fissures, filter).items;
  }
  const key = rows
    .map((f) => `${f.id}|${f.node.en}|${f.missionType.en}|${f.era}|${f.path}|${f.expiry}`)
    .sort()
    .join(';');
  return {
    fingerprint: hashFingerprint(`fis|${filterArgs ?? ''}|${key}`),
    text: formatFissuresPush(rows, locale, filterArgs),
  };
}

/**
 * 赏金快照（可带地图筛选）。
 *
 * @param bounties - 赏金块
 * @param locale - 语言
 * @param filterArgs - 筛选原文或 null
 * @returns 快照
 */
function snapshotBounties(
  bounties: WorldstateDto['bounties'],
  locale: Locale,
  filterArgs: string | null,
): ModuleSnapshot {
  let rows = bounties;
  if (filterArgs) {
    const mapFilter = parseBountyMapTokens(filterArgs.split(/\s+/).filter(Boolean));
    if (mapFilter.tags.length > 0) {
      const tagSet = new Set(mapFilter.tags);
      rows = bounties.filter((b) => tagSet.has(b.tag));
    }
  }
  const key = rows
    .map(
      (b) =>
        `${b.tag}|${b.expiry ?? ''}|${b.jobs.map((j) => j.jobType ?? j.title?.en ?? '').join(',')}`,
    )
    .sort()
    .join(';');
  return {
    fingerprint: hashFingerprint(`bounty|${filterArgs ?? ''}|${key}`),
    text: formatBountiesPush(rows, locale, filterArgs),
  };
}

/**
 * 单周期快照。
 *
 * @param cycle - 周期 DTO
 * @param locale - 语言
 * @returns 快照
 */
function snapshotCycle(cycle: OpenWorldCycleDto, locale: Locale): ModuleSnapshot {
  return {
    fingerprint: hashFingerprint(`${cycle.id}|${cycle.state}|${cycle.expiry}`),
    text: formatSingleCyclePush(cycle, locale),
  };
}

/**
 * 仲裁筛选：关键词命中节点/任务/敌人中英文字段（空格 = 且）。
 *
 * @param arb - 仲裁 DTO
 * @param filterArgs - 筛选原文
 * @returns 是否命中
 */
function arbitrationMatchesFilter(
  arb: NonNullable<WorldstateDto['arbitration']>,
  filterArgs: string,
): boolean {
  const hay = [
    arb.node?.zh,
    arb.node?.en,
    arb.missionType?.zh,
    arb.missionType?.en,
    arb.enemy?.zh,
    arb.enemy?.en,
    arb.missionTypeKey,
    arb.nodeKey,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const tokens = filterArgs
    .split(/[\s,，]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }
  return tokens.every((t) => hay.includes(t));
}

/**
 * 裂隙推送文案（精简）。
 *
 * @param fissures - 裂隙列表
 * @param locale - 语言
 * @param filterArgs - 可选筛选说明
 * @returns 文本
 */
function formatFissuresPush(
  fissures: WorldstateDto['fissures'],
  locale: Locale,
  filterArgs: string | null,
): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 裂隙推送】' : '[Lanius · Fissures]'];
  if (filterArgs) {
    lines.push(zh ? `筛选：${filterArgs}` : `Filter: ${filterArgs}`);
  }
  const rows = fissures.slice(0, 12);
  if (rows.length === 0) {
    lines.push(zh ? '· 暂无活跃裂隙' : '· none active');
  } else {
    for (const row of rows) {
      const node = pickLocalized(row.node, locale);
      const mission = pickLocalized(row.missionType, locale);
      const era = pickLocalized(row.eraLabel, locale);
      const path = pickLocalized(row.pathLabel, locale);
      const mins = Math.max(0, Math.round(row.remainingMs / 60_000));
      lines.push(`· ${era} ${mission} @ ${node} (${path}) ~${mins}m`);
    }
  }
  return lines.join('\n');
}

/**
 * 全部开放世界周期推送。
 *
 * @param cycles - 周期列表
 * @param locale - 语言
 * @returns 文本
 */
function formatCyclesPush(cycles: OpenWorldCycleDto[], locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 开放世界周期】' : '[Lanius · Open-world cycles]'];
  if (cycles.length === 0) {
    lines.push(zh ? '· 暂无数据' : '· none');
  } else {
    for (const c of cycles) {
      lines.push(formatCycleLine(c, locale));
    }
  }
  return lines.join('\n');
}

/**
 * 单周期推送。
 *
 * @param cycle - 周期
 * @param locale - 语言
 * @returns 文本
 */
function formatSingleCyclePush(cycle: OpenWorldCycleDto, locale: Locale): string {
  const zh = locale === 'zh';
  const name = pickLocalized(cycle.name, locale);
  return [zh ? `【Lanius · ${name}】` : `[Lanius · ${name}]`, formatCycleLine(cycle, locale)].join(
    '\n',
  );
}

/**
 * 周期单行。
 *
 * @param cycle - 周期
 * @param locale - 语言
 * @returns 行
 */
function formatCycleLine(cycle: OpenWorldCycleDto, locale: Locale): string {
  const name = pickLocalized(cycle.name, locale);
  const state = pickLocalized(cycle.stateLabel, locale);
  const mins = Math.max(0, Math.round(cycle.remainingMs / 60_000));
  return `· ${name}: ${state} ~${mins}m`;
}

/**
 * 虚空商人推送文案。
 *
 * @param data - DTO
 * @param locale - 语言
 * @returns 文本
 */
function formatVoidTraderPush(
  data: {
    character: { zh: string; en: string };
    node: { zh: string; en: string };
    active: boolean;
    remainingMs: number;
    inventory: Array<{ name: { zh: string; en: string }; ducats?: number }>;
  },
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const name = pickLocalized(data.character, locale);
  const node = pickLocalized(data.node, locale);
  const mins = Math.max(0, Math.round(data.remainingMs / 60_000));
  const lines = [zh ? `【Lanius · ${name}】` : `[Lanius · ${name}]`];
  if (data.active) {
    lines.push(zh ? `驻留 ${node}，约 ${mins} 分钟后离开` : `At ${node}, leaves in ~${mins}m`);
  } else {
    lines.push(zh ? `未在场，约 ${mins} 分钟后抵达 ${node}` : `Arrives at ${node} in ~${mins}m`);
  }
  for (const item of data.inventory.slice(0, 15)) {
    const label = pickLocalized(item.name, locale);
    const ducats = item.ducats != null ? ` ${item.ducats}d` : '';
    lines.push(`· ${label}${ducats}`);
  }
  return lines.join('\n');
}

/**
 * 瓦奇娅推送文案。
 *
 * @param data - DTO
 * @param locale - 语言
 * @returns 文本
 */
function formatVarziaPush(
  data: {
    character: { zh: string; en: string };
    active: boolean;
    remainingMs?: number;
    inventory: Array<{ name: { zh: string; en: string } }>;
  },
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const name = pickLocalized(data.character, locale);
  const lines = [zh ? `【Lanius · ${name}】` : `[Lanius · ${name}]`];
  if (data.remainingMs != null) {
    const mins = Math.max(0, Math.round(data.remainingMs / 60_000));
    lines.push(zh ? `货架剩余约 ${mins} 分钟` : `~${mins}m left`);
  }
  if (data.inventory.length === 0) {
    lines.push(zh ? '· 货架为空或未开放' : '· empty / inactive');
  } else {
    for (const item of data.inventory.slice(0, 20)) {
      lines.push(`· ${pickLocalized(item.name, locale)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 格式化轮换推送文案（货架平级 + 可选 Valence）。
 *
 * @param data - 轮换 DTO
 * @param locale - 语言
 * @returns 多行文本
 */
function formatRotationPush(
  data: {
    kind: 'tenet' | 'coda';
    offerings: Array<{
      name: { zh: string; en: string };
      elementLabel?: { zh: string; en: string };
      bonusPct?: number;
    }>;
    remainingMs: number;
  },
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const title =
    data.kind === 'tenet'
      ? zh
        ? '信条武器商店'
        : 'Tenet shop'
      : zh
        ? '终幕武器商店'
        : 'Coda shop';
  const days = Math.max(0, Math.round(data.remainingMs / 86_400_000));
  const lines = [
    zh ? `【Lanius · ${title}】` : `[Lanius · ${title}]`,
    zh ? `约 ${days} 天后刷新 Valence` : `Valence refreshes in ~${days}d`,
  ];
  for (const weapon of data.offerings) {
    const name = pickLocalized(weapon.name, locale);
    const el = weapon.elementLabel ? pickLocalized(weapon.elementLabel, locale) : '';
    const pct = weapon.bonusPct != null ? `${Number(weapon.bonusPct.toFixed(1))}%` : '';
    const valence = [el, pct].filter(Boolean).join(' ');
    lines.push(valence ? `· ${name} [${valence}]` : `· ${name}`);
  }
  return lines.join('\n');
}

/**
 * 突击推送。
 *
 * @param sortie - 突击 DTO
 * @param locale - 语言
 * @returns 文本
 */
function formatSortiePush(sortie: NonNullable<WorldstateDto['sortie']>, locale: Locale): string {
  const zh = locale === 'zh';
  const boss = sortie.boss ? pickLocalized(sortie.boss, locale) : (sortie.bossKey ?? '');
  const lines = [
    zh ? '【Lanius · 每日突击】' : '[Lanius · Sortie]',
    boss ? `· ${boss}` : '',
    ...sortie.missions.slice(0, 3).map((m, i) => {
      const mission = m.missionType
        ? pickLocalized(m.missionType, locale)
        : (m.missionTypeKey ?? '');
      const node = m.node ? pickLocalized(m.node, locale) : (m.nodeKey ?? '');
      return `· ${i + 1}. ${mission} @ ${node}`;
    }),
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * 执刑官推送。
 *
 * @param archon - 执刑官 DTO
 * @param locale - 语言
 * @returns 文本
 */
function formatArchonPush(archon: NonNullable<WorldstateDto['archon']>, locale: Locale): string {
  const zh = locale === 'zh';
  const boss = archon.boss ? pickLocalized(archon.boss, locale) : (archon.bossKey ?? '');
  const lines = [
    zh ? '【Lanius · 执刑官猎杀】' : '[Lanius · Archon Hunt]',
    boss ? `· ${boss}` : '',
    ...archon.missions.slice(0, 3).map((m, i) => {
      const mission = m.missionType
        ? pickLocalized(m.missionType, locale)
        : (m.missionTypeKey ?? '');
      const node = m.node ? pickLocalized(m.node, locale) : (m.nodeKey ?? '');
      return `· ${i + 1}. ${mission} @ ${node}`;
    }),
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * 仲裁推送。
 *
 * @param arb - 仲裁
 * @param locale - 语言
 * @returns 文本
 */
function formatArbitrationPush(
  arb: NonNullable<WorldstateDto['arbitration']>,
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const node = arb.node ? pickLocalized(arb.node, locale) : (arb.nodeKey ?? '?');
  const mission = arb.missionType
    ? pickLocalized(arb.missionType, locale)
    : (arb.missionTypeKey ?? '');
  const enemy = arb.enemy ? pickLocalized(arb.enemy, locale) : '';
  const lines = [
    zh ? '【Lanius · 仲裁】' : '[Lanius · Arbitration]',
    `· ${mission} @ ${node}${enemy ? ` (${enemy})` : ''}`,
  ];
  return lines.join('\n');
}

/**
 * 警报推送。
 *
 * @param alerts - 警报列表
 * @param locale - 语言
 * @returns 文本
 */
function formatAlertsPush(alerts: WorldstateDto['alerts'], locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 警报】' : '[Lanius · Alerts]'];
  if (alerts.length === 0) {
    lines.push(zh ? '· 暂无活跃警报' : '· none');
  } else {
    for (const a of alerts.slice(0, 8)) {
      const node = a.node ? pickLocalized(a.node, locale) : (a.nodeKey ?? '');
      const mission = a.missionType
        ? pickLocalized(a.missionType, locale)
        : (a.missionTypeKey ?? '');
      lines.push(`· ${mission} @ ${node}`);
    }
  }
  return lines.join('\n');
}

/**
 * 入侵推送。
 *
 * @param invasions - 入侵列表
 * @param locale - 语言
 * @returns 文本
 */
function formatInvasionsPush(invasions: WorldstateDto['invasions'], locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 入侵】' : '[Lanius · Invasions]'];
  if (invasions.length === 0) {
    lines.push(zh ? '· 暂无入侵' : '· none');
  } else {
    for (const inv of invasions.slice(0, 8)) {
      lines.push(`· ${pickLocalized(inv.node, locale)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 新闻推送。
 *
 * @param news - 新闻
 * @param locale - 语言
 * @returns 文本
 */
function formatNewsPush(news: WorldstateDto['news'], locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 新闻】' : '[Lanius · News]'];
  if (news.length === 0) {
    lines.push(zh ? '· 暂无新闻' : '· none');
  } else {
    for (const n of news.slice(0, 6)) {
      lines.push(`· ${pickLocalized(n.message, locale)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 每日特惠推送。
 *
 * @param deals - 特惠
 * @param locale - 语言
 * @returns 文本
 */
function formatDailyDealsPush(deals: WorldstateDto['dailyDeals'], locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 每日特惠】' : '[Lanius · Daily Deals]'];
  if (deals.length === 0) {
    lines.push(zh ? '· 暂无特惠' : '· none');
  } else {
    for (const d of deals.slice(0, 8)) {
      const name = pickLocalized(d.item.name, locale);
      const price = d.salePrice != null ? (zh ? `${d.salePrice} 白金` : `${d.salePrice}p`) : '';
      const disc = d.discountPct != null ? ` -${d.discountPct}%` : '';
      lines.push(`· ${name}${price ? ` ${price}` : ''}${disc}`);
    }
  }
  return lines.join('\n');
}

/**
 * 活动推送。
 *
 * @param events - 活动
 * @param locale - 语言
 * @returns 文本
 */
function formatEventsPush(events: WorldstateDto['events'], locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 限时活动】' : '[Lanius · Events]'];
  if (events.length === 0) {
    lines.push(zh ? '· 暂无活动' : '· none');
  } else {
    for (const e of events.slice(0, 8)) {
      lines.push(`· ${pickLocalized(e.name, locale)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 1999 日历推送。
 *
 * @param cal - 日历
 * @param locale - 语言
 * @returns 文本
 */
function formatCalendarPush(
  cal: NonNullable<WorldstateDto['calendar1999']>,
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const lines = [
    zh ? '【Lanius · 1999 日历】' : '[Lanius · 1999 Calendar]',
    cal.season ? (zh ? `季：${cal.season}` : `Season: ${cal.season}`) : '',
  ].filter(Boolean);
  for (const day of cal.days.slice(0, 3)) {
    const label = day.date ?? (day.day != null ? `D${day.day}` : '?');
    const evs = (day.events ?? [])
      .map((e) => (e.name ? pickLocalized(e.name, locale) : (e.ref ?? '')))
      .filter(Boolean)
      .join('、');
    lines.push(`· ${label}: ${evs || (zh ? '无' : 'none')}`);
  }
  return lines.join('\n');
}

/**
 * 电波推送。
 *
 * @param nw - 电波
 * @param locale - 语言
 * @returns 文本
 */
function formatNightwavePush(nw: NonNullable<WorldstateDto['nightwave']>, locale: Locale): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 午夜电波】' : '[Lanius · Nightwave]'];
  if (nw.season != null) {
    lines.push(zh ? `赛季：${nw.season}` : `Season: ${nw.season}`);
  }
  for (const ch of nw.activeChallenges.slice(0, 10)) {
    const title = ch.title ? pickLocalized(ch.title, locale) : ch.id;
    lines.push(`· ${title}`);
  }
  return lines.join('\n');
}

/**
 * 赏金推送。
 *
 * @param bounties - 赏金
 * @param locale - 语言
 * @param filterArgs - 筛选
 * @returns 文本
 */
function formatBountiesPush(
  bounties: WorldstateDto['bounties'],
  locale: Locale,
  filterArgs: string | null,
): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 赏金】' : '[Lanius · Bounties]'];
  if (filterArgs) {
    lines.push(zh ? `筛选：${filterArgs}` : `Filter: ${filterArgs}`);
  }
  if (bounties.length === 0) {
    lines.push(zh ? '· 暂无赏金' : '· none');
  } else {
    for (const b of bounties.slice(0, 6)) {
      const name = b.name ? pickLocalized(b.name, locale) : b.tag;
      lines.push(`· ${name}（${b.jobs.length} jobs）`);
    }
  }
  return lines.join('\n');
}

/**
 * 钢精 / 碎银商店推送。
 *
 * @param shop - 商店
 * @param locale - 语言
 * @returns 文本
 */
function formatShopPush(
  shop: {
    kind: 'steelPath' | 'sliverShop';
    nextReset?: string;
    weekly: Array<{ name: { zh: string; en: string }; cost?: number }>;
    evergreen: Array<{ name: { zh: string; en: string }; cost?: number }>;
  },
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const title =
    shop.kind === 'steelPath'
      ? zh
        ? '钢精兑换'
        : 'Steel Path shop'
      : zh
        ? '碎银兑换'
        : 'Sliver shop';
  const lines = [zh ? `【Lanius · ${title}】` : `[Lanius · ${title}]`];
  if (shop.nextReset) {
    lines.push(zh ? `下次重置：${shop.nextReset}` : `Next reset: ${shop.nextReset}`);
  }
  const offers = [...shop.weekly, ...shop.evergreen].slice(0, 10);
  if (offers.length === 0) {
    lines.push(zh ? '· 货架为空' : '· empty');
  } else {
    for (const o of offers) {
      const cost = o.cost != null ? ` (${o.cost})` : '';
      lines.push(`· ${pickLocalized(o.name, locale)}${cost}`);
    }
  }
  return lines.join('\n');
}

/**
 * 灵化轮换推送。
 *
 * @param incarnon - 灵化
 * @param locale - 语言
 * @returns 文本
 */
function formatIncarnonPush(
  incarnon: {
    weekIndex: number;
    weekTotal: number;
    current: Array<{ name: { zh: string; en: string } }>;
  },
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const lines = [
    zh ? '【Lanius · 灵化武器】' : '[Lanius · Incarnon]',
    zh
      ? `第 ${incarnon.weekIndex}/${incarnon.weekTotal} 周`
      : `Week ${incarnon.weekIndex}/${incarnon.weekTotal}`,
  ];
  for (const w of incarnon.current) {
    lines.push(`· ${pickLocalized(w.name, locale)}`);
  }
  return lines.join('\n');
}

/**
 * 钢路侵袭推送。
 *
 * @param incursions - 侵袭
 * @param locale - 语言
 * @returns 文本
 */
function formatIncursionsPush(
  incursions: {
    nodes: Array<{ nodeKey: string; node: { zh: string; en: string } }>;
    expiry?: string;
  },
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 钢路侵袭】' : '[Lanius · Steel Path Incursions]'];
  if (incursions.nodes.length === 0) {
    lines.push(zh ? '· 暂无节点' : '· none');
  } else {
    for (const n of incursions.nodes.slice(0, 8)) {
      lines.push(`· ${pickLocalized(n.node, locale)}`);
    }
  }
  return lines.join('\n');
}
