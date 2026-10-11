/**
 * Lanius 共享视觉 token，供 Web UI 与 QQ 卡片栅格化共用。
 * 浅色清新工具站气质；十六进制色值须与 `tokens.css` 保持同步。
 */
export const laniusTokens = {
  color: {
    /** 浅青底，对齐 worldstate.wf.wiki 工具站气质 */
    void: '#eef6fb',
    panel: '#ffffff',
    panelRaised: '#f5fafd',
    border: '#cfe3f0',
    borderBright: '#9ec9e0',
    text: '#1a3348',
    textMuted: '#5a7388',
    accent: '#3aa7d6',
    accentDim: '#2b8fc4',
    warn: '#f0a030',
    danger: '#e25555',
    success: '#2fbf7a',
    brand: '#2486bb',
    highlight: '#f07a45',
    /** 入侵进度条：攻方 / 守方 */
    barAttack: '#3aa7d6',
    barDefend: '#f0a030',
  },
  font: {
    display: '"Sora", "Noto Sans SC", sans-serif',
    body: '"Source Sans 3", "Noto Sans SC", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  card: {
    /**
     * QQ 图片卡片逻辑宽度（移动端聊天气泡友好；约等于常见手机内容区）。
     * Web 看板勿依赖此值做响应式断点。
     */
    width: 640,
    /** 卡片外边距（内容区尽量铺满） */
    padding: 10,
    radius: 12,
    /** 宫格 / 列表间距 */
    gap: 8,
  },
} as const;

/**
 * 只读 token 映射类型，供需要类型化访问的消费者使用。
 */
export type LaniusTokens = typeof laniusTokens;

/**
 * 生成可嵌入 SVG/HTML 的 CSS 自定义属性声明。
 *
 * @returns 分号分隔的 CSS 变量赋值（不含外层花括号）。
 */
export function tokensAsCssVariables(): string {
  return [
    `--lanius-void: ${laniusTokens.color.void}`,
    `--lanius-panel: ${laniusTokens.color.panel}`,
    `--lanius-panel-raised: ${laniusTokens.color.panelRaised}`,
    `--lanius-border: ${laniusTokens.color.border}`,
    `--lanius-border-bright: ${laniusTokens.color.borderBright}`,
    `--lanius-text: ${laniusTokens.color.text}`,
    `--lanius-text-muted: ${laniusTokens.color.textMuted}`,
    `--lanius-accent: ${laniusTokens.color.accent}`,
    `--lanius-accent-dim: ${laniusTokens.color.accentDim}`,
    `--lanius-warn: ${laniusTokens.color.warn}`,
    `--lanius-danger: ${laniusTokens.color.danger}`,
    `--lanius-success: ${laniusTokens.color.success}`,
    `--lanius-brand: ${laniusTokens.color.brand}`,
    `--lanius-highlight: ${laniusTokens.color.highlight}`,
    `--lanius-bar-attack: ${laniusTokens.color.barAttack}`,
    `--lanius-bar-defend: ${laniusTokens.color.barDefend}`,
  ].join('; ');
}
