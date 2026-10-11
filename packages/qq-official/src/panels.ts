import type { AccessTokenCache } from './access-token.js';
import {
  qqOpenApiJson,
  truncateChars,
  type QqOpenApiOptions,
} from './open-api.js';

/** 指令面板生效场景。 */
export type QqPanelScope = 'c2c' | 'group' | 'channel' | 'dm';

/**
 * 同步到开放平台的一条面板指令项。
 */
export type QqPanelCommandItem = {
  /** 点击后填入输入框的文本（≤14 字符）。 */
  name: string;
  /** 面板展示说明（≤30 字符）。 */
  desc: string;
};

/**
 * 启动时全局同步（优先 c2c all；群面板改走按群 specific）。
 */
export type SyncQqCommandPanelsOptions = QqOpenApiOptions & {
  items: readonly QqPanelCommandItem[];
  remark?: string;
};

/**
 * 单场景 / 单目标同步结果。
 */
export type SyncQqCommandPanelResult = {
  scope: QqPanelScope;
  panelId: string;
  action: 'created' | 'updated' | 'bound' | 'skipped' | 'failed';
  detail?: string;
};

const DEFAULT_REMARK = 'lanius-mvp-commands';

/**
 * 进程内：已绑定指令面板的群 openid → panel_id。
 * 避免每次 @ 都打创建/关联接口（10 QPM）。
 */
const boundGroupPanels = new Map<string, string>();

/** 共享的群聊 specific 面板 id（多群通过 /target 追加）。 */
let sharedGroupPanelId: string | undefined;

/**
 * 启动时尝试创建单聊全局面板；群聊改为收到群事件后再按群绑定。
 *
 * @param options - 凭据与指令项
 * @returns 同步结果（通常仅含 c2c）
 */
export async function syncQqCommandPanels(
  options: SyncQqCommandPanelsOptions,
): Promise<SyncQqCommandPanelResult[]> {
  const remark = options.remark ?? DEFAULT_REMARK;
  const items = toPanelItems(options.items);
  const results: SyncQqCommandPanelResult[] = [];

  try {
    results.push(await ensureScopeAllPanel(options, 'c2c', items, remark));
  } catch (error) {
    results.push({
      scope: 'c2c',
      panelId: '',
      action: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  // 群聊不在启动时用 target_type=all（Webhook 机器人上常直接 30013）；
  // 改为 ensureQqGroupCommandPanel 在入群/@ 时用 specific 绑定。
  results.push({
    scope: 'group',
    panelId: sharedGroupPanelId ?? '',
    action: 'skipped',
    detail: 'group panels bind on GROUP_AT / GROUP_ADD via specific',
  });

  return results;
}

/**
 * 确保指定群已绑定 Lanius 指令面板（specific）。
 * 首次创建面板并带上该群；后续群通过关联对象接口追加。
 *
 * @param options - 凭据与指令项
 * @param groupOpenid - 群 openid（来自事件 d.group_openid）
 * @returns 绑定结果
 */
export async function ensureQqGroupCommandPanel(
  options: SyncQqCommandPanelsOptions & { groupOpenid: string },
): Promise<SyncQqCommandPanelResult> {
  const groupOpenid = options.groupOpenid.trim();
  if (!groupOpenid) {
    return { scope: 'group', panelId: '', action: 'skipped', detail: 'empty groupOpenid' };
  }
  if (boundGroupPanels.has(groupOpenid)) {
    return {
      scope: 'group',
      panelId: boundGroupPanels.get(groupOpenid) ?? '',
      action: 'skipped',
      detail: 'already bound in-process',
    };
  }

  const remark = options.remark ?? DEFAULT_REMARK;
  const items = toPanelItems(options.items);

  try {
    if (sharedGroupPanelId) {
      await qqOpenApiJson(options, 'PUT', `/v2/panels/${sharedGroupPanelId}/target`, {
        op: 'add',
        group_openids: [groupOpenid],
      });
      boundGroupPanels.set(groupOpenid, sharedGroupPanelId);
      return { scope: 'group', panelId: sharedGroupPanelId, action: 'bound' };
    }

    // 先查是否已有本产品 remark 的 specific 面板可复用
    const existing = await listPanels(options, 'group');
    const ours = existing.find((row) => row.panel?.remark === remark);
    if (ours?.panel_id) {
      await qqOpenApiJson(options, 'PUT', `/v2/panels/${ours.panel_id}`, {
        panel: { items, remark },
      });
      try {
        await qqOpenApiJson(options, 'PUT', `/v2/panels/${ours.panel_id}/target`, {
          op: 'add',
          group_openids: [groupOpenid],
        });
      } catch {
        // 可能已是 all 或已关联；忽略关联失败仍记录 panel
      }
      sharedGroupPanelId = ours.panel_id;
      boundGroupPanels.set(groupOpenid, ours.panel_id);
      return { scope: 'group', panelId: ours.panel_id, action: 'updated' };
    }

    const created = await qqOpenApiJson<{ panel_id?: string }>(
      options,
      'POST',
      '/v2/panels',
      {
        scope: 'group',
        target_type: 'specific',
        group_openids: [groupOpenid],
        panel: { items, remark },
      },
    );
    if (!created.panel_id) {
      return {
        scope: 'group',
        panelId: '',
        action: 'failed',
        detail: 'create specific group panel missing panel_id',
      };
    }
    sharedGroupPanelId = created.panel_id;
    boundGroupPanels.set(groupOpenid, created.panel_id);
    return { scope: 'group', panelId: created.panel_id, action: 'created' };
  } catch (error) {
    return {
      scope: 'group',
      panelId: '',
      action: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 确保单聊全局面板存在（启动时调用）。
 *
 * @param options - OpenAPI 选项
 * @param scope - 场景（此处为 c2c）
 * @param items - 面板元素
 * @param remark - 产品备注
 * @returns 同步结果
 */
async function ensureScopeAllPanel(
  options: QqOpenApiOptions,
  scope: QqPanelScope,
  items: Array<{ type: 'command'; name: string; desc: string }>,
  remark: string,
): Promise<SyncQqCommandPanelResult> {
  const existing = await listPanels(options, scope);
  const ours = existing.find((row) => row.panel?.remark === remark) ?? existing[0];
  if (ours?.panel_id) {
    await qqOpenApiJson(options, 'PUT', `/v2/panels/${ours.panel_id}`, {
      panel: { items, remark },
    });
    return { scope, panelId: ours.panel_id, action: 'updated' };
  }

  const created = await qqOpenApiJson<{ panel_id?: string }>(
    options,
    'POST',
    '/v2/panels',
    {
      scope,
      target_type: 'all',
      panel: { items, remark },
    },
  );
  if (!created.panel_id) {
    return {
      scope,
      panelId: '',
      action: 'failed',
      detail: 'create response missing panel_id',
    };
  }
  return { scope, panelId: created.panel_id, action: 'created' };
}

/**
 * 将业务指令项转为官方 panel.items。
 *
 * @param items - 业务侧指令项
 * @returns 截断后的官方元素列表
 */
function toPanelItems(
  items: readonly QqPanelCommandItem[],
): Array<{ type: 'command'; name: string; desc: string }> {
  return items.slice(0, 12).map((item) => ({
    type: 'command' as const,
    name: truncateChars(item.name, 14),
    desc: truncateChars(item.desc, 30),
  }));
}

/**
 * 拉取某场景下已有面板列表。
 *
 * @param options - 凭据与 fetch
 * @param scope - 场景
 * @returns 面板摘要列表
 */
async function listPanels(
  options: QqOpenApiOptions,
  scope: QqPanelScope,
): Promise<
  Array<{
    panel_id?: string;
    version?: number;
    panel?: { remark?: string };
  }>
> {
  const data = await qqOpenApiJson<Record<string, unknown>>(
    options,
    'GET',
    `/v2/panels?scope=${encodeURIComponent(scope)}&limit=50`,
  );
  const nested =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : undefined;
  const raw = (data.records ??
    data.list ??
    nested?.records ??
    nested?.list ??
    []) as Array<Record<string, unknown>>;

  return raw.map((row) => {
    const panel =
      row.panel && typeof row.panel === 'object'
        ? (row.panel as { remark?: string })
        : undefined;
    return {
      panel_id:
        typeof row.panel_id === 'string'
          ? row.panel_id
          : typeof row.id === 'string'
            ? row.id
            : undefined,
      version: typeof row.version === 'number' ? row.version : undefined,
      panel,
    };
  });
}

export type { AccessTokenCache };
