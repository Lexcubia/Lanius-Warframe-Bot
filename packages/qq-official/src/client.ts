import type { AccessTokenCache } from './access-token.js';
import { getAppAccessToken } from './access-token.js';
import { toQqKeyboardPayload, type QqKeyboardContent } from './keyboard.js';

/**
 * 官方 QQ 下行消息的目标通道描述。
 */
export type QqSendTarget = {
  /** 会话场景：群 / 单聊 / 文字子频道 / 频道私信。 */
  scene: 'group' | 'c2c' | 'channel' | 'dm';
  /**
   * 场景对应的目标 id：
   * group→group_openid；c2c→user_openid；channel→channel_id；dm→guild_id。
   */
  targetId: string;
  /** 被动回复用的消息 id（事件 `d.id`），5 分钟内有效。 */
  msgId?: string;
  /** 部分事件可用的外层 event id（与 msgId 二选一）。 */
  eventId?: string;
};

/**
 * 下行发送辅助方法的返回结果。
 */
export type QqSendResult = {
  ok: boolean;
  messageId?: string;
  degraded?: boolean;
  detail?: string;
};

/**
 * 官方 QQ 下行客户端的依赖选项。
 */
export type QqOfficialClientOptions = {
  appId: string;
  appSecret: string;
  /** 可注入的 fetch，便于测试或替换传输层。 */
  fetchImpl?: typeof fetch;
  /**
   * 为 true 时跳过真实网络调用，仅本地确认。
   * 在平台凭据尚未接通时用于本地开发。
   */
  dryRun?: boolean;
  /** OpenAPI 基址，默认 `https://api.bot.qq.com`。 */
  apiBaseUrl?: string;
};

/**
 * 官方 QQ 文本/图片下行的薄封装客户端（验签与发信）。
 */
export class QqOfficialClient {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly fetchImpl: typeof fetch;
  private readonly dryRun: boolean;
  private readonly apiBaseUrl: string;
  private readonly tokenCache: { current?: AccessTokenCache } = {};
  /** 同一 msg_id 下递增 msg_seq，避免被动回复去重失败。 */
  private readonly msgSeqByMsgId = new Map<string, number>();

  /**
   * 创建官方 QQ 下行客户端。
   *
   * @param options - 应用凭据、fetch 实现与 dry-run 开关
   */
  constructor(options: QqOfficialClientOptions) {
    this.appId = options.appId;
    this.appSecret = options.appSecret;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.dryRun = options.dryRun ?? false;
    this.apiBaseUrl = (options.apiBaseUrl ?? 'https://api.bot.qq.com').replace(/\/$/, '');
  }

  /**
   * 暴露 token 缓存槽，供指令面板同步与发信共用同一凭证。
   *
   * @returns 可写入的 token 缓存引用
   */
  getAccessTokenCache(): { current?: AccessTokenCache } {
    return this.tokenCache;
  }

  /**
   * 向目标发送纯文本回复（`msg_type=0`）。
   * 群/单聊优先带 `msg_id` 做被动回复；平台禁止消息内含 URL。
   *
   * @param target - 频道/会话目标
   * @param content - UTF-8 文本（必要时由 bot 侧已截断）
   * @returns 发送确认；dry-run 时不发起网络 I/O
   */
  async sendText(target: QqSendTarget, content: string): Promise<QqSendResult> {
    const safeContent = stripHttpUrls(content).trim();
    if (!safeContent) {
      return { ok: false, detail: 'empty content after URL strip' };
    }

    if (this.dryRun) {
      return {
        ok: true,
        messageId: `dry-text-${target.targetId}`,
        detail: safeContent.slice(0, 80),
      };
    }

    if (!target.targetId) {
      return { ok: false, detail: 'missing targetId' };
    }

    try {
      const path = messagePath(target);
      const body: Record<string, unknown> = {
        msg_type: 0,
        content: safeContent,
      };
      this.applyPassiveReplyFields(body, target);
      const result = await this.openApiPost<{ id?: string }>(path, body);
      return { ok: true, messageId: result.id };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 发送自定义 Markdown 消息（`msg_type=2`），可选挂载底部 keyboard 按钮。
   * 群/单聊已开放自定义 Markdown；频道可能需内邀——失败时由调用方降级文本。
   *
   * @param target - 频道/会话目标
   * @param content - Markdown 正文（勿依赖外链；群场景会剥 http URL）
   * @param keyboard - 可选自定义按钮（需与 markdown 同发）
   * @returns 发送确认；dry-run 时不发起网络 I/O
   */
  async sendMarkdown(
    target: QqSendTarget,
    content: string,
    keyboard?: QqKeyboardContent,
  ): Promise<QqSendResult> {
    const safeContent = stripHttpUrls(content).trim();
    if (!safeContent) {
      return { ok: false, detail: 'empty markdown content after URL strip' };
    }

    if (this.dryRun) {
      return {
        ok: true,
        messageId: `dry-md-${target.targetId}`,
        detail: safeContent.slice(0, 80),
      };
    }

    if (!target.targetId) {
      return { ok: false, detail: 'missing targetId' };
    }

    try {
      const path = messagePath(target);
      const body: Record<string, unknown> = {
        msg_type: 2,
        markdown: { content: safeContent },
      };
      if (keyboard && keyboard.rows.length > 0) {
        body.keyboard = toQqKeyboardPayload({
          ...keyboard,
          botAppId: keyboard.botAppId ?? this.appId,
        });
      }
      this.applyPassiveReplyFields(body, target);
      const result = await this.openApiPost<{ id?: string }>(path, body);
      return { ok: true, messageId: result.id };
    } catch (error) {
      return {
        ok: false,
        degraded: true,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 上传 PNG（`file_data` base64，≤5MB）并作为富媒体消息发送（`msg_type=7`）。
   * 群/单聊走各自 `/files` 接口；频道场景暂未接线，返回降级提示。
   *
   * @param target - 频道/会话目标
   * @param imagePng - 来自 `@lanius/render` 的 PNG 字节
   * @returns 发送确认；dry-run 时不实际上传
   */
  async sendImage(target: QqSendTarget, imagePng: Buffer): Promise<QqSendResult> {
    if (this.dryRun) {
      return {
        ok: true,
        messageId: `dry-image-${target.targetId}`,
        detail: `png:${imagePng.length}`,
      };
    }

    if (!target.targetId) {
      return { ok: false, detail: 'missing targetId' };
    }
    if (target.scene !== 'group' && target.scene !== 'c2c') {
      return {
        ok: false,
        degraded: true,
        detail: `image upload unsupported for scene=${target.scene}`,
      };
    }
    // 官方 file_data 直传软上限约 5MB；卡片 PNG 通常远小于此
    if (imagePng.length > 5 * 1024 * 1024) {
      return {
        ok: false,
        degraded: true,
        detail: `png too large for file_data upload: ${imagePng.length} bytes`,
      };
    }

    try {
      const uploadPath = filesPath(target);
      const uploaded = await this.openApiPost<{
        file_info?: string;
        file_uuid?: string;
      }>(uploadPath, {
        file_type: 1,
        file_name: 'lanius-card.png',
        file_data: imagePng.toString('base64'),
        srv_send_msg: false,
      });
      if (!uploaded.file_info) {
        return {
          ok: false,
          degraded: true,
          detail: 'files upload missing file_info',
        };
      }

      const body: Record<string, unknown> = {
        msg_type: 7,
        media: { file_info: uploaded.file_info },
      };
      this.applyPassiveReplyFields(body, target);
      const result = await this.openApiPost<{ id?: string }>(messagePath(target), body);
      return {
        ok: true,
        messageId: result.id,
        detail: uploaded.file_uuid ? `file_uuid:${uploaded.file_uuid}` : undefined,
      };
    } catch (error) {
      return {
        ok: false,
        degraded: true,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 写入被动回复字段 `msg_id`/`event_id` 与递增 `msg_seq`。
   *
   * @param body - 即将 POST 的消息体
   * @param target - 发送目标
   * @returns 无返回值
   */
  private applyPassiveReplyFields(body: Record<string, unknown>, target: QqSendTarget): void {
    if (target.msgId) {
      body.msg_id = target.msgId;
      const next = (this.msgSeqByMsgId.get(target.msgId) ?? 0) + 1;
      this.msgSeqByMsgId.set(target.msgId, next);
      body.msg_seq = next;
      return;
    }
    if (target.eventId) {
      body.event_id = target.eventId;
    }
  }

  /**
   * 带鉴权的 OpenAPI POST JSON。
   *
   * @param path - 以 `/` 开头的路径
   * @param body - JSON 请求体
   * @returns 解析后的响应对象
   * @throws Error 当 HTTP 或业务码失败
   */
  private async openApiPost<T>(path: string, body: unknown): Promise<T> {
    const token = await getAppAccessToken({
      appId: this.appId,
      clientSecret: this.appSecret,
      fetchImpl: this.fetchImpl,
      apiBaseUrl: this.apiBaseUrl,
      cache: this.tokenCache,
    });
    const response = await this.fetchImpl(`${this.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `QQBot ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let parsed: T & { code?: number; message?: string; msg?: string };
    try {
      parsed = (text ? JSON.parse(text) : {}) as T & {
        code?: number;
        message?: string;
        msg?: string;
      };
    } catch {
      throw new Error(`QQ OpenAPI POST ${path} non-json: HTTP ${response.status}`);
    }
    // 官方成功响应常带 code:0，仅非 0 视为失败
    const businessFailed = parsed.code != null && Number(parsed.code) !== 0;
    if (!response.ok || businessFailed) {
      throw new Error(
        `QQ OpenAPI POST ${path} failed: HTTP ${response.status} code=${parsed.code ?? 'n/a'} message=${parsed.message ?? parsed.msg ?? text.slice(0, 200)}`,
      );
    }
    return parsed;
  }
}

/**
 * 按场景拼出发送消息的路径。
 *
 * @param target - 发送目标
 * @returns OpenAPI 路径
 */
function messagePath(target: QqSendTarget): string {
  const id = encodeURIComponent(target.targetId);
  switch (target.scene) {
    case 'group':
      return `/v2/groups/${id}/messages`;
    case 'c2c':
      return `/v2/users/${id}/messages`;
    case 'channel':
      return `/channels/${id}/messages`;
    case 'dm':
      return `/dms/${id}/messages`;
    default: {
      const _exhaustive: never = target.scene;
      return _exhaustive;
    }
  }
}

/**
 * 按场景拼出富媒体上传路径（仅 group / c2c）。
 *
 * @param target - 发送目标（须为 group 或 c2c）
 * @returns OpenAPI `/files` 路径
 */
function filesPath(target: QqSendTarget): string {
  const id = encodeURIComponent(target.targetId);
  if (target.scene === 'group') {
    return `/v2/groups/${id}/files`;
  }
  return `/v2/users/${id}/files`;
}

/**
 * 移除 http(s) URL，规避群聊「不允许发送 URL」限制。
 *
 * @param content - 原始回复文本
 * @returns 去掉链接后的文本
 */
function stripHttpUrls(content: string): string {
  // 保留 markdown 图片语法 `![alt](url)` 内的 URL（嵌图需要公网链接），
  // 其余裸链剥除（群场景限制外链）。
  const imageUrls: string[] = [];
  const placeholdered = content.replace(
    /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi,
    (_m, url: string) => {
      imageUrls.push(url);
      return `![img](__LANIUS_IMG_${imageUrls.length - 1}__)`;
    },
  );
  const stripped = placeholdered.replace(/https?:\/\/\S+/gi, '').replace(/[ \t]+\n/g, '\n');
  // 还原图片 URL
  return stripped.replace(/__LANIUS_IMG_(\d+)__/g, (_m, i: string) => imageUrls[Number(i)] ?? '');
}

/**
 * 官方 QQ 客户端工厂。
 *
 * @param options - 客户端构造选项
 * @returns 已配置的 `QqOfficialClient`
 */
export function createQqOfficialClient(options: QqOfficialClientOptions): QqOfficialClient {
  return new QqOfficialClient(options);
}
