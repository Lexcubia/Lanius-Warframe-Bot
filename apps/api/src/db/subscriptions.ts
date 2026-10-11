import {
  PushFrequencySchema,
  SubscribableModuleIdSchema,
  type PushFrequency,
  type SubscribableModuleId,
  type SubscriptionDto,
} from '@lanius/core';

import type { LaniusDb } from './client.js';

/**
 * 订阅表行。
 */
export type SubscriptionRow = {
  id: number;
  scene: string;
  target_id: string;
  module_id: string;
  enabled: number;
  frequency: string;
  last_fingerprint: string | null;
  last_pushed_at: string | null;
  created_at: string;
};

/**
 * 将行映射为 DTO。
 *
 * @param row - SQLite 行
 * @returns SubscriptionDto
 */
export function toSubscriptionDto(row: SubscriptionRow): SubscriptionDto {
  return {
    id: row.id,
    scene: row.scene as 'group' | 'c2c',
    targetId: row.target_id,
    moduleId: SubscribableModuleIdSchema.parse(row.module_id),
    enabled: row.enabled === 1,
    frequency: PushFrequencySchema.parse(row.frequency),
    lastPushedAt: row.last_pushed_at,
    createdAt: row.created_at,
  };
}

/**
 * 列出全部订阅（admin）。
 *
 * @param db - 数据库
 * @returns DTO 列表
 */
export function listAllSubscriptions(db: LaniusDb): SubscriptionDto[] {
  const rows = db.all<SubscriptionRow>(
    `SELECT id, scene, target_id, module_id, enabled, frequency,
            last_fingerprint, last_pushed_at, created_at
     FROM subscriptions ORDER BY id DESC`,
  );
  return rows.map(toSubscriptionDto);
}

/**
 * 按场景目标列出订阅。
 *
 * @param db - 数据库
 * @param scene - group | c2c
 * @param targetId - 群/私聊 openid
 * @returns DTO 列表
 */
export function listSubscriptionsForTarget(
  db: LaniusDb,
  scene: 'group' | 'c2c',
  targetId: string,
): SubscriptionDto[] {
  const rows = db.all<SubscriptionRow>(
    `SELECT id, scene, target_id, module_id, enabled, frequency,
            last_fingerprint, last_pushed_at, created_at
     FROM subscriptions WHERE scene = ? AND target_id = ? ORDER BY id ASC`,
    [scene, targetId],
  );
  return rows.map(toSubscriptionDto);
}

/**
 * 列出启用中的订阅（推送 tick）。
 *
 * @param db - 数据库
 * @returns 含 fingerprint 的行
 */
export function listEnabledSubscriptionRows(db: LaniusDb): SubscriptionRow[] {
  return db.all<SubscriptionRow>(
    `SELECT id, scene, target_id, module_id, enabled, frequency,
            last_fingerprint, last_pushed_at, created_at
     FROM subscriptions WHERE enabled = 1 ORDER BY id ASC`,
  );
}

/**
 * 创建或更新订阅。
 *
 * @param db - 数据库
 * @param input - 场景、模块、频率
 * @returns 最新 DTO
 */
export function upsertSubscription(
  db: LaniusDb,
  input: {
    scene: 'group' | 'c2c';
    targetId: string;
    moduleId: SubscribableModuleId;
    frequency: PushFrequency;
    enabled?: boolean;
  },
): SubscriptionDto {
  const now = new Date().toISOString();
  const enabled = input.enabled === undefined ? 1 : input.enabled ? 1 : 0;
  db.run(
    `INSERT INTO subscriptions
      (scene, target_id, module_id, enabled, frequency, last_fingerprint, last_pushed_at, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)
     ON CONFLICT(scene, target_id, module_id) DO UPDATE SET
       enabled = excluded.enabled,
       frequency = excluded.frequency`,
    [input.scene, input.targetId, input.moduleId, enabled, input.frequency, now],
  );
  const row = db.get<SubscriptionRow>(
    `SELECT id, scene, target_id, module_id, enabled, frequency,
            last_fingerprint, last_pushed_at, created_at
     FROM subscriptions WHERE scene = ? AND target_id = ? AND module_id = ?`,
    [input.scene, input.targetId, input.moduleId],
  );
  if (!row) {
    throw new Error('upsert subscription failed');
  }
  return toSubscriptionDto(row);
}

/**
 * 按场景关闭某模块订阅。
 *
 * @param db - 数据库
 * @param scene - 场景
 * @param targetId - 目标
 * @param moduleId - 模块
 * @returns 是否更新到行
 */
export function disableSubscription(
  db: LaniusDb,
  scene: 'group' | 'c2c',
  targetId: string,
  moduleId: SubscribableModuleId,
): boolean {
  const before = db.get<{ id: number }>(
    'SELECT id FROM subscriptions WHERE scene = ? AND target_id = ? AND module_id = ?',
    [scene, targetId, moduleId],
  );
  if (!before) {
    return false;
  }
  db.run(
    'UPDATE subscriptions SET enabled = 0 WHERE scene = ? AND target_id = ? AND module_id = ?',
    [scene, targetId, moduleId],
  );
  return true;
}

/**
 * 按 id 更新订阅。
 *
 * @param db - 数据库
 * @param id - 订阅 id
 * @param patch - 字段补丁
 * @returns 更新后 DTO；不存在则 undefined
 */
export function patchSubscription(
  db: LaniusDb,
  id: number,
  patch: { enabled?: boolean; frequency?: PushFrequency },
): SubscriptionDto | undefined {
  const row = db.get<SubscriptionRow>(
    `SELECT id, scene, target_id, module_id, enabled, frequency,
            last_fingerprint, last_pushed_at, created_at
     FROM subscriptions WHERE id = ?`,
    [id],
  );
  if (!row) {
    return undefined;
  }
  const enabled =
    patch.enabled === undefined ? row.enabled : patch.enabled ? 1 : 0;
  const frequency = patch.frequency ?? row.frequency;
  db.run('UPDATE subscriptions SET enabled = ?, frequency = ? WHERE id = ?', [
    enabled,
    frequency,
    id,
  ]);
  return toSubscriptionDto({ ...row, enabled, frequency });
}

/**
 * 删除订阅。
 *
 * @param db - 数据库
 * @param id - id
 * @returns 是否删除
 */
export function deleteSubscription(db: LaniusDb, id: number): boolean {
  const row = db.get<{ id: number }>('SELECT id FROM subscriptions WHERE id = ?', [
    id,
  ]);
  if (!row) {
    return false;
  }
  db.run('DELETE FROM subscriptions WHERE id = ?', [id]);
  return true;
}

/**
 * 推送成功后写入指纹与时间。
 *
 * @param db - 数据库
 * @param id - 订阅 id
 * @param fingerprint - 内容指纹
 * @param pushedAt - 推送时间 ISO
 * @returns 无返回值
 */
export function markSubscriptionPushed(
  db: LaniusDb,
  id: number,
  fingerprint: string,
  pushedAt: string,
): void {
  db.run(
    'UPDATE subscriptions SET last_fingerprint = ?, last_pushed_at = ? WHERE id = ?',
    [fingerprint, pushedAt, id],
  );
}
