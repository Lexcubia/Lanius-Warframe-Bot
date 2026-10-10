import { describe, expect, it } from 'vitest';

import { laniusTokens, tokensAsCssVariables } from './tokens.js';

describe('laniusTokens', () => {
  it('暴露 accent / void 等共享色值', () => {
    expect(laniusTokens.color.accent).toMatch(/^#/);
    expect(laniusTokens.color.void).toMatch(/^#/);
  });

  it('序列化可供 SVG/HTML 嵌入的 CSS 变量', () => {
    const css = tokensAsCssVariables();
    expect(css).toContain('--lanius-accent:');
    expect(css).toContain(laniusTokens.color.accent);
  });
});
