import { upstreamUnavailableError } from '../../lib/http-error.js';

/**
 * WFM 上游默认根。
 */
export const WFM_API_BASE = 'https://api.warframe.market/v1';

/**
 * 上游物品条目（精简）。
 */
export type WfmItemRow = {
  url_name: string;
  item_name: string;
  thumb?: string;
};

/**
 * 上游订单行（精简）。
 */
export type WfmOrderRow = {
  order_type: 'sell' | 'buy';
  platinum: number;
  quantity: number;
  user?: { status?: string };
};

/**
 * 上游拍卖行（紫卡，精简）。
 */
export type WfmAuctionRow = {
  starting_price?: number;
  buyout_price?: number;
  top_bid?: number | null;
  item?: { weapon_url_name?: string; name?: string };
};

/**
 * Warframe Market HTTP 客户端（仅被 API 层使用）。
 */
export class WarframeMarketClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  /**
   * @param options - 根 URL / 超时 / fetch
   */
  constructor(options?: {
    baseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    this.baseUrl = (options?.baseUrl ?? WFM_API_BASE).replace(/\/+$/, '');
    this.timeoutMs = options?.timeoutMs ?? 8000;
    this.fetchImpl = options?.fetchImpl ?? fetch;
  }

  /**
   * 拉取全量物品索引（宜缓存）。
   *
   * @returns 物品行
   */
  async listItems(): Promise<WfmItemRow[]> {
    const json = await this.getJson<{ payload?: { items?: WfmItemRow[] } }>(
      '/items',
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
   * 搜索紫卡拍卖（按武器 url_name）。
   *
   * @param weaponUrlName - 武器 url_name
   * @returns 拍卖行
   */
  async searchRivenAuctions(weaponUrlName: string): Promise<WfmAuctionRow[]> {
    const qs = new URLSearchParams({
      type: 'riven',
      weapon_url_name: weaponUrlName,
      sort_by: 'price_asc',
    });
    const json = await this.getJson<{ payload?: { auctions?: WfmAuctionRow[] } }>(
      `/auctions/search?${qs.toString()}`,
    );
    return json.payload?.auctions ?? [];
  }

  /**
   * GET JSON。
   *
   * @param path - 路径
   * @returns 解析后的 JSON
   */
  private async getJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        headers: {
          Accept: 'application/json',
          Language: 'en',
          Platform: 'pc',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw upstreamUnavailableError(
          `Warframe Market HTTP ${response.status}`,
        );
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
