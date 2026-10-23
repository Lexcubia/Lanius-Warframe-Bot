/**
 * QQ 自定义 Markdown「参数指令」标签上限（官方文档：最大 100 字符）。
 * @see https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/trans/text-chain.html
 */
export const QQ_CMD_INPUT_MAX_CHARS = 100;

/**
 * 将字符串按 Unicode 码点截断到上限（官方「字符」按码点计更稳妥）。
 *
 * @param value - 原始串
 * @param maxChars - 最大码点数
 * @returns 截断后的串（未超限则原样）
 */
export function clampQqCmdChars(value: string, maxChars = QQ_CMD_INPUT_MAX_CHARS): string {
  const chars = Array.from(value);
  if (chars.length <= maxChars) {
    return value;
  }
  return chars.slice(0, maxChars).join('');
}

/**
 * 构造 Markdown 内嵌的「参数指令」标签：点击后把 `text` 插入输入框，**不**自动 @ 机器人。
 *
 * @param options - 插入正文与展示文案
 * @returns 如 `<qqbot-cmd-input text="%2Fw%20…" show="%E7%A7%81%E8%81%8A1" reference="false" />`
 */
export function qqCmdInputTag(options: {
  /** 点击后插入输入框的文本（会自动截断并 urlencode） */
  text: string;
  /** 消息内可见标签；缺省用 text */
  show?: string;
  /** 是否带引用本消息；默认 false */
  reference?: boolean;
}): string {
  const text = clampQqCmdChars(options.text.trim());
  const showRaw = (options.show ?? text).trim() || text;
  const show = clampQqCmdChars(showRaw);
  const reference = options.reference === true ? 'true' : 'false';
  return `<qqbot-cmd-input text="${encodeURIComponent(text)}" show="${encodeURIComponent(show)}" reference="${reference}" />`;
}
