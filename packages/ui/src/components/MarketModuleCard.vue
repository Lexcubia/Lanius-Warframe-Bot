<script setup lang="ts">
import type { Locale, MarketOrdersDto } from '@lanius/core';
import { formatMarketPriceQuantity, formatSellerStatusLabel, pickLocalized } from '@lanius/core';

import { resolvePlatinumIconSrc } from '../lib/platinum-icon.js';
import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';

defineProps<{
  market: MarketOrdersDto;
  locale: Locale;
}>();

const platIcon = resolvePlatinumIconSrc();
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'Market' : '市场'"
    :subtitle="pickLocalized(market.resolved.name, locale)"
    :locale="locale"
  >
    <div class="head">
      <OfficialItemIcon
        class="head__icon"
        :icon-url="market.resolved.iconUrl"
        :alt="pickLocalized(market.resolved.name, locale)"
        :size="40"
      />
      <p class="meta">
        <template v-if="locale === 'en'">
          page {{ market.page }}/{{ Math.max(1, Math.ceil(market.total / market.pageSize) || 1) }}
          · sell online/ingame · price↑
          <span v-if="market.modRank !== null"> · rank {{ market.modRank }}</span>
        </template>
        <template v-else>
          第 {{ market.page }}/{{ Math.max(1, Math.ceil(market.total / market.pageSize) || 1) }} 页
          · 在线/游戏中卖单 · 价↑
          <span v-if="market.modRank !== null"> · 等级 {{ market.modRank }}</span>
        </template>
      </p>
    </div>
    <p v-if="market.total === 0" class="empty">
      {{
        locale === 'en'
          ? 'No online/ingame sell orders.'
          : `已锁定 ${pickLocalized(market.resolved.name, locale)}，暂无在线/游戏中卖单`
      }}
    </p>
    <ul v-else class="rows">
      <li
        v-for="(order, index) in market.orders"
        :key="`${order.seller}-${order.platinum}-${index}`"
        class="row"
      >
        <div class="name">
          <span class="price">{{
            formatMarketPriceQuantity(order.platinum, order.quantity, locale)
          }}</span>
          <img
            class="plat"
            :src="platIcon"
            alt=""
            width="14"
            height="14"
            data-lanius-icon="platinum"
          />
          <span v-if="order.modRank !== null" class="rank">
            {{ locale === 'en' ? `r${order.modRank}` : `等级${order.modRank}` }}
          </span>
        </div>
        <div class="prices">
          <span>{{ order.seller }}</span>
          <span>{{ formatSellerStatusLabel(order.status, locale) }}</span>
        </div>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}
.head__icon {
  flex: 0 0 auto;
}
.meta {
  margin: 0;
  font-size: 11px;
  color: var(--lanius-text-muted);
  line-height: 1.45;
}
.empty {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 13px;
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.row {
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--lanius-panel);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .row:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}
.name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
}
.price {
  font-weight: 700;
}
.plat {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex: 0 0 auto;
}
.rank {
  font-weight: 600;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.prices {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
</style>
