import { createHash } from 'node:crypto';

/**
 * 将 openid / 群 id 等标识哈希为短指纹，便于关联日志且不落明文。
 *
 * @param value - 原始标识；空串返回 `empty`
 * @returns 以 `h_` 前缀的 12 位 hex 指纹
 */
export function hashLogId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'empty';
  }
  return `h_${createHash('sha256').update(trimmed).digest('hex').slice(0, 12)}`;
}
