/**
 * 官方 Webhook HTTP Callback ACK（OpCode 12）回包体。
 *
 * 平台要求收到 `op:0` 事件后尽快回 ACK；字段名在社区实现中存在
 * `op` / `opcode` / `op_code` 并存，故同时写入以兼容。
 */
export type QqWebhookAckBody = {
  op: 12;
  opcode: 12;
  op_code: 12;
};

/**
 * 构建 Webhook 事件 ACK 回包（应在验签通过后、业务处理前尽早返回）。
 *
 * @returns JSON 可序列化的 ACK 对象
 */
export function buildQqWebhookAck(): QqWebhookAckBody {
  return { op: 12, opcode: 12, op_code: 12 };
}
