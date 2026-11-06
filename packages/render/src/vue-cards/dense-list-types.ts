/**
 * 密列表行（Wave1 多模块共用）。
 */
export type DenseListRow = {
  primary: string;
  secondary?: string;
  meta?: string;
  remain?: string;
  iconUrl?: string;
};

/**
 * DenseList 卡片载荷。
 */
export type DenseListCardPayload = {
  title: string;
  kicker: string;
  rows: DenseListRow[];
  emptyText?: string;
  note?: string;
  fetchedAt?: string;
};
