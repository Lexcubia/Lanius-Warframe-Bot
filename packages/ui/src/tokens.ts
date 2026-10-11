/**
 * Lanius 共享视觉 token，供 Web UI 与 QQ 卡片栅格化共用。
 * 暖底动漫风（对齐公开站 anime 主题）；十六进制色值须与 `tokens.css` 保持同步。
 */
export const laniusTokens = {
  color: {
    /** 暖奶油底 */
    void: '#fff8f2',
    panel: '#ffffff',
    panelRaised: '#fff4eb',
    border: '#e4d5c8',
    borderBright: '#c9b8a8',
    text: '#2a3142',
    textMuted: '#6b7385',
    accent: '#4eb7e8',
    accentDim: '#2f8fc4',
    warn: '#f0b429',
    danger: '#ff7a6e',
    success: '#5fd0b0',
    brand: '#2a3142',
    highlight: '#ff7a6e',
    /** 入侵进度条：攻方 / 守方 */
    barAttack: '#4eb7e8',
    barDefend: '#ffb38a',
  },
  font: {
    display: '"Zen Maru Gothic", "Noto Sans SC", sans-serif',
    body: '"Noto Sans SC", "Source Sans 3", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  card: {
    /**
     * QQ 图片卡片逻辑宽度（移动端聊天气泡友好；约等于常见手机内容区）。
     * Web 看板勿依赖此值做响应式断点。
     */
    width: 640,
    /** 卡片外边距（内容区尽量铺满） */
    padding: 12,
    radius: 16,
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
