import { upstreamUnavailableError } from '../../lib/http-error.js';

/**
 * WFM 上游默认根。
 */
export const WFM_API_BASE = 'https://api.warframe.market/v1';

/**
 * WFM 请求语言（物品索引 `item_name` 随 Language 变化）。
 */
export type WfmLanguage = 'zh-hans' | 'en';

/**
 * 上游物品条目（精简）。
 */
export type WfmItemRow = {
  url_name: string;
  item_name: string;
  thumb?: string;
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
 * 上游拍卖行（紫卡明细）。
 */
export type WfmAuctionRow = {
  starting_price?: number;
  buyout_price?: number;
  top_bid?: number | null;
  updated?: string;
  owner?: {
    ingame_name?: string;
    status?: string;
  };
  /** 部分响应仍用 user；与 owner 并存时优先 owner */
  user?: {
    ingame_name?: string;
    status?: string;
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
 * Warframe Market HTTP 客户端（仅被 API 层使用）。
 */
export class WarframeMarketClient {
  private readonly baseUrl: string;
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
    this.baseUrl = (options?.baseUrl ?? WFM_API_BASE).replace(/\/+$/, '');
    this.timeoutMs = options?.timeoutMs ?? 8000;
    this.fetchImpl = options?.fetchImpl ?? fetch;
    this.defaultLanguage = options?.language ?? 'zh-hans';
  }

  /**
   * 拉取全量物品索引（宜按语言缓存）。
   *
   * @param language - `Language` 头；默认构造时的 zh-hans
   * @returns 物品行
   */
  async listItems(language: WfmLanguage = this.defaultLanguage): Promise<WfmItemRow[]> {
    const json = await this.getJson<{ payload?: { items?: WfmItemRow[] } }>('/items', language);
    return json.payload?.items ?? [];
  }

  /**
   * 拉取可打紫卡的武器/物品列表（中文名用于 `/zk` 锁定）。
   *
   * @param language - `Language` 头
   * @returns 紫卡物品行（字段与 `/items` 兼容）
   */
  async listRivenItems(language: WfmLanguage = this.defaultLanguage): Promise<WfmItemRow[]> {
    const json = await this.getJson<{ payload?: { items?: WfmItemRow[] } }>(
      '/riven/items',
      language,
    );
    return json.payload?.items ?? [];
  }

  /**
   * 拉取物品订单。
   *
   * @param urlName - WFM url_name
   * @returns 订单行
   */
  async listOrders(urlName: string): Promise<WfmOrderRow[]> {
    const json = await this.getJson<{ payload?: { orders?: WfmOrderRow[] } }>(
      `/items/${encodeURIComponent(urlName)}/orders`,
    );
    return json.payload?.orders ?? [];
  }

  /**
   * 搜索紫卡拍卖（按武器 url_name，价升序）。
   *
   * @param weaponUrlName - 武器 url_name
   * @param options - 可选 rank/mastery（上游支持则透传）
   * @returns 拍卖行
   */
  async searchRivenAuctions(
    weaponUrlName: string,
    options: WfmRivenAuctionSearchOptions = {},
  ): Promise<WfmAuctionRow[]> {
    const qs = new URLSearchParams({
      type: 'riven',
      weapon_url_name: weaponUrlName,
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
    );
    return json.payload?.auctions ?? [];
  }

  /**
   * GET JSON（带 Platform / Language）。
   *
   * @param path - 路径（含 query）
   * @param language - 覆盖默认 Language；订单/拍卖可沿用默认
   * @returns 解析后的 JSON
   */
  private async getJson<T>(path: string, language: WfmLanguage = this.defaultLanguage): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        headers: {
          Accept: 'application/json',
          Language: language,
          Platform: 'pc',
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
