/**
 * Lanius 共享视觉 token，供 Web UI 与 QQ 卡片栅格化共用。
 * Wave 0 起默认 Orokin 暗金（对齐 SDJK）；十六进制色值须与 `tokens.css` 保持同步。
 */
export const laniusTokens = {
  color: {
    /** Orokin 竖向底顶色 */
    void: '#0c0f16',
    panel: '#131823',
    panelRaised: '#181e2b',
    border: '#342f26',
    borderBright: '#7a643e',
    text: '#ece8de',
    textMuted: '#a8b0be',
    accent: '#d4b06a',
    accentDim: '#7a643e',
    warn: '#e8b26a',
    danger: '#d86458',
    success: '#6cc88a',
    brand: '#f0d79a',
    highlight: '#f0d79a',
    /** 入侵进度条：攻方 / 守方 */
    barAttack: '#6fd3e8',
    barDefend: '#d4b06a',
  },
  font: {
    display: '"Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif',
    body: '"Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  card: {
    /**
     * QQ 图片卡片逻辑宽度（对齐 SDJK 960–1260 中段；约 1000）。
     * Web 看板勿依赖此值做响应式断点。
     */
    width: 1000,
    /** 卡片外边距 */
    padding: 14,
    radius: 0,
    /** 宫格 / 列表间距 */
    gap: 6,
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
