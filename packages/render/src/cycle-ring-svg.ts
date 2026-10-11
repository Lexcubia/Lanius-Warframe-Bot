/**
 * 开放世界周期环形进度：生成完整 SVG（含双色弧与指示点），供 Satori 以 img 嵌入。
 * 避免依赖 Satori 对内联 `<svg>` / `stroke-dasharray` 的不完整支持。
 */

/**
 * 周期环绘图入参。
 */
export type CycleRingSvgInput = {
  /** 当前状态已流逝比例 `[0,1]` */
  progress: number;
  /** 当前状态强调色（弧 + 指示点） */
  activeColor: string;
  /** 剩余段 / 轨道色 */
  trackColor: string;
  /** 环心简写（1–2 字符） */
  glyph: string;
  /** 画布边长（像素） */
  size?: number;
};

/**
 * 将周期进度绘制为独立 SVG，并返回 data URL。
 *
 * @param input - 进度、配色与中心字
 * @returns `data:image/svg+xml;base64,…`
 */
export function buildCycleRingDataUrl(input: CycleRingSvgInput): string {
  const size = input.size ?? 72;
  const progress = Math.max(0, Math.min(1, input.progress));
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.max(5, Math.round(size * 0.1));
  const r = (size - stroke) / 2 - 1;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + progress * Math.PI * 2;

  const track = circlePath(cx, cy, r);
  const activeArc =
    progress <= 0.001
      ? ''
      : progress >= 0.999
        ? track
        : describeArc(cx, cy, r, startAngle, endAngle);

  const thumb = polar(cx, cy, r, endAngle);
  const glyphSize = Math.round(size * 0.28);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<path d="${track}" fill="none" stroke="${escapeXml(input.trackColor)}" stroke-width="${stroke}" stroke-linecap="round"/>`,
    activeArc
      ? `<path d="${activeArc}" fill="none" stroke="${escapeXml(input.activeColor)}" stroke-width="${stroke}" stroke-linecap="round"/>`
      : '',
    `<circle cx="${thumb.x.toFixed(2)}" cy="${thumb.y.toFixed(2)}" r="${(stroke * 0.55).toFixed(2)}" fill="${escapeXml(input.activeColor)}" stroke="#ffffff" stroke-width="2"/>`,
    `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Rajdhani, sans-serif" font-size="${glyphSize}" font-weight="700" fill="${escapeXml(input.activeColor)}">${escapeXml(input.glyph)}</text>`,
    `</svg>`,
  ].join('');

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

/**
 * 完整圆环 path（供轨道或接近满环时使用）。
 *
 * @param cx - 圆心 x
 * @param cy - 圆心 y
 * @param r - 半径
 * @returns SVG path `d`
 */
function circlePath(cx: number, cy: number, r: number): string {
  // 两段 180° 弧拼成闭合圆，避免单弧 large-arc 歧义
  return [
    `M ${cx + r} ${cy}`,
    `A ${r} ${r} 0 1 1 ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 1 ${cx + r} ${cy}`,
  ].join(' ');
}

/**
 * 描述从 `start` 到 `end` 的圆弧（弧度，数学坐标系）。
 *
 * @param cx - 圆心 x
 * @param cy - 圆心 y
 * @param r - 半径
 * @param start - 起始弧度
 * @param end - 结束弧度
 * @returns SVG path `d`
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const delta = ((end - start) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const largeArc = delta > Math.PI ? 1 : 0;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

/**
 * 极坐标转笛卡尔。
 *
 * @param cx - 圆心 x
 * @param cy - 圆心 y
 * @param r - 半径
 * @param angle - 弧度（0 = 正右，逆时针）
 * @returns 点坐标
 */
function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/**
 * 转义 SVG / XML 文本与属性值。
 *
 * @param value - 原始字符串
 * @returns 转义后字符串
 */
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
