<script setup lang="ts">
import type { Locale, MarketOrdersDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';

defineProps<{
  market: MarketOrdersDto;
  locale: Locale;
}>();
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'Market' : '市场'"
    :subtitle="pickLocalized(market.resolved.name, locale)"
    :locale="locale"
  >
    <p class="meta">
      <template v-if="locale === 'en'">
        page {{ market.page }}/{{ Math.max(1, Math.ceil(market.total / market.pageSize) || 1) }}
        · sell online/ingame · price↑
        <span v-if="market.modRank !== null"> · rank {{ market.modRank }}</span>
      </template>
      <template v-else>
        第 {{ market.page }}/{{ Math.max(1, Math.ceil(market.total / market.pageSize) || 1) }} 页 ·
        在线/游戏中卖单 · 价↑
        <span v-if="market.modRank !== null"> · 等级 {{ market.modRank }}</span>
      </template>
    </p>
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
          {{ order.platinum }}
          <span class="unit">{{ locale === 'en' ? 'p' : '白金' }}</span>
          ×{{ order.quantity }}
          <span v-if="order.modRank !== null" class="rank">
            {{ locale === 'en' ? `r${order.modRank}` : `等级${order.modRank}` }}
          </span>
        </div>
        <div class="prices">
          <span>{{ order.seller }}</span>
          <span>{{ order.status }}</span>
        </div>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.meta {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--lanius-text-muted);
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
  font-weight: 700;
  font-size: 13px;
}
.unit {
  font-weight: 600;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.rank {
  margin-left: 6px;
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
