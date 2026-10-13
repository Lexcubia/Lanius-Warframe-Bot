import type { QqSendTarget } from '@lanius/qq-official';

/**
 * 官方 Webhook / 事件推送的最小载荷形状。
 */
export type QqInboundPayload = {
  id?: string;
  op?: number;
  t?: string;
  d?: {
    id?: string;
    content?: string;
    group_openid?: string;
    channel_id?: string;
    guild_id?: string;
    author?: {
      user_openid?: string;
      id?: string;
      member_openid?: string;
    };
  };
};

/**
 * 从入站事件解析出的可处理消息。
 */
export type ParsedQqInboundMessage = {
  content: string;
  target: QqSendTarget;
  eventType: string;
};

/**
 * 将官方事件载荷解析为命令处理所需的内容与发送目标。
 * 支持群 @、群全量、单聊、频道 @、频道私信。
 *
 * @param payload - 已 JSON 解析的 Webhook 体
 * @returns 可处理消息；非消息事件或不完整时为 `null`
 */
export function parseInboundQqMessage(payload: QqInboundPayload): ParsedQqInboundMessage | null {
  const eventType = payload.t ?? '';
  const data = payload.d;
  if (!data) {
    return null;
  }

  const content = (data.content ?? '').trim();
  const msgId = data.id;
  const eventId = payload.id;

  if (eventType === 'GROUP_AT_MESSAGE_CREATE' || eventType === 'GROUP_MESSAGE_CREATE') {
    if (!data.group_openid) {
      return null;
    }
    return {
      content,
      eventType,
      target: {
        scene: 'group',
        targetId: data.group_openid,
        msgId,
        eventId,
      },
    };
  }

  if (eventType === 'C2C_MESSAGE_CREATE') {
    const userOpenid = data.author?.user_openid ?? data.author?.id;
    if (!userOpenid) {
      return null;
    }
    return {
      content,
      eventType,
      target: {
        scene: 'c2c',
        targetId: userOpenid,
        msgId,
        eventId,
      },
    };
  }

  if (eventType === 'AT_MESSAGE_CREATE') {
    if (!data.channel_id) {
      return null;
    }
    return {
      content,
      eventType,
      target: {
        scene: 'channel',
        targetId: data.channel_id,
        msgId,
        eventId,
      },
    };
  }

  if (eventType === 'DIRECT_MESSAGE_CREATE') {
    if (!data.guild_id) {
      return null;
    }
    return {
      content,
      eventType,
      target: {
        scene: 'dm',
        targetId: data.guild_id,
        msgId,
        eventId,
      },
    };
  }

  return null;
}

/**
 * 与群 openid 相关的生命周期 / 消息事件类型。
 */
export type QqGroupLifecycleEvent =
  | 'GROUP_AT_MESSAGE_CREATE'
  | 'GROUP_MESSAGE_CREATE'
  | 'GROUP_ADD_ROBOT'
  | 'GROUP_DEL_ROBOT'
  | 'GROUP_MSG_RECEIVE'
  | 'GROUP_MSG_REJECT';

/**
 * 从入站事件取出群 openid（消息、入群/踢群、主动通知开关）。
 *
 * @param payload - Webhook JSON
 * @returns group_openid；非群事件时为 `undefined`
 */
export function extractGroupOpenid(payload: QqInboundPayload): string | undefined {
  const eventType = payload.t ?? '';
  const groupOpenid = payload.d?.group_openid?.trim();
  if (!groupOpenid) {
    return undefined;
  }
  if (
    eventType === 'GROUP_AT_MESSAGE_CREATE' ||
    eventType === 'GROUP_MESSAGE_CREATE' ||
    eventType === 'GROUP_ADD_ROBOT' ||
    eventType === 'GROUP_DEL_ROBOT' ||
    eventType === 'GROUP_MSG_RECEIVE' ||
    eventType === 'GROUP_MSG_REJECT'
  ) {
    return groupOpenid;
  }
  return undefined;
}

/**
 * 判断事件是否为群生命周期（非命令消息），需单独打日志 / 清缓存。
 *
 * @param eventType - payload.t
 * @returns 是否为 ADD/DEL/MSG_RECEIVE/MSG_REJECT
 */
export function isQqGroupLifecycleEvent(eventType: string): boolean {
  return (
    eventType === 'GROUP_ADD_ROBOT' ||
    eventType === 'GROUP_DEL_ROBOT' ||
    eventType === 'GROUP_MSG_RECEIVE' ||
    eventType === 'GROUP_MSG_REJECT'
  );
}
