import { describe, expect, it } from 'vitest';

import { parseCommand } from './parse-command.js';

describe('parseCommand', () => {
  it('ignores plain chat without a command root', () => {
    expect(parseCommand('hello').matched).toBe(false);
    expect(parseCommand('wf 世界状态').matched).toBe(false);
  });

  it('parses independent roots with optional slash', () => {
    expect(parseCommand('世界状态').intent).toEqual({ type: 'worldstate' });
    expect(parseCommand('/worldstate').intent).toEqual({ type: 'worldstate' });
    expect(parseCommand('/WS').intent).toEqual({ type: 'worldstate' });
    expect(parseCommand('/入侵').intent).toEqual({ type: 'invasions' });
    expect(parseCommand('/虚空裂隙').intent).toEqual({ type: 'fissures' });
    expect(parseCommand('裂隙').intent).toEqual({ type: 'fissures' });
    expect(parseCommand('午夜电波').intent).toEqual({ type: 'nightwave' });
    expect(parseCommand('/电波').intent).toEqual({ type: 'nightwave' });
    expect(parseCommand('夜浪').intent).toEqual({ type: 'nightwave' });
    expect(parseCommand('/帮助').intent).toEqual({ type: 'help' });
  });

  it('parses reply mode with required argument', () => {
    expect(parseCommand('/模式 图片').intent).toEqual({
      type: 'mode',
      mode: 'image',
    });
    expect(parseCommand('mode text').intent).toEqual({
      type: 'mode',
      mode: 'text',
    });
  });

  it('returns unknown for slash commands with bad args or unknown roots', () => {
    expect(parseCommand('/模式').intent).toEqual({
      type: 'unknown',
      raw: '模式',
    });
    expect(parseCommand('/价格 洛基').intent).toEqual({
      type: 'unknown',
      raw: '价格 洛基',
    });
  });
});
