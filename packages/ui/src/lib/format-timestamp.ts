/**
 * 将 ISO 时间字符串格式化为卡片时间戳（本地时区）。
 *
 * 时间展示遵循运行时本地时区（容器经 `TZ=Asia/Shanghai` 设为东八区）。
 * 通过 `Date` 解析而非字符串拼接，避免把 UTC 原文直接当本地时间展示。
 *
 * @param iso - ISO 8601 时间字符串（如 `2026-10-14T02:00:00.000Z`）
 * @returns `YYYY-MM-DD HH:mm:ss` 本地时间；解析失败时回退为去毫秒的原字符串
 */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.replace('T', ' ').replace(/\.\d+Z$/, '');
  }
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
