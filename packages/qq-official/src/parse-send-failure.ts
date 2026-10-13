/**
 * 从 OpenAPI 发信失败详情中解析出的结构化字段。
 */
export type ParsedQqSendFailure = {
  /** 业务/HTTP 错误码字符串（若可解析）。 */
  code?: string;
  /** 是否像被动回复窗口/次数超限。 */
  passiveWindowExceeded: boolean;
  /** 是否像频控/配额类失败。 */
  rateLimited: boolean;
  /** 原始 detail 截断摘要。 */
  summary: string;
};

/**
 * 从 `QqSendResult.detail` 解析错误码，便于日志分类（不改写原串）。
 *
 * @param detail - 客户端捕获的失败详情；可空
 * @returns 结构化分类结果
 */
export function parseQqSendFailure(detail: string | undefined): ParsedQqSendFailure {
  const raw = (detail ?? '').trim();
  const summary = raw.slice(0, 240) || 'unknown';
  const codeMatch = raw.match(/\bcode=([0-9]+)\b/i);
  const code = codeMatch?.[1];
  const passiveWindowExceeded =
    code === '40034128' ||
    code === '304103' ||
    code === '40034005' ||
    /被动回复|时间或次数超限|msg_id/i.test(raw);
  const rateLimited = code === '11264' || /rate|频控|频率|配额|limit=/i.test(raw);
  return {
    code,
    passiveWindowExceeded,
    rateLimited,
    summary,
  };
}
