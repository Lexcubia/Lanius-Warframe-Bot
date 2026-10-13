import { createLaniusApiClient } from '@lanius/api';
import type { QqOfficialClient, QqSendTarget } from '@lanius/qq-official';
import type { Logger } from '@lanius/logger';

import type { BotConfig } from '../config.js';

/**
 * 推送 worker 依赖。
 */
export type PushWorkerDeps = {
  config: BotConfig;
  qq: QqOfficialClient;
  logger: Logger;
  /** 轮询间隔毫秒，默认 60s */
  intervalMs?: number;
};

/**
 * 启动推送轮询：调用 API tick → QQ 下行 → ack。
 *
 * @param deps - 配置与客户端
 * @returns 停止函数
 */
export function startPushWorker(deps: PushWorkerDeps): () => void {
  const intervalMs = deps.intervalMs ?? 60_000;
  const token = deps.config.api?.adminToken;
  if (!token) {
    deps.logger.warn('push worker disabled: api.adminToken missing');
    return () => undefined;
  }

  const api = createLaniusApiClient({
    baseUrl: deps.config.bot.apiBaseUrl,
    adminToken: token,
  });

  let stopped = false;
  let running = false;

  /**
   * 执行一轮 tick。
   *
   * @returns 无返回值
   */
  async function tick(): Promise<void> {
    if (stopped || running) {
      return;
    }
    running = true;
    try {
      const envelope = await api.pushTick();
      if (!envelope.ok) {
        deps.logger.warn({ err: envelope.error }, 'push tick failed');
        return;
      }
      const { dispatches, fingerprints } = envelope.data;
      for (const row of dispatches) {
        const target: QqSendTarget = {
          scene: row.scene,
          targetId: row.targetId,
        };
        const sent = await deps.qq.sendText(target, row.text);
        if (!sent.ok) {
          deps.logger.warn(
            { subscriptionId: row.subscriptionId, detail: sent.detail },
            'push send failed',
          );
          continue;
        }
        const fingerprint = fingerprints[String(row.subscriptionId)];
        if (fingerprint) {
          const ack = await api.pushAck(row.subscriptionId, fingerprint);
          if (!ack.ok) {
            deps.logger.warn({ subscriptionId: row.subscriptionId }, 'push ack failed');
          }
        }
      }
      if (dispatches.length > 0) {
        deps.logger.info({ count: dispatches.length }, 'push dispatches sent');
      }
    } catch (error) {
      deps.logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        'push worker tick error',
      );
    } finally {
      running = false;
    }
  }

  void tick();
  const handle = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(handle);
  };
}
