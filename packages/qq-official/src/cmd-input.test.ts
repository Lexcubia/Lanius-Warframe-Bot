import { describe, expect, it } from 'vitest';

import { clampQqCmdChars, qqCmdInputTag, QQ_CMD_INPUT_MAX_CHARS } from './cmd-input.js';

describe('clampQqCmdChars', () => {
  it('keeps short strings', () => {
    expect(clampQqCmdChars('abc')).toBe('abc');
  });

  it('truncates by code point', () => {
    const long = 'あ'.repeat(QQ_CMD_INPUT_MAX_CHARS + 5);
    expect(Array.from(clampQqCmdChars(long)).length).toBe(QQ_CMD_INPUT_MAX_CHARS);
  });
});

describe('qqCmdInputTag', () => {
  it('builds urlencoded tag without @bot', () => {
    const tag = qqCmdInputTag({
      text: '/w SellerA Hi',
      show: '私聊1',
    });
    expect(tag).toContain('<qqbot-cmd-input');
    expect(tag).toContain('reference="false"');
    expect(tag).toContain(`text="${encodeURIComponent('/w SellerA Hi')}"`);
    expect(tag).toContain(`show="${encodeURIComponent('私聊1')}"`);
    expect(tag).not.toContain('@');
  });
});
