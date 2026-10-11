import { createHash } from 'node:crypto';

import {
  pickLocalized,
  type Locale,
  type PushDispatchDto,
  type PushFrequency,
  type Realm,
  type SubscribableModuleId,
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
 * 按订阅频率检查变更并生成 QQ 下行文本。
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

    const snapshots = await this.buildSnapshots();
    const due: PushPending[] = [];

    for (const row of rows) {
      const moduleId = row.module_id as SubscribableModuleId;
      const snap = snapshots[moduleId];
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
    markSubscriptionPushed(
      this.db,
      subscriptionId,
      fingerprint,
      new Date().toISOString(),
    );
  }

  /**
   * 为各可订阅模块构建指纹与推送文案。
   *
   * @returns 模块 → 快照
   */
  private async buildSnapshots(): Promise<
    Partial<Record<SubscribableModuleId, { fingerprint: string; text: string }>>
  > {
    const locale = this.locale;
    const realm = this.realm;
    const out: Partial<
      Record<SubscribableModuleId, { fingerprint: string; text: string }>
    > = {};

    const ws = await this.worldstateService.getWorldstate(realm, locale);
    const fissureKey = ws.data.fissures
      .map(
        (f) =>
          `${f.id}|${f.node.en}|${f.missionType.en}|${f.era}|${f.path}|${f.expiry}`,
      )
      .sort()
      .join(';');
    out.fissures = {
      fingerprint: hashFingerprint(fissureKey),
      text: formatFissuresPush(ws.data.fissures, locale),
    };

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

    const tenet = await this.rotationService.getRotation('tenet');
    out.tenetRotation = {
      fingerprint: hashFingerprint(
        `${tenet.periodEnd}|${tenet.offerings.map((o) => `${o.name.en}:${o.element ?? ''}:${o.bonusPct ?? ''}`).join('|')}`,
      ),
      text: formatRotationPush(tenet, locale),
    };

    const coda = await this.rotationService.getRotation('coda');
    out.codaRotation = {
      fingerprint: hashFingerprint(
        `${coda.periodEnd}|${coda.offerings.map((o) => `${o.name.en}:${o.element ?? ''}:${o.bonusPct ?? ''}`).join('|')}`,
      ),
      text: formatRotationPush(coda, locale),
    };

    return out;
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
 * 裂隙推送文案（精简）。
 *
 * @param fissures - 裂隙列表
 * @param locale - 语言
 * @returns 文本
 */
function formatFissuresPush(
  fissures: Array<{
    node: { zh: string; en: string };
    missionType: { zh: string; en: string };
    eraLabel: { zh: string; en: string };
    pathLabel: { zh: string; en: string };
    remainingMs: number;
  }>,
  locale: Locale,
): string {
  const zh = locale === 'zh';
  const lines = [zh ? '【Lanius · 裂隙推送】' : '[Lanius · Fissures]'];
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
    zh
      ? `约 ${days} 天后刷新 Valence`
      : `Valence refreshes in ~${days}d`,
  ];
  for (const weapon of data.offerings) {
    const name = pickLocalized(weapon.name, locale);
    const el = weapon.elementLabel
      ? pickLocalized(weapon.elementLabel, locale)
      : '';
    const pct =
      weapon.bonusPct != null
        ? `${Number(weapon.bonusPct.toFixed(1))}%`
        : '';
    const valence = [el, pct].filter(Boolean).join(' ');
    lines.push(valence ? `· ${name} [${valence}]` : `· ${name}`);
  }
  return lines.join('\n');
}
