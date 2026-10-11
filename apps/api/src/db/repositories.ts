import {
  ModuleIdSchema,
  type HelpDto,
  type ModuleId,
  buildHelpDto,
  resolveModuleToken,
} from '@lanius/core';

import type { LaniusDb } from './client.js';

/**
 * 模块开关行。
 */
export type ModuleSettingRow = {
  module_id: string;
  enabled: number;
  sort_order: number;
  help_override_json: string | null;
};

/**
 * ACL 规则行。
 */
export type AclRuleRow = {
  id: number;
  scope: string;
  target_id: string;
  subject: string;
  effect: string;
  module_id: string | null;
  user_openid: string | null;
  created_at: string;
};

/**
 * 审计事件写入入参。
 */
export type AuditEventInput = {
  scene: string;
  targetId: string;
  userId: string;
  moduleId: string;
  outcome: string;
  latencyMs: number;
  requestId: string;
  detail?: string;
};

/**
 * 列出全部模块设置。
 *
 * @param db - 数据库
 * @returns 行列表
 */
export function listModuleSettings(db: LaniusDb): ModuleSettingRow[] {
  return db.all<ModuleSettingRow>(
    'SELECT module_id, enabled, sort_order, help_override_json FROM module_settings ORDER BY sort_order ASC',
  );
}

/**
 * 更新模块开关。
 *
 * @param db - 数据库
 * @param moduleId - 模块 id
 * @param enabled - 是否启用
 * @returns 无返回值
 */
export function setModuleEnabled(
  db: LaniusDb,
  moduleId: ModuleId,
  enabled: boolean,
): void {
  db.run('UPDATE module_settings SET enabled = ? WHERE module_id = ?', [
    enabled ? 1 : 0,
    moduleId,
  ]);
}

/**
 * 启用的模块 id 集合。
 *
 * @param db - 数据库
 * @returns Set
 */
export function enabledModuleIdSet(db: LaniusDb): Set<string> {
  const rows = listModuleSettings(db);
  return new Set(rows.filter((row) => row.enabled === 1).map((row) => row.module_id));
}

/**
 * 从 DB + 目录构建帮助 DTO。
 *
 * @param db - 数据库
 * @param moduleToken - 可选模块 token
 * @returns HelpDto
 */
export function buildHelpFromDb(db: LaniusDb, moduleToken?: string): HelpDto {
  const enabled = enabledModuleIdSet(db);
  const moduleId = moduleToken ? resolveModuleToken(moduleToken) : undefined;
  const base = buildHelpDto({
    moduleId,
    enabledIds: enabled,
  });

  const menu = db.get<{
    title_zh: string;
    title_en: string;
    intro_zh: string;
    intro_en: string;
    visible_module_ids_json: string;
  }>('SELECT * FROM help_menu WHERE id = 1');

  if (!menu || moduleId) {
    return base;
  }

  let visible: string[] = [];
  try {
    visible = JSON.parse(menu.visible_module_ids_json) as string[];
  } catch {
    visible = [...enabled];
  }
  const visibleSet = new Set(visible.filter((id) => enabled.has(id)));
  return {
    title: { zh: menu.title_zh, en: menu.title_en },
    intro: { zh: menu.intro_zh, en: menu.intro_en },
    lines: base.lines.filter((line) => visibleSet.has(line.id)),
  };
}

/**
 * 更新帮助菜单文案与可见模块。
 *
 * @param db - 数据库
 * @param payload - 菜单字段
 * @returns 无返回值
 */
export function updateHelpMenu(
  db: LaniusDb,
  payload: {
    titleZh: string;
    titleEn: string;
    introZh: string;
    introEn: string;
    visibleModuleIds: string[];
  },
): void {
  db.run(
    `UPDATE help_menu SET title_zh=?, title_en=?, intro_zh=?, intro_en=?, visible_module_ids_json=?
     WHERE id = 1`,
    [
      payload.titleZh,
      payload.titleEn,
      payload.introZh,
      payload.introEn,
      JSON.stringify(payload.visibleModuleIds),
    ],
  );
}

/**
 * 列出 ACL。
 *
 * @param db - 数据库
 * @returns 规则列表
 */
export function listAclRules(db: LaniusDb): AclRuleRow[] {
  return db.all<AclRuleRow>(
    `SELECT id, scope, target_id, subject, effect, module_id, user_openid, created_at
     FROM acl_rules ORDER BY id DESC`,
  );
}

/**
 * 新增 ACL 规则。
 *
 * @param db - 数据库
 * @param rule - 规则字段
 * @returns 新 id
 */
export function insertAclRule(
  db: LaniusDb,
  rule: {
    scope: 'global' | 'group' | 'c2c';
    targetId: string;
    subject: 'module' | 'user';
    effect: 'allow' | 'deny';
    moduleId?: string;
    userOpenid?: string;
  },
): number {
  if (rule.moduleId) {
    ModuleIdSchema.parse(rule.moduleId);
  }
  db.run(
    `INSERT INTO acl_rules (scope, target_id, subject, effect, module_id, user_openid, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      rule.scope,
      rule.targetId,
      rule.subject,
      rule.effect,
      rule.moduleId ?? null,
      rule.userOpenid ?? null,
      new Date().toISOString(),
    ],
  );
  const row = db.get<{ id: number }>('SELECT last_insert_rowid() AS id');
  return row?.id ?? 0;
}

/**
 * 删除 ACL。
 *
 * @param db - 数据库
 * @param id - 规则 id
 * @returns 无返回值
 */
export function deleteAclRule(db: LaniusDb, id: number): void {
  db.run('DELETE FROM acl_rules WHERE id = ?', [id]);
}

/**
 * 写入审计事件。
 *
 * @param db - 数据库
 * @param event - 事件
 * @returns 无返回值
 */
export function writeAuditEvent(db: LaniusDb, event: AuditEventInput): void {
  db.run(
    `INSERT INTO audit_events
      (ts, scene, target_id, user_id, module_id, outcome, latency_ms, request_id, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      new Date().toISOString(),
      event.scene,
      event.targetId,
      event.userId,
      event.moduleId,
      event.outcome,
      event.latencyMs,
      event.requestId,
      event.detail ?? '',
    ],
  );
}

/**
 * 查询审计（最新优先）。
 *
 * @param db - 数据库
 * @param limit - 条数上限
 * @returns 行列表
 */
export function listAuditEvents(
  db: LaniusDb,
  limit = 100,
): Array<Record<string, unknown>> {
  return db.all(
    `SELECT id, ts, scene, target_id, user_id, module_id, outcome, latency_ms, request_id, detail
     FROM audit_events ORDER BY id DESC LIMIT ?`,
    [limit],
  );
}
