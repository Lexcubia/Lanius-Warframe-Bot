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
 * 同步指令面板的选项。
 */
export type SyncQqCommandPanelsOptions = QqOpenApiOptions & {
  /** 需要确保存在的场景列表，默认 group + channel + c2c + dm。 */
  scopes?: readonly QqPanelScope[];
  /** 面板指令项；调用方从 Lanius 指令目录映射。 */
  items: readonly QqPanelCommandItem[];
  /** 写入 panel.remark，用于识别本产品面板以便更新。 */
  remark?: string;
};

/**
 * 单场景同步结果。
 */
export type SyncQqCommandPanelResult = {
  scope: QqPanelScope;
  panelId: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  detail?: string;
};

const DEFAULT_SCOPES: readonly QqPanelScope[] = ['group', 'channel', 'c2c', 'dm'];
const DEFAULT_REMARK = 'lanius-mvp-commands';

/**
 * 将 Lanius 指令同步为官方「指令面板」（创建或按 remark 更新）。
 * 单场景失败不阻断其它场景。
 *
 * @param options - 凭据、场景与指令项
 * @returns 各场景同步结果列表
 */
export async function syncQqCommandPanels(
  options: SyncQqCommandPanelsOptions,
): Promise<SyncQqCommandPanelResult[]> {
  const scopes = options.scopes ?? DEFAULT_SCOPES;
  const remark = options.remark ?? DEFAULT_REMARK;
  const items = options.items.map((item) => ({
    type: 'command' as const,
    name: truncateChars(item.name, 14),
    desc: truncateChars(item.desc, 30),
    only_admin: false,
  }));

  const results: SyncQqCommandPanelResult[] = [];
  for (const scope of scopes) {
    try {
      results.push(await syncOneScope(options, scope, items, remark));
    } catch (error) {
      results.push({
        scope,
        panelId: '',
        action: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}

/**
 * 同步单个场景的指令面板。
 *
 * @param options - 全局同步选项
 * @param scope - 场景
 * @param items - 已截断的面板元素
 * @param remark - 用于识别本产品面板的备注
 * @returns 该场景的同步结果
 */
async function syncOneScope(
  options: SyncQqCommandPanelsOptions,
  scope: QqPanelScope,
  items: Array<{
    type: 'command';
    name: string;
    desc: string;
    only_admin: boolean;
  }>,
  remark: string,
): Promise<SyncQqCommandPanelResult> {
  const existing = await listPanels(options, scope);
  // 优先更新本产品 remark；否则复用该场景已有面板（避免 20 个上限占满无法创建）
  const target = existing.find((row) => row.panel?.remark === remark) ?? existing[0];

  if (target?.panel_id) {
    await qqOpenApiJson(options, 'PUT', `/v2/panels/${target.panel_id}`, {
      panel: { items, remark },
    });
    return { scope, panelId: target.panel_id, action: 'updated' };
  }

  try {
    return await createPanel(options, scope, items, remark);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // 40030013：机器人全局面板数达上限，先删掉非本产品面板再创建一次
    if (!detail.includes('30013') && !detail.includes('超出数量')) {
      throw error;
    }
    const freed = await freeForeignPanelSlots(options, remark, 4);
    if (freed === 0) {
      return { scope, panelId: '', action: 'failed', detail };
    }
    return await createPanel(options, scope, items, remark);
  }
}

/**
 * 创建全局面板。
 *
 * @param options - OpenAPI 选项
 * @param scope - 场景
 * @param items - 面板元素
 * @param remark - 产品备注
 * @returns 创建结果
 */
async function createPanel(
  options: SyncQqCommandPanelsOptions,
  scope: QqPanelScope,
  items: Array<{
    type: 'command';
    name: string;
    desc: string;
    only_admin: boolean;
  }>,
  remark: string,
): Promise<SyncQqCommandPanelResult> {
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
      action: 'skipped',
      detail: 'create response missing panel_id',
    };
  }
  return { scope, panelId: created.panel_id, action: 'created' };
}

/**
 * 删除若干非本产品 remark 的面板，腾出全局配额。
 *
 * @param options - OpenAPI 选项
 * @param remark - 本产品备注（保留）
 * @param maxDelete - 最多删除个数
 * @returns 实际删除数量
 */
async function freeForeignPanelSlots(
  options: SyncQqCommandPanelsOptions,
  remark: string,
  maxDelete: number,
): Promise<number> {
  let deleted = 0;
  for (const scope of DEFAULT_SCOPES) {
    if (deleted >= maxDelete) {
      break;
    }
    const rows = await listPanels(options, scope);
    for (const row of rows) {
      if (deleted >= maxDelete) {
        break;
      }
      if (!row.panel_id || row.panel?.remark === remark) {
        continue;
      }
      await qqOpenApiJson(options, 'DELETE', `/v2/panels/${row.panel_id}`);
      deleted += 1;
    }
  }
  return deleted;
}

/**
 * 拉取某场景下已有面板列表（首页，足够定位本产品 remark）。
 *
 * @param options - 凭据与 fetch
 * @param scope - 场景
 * @returns 面板摘要列表
 */
async function listPanels(
  options: SyncQqCommandPanelsOptions,
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

/** 再导出缓存类型，便于调用方标注。 */
export type { AccessTokenCache };
