import type { ModuleId } from '@lanius/core';

import type { LaniusDb } from '../db/client.js';
import { listAclRules, listModuleSettings } from '../db/repositories.js';
import { forbiddenError } from '../lib/http-error.js';

/**
 * 门禁裁决上下文（QQ 场景）。
 */
export type GateContext = {
  scene: 'group' | 'c2c' | 'web' | 'system';
  targetId: string;
  userId: string;
  moduleId: ModuleId;
};

/**
 * 判断模块是否允许执行。
 *
 * 优先级：deny > allow；group/c2c 规则 > global；无规则默认允许。
 * `mode` 模块始终放行。
 *
 * @param db - SQLite
 * @param ctx - 场景上下文
 * @returns 允许时无返回；拒绝时抛 HttpError
 * @throws HttpError 拒绝访问时
 */
export function assertModuleAllowed(db: LaniusDb, ctx: GateContext): void {
  if (ctx.moduleId === 'mode') {
    return;
  }

  const settings = listModuleSettings(db);
  const setting = settings.find((row) => row.module_id === ctx.moduleId);
  if (setting && setting.enabled !== 1) {
    throw forbiddenError(`Module disabled: ${ctx.moduleId}`);
  }

  const rules = listAclRules(db);
  const applicable = rules.filter((rule) => {
    if (rule.scope === 'global') {
      return true;
    }
    if (rule.scope === ctx.scene && rule.target_id === ctx.targetId) {
      return true;
    }
    return false;
  });

  // 更具体 scope 优先：非 global 排前
  applicable.sort((a, b) => {
    const score = (scope: string) => (scope === 'global' ? 0 : 1);
    return score(b.scope) - score(a.scope);
  });

  let decision: 'allow' | 'deny' | null = null;
  for (const rule of applicable) {
    if (rule.subject === 'module' && rule.module_id === ctx.moduleId) {
      decision = rule.effect === 'deny' ? 'deny' : 'allow';
      if (decision === 'deny') {
        break;
      }
    }
    if (rule.subject === 'user' && rule.user_openid === ctx.userId) {
      decision = rule.effect === 'deny' ? 'deny' : 'allow';
      if (decision === 'deny') {
        break;
      }
    }
  }

  if (decision === 'deny') {
    throw forbiddenError(`ACL denied module=${ctx.moduleId}`);
  }
}
