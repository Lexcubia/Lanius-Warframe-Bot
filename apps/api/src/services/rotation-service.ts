import type {
  RotationWeaponDto,
  ValenceElement,
  WeaponRotationDto,
} from '@lanius/core';

import {
  parseValenceElement,
  resolveElementLabel,
} from '../adapters/worldstate/valence.js';
import { resolveWeaponLabel } from '../adapters/worldstate/resolve-labels.js';
import { lookupWeaponUniqueName } from '../adapters/worldstate/weapon-unique-names.js';
import type { LaniusDb } from '../db/client.js';
import { notFoundError, validationError } from '../lib/http-error.js';
import type { ItemIconService } from './item-icon-service.js';

/**
 * 轮换表行。
 */
export type RotationScheduleRow = {
  module_id: string;
  epoch_iso: string;
  period_days: number;
  items_json: string;
};

/**
 * 轮换表单条配置（兼容纯字符串旧数据）。
 */
export type RotationScheduleItem = {
  /** 武器英文名（轮换主键） */
  name: string;
  /** 可选 PublicExport uniqueName；缺省时查内置表 */
  uniqueName?: string;
  /** Valence 元素 */
  element?: ValenceElement;
  /** Valence 加成百分比 */
  bonusPct?: number;
};

/**
 * 武器轮换服务依赖。
 */
export type RotationServiceDeps = {
  db: LaniusDb;
  /** 可选：为武器条目填充官方图标 */
  itemIconService?: ItemIconService;
};

/**
 * 武器轮换服务（信条 / 终幕；数据来自 SQLite 可配置表）。
 * `items_json` 表示**当前档货架全部武器**（平级），周期仅控制 Valence 刷新倒计时。
 */
export class RotationService {
  private readonly db: LaniusDb;
  private readonly itemIconService?: ItemIconService;

  /**
   * @param deps - SQLite 与可选图标服务
   */
  constructor(deps: RotationServiceDeps) {
    this.db = deps.db;
    this.itemIconService = deps.itemIconService;
  }

  /**
   * 计算当前货架档（全部 offerings 平级 + 周期倒计时）。
   *
   * @param kind - tenet | coda
   * @param nowMs - 当前时间毫秒（可注入便于测试）
   * @returns WeaponRotationDto
   * @throws HttpError 表缺失或 items 非法时
   */
  async getRotation(
    kind: 'tenet' | 'coda',
    nowMs: number = Date.now(),
  ): Promise<WeaponRotationDto> {
    const moduleId = kind === 'tenet' ? 'tenetRotation' : 'codaRotation';
    const row = this.db.get<RotationScheduleRow>(
      'SELECT module_id, epoch_iso, period_days, items_json FROM rotation_schedules WHERE module_id = ?',
      [moduleId],
    );
    if (!row) {
      throw notFoundError(`Rotation schedule missing: ${moduleId}`);
    }

    const items = parseRotationItemsJson(row.items_json);
    if (items.length === 0) {
      throw validationError('Rotation items empty');
    }

    const epochMs = Date.parse(row.epoch_iso);
    if (!Number.isFinite(epochMs)) {
      throw validationError('Invalid rotation epoch_iso');
    }
    // 货架内容由 items_json 整体表示；周期只驱动「下次刷新」倒计时，不挑单把武器高亮。
    const periodMs = Math.max(1, row.period_days) * 86_400_000;
    const elapsed = Math.max(0, nowMs - epochMs);
    const periodStartMs = epochMs + Math.floor(elapsed / periodMs) * periodMs;
    const periodEndMs = periodStartMs + periodMs;
    const fetchedAt = new Date(nowMs).toISOString();

    let offerings = items.map(toRotationWeaponDto);
    if (this.itemIconService) {
      offerings = await this.itemIconService.enrichRotationWeapons(offerings);
    }

    return {
      kind,
      offerings,
      periodStart: new Date(periodStartMs).toISOString(),
      periodEnd: new Date(periodEndMs).toISOString(),
      remainingMs: Math.max(0, periodEndMs - nowMs),
      fetchedAt,
    };
  }

  /**
   * 列出轮换表配置（admin）。
   *
   * @returns 行列表
   */
  listSchedules(): RotationScheduleRow[] {
    return this.db.all<RotationScheduleRow>(
      'SELECT module_id, epoch_iso, period_days, items_json FROM rotation_schedules ORDER BY module_id',
    );
  }

  /**
   * 更新轮换表。
   *
   * @param moduleId - tenetRotation | codaRotation
   * @param payload - epoch / 周期 / 武器列表（字符串或结构化条目）
   * @returns 无返回值
   */
  upsertSchedule(
    moduleId: 'tenetRotation' | 'codaRotation',
    payload: {
      epochIso: string;
      periodDays: number;
      items: Array<string | RotationScheduleItem>;
    },
  ): void {
    if (!payload.items.length) {
      throw validationError('items required');
    }
    if (!Number.isFinite(Date.parse(payload.epochIso))) {
      throw validationError('epochIso invalid');
    }
    const normalized = payload.items.map(normalizeScheduleInput);
    this.db.run(
      `INSERT INTO rotation_schedules (module_id, epoch_iso, period_days, items_json)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(module_id) DO UPDATE SET
         epoch_iso = excluded.epoch_iso,
         period_days = excluded.period_days,
         items_json = excluded.items_json`,
      [
        moduleId,
        payload.epochIso,
        payload.periodDays,
        JSON.stringify(normalized),
      ],
    );
  }
}

/**
 * 解析 items_json（字符串数组或对象数组）。
 *
 * @param raw - SQLite 中的 JSON 文本
 * @returns 规范化条目列表
 * @throws HttpError JSON 非法时
 */
export function parseRotationItemsJson(raw: string): RotationScheduleItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw validationError('Invalid rotation items_json');
  }
  if (!Array.isArray(parsed)) {
    throw validationError('Rotation items empty');
  }
  const items: RotationScheduleItem[] = [];
  for (const entry of parsed) {
    const normalized = normalizeScheduleInput(entry);
    if (normalized.name) {
      items.push(normalized);
    }
  }
  return items;
}

/**
 * 将 admin / seed 入参规范为 RotationScheduleItem。
 *
 * @param entry - 字符串、对象，或 `Name | element | 45.2` 管道行
 * @returns 规范化条目
 */
export function normalizeScheduleInput(entry: unknown): RotationScheduleItem {
  if (typeof entry === 'string') {
    return parseScheduleLine(entry);
  }
  if (entry && typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    const name = String(row.name ?? '').trim();
    const uniqueName =
      typeof row.uniqueName === 'string' && row.uniqueName.trim()
        ? row.uniqueName.trim()
        : undefined;
    const element =
      typeof row.element === 'string'
        ? parseValenceElement(row.element)
        : undefined;
    const bonusRaw = row.bonusPct;
    const bonusPct =
      typeof bonusRaw === 'number' && Number.isFinite(bonusRaw)
        ? bonusRaw
        : typeof bonusRaw === 'string' && Number.isFinite(Number(bonusRaw))
          ? Number(bonusRaw)
          : undefined;
    return {
      name,
      ...(uniqueName ? { uniqueName } : {}),
      ...(element ? { element } : {}),
      ...(bonusPct !== undefined ? { bonusPct } : {}),
    };
  }
  return { name: '' };
}

/**
 * 解析 admin 文本行：`武器英文名` 或 `武器英文名 | heat | 45.2`。
 *
 * @param line - 单行配置
 * @returns 规范化条目
 */
function parseScheduleLine(line: string): RotationScheduleItem {
  const parts = line
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  const name = parts[0] ?? '';
  const element = parts[1] ? parseValenceElement(parts[1]) : undefined;
  const bonusPct =
    parts[2] !== undefined && Number.isFinite(Number(parts[2]))
      ? Number(parts[2])
      : undefined;
  return {
    name,
    ...(element ? { element } : {}),
    ...(bonusPct !== undefined ? { bonusPct } : {}),
  };
}

/**
 * 将配置条目映射为对外 RotationWeaponDto（尚未补图标 URL）。
 *
 * @param item - 轮换表条目
 * @returns DTO 片段
 */
function toRotationWeaponDto(item: RotationScheduleItem): RotationWeaponDto {
  const uniqueName =
    item.uniqueName?.trim() || lookupWeaponUniqueName(item.name);
  const name = resolveWeaponLabel(item.name, uniqueName);
  const dto: RotationWeaponDto = {
    name,
    ...(uniqueName ? { uniqueName } : {}),
  };
  if (item.element) {
    dto.element = item.element;
    dto.elementLabel = resolveElementLabel(item.element);
  }
  if (item.bonusPct !== undefined) {
    dto.bonusPct = item.bonusPct;
  }
  return dto;
}
