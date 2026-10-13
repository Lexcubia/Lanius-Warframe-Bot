import type { AccessTokenCache } from './access-token.js';
import { qqOpenApiJson, truncateChars, type QqOpenApiOptions } from './open-api.js';

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

/** 列表接口返回的面板摘要。 */
type PanelRow = {
  panel_id?: string;
  scope?: string;
  target_type?: string;
  version?: number;
  panel?: { remark?: string };
};

const DEFAULT_REMARK = 'lanius-mvp-commands';

const ALL_SCOPES: readonly QqPanelScope[] = ['c2c', 'group', 'channel', 'dm'];

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
 * 清除进程内「群已绑定面板」缓存（踢群 / 重新拉入时用）。
 * 不调用 OpenAPI；下次 `ensureQqGroupCommandPanel` 会重新关联。
 *
 * @param groupOpenid - 群 openid
 * @returns 是否原先存在缓存项
 */
export function forgetQqGroupPanelBinding(groupOpenid: string): boolean {
  const key = groupOpenid.trim();
  if (!key) {
    return false;
  }
  return boundGroupPanels.delete(key);
}

/**
 * 确保指定群已绑定 Lanius 指令面板（specific）。
 * 首次创建面板并带上该群；后续群通过关联对象接口追加。
 *
 * @param options - 凭据与指令项；`force` 为 true 时忽略进程内已绑定缓存并重新关联
 * @returns 绑定结果
 */
export async function ensureQqGroupCommandPanel(
  options: SyncQqCommandPanelsOptions & { groupOpenid: string; force?: boolean },
): Promise<SyncQqCommandPanelResult> {
  const groupOpenid = options.groupOpenid.trim();
  if (!groupOpenid) {
    return { scope: 'group', panelId: '', action: 'skipped', detail: 'empty groupOpenid' };
  }
  // 重新入群后平台侧关联可能已失效；force 时必须打 OpenAPI，不能吃进程内 skipped。
  if (options.force) {
    boundGroupPanels.delete(groupOpenid);
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
    return await bindGroupPanel(options, groupOpenid, items, remark, false);
  } catch (error) {
    if (!isQuotaExceeded(error)) {
      return {
        scope: 'group',
        panelId: '',
        action: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    // 配额满：清掉非本产品 / 多余面板后再绑定一次
    try {
      await reclaimOrphanPanels(options, remark);
      return await bindGroupPanel(options, groupOpenid, items, remark, true);
    } catch (retryError) {
      return {
        scope: 'group',
        panelId: '',
        action: 'failed',
        detail: retryError instanceof Error ? retryError.message : String(retryError),
      };
    }
  }
}

/**
 * 将群绑定到已有/新建的 specific 面板。
 *
 * @param options - OpenAPI 选项
 * @param groupOpenid - 目标群
 * @param items - 面板元素
 * @param remark - 产品备注
 * @param afterReclaim - 是否刚做过配额回收（影响 detail）
 * @returns 绑定结果
 * @throws Error 当 OpenAPI 创建/更新失败时
 */
async function bindGroupPanel(
  options: QqOpenApiOptions,
  groupOpenid: string,
  items: Array<{ type: 'command'; name: string; desc: string }>,
  remark: string,
  afterReclaim: boolean,
): Promise<SyncQqCommandPanelResult> {
  if (sharedGroupPanelId) {
    await qqOpenApiJson(options, 'PUT', `/v2/panels/${sharedGroupPanelId}/target`, {
      op: 'add',
      group_openids: [groupOpenid],
    });
    boundGroupPanels.set(groupOpenid, sharedGroupPanelId);
    return {
      scope: 'group',
      panelId: sharedGroupPanelId,
      action: 'bound',
      detail: afterReclaim ? 'bound after reclaim' : undefined,
    };
  }

  const existing = await listPanels(options, 'group');
  // 优先本产品 remark；否则复用任意群面板，避免重复 POST 撞 20 上限
  const ours = existing.find((row) => row.panel?.remark === remark) ?? existing[0];
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
    return {
      scope: 'group',
      panelId: ours.panel_id,
      action: 'updated',
      detail: afterReclaim ? 'updated after reclaim' : undefined,
    };
  }

  const created = await qqOpenApiJson<{ panel_id?: string }>(options, 'POST', '/v2/panels', {
    scope: 'group',
    target_type: 'specific',
    group_openids: [groupOpenid],
    panel: { items, remark },
  });
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
  return {
    scope: 'group',
    panelId: created.panel_id,
    action: 'created',
    detail: afterReclaim ? 'created after reclaim' : undefined,
  };
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
  try {
    return await upsertScopeAllPanel(options, scope, items, remark);
  } catch (error) {
    if (!isQuotaExceeded(error)) {
      throw error;
    }
    await reclaimOrphanPanels(options, remark);
    return await upsertScopeAllPanel(options, scope, items, remark);
  }
}

/**
 * 更新或创建某场景的全局面板。
 *
 * @param options - OpenAPI 选项
 * @param scope - 场景
 * @param items - 面板元素
 * @param remark - 产品备注
 * @returns 同步结果
 * @throws Error 当创建失败时
 */
async function upsertScopeAllPanel(
  options: QqOpenApiOptions,
  scope: QqPanelScope,
  items: Array<{ type: 'command'; name: string; desc: string }>,
  remark: string,
): Promise<SyncQqCommandPanelResult> {
  const existing = await listPanels(options, scope);
  const ours =
    existing.find((row) => row.panel?.remark === remark) ??
    existing.find((row) => row.target_type === 'all') ??
    existing[0];
  if (ours?.panel_id) {
    await qqOpenApiJson(options, 'PUT', `/v2/panels/${ours.panel_id}`, {
      panel: { items, remark },
    });
    return { scope, panelId: ours.panel_id, action: 'updated' };
  }

  const created = await qqOpenApiJson<{ panel_id?: string }>(options, 'POST', '/v2/panels', {
    scope,
    target_type: 'all',
    panel: { items, remark },
  });
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
 * 删除非本产品备注的面板，并合并多余的本产品面板，腾出配额。
 * 官方限制每个机器人最多 20 个面板；历史调试极易堆满导致 POST 30013。
 *
 * @param options - OpenAPI 选项
 * @param remark - 保留的本产品备注
 * @returns 实际删除数量
 */
export async function reclaimOrphanPanels(
  options: QqOpenApiOptions,
  remark: string = DEFAULT_REMARK,
): Promise<number> {
  const all = await listAllPanels(options);
  const keepIds = new Set<string>();
  const oursByScope = new Map<QqPanelScope, PanelRow[]>();

  for (const row of all) {
    if (!row.panel_id) {
      continue;
    }
    if (row.panel?.remark !== remark) {
      continue;
    }
    const scope = (row.scope as QqPanelScope | undefined) ?? 'group';
    if (scope !== 'c2c' && scope !== 'group') {
      continue;
    }
    const list = oursByScope.get(scope) ?? [];
    list.push(row);
    oursByScope.set(scope, list);
  }

  // 每个关心的场景只保留一块面板（优先已有 sharedGroupPanelId）
  for (const scope of ['c2c', 'group'] as const) {
    const list = oursByScope.get(scope) ?? [];
    if (list.length === 0) {
      continue;
    }
    const preferred =
      scope === 'group' && sharedGroupPanelId
        ? (list.find((row) => row.panel_id === sharedGroupPanelId) ?? list[0])
        : list[0];
    if (preferred?.panel_id) {
      keepIds.add(preferred.panel_id);
      if (scope === 'group') {
        sharedGroupPanelId = preferred.panel_id;
      }
    }
  }

  let deleted = 0;
  for (const row of all) {
    if (!row.panel_id || keepIds.has(row.panel_id)) {
      continue;
    }
    await qqOpenApiJson(options, 'DELETE', `/v2/panels/${row.panel_id}`);
    deleted += 1;
    if (row.panel_id === sharedGroupPanelId) {
      sharedGroupPanelId = undefined;
    }
    for (const [openid, panelId] of boundGroupPanels) {
      if (panelId === row.panel_id) {
        boundGroupPanels.delete(openid);
      }
    }
  }

  return deleted;
}

/**
 * 判断错误是否为面板数量超限（30013）。
 *
 * @param error - 捕获的异常
 * @returns 是否配额错误
 */
function isQuotaExceeded(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /30013|超出数量限制/.test(message);
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
 * 拉取某场景下已有面板列表（自动翻页）。
 *
 * @param options - 凭据与 fetch
 * @param scope - 场景
 * @returns 面板摘要列表
 */
async function listPanels(options: QqOpenApiOptions, scope: QqPanelScope): Promise<PanelRow[]> {
  const rows: PanelRow[] = [];
  let cursor = '';
  for (let page = 0; page < 10; page += 1) {
    const query = new URLSearchParams({
      scope,
      limit: '50',
    });
    if (cursor) {
      query.set('cursor', cursor);
    }
    const data = await qqOpenApiJson<Record<string, unknown>>(
      options,
      'GET',
      `/v2/panels?${query.toString()}`,
    );
    const pageRows = extractPanelRows(data, scope);
    rows.push(...pageRows);

    const nested =
      data.data && typeof data.data === 'object'
        ? (data.data as Record<string, unknown>)
        : undefined;
    const next =
      (typeof data.next_cursor === 'string' && data.next_cursor) ||
      (typeof nested?.next_cursor === 'string' && nested.next_cursor) ||
      '';
    const ended =
      data.is_end === true || nested?.is_end === true || next === '' || pageRows.length === 0;
    if (ended) {
      break;
    }
    cursor = next;
  }
  return rows;
}

/**
 * 拉取全部场景的面板（用于配额回收）。
 *
 * @param options - OpenAPI 选项
 * @returns 全场景面板列表
 */
async function listAllPanels(options: QqOpenApiOptions): Promise<PanelRow[]> {
  const all: PanelRow[] = [];
  for (const scope of ALL_SCOPES) {
    all.push(...(await listPanels(options, scope)));
  }
  return all;
}

/**
 * 从列表响应中解析 records（兼容 code:0 包裹与多种字段名）。
 *
 * @param data - GET /v2/panels 响应体
 * @param fallbackScope - 请求时的 scope（响应缺省时补上）
 * @returns 规范化后的行
 */
function extractPanelRows(data: Record<string, unknown>, fallbackScope: QqPanelScope): PanelRow[] {
  const nested =
    data.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : undefined;
  const raw = (data.records ?? data.list ?? nested?.records ?? nested?.list ?? []) as Array<
    Record<string, unknown>
  >;

  return raw.map((row) => {
    const panel =
      row.panel && typeof row.panel === 'object' ? (row.panel as { remark?: string }) : undefined;
    return {
      panel_id:
        typeof row.panel_id === 'string'
          ? row.panel_id
          : typeof row.id === 'string'
            ? row.id
            : undefined,
      scope: typeof row.scope === 'string' ? row.scope : fallbackScope,
      target_type: typeof row.target_type === 'string' ? row.target_type : undefined,
      version: typeof row.version === 'number' ? row.version : undefined,
      panel,
    };
  });
}

export type { AccessTokenCache };
