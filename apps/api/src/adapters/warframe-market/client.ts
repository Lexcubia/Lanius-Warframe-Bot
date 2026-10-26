import { upstreamUnavailableError } from '../../lib/http-error.js';

/**
 * WFM API v2 默认根（物品 / 订单 / 紫卡武器索引）。
 * v1 已弃用：`/v1/items`→404，`/v1/items/.../orders`→403 Deprecated。
 */
export const WFM_API_BASE = 'https://api.warframe.market/v2';

/**
 * 仍可用的 v1 根（紫卡拍卖搜索暂未迁到 v2；`/v2/auctions/*` 尚无对等路由）。
 */
export const WFM_API_V1_BASE = 'https://api.warframe.market/v1';

/**
 * WFM 要求可识别的 User-Agent；Node fetch 缺省 UA 会被 Cloudflare 拦成 403 挑战页。
 * 勿伪装成浏览器 UA（见 docs.warframe.market Rules）。
 */
export const WFM_USER_AGENT =
  'Lanius-Warframe-Bot (+https://github.com/Lexcubia/Lanius-Warframe-Bot)';

/**
 * WFM 展示语言（v2 物品在 `i18n` 内同时带多语种名）。
 */
export type WfmLanguage = 'zh-hans' | 'en';

/**
 * 上游物品条目（精简；对外仍用 url_name / item_name 字段名以兼容服务层）。
 */
export type WfmItemRow = {
  url_name: string;
  item_name: string;
  /** WFM 物品 id（套装 setParts 引用） */
  id?: string;
  /** 相对或绝对 thumb；服务层可转绝对 URL */
  thumb?: string;
  /**
   * 部件类型小图标（如 `sub_icons/weapon/prime_barrel_128x128.png`）。
   * WFM 部件 `thumb` 常与套装同图，套装卡部件行应优先用此字段。
   */
  subIcon?: string;
  /** 杜卡德价值；非 Prime 等可能缺失 */
  ducats?: number | null;
  /** 上游 tags（如 prime / set / component） */
  tags?: string[];
};

/**
 * 上游单物品详情（v2 `/item/{slug}`；含套装部件 id 列表）。
 */
export type WfmItemDetail = {
  url_name: string;
  item_name: string;
  id?: string;
  thumb?: string;
  /** 部件类型小图标；见 {@link WfmItemRow.subIcon} */
  subIcon?: string;
  ducats?: number | null;
  tags?: string[];
  /** 是否套装根节点 */
  setRoot?: boolean;
  /** 套装内物品 id 列表（含自身） */
  setParts?: string[];
  /** 组成一套所需本部件数量 */
  quantityInSet?: number;
};

/**
 * 紫卡属性目录行（v2 `/riven/attributes`）。
 */
export type WfmRivenAttributeCatalogRow = {
  /** 属性 slug（与拍卖 attributes.url_name 对齐） */
  url_name: string;
  /** 展示名（按请求 Language 取 i18n） */
  item_name: string;
};

/**
 * 上游订单行（含卖家与模组等级）。
 */
export type WfmOrderRow = {
  order_type: 'sell' | 'buy';
  platinum: number;
  quantity: number;
  mod_rank?: number | null;
  last_update?: string;
  user?: {
    ingame_name?: string;
    status?: string;
    /** WFM 用户声誉 */
    reputation?: number;
  };
};

/**
 * 上游紫卡词条。
 */
export type WfmRivenAttribute = {
  url_name?: string;
  positive?: boolean;
  value?: number;
};

/**
 * 上游拍卖行（紫卡明细；当前仍来自 v1 auctions）。
 */
export type WfmAuctionRow = {
  starting_price?: number;
  buyout_price?: number;
  top_bid?: number | null;
  updated?: string;
  owner?: {
    ingame_name?: string;
    status?: string;
    reputation?: number;
  };
  /** 部分响应仍用 user；与 owner 并存时优先 owner */
  user?: {
    ingame_name?: string;
    status?: string;
    reputation?: number;
  };
  item?: {
    weapon_url_name?: string;
    name?: string;
    mod_rank?: number;
    re_rolls?: number;
    mastery_level?: number;
    polarity?: string;
    attributes?: WfmRivenAttribute[];
  };
};

/**
 * 紫卡拍卖搜索可选过滤（上游支持则透传；否则由服务层本地滤）。
 */
export type WfmRivenAuctionSearchOptions = {
  /** 紫卡等级 */
  rank?: number;
  /** 段位 */
  mastery?: number;
};

/**
 * v2 物品 `i18n` 片段。
 */
type WfmV2I18nBlock = {
  name?: string;
  thumb?: string;
  icon?: string;
  /** 部件类型小图标相对路径（与套装总图区分） */
  subIcon?: string;
};

/**
 * v2 `/items` / `/riven/weapons` 行。
 */
type WfmV2CatalogRow = {
  id?: string;
  slug?: string;
  ducats?: number | null;
  tags?: string[];
  setRoot?: boolean;
  setParts?: string[];
  quantityInSet?: number;
  i18n?: Partial<Record<WfmLanguage | string, WfmV2I18nBlock>>;
};

/**
 * v2 `/riven/attributes` 行。
 */
type WfmV2RivenAttributeRow = {
  slug?: string;
  i18n?: Partial<Record<WfmLanguage | string, WfmV2I18nBlock>>;
};

/**
 * v2 `/orders/item/{slug}` 行。
 */
type WfmV2OrderRow = {
  type?: string;
  platinum?: number;
  quantity?: number;
  rank?: number | null;
  updatedAt?: string;
  user?: {
    ingameName?: string;
    status?: string;
    reputation?: number;
  };
};

/**
 * 将配置里的上游根规范为 v2（兼容仍写着 `/v1` 的旧配置）。
 *
 * @param raw - 配置或默认 URL
 * @returns 无尾斜杠的 v2 根
 */
export function resolveWfmV2BaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '');
  if (/\/v1$/i.test(trimmed)) {
    return trimmed.replace(/\/v1$/i, '/v2');
  }
  if (!/\/v2$/i.test(trimmed) && /api\.warframe\.market$/i.test(trimmed)) {
    return `${trimmed}/v2`;
  }
  return trimmed;
}

/**
 * 由 v2 根推导仍可用的 v1 根（拍卖）。
 *
 * @param v2Base - 已规范的 v2 根
 * @returns v1 根
 */
function resolveWfmV1BaseUrl(v2Base: string): string {
  if (/\/v2$/i.test(v2Base)) {
    return v2Base.replace(/\/v2$/i, '/v1');
  }
  return WFM_API_V1_BASE;
}

/**
 * Warframe Market HTTP 客户端（仅被 API 层使用）。
 */
export class WarframeMarketClient {
  private readonly baseUrl: string;
  private readonly v1BaseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultLanguage: WfmLanguage;

  /**
   * @param options - 根 URL / 超时 / fetch / 默认 Language
   */
  constructor(options?: {
    baseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    /** 默认索引语言；物品名模糊锁定用 zh-hans */
    language?: WfmLanguage;
  }) {
    this.baseUrl = resolveWfmV2BaseUrl(options?.baseUrl ?? WFM_API_BASE);
    this.v1BaseUrl = resolveWfmV1BaseUrl(this.baseUrl);
    this.timeoutMs = options?.timeoutMs ?? 8000;
    this.fetchImpl = options?.fetchImpl ?? fetch;
    this.defaultLanguage = options?.language ?? 'zh-hans';
  }

  /**
   * 拉取全量物品索引（v2；按语言从 `i18n` 取名）。
   *
   * @param language - 展示名语言
   * @returns 物品行
   */
  async listItems(language: WfmLanguage = this.defaultLanguage): Promise<WfmItemRow[]> {
    const json = await this.getJson<{ data?: WfmV2CatalogRow[] }>('/items');
    return mapCatalogRows(json.data ?? [], language);
  }

  /**
   * 拉取可打紫卡武器列表（v2 `/riven/weapons`）。
   *
   * @param language - 展示名语言
   * @returns 与 `/items` 同形的精简行
   */
  async listRivenItems(language: WfmLanguage = this.defaultLanguage): Promise<WfmItemRow[]> {
    const json = await this.getJson<{ data?: WfmV2CatalogRow[] }>('/riven/weapons');
    return mapCatalogRows(json.data ?? [], language);
  }

  /**
   * 拉取紫卡属性目录（v2 `/riven/attributes`；`Language` 头决定 i18n 优先语种）。
   *
   * @param language - 展示名语言（zh-hans / en）
   * @returns slug → 展示名
   */
  async listRivenAttributes(
    language: WfmLanguage = this.defaultLanguage,
  ): Promise<WfmRivenAttributeCatalogRow[]> {
    const json = await this.getJson<{ data?: WfmV2RivenAttributeRow[] }>('/riven/attributes', {
      language,
    });
    const out: WfmRivenAttributeCatalogRow[] = [];
    for (const row of json.data ?? []) {
      const slug = row.slug?.trim();
      if (!slug) {
        continue;
      }
      const localized = row.i18n?.[language]?.name?.trim();
      const fallbackEn = row.i18n?.en?.name?.trim();
      out.push({
        url_name: slug,
        item_name: localized || fallbackEn || slug.replace(/_/g, ' '),
      });
    }
    return out;
  }

  /**
   * 拉取物品订单（v2 `/orders/item/{slug}?platform=pc`）。
   *
   * @param urlName - WFM slug（原 url_name）
   * @returns 订单行
   */
  async listOrders(urlName: string): Promise<WfmOrderRow[]> {
    const path = `/orders/item/${encodeURIComponent(urlName)}?platform=pc`;
    const json = await this.getJson<{ data?: WfmV2OrderRow[] }>(path);
    return (json.data ?? []).map(mapV2OrderRow).filter((row): row is WfmOrderRow => row !== null);
  }

  /**
   * 拉取单物品详情（v2 `/item/{slug}`；含 ducats / setParts）。
   *
   * @param urlName - WFM slug
   * @param language - 展示名语言
   * @returns 详情；上游无 data 时抛错由 getJson 处理
   */
  async getItem(
    urlName: string,
    language: WfmLanguage = this.defaultLanguage,
  ): Promise<WfmItemDetail> {
    const slug = urlName.trim();
    if (!slug) {
      throw upstreamUnavailableError('Warframe Market item slug is empty');
    }
    const json = await this.getJson<{ data?: WfmV2CatalogRow }>(
      `/item/${encodeURIComponent(slug)}`,
      { language },
    );
    const mapped = mapCatalogRowToDetail(json.data, language);
    if (!mapped) {
      throw upstreamUnavailableError(`Warframe Market item not found: ${slug}`);
    }
    return mapped;
  }

  /**
   * 搜索紫卡拍卖（按武器 slug，价升序；暂走 v1，因 v2 尚无对等路由）。
   *
   * @param weaponUrlName - 武器 slug
   * @param options - 可选 rank/mastery（上游支持则透传）
   * @returns 拍卖行
   */
  async searchRivenAuctions(
    weaponUrlName: string,
    options: WfmRivenAuctionSearchOptions = {},
  ): Promise<WfmAuctionRow[]> {
    const slug = weaponUrlName.trim();
    // 空 slug 会让上游直接 HTTP 400；在此拦截为业务层可理解的上游错误。
    if (!slug) {
      throw upstreamUnavailableError('Warframe Market riven weapon slug is empty');
    }
    const qs = new URLSearchParams({
      type: 'riven',
      weapon_url_name: slug,
      sort_by: 'price_asc',
    });
    if (options.rank !== undefined) {
      qs.set('mod_rank', String(options.rank));
    }
    if (options.mastery !== undefined) {
      qs.set('mastery_rank', String(options.mastery));
    }
    const json = await this.getJson<{ payload?: { auctions?: WfmAuctionRow[] } }>(
      `/auctions/search?${qs.toString()}`,
      { baseUrl: this.v1BaseUrl },
    );
    return json.payload?.auctions ?? [];
  }

  /**
   * GET JSON（Platform + Language + 可识别 User-Agent；可切 v1/v2 根）。
   *
   * @param path - 路径（含 query）
   * @param options - 可选覆盖根 URL / Language
   * @returns 解析后的 JSON
   * @throws 上游非 2xx / 超时时抛出 `UPSTREAM_UNAVAILABLE`（含 `Warframe Market HTTP ${status}`）
   */
  private async getJson<T>(
    path: string,
    options: { baseUrl?: string; language?: WfmLanguage } = {},
  ): Promise<T> {
    const language = options.language ?? this.defaultLanguage;
    const root = options.baseUrl ?? this.baseUrl;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Cloudflare 对无 UA 的 Node fetch 返回 403「Just a moment…」；须自报 Lanius 身份。
      const response = await this.fetchImpl(`${root}${path}`, {
        headers: {
          Accept: 'application/json',
          Language: language,
          Platform: 'pc',
          'User-Agent': WFM_USER_AGENT,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw upstreamUnavailableError(`Warframe Market HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw upstreamUnavailableError('Warframe Market timeout');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * 将 v2 目录行映射为服务层沿用的 ItemRow。
 *
 * @param rows - v2 data 数组
 * @param language - 优先语言
 * @returns 精简行
 */
function mapCatalogRows(rows: WfmV2CatalogRow[], language: WfmLanguage): WfmItemRow[] {
  const out: WfmItemRow[] = [];
  for (const row of rows) {
    const mapped = mapCatalogRowToItem(row, language);
    if (mapped) {
      out.push(mapped);
    }
  }
  return out;
}

/**
 * 将单条 v2 目录/详情行映射为索引 ItemRow。
 *
 * @param row - v2 行
 * @param language - 优先语言
 * @returns 精简行或 null
 */
function mapCatalogRowToItem(
  row: WfmV2CatalogRow | undefined,
  language: WfmLanguage,
): WfmItemRow | null {
  const slug = row?.slug?.trim();
  if (!slug || !row) {
    return null;
  }
  const localized = row.i18n?.[language]?.name?.trim();
  const fallbackEn = row.i18n?.en?.name?.trim();
  const itemName = localized || fallbackEn || slug.replace(/_/g, ' ');
  const i18nPreferred = row.i18n?.[language];
  const i18nEn = row.i18n?.en;
  const thumb = i18nPreferred?.thumb?.trim() || i18nEn?.thumb?.trim();
  const subIcon = i18nPreferred?.subIcon?.trim() || i18nEn?.subIcon?.trim();
  const id = row.id?.trim();
  const tags = Array.isArray(row.tags)
    ? row.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
    : undefined;
  const ducats =
    typeof row.ducats === 'number' && row.ducats >= 0 && Number.isFinite(row.ducats)
      ? Math.trunc(row.ducats)
      : null;
  return {
    url_name: slug,
    item_name: itemName,
    ...(id ? { id } : {}),
    ...(thumb ? { thumb } : {}),
    ...(subIcon ? { subIcon } : {}),
    ducats,
    ...(tags && tags.length > 0 ? { tags } : {}),
  };
}

/**
 * 将 v2 单物品详情映射为 WfmItemDetail。
 *
 * @param row - v2 data
 * @param language - 优先语言
 * @returns 详情或 null
 */
function mapCatalogRowToDetail(
  row: WfmV2CatalogRow | undefined,
  language: WfmLanguage,
): WfmItemDetail | null {
  const base = mapCatalogRowToItem(row, language);
  if (!base || !row) {
    return null;
  }
  const setParts = Array.isArray(row.setParts)
    ? row.setParts.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : undefined;
  const quantityInSet =
    typeof row.quantityInSet === 'number' &&
    row.quantityInSet >= 1 &&
    Number.isFinite(row.quantityInSet)
      ? Math.trunc(row.quantityInSet)
      : undefined;
  return {
    ...base,
    setRoot: row.setRoot === true,
    ...(setParts && setParts.length > 0 ? { setParts } : {}),
    ...(quantityInSet !== undefined ? { quantityInSet } : {}),
  };
}

/**
 * 将 v2 订单行映射为内部 WfmOrderRow；缺价/类型则丢弃。
 *
 * @param row - v2 订单
 * @returns 规范化行或 null
 */
function mapV2OrderRow(row: WfmV2OrderRow): WfmOrderRow | null {
  const type = row.type === 'sell' || row.type === 'buy' ? row.type : null;
  if (!type || typeof row.platinum !== 'number' || typeof row.quantity !== 'number') {
    return null;
  }
  // quantity 须为正整数；异常上游值丢弃以免 DTO Zod 400。
  if (!Number.isFinite(row.quantity) || row.quantity < 1) {
    return null;
  }
  const reputation =
    typeof row.user?.reputation === 'number' &&
    row.user.reputation >= 0 &&
    Number.isFinite(row.user.reputation)
      ? Math.trunc(row.user.reputation)
      : undefined;
  return {
    order_type: type,
    platinum: row.platinum,
    quantity: Math.trunc(row.quantity),
    mod_rank: typeof row.rank === 'number' && row.rank >= 0 ? row.rank : null,
    last_update: row.updatedAt,
    user: {
      ingame_name: row.user?.ingameName,
      status: row.user?.status,
      ...(reputation !== undefined ? { reputation } : {}),
    },
  };
}
