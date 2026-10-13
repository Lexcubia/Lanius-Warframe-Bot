<script setup lang="ts">
import type { Locale, MarketSearchDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';

defineProps<{
  market: MarketSearchDto;
  locale: Locale;
}>();
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'Market' : '市场'"
    :subtitle="market.query"
    :locale="locale"
  >
    <p v-if="!market.items.length" class="empty">
      {{ locale === 'en' ? 'No items matched.' : '未匹配到物品。' }}
    </p>
    <ul v-else class="rows">
      <li v-for="item in market.items" :key="item.urlName" class="row">
        <div class="name">{{ pickLocalized(item.name, locale) }}</div>
        <div class="prices">
          <span>{{ locale === 'en' ? 'Sell' : '在售' }} {{ item.lowestSell ?? '—' }}</span>
          <span>{{ locale === 'en' ? 'Buy' : '求购' }} {{ item.highestBuy ?? '—' }}</span>
        </div>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
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
.prices {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
</style>
