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
  const ours = existing.find((row) => row.panel?.remark === remark);

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
      action: 'skipped',
      detail: 'create response missing panel_id',
    };
  }
  return { scope, panelId: created.panel_id, action: 'created' };
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
  const data = await qqOpenApiJson<{
    records?: Array<{
      panel_id?: string;
      version?: number;
      panel?: { remark?: string };
    }>;
  }>(options, 'GET', `/v2/panels?scope=${encodeURIComponent(scope)}&limit=50`);
  return data.records ?? [];
}

/** 再导出缓存类型，便于调用方标注。 */
export type { AccessTokenCache };
