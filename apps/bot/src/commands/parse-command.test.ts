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
    expect(parseCommand('/裂隙 古纪').intent).toEqual({
      type: 'fissures',
      filter: { eras: ['lith'], paths: [], missionHints: [] },
    });
    expect(parseCommand('/裂隙 钢铁之路 生存').intent).toEqual({
      type: 'fissures',
      filter: {
        eras: [],
        paths: ['steelPath'],
        missionHints: ['生存'],
      },
    });
    expect(parseCommand('/fissures lith steel').intent).toEqual({
      type: 'fissures',
      filter: {
        eras: ['lith'],
        paths: ['steelPath'],
        missionHints: [],
      },
    });
    expect(parseCommand('午夜电波').intent).toEqual({ type: 'nightwave' });
    expect(parseCommand('/电波').intent).toEqual({ type: 'nightwave' });
    expect(parseCommand('夜浪').intent).toEqual({ type: 'nightwave' });
    expect(parseCommand('/帮助').intent).toEqual({ type: 'help' });
    expect(parseCommand('/help zk').intent).toEqual({
      type: 'help',
      module: 'zk',
    });
    expect(parseCommand('/wm 红晶').intent).toEqual({
      type: 'market',
      query: '红晶',
    });
    expect(parseCommand('/wm 红晶 等级=5 p=2').intent).toEqual({
      type: 'market',
      query: '红晶',
      modRank: 5,
      page: 2,
    });
    expect(parseCommand('/zk latron').intent).toEqual({
      type: 'riven',
      query: 'latron',
    });
    expect(parseCommand('/zk 拉特昂 等级=0 段位=8 循环=2 p=2').intent).toEqual({
      type: 'riven',
      query: '拉特昂',
      rank: 0,
      mastery: 8,
      minRerolls: 2,
      maxRerolls: 2,
      page: 2,
    });
    expect(parseCommand('/wm 拉特昂 私聊=1').intent).toEqual({
      type: 'market',
      query: '拉特昂',
      whisperIndex: 1,
    });
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

  it('parses trader / rotation / subscribe commands', () => {
    expect(parseCommand('/虚空商人').intent).toEqual({ type: 'voidTrader' });
    expect(parseCommand('/瓦奇娅').intent).toEqual({ type: 'varzia' });
    expect(parseCommand('/信条轮换').intent).toEqual({ type: 'tenetRotation' });
    expect(parseCommand('/终幕').intent).toEqual({ type: 'codaRotation' });
    expect(parseCommand('/订阅').intent).toEqual({
      type: 'subscribe',
      action: 'list',
    });
    expect(parseCommand('/订阅 裂隙 每天').intent).toEqual({
      type: 'subscribe',
      action: 'on',
      moduleId: 'fissures',
      frequency: 'daily',
    });
    expect(parseCommand('/订阅 退订 信条').intent).toEqual({
      type: 'subscribe',
      action: 'off',
      moduleId: 'tenetRotation',
    });
  });

  it('honors commandPrefixPolicy=required for agent handoff', () => {
    const opts = {
      prefix: '/',
      prefixPolicy: 'required' as const,
    };
    expect(parseCommand('裂隙', opts)).toEqual({
      matched: false,
      reason: 'prefix_required',
    });
    expect(parseCommand('/裂隙', opts).intent).toEqual({ type: 'fissures' });
    expect(parseCommand('今天裂隙有什么', opts)).toEqual({
      matched: false,
      reason: 'prefix_required',
    });
  });

  it('bare policy does not promote unknown slash to help', () => {
    const opts = { prefix: '/', prefixPolicy: 'bare' as const };
    expect(parseCommand('裂隙', opts).intent).toEqual({ type: 'fissures' });
    expect(parseCommand('/不存在的指令', opts)).toEqual({
      matched: false,
      reason: 'no_root',
    });
  });
});
