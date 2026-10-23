import { describe, expect, it } from 'vitest';

import {
  formatMarketCommandSuffix,
  formatRivenCommandSuffix,
  parseMarketArgs,
  parseRivenArgs,
} from './parse-market-args.js';

describe('parseMarketArgs', () => {
  it('parses name with rank and page', () => {
    expect(parseMarketArgs(['红晶', '等级=5', 'p=2'])).toEqual({
      query: '红晶',
      modRank: 5,
      page: 2,
    });
    expect(parseMarketArgs(['Primed', 'Continuity', 'rank=10'])).toEqual({
      query: 'Primed Continuity',
      modRank: 10,
    });
  });

  it('parses whisper index', () => {
    expect(parseMarketArgs(['拉特昂', '私聊=1'])).toEqual({
      query: '拉特昂',
      whisperIndex: 1,
    });
    expect(parseMarketArgs(['axiom', 'whisper=2', 'p=3'])).toEqual({
      query: 'axiom',
      page: 3,
      whisperIndex: 2,
    });
  });

  it('ignores unknown keys', () => {
    expect(parseMarketArgs(['红晶', 'foo=1', '页=3']).query).toBe('红晶');
    expect(parseMarketArgs(['红晶', 'foo=1', '页=3']).page).toBe(3);
  });
});

describe('parseRivenArgs', () => {
  it('parses weapon filters', () => {
    expect(parseRivenArgs(['拉特昂', '等级=0', '段位=8', '循环=2', 'p=2'])).toEqual({
      query: '拉特昂',
      rank: 0,
      mastery: 8,
      minRerolls: 2,
      maxRerolls: 2,
      page: 2,
    });
  });
});

describe('format command suffixes', () => {
  it('replays market filters for keyboard', () => {
    expect(formatMarketCommandSuffix({ query: '红晶', modRank: 5, page: 2 }, 'zh')).toBe(
      '红晶 等级=5 p=2',
    );
    expect(formatMarketCommandSuffix({ query: 'axiom', page: 1 }, 'en')).toBe('axiom');
    expect(formatMarketCommandSuffix({ query: '拉特昂', whisperIndex: 1 }, 'zh')).toBe(
      '拉特昂 私聊=1',
    );
  });

  it('replays riven filters for keyboard', () => {
    expect(
      formatRivenCommandSuffix(
        {
          query: '拉特昂',
          rank: 0,
          mastery: 8,
          minRerolls: 2,
          maxRerolls: 2,
          page: 2,
        },
        'zh',
      ),
    ).toBe('拉特昂 等级=0 段位=8 循环=2 p=2');
  });
});
