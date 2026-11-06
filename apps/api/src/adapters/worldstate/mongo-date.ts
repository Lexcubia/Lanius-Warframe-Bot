/**
 * 解析官方 worldState Mongo 风格 `$date.$numberLong` 为毫秒时间戳。
 *
 * @param stamp - 上游时间戳对象（可缺省）
 * @returns 有限毫秒；非法或缺省时 `undefined`
 */
export function parseMongoMs(
  stamp?: { $date?: { $numberLong?: string } } | number | string | null,
): number | undefined {
  if (stamp == null) {
    return undefined;
  }
  if (typeof stamp === 'number') {
    return Number.isFinite(stamp) ? stamp : undefined;
  }
  if (typeof stamp === 'string') {
    const n = Number(stamp);
    return Number.isFinite(n) ? n : undefined;
  }
  const raw = stamp.$date?.$numberLong;
  if (raw == null) {
    return undefined;
  }
  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : undefined;
}

/**
 * 将 Mongo 时间戳转为 ISO8601；非法时返回 `undefined`。
 *
 * @param stamp - 上游时间戳
 * @returns ISO 字符串或 `undefined`
 */
export function mongoToIso(
  stamp?: { $date?: { $numberLong?: string } } | number | string | null,
): string | undefined {
  const ms = parseMongoMs(stamp);
  if (ms === undefined) {
    return undefined;
  }
  return new Date(ms).toISOString();
}
