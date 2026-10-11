/**
 * QQ 消息按钮（挂在 Markdown 消息底部）的单按钮描述。
 * @see https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/trans/msg-btn.html
 */
export type QqKeyboardButton = {
  /** 键盘内唯一 id */
  id: string;
  /** 展示文案 */
  label: string;
  /** 点击后展示文案；缺省与 label 相同 */
  visitedLabel?: string;
  /** 样式：0 灰框，1 蓝框 */
  style?: 0 | 1;
  /**
   * 动作类型：
   * 0 跳转；1 回调（INTERACTION_CREATE）；2 指令（插入/发送 data）。
   */
  actionType: 0 | 1 | 2;
  /** 指令或回调数据（type=2 时为待插入的指令正文） */
  data: string;
  /** type=2：点击后是否直接发送（群场景可能仅插入输入框） */
  enter?: boolean;
  /** type=2：是否引用本消息 */
  reply?: boolean;
  /** 客户端不支持时的 toast */
  unsupportTips?: string;
};

/**
 * 一行按钮（最多 5 个）。
 */
export type QqKeyboardRow = {
  buttons: QqKeyboardButton[];
};

/**
 * 自定义 keyboard 载荷（写入消息体 `keyboard.content`）。
 */
export type QqKeyboardContent = {
  rows: QqKeyboardRow[];
  /** 部分场景要求带 bot_appid */
  botAppId?: string | number;
};

/**
 * 将内部按钮描述转为官方 OpenAPI keyboard JSON。
 *
 * @param content - 行/按钮描述
 * @returns 可直接放入请求体 `keyboard` 字段的对象
 */
export function toQqKeyboardPayload(content: QqKeyboardContent): {
  content: {
    rows: Array<{
      buttons: Array<Record<string, unknown>>;
    }>;
    bot_appid?: number;
  };
} {
  const rows = content.rows.map((row) => ({
    buttons: row.buttons.map((btn) => ({
      id: btn.id,
      render_data: {
        label: btn.label,
        visited_label: btn.visitedLabel ?? btn.label,
        style: btn.style ?? 1,
      },
      action: {
        type: btn.actionType,
        permission: { type: 2 },
        data: btn.data,
        enter: btn.enter ?? false,
        reply: btn.reply ?? false,
        unsupport_tips: btn.unsupportTips ?? '客户端暂不支持该按钮',
      },
    })),
  }));

  const payload: {
    content: {
      rows: typeof rows;
      bot_appid?: number;
    };
  } = { content: { rows } };

  if (content.botAppId != null && content.botAppId !== '') {
    const n = Number(content.botAppId);
    if (Number.isFinite(n)) {
      payload.content.bot_appid = n;
    }
  }

  return payload;
}

/**
 * 构造「指令按钮」（action.type=2）：点击后向输入框插入 `@bot data`。
 *
 * @param options - 按钮字段
 * @returns 单按钮描述
 */
export function commandKeyboardButton(options: {
  id: string;
  label: string;
  /** 插入的指令正文（勿含 @） */
  command: string;
  enter?: boolean;
  reply?: boolean;
  style?: 0 | 1;
  visitedLabel?: string;
}): QqKeyboardButton {
  return {
    id: options.id,
    label: options.label,
    visitedLabel: options.visitedLabel,
    style: options.style ?? 1,
    actionType: 2,
    data: options.command,
    enter: options.enter,
    reply: options.reply,
  };
}
