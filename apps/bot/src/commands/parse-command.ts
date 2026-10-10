import { findCommandByRoot } from '@lanius/core';

/**
 * MVP 切片支持的 Bot 命令意图。
 */
export type BotIntent =
  | { type: 'worldstate' }
  | { type: 'invasions' }
  | { type: 'nightwave' }
  | { type: 'help' }
  | { type: 'mode'; mode: 'text' | 'image' }
  | { type: 'unknown'; raw: string };

/**
 * 将原始聊天消息解析为 Bot 命令的结果。
 */
export type ParsedCommand = {
  matched: boolean;
  intent?: BotIntent;
};

/**
 * 将聊天消息解析为 Lanius Bot 命令意图。
 * 每条指令为独立根（可选前导 `/`），不再使用总前缀如 `wf`。
 *
 * @param text - 原始消息内容（可能含 @bot 噪音）
 * @returns 是否命中指令根，以及解析出的意图
 */
export function parseCommand(text: string): ParsedCommand {
  const normalized = text
    .replace(/@\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return { matched: false };
  }

  const hasSlash = normalized.startsWith('/');
  const body = normalized.replace(/^\/+/, '').trim();
  if (!body) {
    return { matched: false };
  }

  const tokens = body.split(' ');
  const rootToken = tokens[0] ?? '';
  const restTokens = tokens.slice(1);
  const command = findCommandByRoot(rootToken);

  if (!command) {
    // 以 `/` 开头但未识别：回帮助类未知；普通闲聊不抢答。
    if (hasSlash) {
      return { matched: true, intent: { type: 'unknown', raw: body } };
    }
    return { matched: false };
  }

  if (command.id === 'mode') {
    const arg = (restTokens[0] ?? '').toLowerCase();
    if (arg === '图片' || arg === 'image') {
      return { matched: true, intent: { type: 'mode', mode: 'image' } };
    }
    if (arg === '文本' || arg === 'text') {
      return { matched: true, intent: { type: 'mode', mode: 'text' } };
    }
    return {
      matched: true,
      intent: { type: 'unknown', raw: body },
    };
  }

  return { matched: true, intent: { type: command.id } };
}
