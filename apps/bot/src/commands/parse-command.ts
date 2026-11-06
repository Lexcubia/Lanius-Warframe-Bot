import {
  PushFrequencySchema,
  SDJK_PUSH_EVENT_MAP,
  SubscribableModuleIdSchema,
  findCommandByRoot,
  isBountyMapFilterActive,
  isFissureQueryActive,
  parseBountyMapTokens,
  parseFissureFilterTokens,
  resolveModuleToken,
  type ArchimedeaKind,
  type BountyMapFilter,
  type FissureQueryFilter,
  type PushFrequency,
  type SubscribableModuleId,
} from '@lanius/core';

import { parseMarketArgs, parseRivenArgs } from './parse-market-args.js';

/**
 * MVP 切片支持的 Bot 命令意图。
 */
export type BotIntent =
  | { type: 'worldstate' }
  | { type: 'fissures'; filter?: FissureQueryFilter }
  | { type: 'invasions' }
  | { type: 'nightwave' }
  /** Wave 1 并行模块：circuit 已接线；其余未就绪时回「数据接入中」 */
  | { type: 'sortie' }
  | { type: 'archon' }
  | { type: 'circuit' }
  | { type: 'bounties'; mapFilter?: BountyMapFilter }
  | { type: 'arbitration' }
  | { type: 'alerts' }
  /** `kind`：精英=`lab`、时光=`hex`；裸 `/科研` 不带 kind 同时摘要两者 */
  | { type: 'archimedea'; kind?: ArchimedeaKind }
  | {
      type: 'market';
      query: string;
      modRank?: number;
      page?: number;
      /** 本页卖单序号（1-based）；有值时只回私聊文案 */
      whisperIndex?: number;
    }
  | {
      type: 'riven';
      query: string;
      rank?: number;
      mastery?: number;
      minRerolls?: number;
      maxRerolls?: number;
      page?: number;
      /** 本页拍卖序号（1-based）；有值时只回私聊文案 */
      whisperIndex?: number;
    }
  | { type: 'marketTrend'; query: string }
  | { type: 'marketRank'; category?: string; page?: number }
  | { type: 'ducats'; tier?: 'gold' | 'silver' | 'bronze'; page?: number }
  | { type: 'rivenAnalysis'; text: string }
  | { type: 'rivenRanges'; query: string }
  | { type: 'rivenSplice'; query?: string }
  | { type: 'disposition'; query: string }
  | {
      type: 'lichAuctions';
      query: string;
      element?: string;
      damageMax?: number;
      page?: number;
    }
  | { type: 'relic'; query?: string; page?: number }
  | { type: 'parts'; query: string; page?: number }
  | { type: 'openRelic' }
  | { type: 'voidTrader' }
  | { type: 'varzia' }
  | { type: 'tenetRotation' }
  | { type: 'codaRotation' }
  // SDJK Wave1
  | { type: 'timers' }
  | { type: 'dailyDeals' }
  | { type: 'news' }
  | { type: 'kuva' }
  | { type: 'synthTargets' }
  | { type: 'construction' }
  | { type: 'voidStorms' }
  | { type: 'events' }
  | { type: 'conclave' }
  | { type: 'clanRewards' }
  | { type: 'flashSales' }
  | { type: 'arbTable' }
  | { type: 'calendar1999' }
  | { type: 'steelPath' }
  | { type: 'sliverShop' }
  | { type: 'descendia' }
  | { type: 'incursions' }
  | { type: 'incarnon' }
  | { type: 'acrithis' }
  | {
      type: 'subscribe';
      action: 'list' | 'on' | 'off';
      moduleId?: SubscribableModuleId;
      /** 裂隙/仲裁/赏金筛选，或 worldstate 周期键 */
      filterArgs?: string;
      frequency?: PushFrequency;
    }
  | { type: 'help'; module?: string }
  /** Wave3：灰机维基深链 */
  | { type: 'wiki'; query: string }
  /** Wave3：中英名翻译 */
  | { type: 'translate'; query: string }
  /** Wave3：效价融合；tokens 为空时 API 回用法 */
  | { type: 'valence'; tokens: string[] }
  | { type: 'unknown'; raw: string };

/**
 * 将原始聊天消息解析为 Bot 命令的结果。
 */
export type ParsedCommand = {
  matched: boolean;
  intent?: BotIntent;
  /**
   * 未匹配原因（供日志 / 后续 Agent 分流）。
   * - `empty`：空消息
   * - `prefix_required`：策略要求前导符但未带
   * - `no_root`：未命中指令根（可交给 Agent）
   */
  reason?: 'empty' | 'prefix_required' | 'no_root';
};

/**
 * 指令前导符策略。
 */
export type CommandPrefixPolicy = 'optional' | 'required' | 'bare';

/**
 * `parseCommand` 可选项（来自 bot 配置）。
 */
export type ParseCommandOptions = {
  /** 前导串，默认 `/`；空串表示无前导符 */
  prefix?: string;
  /** 前导策略，默认 `optional` */
  prefixPolicy?: CommandPrefixPolicy;
};

/**
 * 将聊天消息解析为 Lanius Bot 命令意图。
 *
 * @param text - 原始消息内容（可能含 @bot 噪音）
 * @param options - 前导符与策略（可配置；接 Agent 时常用 `required`）
 * @returns 是否命中指令根，以及解析出的意图
 */
export function parseCommand(text: string, options: ParseCommandOptions = {}): ParsedCommand {
  const prefix = options.prefix ?? '/';
  const prefixPolicy = options.prefixPolicy ?? 'optional';

  const normalized = text.replace(/@\S+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return { matched: false, reason: 'empty' };
  }

  const hasPrefix = prefix.length > 0 ? normalized.startsWith(prefix) : false;

  // required：无前导则不进指令管线，留给自然语言 / Agent
  if (prefixPolicy === 'required' && prefix.length > 0 && !hasPrefix) {
    return { matched: false, reason: 'prefix_required' };
  }

  const body = hasPrefix && prefix.length > 0 ? normalized.slice(prefix.length).trim() : normalized;
  if (!body) {
    return { matched: false, reason: 'empty' };
  }

  const tokens = body.split(' ');
  const rootToken = tokens[0] ?? '';
  const restTokens = tokens.slice(1);
  const rest = restTokens.join(' ').trim();
  const command = findCommandByRoot(rootToken);

  if (!command) {
    // optional + 带前导：明确「想下指令但写错了」→ unknown（帮助）
    // required 同理（已保证有前导）
    // bare：未识别一律 unmatched，避免 `/瞎写` 抢 Agent
    if ((prefixPolicy === 'optional' || prefixPolicy === 'required') && hasPrefix) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: false, reason: 'no_root' };
  }

  if (command.id === 'help') {
    return {
      matched: true,
      intent: rest ? { type: 'help', module: rest } : { type: 'help' },
    };
  }

  if (command.id === 'market') {
    const parsed = parseMarketArgs(restTokens);
    if (!parsed.query) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return {
      matched: true,
      intent: {
        type: 'market',
        query: parsed.query,
        ...(parsed.modRank !== undefined ? { modRank: parsed.modRank } : {}),
        ...(parsed.page !== undefined ? { page: parsed.page } : {}),
        ...(parsed.whisperIndex !== undefined ? { whisperIndex: parsed.whisperIndex } : {}),
      },
    };
  }

  if (command.id === 'riven') {
    const parsed = parseRivenArgs(restTokens);
    if (!parsed.query) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return {
      matched: true,
      intent: {
        type: 'riven',
        query: parsed.query,
        ...(parsed.rank !== undefined ? { rank: parsed.rank } : {}),
        ...(parsed.mastery !== undefined ? { mastery: parsed.mastery } : {}),
        ...(parsed.minRerolls !== undefined ? { minRerolls: parsed.minRerolls } : {}),
        ...(parsed.maxRerolls !== undefined ? { maxRerolls: parsed.maxRerolls } : {}),
        ...(parsed.page !== undefined ? { page: parsed.page } : {}),
        ...(parsed.whisperIndex !== undefined ? { whisperIndex: parsed.whisperIndex } : {}),
      },
    };
  }

  if (command.id === 'subscribe') {
    return { matched: true, intent: parseSubscribeIntent(restTokens) };
  }

  if (command.id === 'marketTrend') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: true, intent: { type: 'marketTrend', query: rest } };
  }

  if (command.id === 'marketRank') {
    return { matched: true, intent: parseMarketRankIntent(restTokens, rootToken) };
  }

  if (command.id === 'ducats') {
    return { matched: true, intent: parseDucatsIntent(restTokens, rootToken) };
  }

  if (command.id === 'rivenAnalysis') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: true, intent: { type: 'rivenAnalysis', text: rest } };
  }

  if (command.id === 'rivenRanges') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: true, intent: { type: 'rivenRanges', query: rest } };
  }

  if (command.id === 'rivenSplice') {
    return { matched: true, intent: { type: 'rivenSplice', ...(rest ? { query: rest } : {}) } };
  }

  if (command.id === 'disposition') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: true, intent: { type: 'disposition', query: rest } };
  }

  if (command.id === 'lichAuctions') {
    return { matched: true, intent: parseLichIntent(restTokens) };
  }

  if (command.id === 'relic') {
    const page = parsePageToken(restTokens);
    const q = restTokens.filter((t) => !/^p(?:age)?[=:]?\d+$/i.test(t) && !/^页[=:]?\d+$/.test(t));
    return {
      matched: true,
      intent: {
        type: 'relic',
        ...(q.length ? { query: q.join(' ') } : {}),
        ...(page !== undefined ? { page } : {}),
      },
    };
  }

  if (command.id === 'parts') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    const page = parsePageToken(restTokens);
    const q = restTokens.filter((t) => !/^p(?:age)?[=:]?\d+$/i.test(t) && !/^页[=:]?\d+$/.test(t));
    return {
      matched: true,
      intent: {
        type: 'parts',
        query: q.join(' ') || rest,
        ...(page !== undefined ? { page } : {}),
      },
    };
  }

  if (command.id === 'openRelic') {
    return { matched: true, intent: { type: 'openRelic' } };
  }

  if (command.id === 'fissures') {
    const filter = parseFissureFilterTokens(restTokens);
    return {
      matched: true,
      intent: isFissureQueryActive(filter) ? { type: 'fissures', filter } : { type: 'fissures' },
    };
  }

  if (command.id === 'bounties') {
    const mapFilter = parseBountyMapTokens(restTokens);
    return {
      matched: true,
      intent: isBountyMapFilterActive(mapFilter)
        ? { type: 'bounties', mapFilter }
        : { type: 'bounties' },
    };
  }

  if (command.id === 'archimedea') {
    const kind = resolveArchimedeaKind(rootToken);
    return {
      matched: true,
      intent: kind ? { type: 'archimedea', kind } : { type: 'archimedea' },
    };
  }

  if (command.id === 'wiki') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: true, intent: { type: 'wiki', query: rest } };
  }

  if (command.id === 'translate') {
    if (!rest) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: true, intent: { type: 'translate', query: rest } };
  }

  if (command.id === 'valence') {
    return { matched: true, intent: { type: 'valence', tokens: restTokens } };
  }

  if (
    command.id === 'worldstate' ||
    command.id === 'invasions' ||
    command.id === 'nightwave' ||
    command.id === 'sortie' ||
    command.id === 'archon' ||
    command.id === 'circuit' ||
    command.id === 'arbitration' ||
    command.id === 'alerts' ||
    command.id === 'voidTrader' ||
    command.id === 'varzia' ||
    command.id === 'tenetRotation' ||
    command.id === 'codaRotation' ||
    command.id === 'timers' ||
    command.id === 'dailyDeals' ||
    command.id === 'news' ||
    command.id === 'kuva' ||
    command.id === 'synthTargets' ||
    command.id === 'construction' ||
    command.id === 'voidStorms' ||
    command.id === 'events' ||
    command.id === 'conclave' ||
    command.id === 'clanRewards' ||
    command.id === 'flashSales' ||
    command.id === 'arbTable' ||
    command.id === 'calendar1999' ||
    command.id === 'steelPath' ||
    command.id === 'sliverShop' ||
    command.id === 'descendia' ||
    command.id === 'incursions' ||
    command.id === 'incarnon' ||
    command.id === 'acrithis'
  ) {
    // 窄化后的 id 联合无法直接赋给判别联合 BotIntent；按无参意图断言。
    return { matched: true, intent: { type: command.id } as BotIntent };
  }

  return { matched: true, intent: { type: 'unknown', raw: body } };
}

/**
 * 解析页码 token（`p=2` / `页2`）。
 *
 * @param tokens - 词元
 * @returns 页码或 undefined
 */
function parsePageToken(tokens: string[]): number | undefined {
  for (const t of tokens) {
    const m = t.match(/^(?:p(?:age)?|页)[=:]?(\d+)$/i);
    if (m) {
      return Math.max(1, Number.parseInt(m[1]!, 10));
    }
  }
  return undefined;
}

/**
 * 解析市场排行意图。
 *
 * @param tokens - 词元
 * @param _root - 根词
 * @returns 排行意图
 */
function parseMarketRankIntent(tokens: string[], _root: string): BotIntent {
  const page = parsePageToken(tokens);
  const catToken = tokens.find((t) => !/^(?:p(?:age)?|页)[=:]?\d+$/i.test(t));
  const categoryMap: Record<string, string> = {
    甲: 'warframe',
    战甲: 'warframe',
    warframe: 'warframe',
    卡: 'mod',
    模组: 'mod',
    mod: 'mod',
    部件: 'part',
    part: 'part',
    赋能: 'arcane',
    arcane: 'arcane',
    主武: 'primary',
    primary: 'primary',
    副武: 'secondary',
    secondary: 'secondary',
    近战: 'melee',
    melee: 'melee',
    遗物: 'relic',
    relic: 'relic',
  };
  const category = catToken
    ? (categoryMap[catToken.toLowerCase()] ?? categoryMap[catToken])
    : undefined;
  return {
    type: 'marketRank',
    ...(category ? { category } : {}),
    ...(page !== undefined ? { page } : {}),
  };
}

/**
 * 解析杜卡德垃圾档位意图。
 *
 * @param tokens - 词元
 * @param root - 根命令（金垃圾等）
 * @returns ducats 意图
 */
function parseDucatsIntent(tokens: string[], root: string): Extract<BotIntent, { type: 'ducats' }> {
  const page = parsePageToken(tokens);
  const rootKey = root.toLowerCase();
  let tier: 'gold' | 'silver' | 'bronze' | undefined =
    rootKey === '金垃圾' || rootKey === 'gold'
      ? 'gold'
      : rootKey === '银垃圾' || rootKey === 'silver'
        ? 'silver'
        : rootKey === '铜垃圾' || rootKey === 'bronze'
          ? 'bronze'
          : undefined;
  for (const t of tokens) {
    const key = t.toLowerCase();
    if (key === '金' || key === 'gold') tier = 'gold';
    if (key === '银' || key === 'silver') tier = 'silver';
    if (key === '铜' || key === 'bronze') tier = 'bronze';
  }
  return {
    type: 'ducats',
    tier: tier ?? 'gold',
    ...(page !== undefined ? { page } : {}),
  };
}

/**
 * 解析玄骸意图。
 *
 * @param tokens - 词元
 * @returns lich 意图或 unknown
 */
function parseLichIntent(tokens: string[]): BotIntent {
  if (tokens.length === 0) {
    return { type: 'unknown', raw: '玄骸' };
  }
  const page = parsePageToken(tokens);
  const elementMap: Record<string, string> = {
    冲击: 'impact',
    火焰: 'heat',
    冰冻: 'cold',
    电击: 'electricity',
    毒素: 'toxin',
    磁力: 'magnetic',
    辐射: 'radiation',
    impact: 'impact',
    heat: 'heat',
    cold: 'cold',
    electricity: 'electricity',
    toxin: 'toxin',
    magnetic: 'magnetic',
    radiation: 'radiation',
  };
  let element: string | undefined;
  let damageMax: number | undefined;
  const nameParts: string[] = [];
  for (const t of tokens) {
    if (/^(?:p(?:age)?|页)[=:]?\d+$/i.test(t)) {
      continue;
    }
    if (elementMap[t] || elementMap[t.toLowerCase()]) {
      element = elementMap[t] ?? elementMap[t.toLowerCase()];
      continue;
    }
    const asNum = Number.parseFloat(t);
    if (Number.isFinite(asNum) && asNum > 0 && asNum <= 100) {
      damageMax = asNum;
      continue;
    }
    nameParts.push(t);
  }
  if (nameParts.length === 0) {
    return { type: 'unknown', raw: `玄骸 ${tokens.join(' ')}` };
  }
  return {
    type: 'lichAuctions',
    query: nameParts.join(' '),
    ...(element ? { element } : {}),
    ...(damageMax !== undefined ? { damageMax } : {}),
    ...(page !== undefined ? { page } : {}),
  };
}

/**
 * 由指令根词解析科研子类过滤。
 *
 * @param rootToken - 用户输入的根（已去前导 `/`）
 * @returns `lab` / `hex`；总览命令返回 `undefined`
 */
function resolveArchimedeaKind(rootToken: string): ArchimedeaKind | undefined {
  const key = rootToken.trim().toLowerCase();
  if (
    key === '精英科研' ||
    key === 'deeparchimedea' ||
    key === 'deep' ||
    key === 'deep-archimedea'
  ) {
    return 'lab';
  }
  if (
    key === '时光科研' ||
    key === 'temporalarchimedea' ||
    key === 'temporal' ||
    key === 'temporal-archimedea' ||
    key === 'hex'
  ) {
    return 'hex';
  }
  return undefined;
}

/**
 * 解析 `/订阅` 参数。
 * 格式：`/订阅 [列表|退订] <模块> [筛选…] [变更时|每小时|每天|每周]`
 * 周期别名（夜灵/山谷等）自带 `filterArgs`，不再吞后续词为筛选。
 *
 * @param tokens - 根命令后的词元
 * @returns subscribe 意图
 */
function parseSubscribeIntent(tokens: string[]): BotIntent {
  if (tokens.length === 0) {
    return { type: 'subscribe', action: 'list' };
  }

  const first = tokens[0]?.toLowerCase() ?? '';
  if (first === '列表' || first === 'list' || first === 'ls') {
    return { type: 'subscribe', action: 'list' };
  }

  if (first === '退订' || first === 'off' || first === 'unsub' || first === '取消') {
    const resolved = resolveSubscribableTokens(tokens.slice(1));
    if (!resolved) {
      return { type: 'unknown', raw: `订阅 ${tokens.join(' ')}` };
    }
    return {
      type: 'subscribe',
      action: 'off',
      moduleId: resolved.moduleId,
      ...(resolved.filterArgs ? { filterArgs: resolved.filterArgs } : {}),
    };
  }

  const resolved = resolveSubscribableTokens(tokens);
  if (!resolved) {
    return { type: 'unknown', raw: `订阅 ${tokens.join(' ')}` };
  }

  const rest = tokens.slice(resolved.consumed);
  let frequency: PushFrequency = 'on_change';
  let filterParts = rest;
  if (rest.length > 0) {
    const maybeFreq = parseFrequency(rest[rest.length - 1] ?? '');
    if (maybeFreq) {
      frequency = maybeFreq;
      filterParts = rest.slice(0, -1);
    }
  }

  // 周期别名已写入 filterArgs，忽略多余筛选词以免覆盖
  const filterArgs =
    resolved.filterArgs ?? (filterParts.length > 0 ? filterParts.join(' ') : undefined);

  return {
    type: 'subscribe',
    action: 'on',
    moduleId: resolved.moduleId,
    frequency,
    ...(filterArgs ? { filterArgs } : {}),
  };
}

/**
 * 可订阅解析结果（含消耗的词元数与可选筛选）。
 */
type SubscribableResolved = {
  moduleId: SubscribableModuleId;
  filterArgs?: string;
  /** 从 tokens 开头匹配到的词元数 */
  consumed: number;
};

/**
 * 从词元序列贪婪匹配可订阅模块（支持双词 SDJK 事件名如「钢路侵袭」）。
 *
 * @param tokens - 词元
 * @returns 解析结果或 undefined
 */
function resolveSubscribableTokens(tokens: string[]): SubscribableResolved | undefined {
  if (tokens.length === 0) {
    return undefined;
  }
  // 先试双词（含无空格粘连，如「钢路」「侵袭」→「钢路侵袭」），再单词
  if (tokens.length >= 2) {
    const spaced = resolveSubscribable(`${tokens[0]} ${tokens[1]}`);
    if (spaced) {
      return { ...spaced, consumed: 2 };
    }
    const compact = resolveSubscribable(`${tokens[0]}${tokens[1]}`);
    if (compact) {
      return { ...compact, consumed: 2 };
    }
  }
  const one = resolveSubscribable(tokens[0] ?? '');
  if (one) {
    return { ...one, consumed: 1 };
  }
  return undefined;
}

/**
 * 将用户输入解析为可订阅模块（可带周期 filterArgs）。
 *
 * @param token - 模块别名或 id
 * @returns 模块与可选筛选；无法识别则 undefined
 */
function resolveSubscribable(
  token: string,
): { moduleId: SubscribableModuleId; filterArgs?: string } | undefined {
  const trimmed = token.trim();
  if (!trimmed) {
    return undefined;
  }

  const fromSdjk = SDJK_PUSH_EVENT_MAP[trimmed as keyof typeof SDJK_PUSH_EVENT_MAP];
  if (fromSdjk) {
    return {
      moduleId: fromSdjk.moduleId,
      ...(fromSdjk.filterArgs ? { filterArgs: fromSdjk.filterArgs } : {}),
    };
  }

  const aliases: Record<string, { moduleId: SubscribableModuleId; filterArgs?: string }> = {
    裂隙: { moduleId: 'fissures' },
    裂缝: { moduleId: 'fissures' },
    fissures: { moduleId: 'fissures' },
    夜灵平野: { moduleId: 'worldstate', filterArgs: 'cetus' },
    平原时间: { moduleId: 'worldstate', filterArgs: 'cetus' },
    cetus: { moduleId: 'worldstate', filterArgs: 'cetus' },
    奥布山谷: { moduleId: 'worldstate', filterArgs: 'vallis' },
    金星: { moduleId: 'worldstate', filterArgs: 'vallis' },
    vallis: { moduleId: 'worldstate', filterArgs: 'vallis' },
    魔胎之境: { moduleId: 'worldstate', filterArgs: 'cambion' },
    火卫二: { moduleId: 'worldstate', filterArgs: 'cambion' },
    cambion: { moduleId: 'worldstate', filterArgs: 'cambion' },
    地球昼夜: { moduleId: 'worldstate', filterArgs: 'earth' },
    earth: { moduleId: 'worldstate', filterArgs: 'earth' },
    双衍王境: { moduleId: 'worldstate', filterArgs: 'duviri' },
    螺旋: { moduleId: 'worldstate', filterArgs: 'duviri' },
    duviri: { moduleId: 'worldstate', filterArgs: 'duviri' },
    世界状态: { moduleId: 'worldstate' },
    worldstate: { moduleId: 'worldstate' },
    虚空商人: { moduleId: 'voidTrader' },
    奸商: { moduleId: 'voidTrader' },
    baro: { moduleId: 'voidTrader' },
    voidtrader: { moduleId: 'voidTrader' },
    瓦奇娅: { moduleId: 'varzia' },
    varzia: { moduleId: 'varzia' },
    信条: { moduleId: 'tenetRotation' },
    信条轮换: { moduleId: 'tenetRotation' },
    tenet: { moduleId: 'tenetRotation' },
    终幕: { moduleId: 'codaRotation' },
    终幕轮换: { moduleId: 'codaRotation' },
    coda: { moduleId: 'codaRotation' },
    突击: { moduleId: 'sortie' },
    sortie: { moduleId: 'sortie' },
    执刑官猎杀: { moduleId: 'archon' },
    执刑官: { moduleId: 'archon' },
    archon: { moduleId: 'archon' },
    仲裁: { moduleId: 'arbitration' },
    arbitration: { moduleId: 'arbitration' },
    侵袭: { moduleId: 'incursions' },
    钢路侵袭: { moduleId: 'incursions' },
    incursions: { moduleId: 'incursions' },
    警报: { moduleId: 'alerts' },
    alerts: { moduleId: 'alerts' },
    入侵: { moduleId: 'invasions' },
    invasions: { moduleId: 'invasions' },
    新闻: { moduleId: 'news' },
    news: { moduleId: 'news' },
    每日特惠: { moduleId: 'dailyDeals' },
    达沃: { moduleId: 'dailyDeals' },
    dailydeals: { moduleId: 'dailyDeals' },
    活动: { moduleId: 'events' },
    events: { moduleId: 'events' },
    日历: { moduleId: 'calendar1999' },
    '1999日历': { moduleId: 'calendar1999' },
    calendar1999: { moduleId: 'calendar1999' },
    灵化: { moduleId: 'incarnon' },
    灵化武器: { moduleId: 'incarnon' },
    incarnon: { moduleId: 'incarnon' },
    钢精: { moduleId: 'steelPath' },
    钢精兑换: { moduleId: 'steelPath' },
    steelpath: { moduleId: 'steelPath' },
    碎银: { moduleId: 'sliverShop' },
    碎银兑换: { moduleId: 'sliverShop' },
    slivershop: { moduleId: 'sliverShop' },
    赏金: { moduleId: 'bounties' },
    bounties: { moduleId: 'bounties' },
    阿耶兑换: { moduleId: 'varzia' },
    电波: { moduleId: 'nightwave' },
    午夜电波: { moduleId: 'nightwave' },
    nightwave: { moduleId: 'nightwave' },
  };
  const lower = trimmed.toLowerCase();
  const direct = aliases[lower] ?? aliases[trimmed];
  if (direct) {
    return direct;
  }
  const resolved = resolveModuleToken(trimmed);
  const parsed = SubscribableModuleIdSchema.safeParse(resolved ?? trimmed);
  if (parsed.success) {
    return { moduleId: parsed.data };
  }
  return undefined;
}

/**
 * 解析推送频率词。
 *
 * @param token - 频率词
 * @returns PushFrequency 或 undefined
 */
function parseFrequency(token: string): PushFrequency | undefined {
  const map: Record<string, PushFrequency> = {
    变更时: 'on_change',
    变化时: 'on_change',
    on_change: 'on_change',
    change: 'on_change',
    每小时: 'hourly',
    hourly: 'hourly',
    hour: 'hourly',
    每天: 'daily',
    每日: 'daily',
    daily: 'daily',
    day: 'daily',
    每周: 'weekly',
    weekly: 'weekly',
    week: 'weekly',
  };
  const key = token.trim().toLowerCase();
  const mapped = map[key] ?? map[token.trim()];
  if (!mapped) {
    return undefined;
  }
  return PushFrequencySchema.parse(mapped);
}
