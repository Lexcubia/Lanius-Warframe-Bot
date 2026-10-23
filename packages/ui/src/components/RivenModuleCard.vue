<script setup lang="ts">
import type { Locale, RivenOrdersDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';

defineProps<{
  riven: RivenOrdersDto;
  locale: Locale;
}>();
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'Riven' : '紫卡'"
    :subtitle="pickLocalized(riven.resolved.name, locale)"
    :locale="locale"
  >
    <p class="meta">
      <template v-if="locale === 'en'">
        page {{ riven.page }}/{{ Math.max(1, Math.ceil(riven.total / riven.pageSize) || 1) }}
        · auctions online/ingame · price↑
      </template>
      <template v-else>
        第 {{ riven.page }}/{{ Math.max(1, Math.ceil(riven.total / riven.pageSize) || 1) }} 页 ·
        在线/游戏中拍卖 · 价↑
      </template>
    </p>
    <p v-if="riven.total === 0" class="empty">
      {{
        locale === 'en'
          ? 'No online/ingame riven auctions.'
          : `已锁定 ${pickLocalized(riven.resolved.name, locale)}，暂无在线/游戏中紫卡拍卖`
      }}
    </p>
    <ul v-else class="rows">
      <li
        v-for="(order, index) in riven.orders"
        :key="`${order.seller}-${order.platinum}-${index}`"
        class="row"
      >
        <div class="name">
          {{ order.platinum }}
          <span class="unit">{{ locale === 'en' ? 'p' : '白金' }}</span>
          · {{ order.seller }}
          <span class="status">({{ order.status }})</span>
        </div>
        <div class="prices">
          <span>
            {{ locale === 'en' ? `MR${order.mastery}` : `段位${order.mastery}` }}
          </span>
          <span>
            {{ locale === 'en' ? `rank ${order.rank}` : `等级${order.rank}` }}
          </span>
          <span>
            {{ locale === 'en' ? `rerolls ${order.rerolls}` : `循环${order.rerolls}` }}
          </span>
        </div>
        <div v-if="order.attributes.length" class="attrs">
          <span
            v-for="attr in order.attributes"
            :key="attr.urlName + String(attr.value)"
            class="attr"
            :class="{ 'attr--neg': !attr.positive }"
          >
            {{ pickLocalized(attr.name, locale) }}
            {{ attr.positive ? '+' : '' }}{{ attr.value }}
          </span>
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
    border-color: rgba(255, 122, 110, 0.4);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}
.name {
  font-weight: 700;
  font-size: 13px;
}
.unit,
.status {
  font-weight: 600;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.prices {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
.attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.attr {
  font-size: 11px;
  color: var(--lanius-text);
}
.attr--neg {
  color: var(--lanius-danger, #c44);
}
</style>
