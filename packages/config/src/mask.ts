import {
  MODULE_FIELD_META,
  SECRET_MASK,
  type ConfigModuleId,
} from './modules.js';

/**
 * 按点分路径读取对象字段。
 *
 * @param obj - 对象
 * @param path - 如 `upstream.timeoutMs`
 * @returns 值或 undefined
 */
export function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || typeof cur !== 'object') {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * 按点分路径设置对象字段（就地修改）。
 *
 * @param obj - 可变对象
 * @param path - 点分路径
 * @param value - 新值
 * @returns 无返回值
 */
export function setByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i] ?? '';
    const next = cur[key];
    if (next === null || typeof next !== 'object' || Array.isArray(next)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (last) {
    cur[last] = value;
  }
}

/**
 * 将模块配置中的密钥字段替换为掩码（深拷贝）。
 *
 * @param moduleId - 模块 id
 * @param data - 已解析配置
 * @returns 掩码后的纯对象
 */
export function maskSecrets(
  moduleId: ConfigModuleId,
  data: unknown,
): Record<string, unknown> {
  const clone = structuredClone(data) as Record<string, unknown>;
  const meta = MODULE_FIELD_META[moduleId];
  for (const [path, field] of Object.entries(meta)) {
    if (!field.secret) {
      continue;
    }
    const current = getByPath(clone, path);
    if (typeof current === 'string' && current.length > 0) {
      setByPath(clone, path, SECRET_MASK);
    }
  }
  return clone;
}

/**
 * 合并写入：掩码或空串表示保留原密钥。
 *
 * @param moduleId - 模块 id
 * @param previous - 当前真实配置
 * @param incoming - 客户端提交（可能含掩码）
 * @returns 可落盘的对象
 */
export function preserveSecretsOnWrite(
  moduleId: ConfigModuleId,
  previous: unknown,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const next = structuredClone(incoming);
  const meta = MODULE_FIELD_META[moduleId];
  for (const [path, field] of Object.entries(meta)) {
    if (!field.secret) {
      continue;
    }
    const submitted = getByPath(next, path);
    if (
      submitted === undefined ||
      submitted === '' ||
      submitted === SECRET_MASK
    ) {
      const old = getByPath(previous, path);
      if (old !== undefined) {
        setByPath(next, path, old);
      } else {
        // 删除空掩码键，避免写成 ********
        const parts = path.split('.');
        let cur: Record<string, unknown> | undefined = next;
        for (let i = 0; i < parts.length - 1; i += 1) {
          const key = parts[i] ?? '';
          const child = cur?.[key];
          if (!child || typeof child !== 'object') {
            cur = undefined;
            break;
          }
          cur = child as Record<string, unknown>;
        }
        const last = parts[parts.length - 1];
        if (cur && last) {
          delete cur[last];
        }
      }
    }
  }
  return next;
}

/**
 * 列出模块中需重启进程的字段路径。
 *
 * @param moduleId - 模块 id
 * @returns 路径列表
 */
export function listRestartRequiredFields(moduleId: ConfigModuleId): string[] {
  return Object.entries(MODULE_FIELD_META[moduleId])
    .filter(([, field]) => field.restartRequired)
    .map(([path]) => path);
}
