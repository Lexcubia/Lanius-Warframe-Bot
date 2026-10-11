import { createPrivateKey, sign } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  expandBotSecretToEd25519Seed,
  signQqWebhookValidation,
  verifyQqCallback,
} from './verify.js';

/** 开放平台文档中的 Webhook Validation 样例。 */
const DOC_FIXTURE = {
  secret: 'DG5g3B4j9X2KOErG',
  plainToken: 'Arq0D5A61EgUu4OxUvOp',
  eventTs: '1725442341',
  signature:
    '87befc99c42c651b3aac0278e71ada338433ae26fcb24307bdc5ad38c1adc2d01bcfcadc0842edac85e85205028a1132afe09280305f13aa6909ffc2d652c706',
} as const;

/**
 * 用与生产相同的 seed→PKCS8 路径为事件回调生成合法 Ed25519 签名。
 *
 * @param appSecret - BotSecret
 * @param timestamp - `x-signature-timestamp` 值
 * @param rawBody - 原始请求体
 * @returns 十六进制签名
 */
function signEventCallback(
  appSecret: string,
  timestamp: string,
  rawBody: string,
): string {
  const seed = expandBotSecretToEd25519Seed(appSecret);
  const der = Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    seed,
  ]);
  const privateKey = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  return sign(null, Buffer.from(`${timestamp}${rawBody}`, 'utf8'), privateKey).toString(
    'hex',
  );
}

describe('signQqWebhookValidation', () => {
  it('matches the official webhook validation fixture', () => {
    const signature = signQqWebhookValidation({
      appSecret: DOC_FIXTURE.secret,
      plainToken: DOC_FIXTURE.plainToken,
      eventTs: DOC_FIXTURE.eventTs,
    });
    expect(signature).toBe(DOC_FIXTURE.signature);
  });
});

describe('verifyQqCallback', () => {
  it('accepts a matching Ed25519 signature', () => {
    const appSecret = 'test-secret-abcdefgh';
    const timestamp = '1710000000';
    const rawBody = '{"op":0}';
    const signature = signEventCallback(appSecret, timestamp, rawBody);

    expect(
      verifyQqCallback(
        {
          rawBody,
          headers: {
            'x-signature-ed25519': signature,
            'x-signature-timestamp': timestamp,
          },
        },
        { appSecret },
      ),
    ).toBe(true);
  });

  it('rejects a mismatched signature', () => {
    expect(
      verifyQqCallback(
        {
          rawBody: '{}',
          headers: {
            'x-signature-ed25519':
              'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
            'x-signature-timestamp': '1',
          },
        },
        { appSecret: 'test-secret-abcdefgh' },
      ),
    ).toBe(false);
  });

  it('rejects non-hex signature headers', () => {
    expect(
      verifyQqCallback(
        {
          rawBody: '{}',
          headers: {
            'x-signature-ed25519': 'not-hex',
            'x-signature-timestamp': '1',
          },
        },
        { appSecret: 'test-secret' },
      ),
    ).toBe(false);
  });
});
