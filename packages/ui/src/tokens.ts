/**
 * Lanius 共享视觉 token，供 Web UI 与 QQ 卡片栅格化共用。
 * 浅色清新工具站气质；十六进制色值须与 `tokens.css` 保持同步。
 */
export const laniusTokens = {
  color: {
    void: '#f3f8fc',
    panel: '#ffffff',
    panelRaised: '#f7fbff',
    border: '#d5e4f0',
    borderBright: '#b7cfe0',
    text: '#1c2f42',
    textMuted: '#5d7388',
    accent: '#14b8a6',
    accentDim: '#0d9488',
    warn: '#f59e0b',
    danger: '#ef4444',
    success: '#22c55e',
    brand: '#0f766e',
    highlight: '#ff7a59',
  },
  font: {
    display: '"Sora", "Noto Sans SC", sans-serif',
    body: '"Source Sans 3", "Noto Sans SC", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  card: {
    width: 720,
    padding: 28,
    radius: 14,
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
  ].join('; ');
}
