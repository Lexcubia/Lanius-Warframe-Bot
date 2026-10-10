/**
 * 官方 QQ 下行消息的目标通道描述。
 */
export type QqSendTarget = {
  /** 开放平台 channel / group / user 等不透明 id。 */
  channelId: string;
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
};

/**
 * 官方 QQ 文本/图片回复的薄封装客户端。
 * 不含命令业务逻辑，也不调用 Lanius 查询 API。
 */
export class QqOfficialClient {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly fetchImpl: typeof fetch;
  private readonly dryRun: boolean;

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
  }

  /**
   * 向目标发送纯文本回复。
   *
   * @param target - 频道/会话目标
   * @param content - UTF-8 文本（必要时由 bot 侧已截断）
   * @returns 发送确认；dry-run 时不发起网络 I/O
   */
  async sendText(target: QqSendTarget, content: string): Promise<QqSendResult> {
    if (this.dryRun) {
      return { ok: true, messageId: `dry-text-${target.channelId}`, detail: content.slice(0, 80) };
    }

    // 真实 OpenAPI 接线待凭据与端点文档锁定后再补。
    void this.appId;
    void this.appSecret;
    void this.fetchImpl;
    return {
      ok: false,
      detail: 'Official QQ sendText endpoint is not wired yet; enable dryRun for local tests',
    };
  }

  /**
   * 上传图片缓冲并作为媒体消息发送。
   *
   * @param target - 频道/会话目标
   * @param imagePng - 来自 `@lanius/render` 的 PNG 字节
   * @returns 发送确认；dry-run 时不实际上传
   */
  async sendImage(target: QqSendTarget, imagePng: Buffer): Promise<QqSendResult> {
    if (this.dryRun) {
      return {
        ok: true,
        messageId: `dry-image-${target.channelId}`,
        detail: `png:${imagePng.length}`,
      };
    }

    void this.appId;
    void this.appSecret;
    void this.fetchImpl;
    return {
      ok: false,
      detail: 'Official QQ sendImage endpoint is not wired yet; enable dryRun for local tests',
    };
  }
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
