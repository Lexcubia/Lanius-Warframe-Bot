<script setup lang="ts">
import type { Locale, RivenOrdersDto } from '@lanius/core';
import {
  formatSellerReputationLabel,
  formatSellerStatusLabel,
  pickLocalized,
  sellerStatusTone,
} from '@lanius/core';

import { resolvePlatinumIconSrc } from '../lib/platinum-icon.js';
import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';

defineProps<{
  riven: RivenOrdersDto;
  locale: Locale;
}>();

const platIcon = resolvePlatinumIconSrc();
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'Riven' : '紫卡'"
    :subtitle="
      locale === 'en'
        ? `page ${riven.page}/${Math.max(1, Math.ceil(riven.total / riven.pageSize) || 1)}`
        : `第 ${riven.page}/${Math.max(1, Math.ceil(riven.total / riven.pageSize) || 1)} 页`
    "
    :locale="locale"
  >
    <!-- 武器详情：名称与图标同在正文，避免挤在右上角看不清 -->
    <div class="item">
      <OfficialItemIcon
        class="item__icon"
        :icon-url="riven.resolved.iconUrl"
        :alt="pickLocalized(riven.resolved.name, locale)"
        :size="64"
      />
      <div class="item__body">
        <h2 class="item__name">{{ pickLocalized(riven.resolved.name, locale) }}</h2>
        <p class="item__meta">
          <template v-if="locale === 'en'">auctions online/ingame · price↑</template>
          <template v-else>在线/游戏中拍卖 · 价↑</template>
        </p>
      </div>
    </div>
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
        <div class="deal">
          <span class="deal__plat">
            <img
              class="plat"
              :src="platIcon"
              alt=""
              width="16"
              height="16"
              data-lanius-icon="platinum"
            />
            <span class="deal__plat-num">{{ order.platinum }}</span>
          </span>
          <span class="seller__name">{{ order.seller }}</span>
          <span class="seller__rep">{{
            formatSellerReputationLabel(order.sellerReputation, locale)
          }}</span>
          <span class="status" :class="`status--${sellerStatusTone(order.status)}`">
            {{ formatSellerStatusLabel(order.status, locale) }}
          </span>
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
.item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid var(--lanius-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.item__icon {
  flex: 0 0 auto;
}
.item__body {
  min-width: 0;
  flex: 1 1 auto;
}
.item__name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
  font-family: var(--lanius-font-display);
  color: var(--lanius-text);
  word-break: break-word;
}
.item__meta {
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
    border-color: rgba(255, 122, 110, 0.4);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}
.deal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  font-weight: 700;
  font-size: 13px;
}
.deal__plat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 2px 6px;
  border-radius: 8px;
  background: rgba(255, 122, 110, 0.12);
}
.deal__plat-num {
  font-variant-numeric: tabular-nums;
}
.plat {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
}
.seller__name {
  font-weight: 600;
  font-size: 12px;
  color: var(--lanius-text);
}
.seller__rep {
  font-weight: 600;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.status {
  font-weight: 700;
  font-size: 11px;
}
.status--online {
  color: var(--lanius-success, #5fd0b0);
}
.status--ingame {
  color: var(--lanius-accent-dim, #2f8fc4);
}
.status--offline {
  color: var(--lanius-text-muted, #6b7385);
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
