<script setup lang="ts">
import { computed } from 'vue';
import type { Locale, MarketOrdersDto } from '@lanius/core';
import {
  formatDucatsLabel,
  formatMarketPlatinumLabel,
  formatMarketQuantityLabel,
  formatSellerReputationLabel,
  formatSellerStatusLabel,
  pickLocalized,
  sellerStatusTone,
} from '@lanius/core';

import { resolvePlatinumIconSrc } from '../lib/platinum-icon.js';
import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';

const props = defineProps<{
  market: MarketOrdersDto;
  locale: Locale;
}>();

const platIcon = resolvePlatinumIconSrc();

/**
 * 套装部件中最大杜卡德，用于条形相对宽度。
 */
const maxComponentDucats = computed(() => {
  const parts = props.market.resolved.components ?? [];
  let max = 0;
  for (const part of parts) {
    if (typeof part.ducats === 'number' && part.ducats > max) {
      max = part.ducats;
    }
  }
  return max;
});

/**
 * 计算部件杜卡德条相对宽度百分比。
 *
 * @param ducats - 部件杜卡德；null 时返回 0
 * @returns 0–100 的宽度百分比
 */
function ducatBarPercent(ducats: number | null | undefined): number {
  if (typeof ducats !== 'number' || ducats <= 0 || maxComponentDucats.value <= 0) {
    return 0;
  }
  return Math.max(8, Math.round((ducats / maxComponentDucats.value) * 100));
}
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'Market' : '市场'"
    :subtitle="
      locale === 'en'
        ? `page ${market.page}/${Math.max(1, Math.ceil(market.total / market.pageSize) || 1)}`
        : `第 ${market.page}/${Math.max(1, Math.ceil(market.total / market.pageSize) || 1)} 页`
    "
    :locale="locale"
  >
    <!-- 物品详情：名称与图标同在正文，避免挤在右上角看不清 -->
    <div class="item">
      <OfficialItemIcon
        class="item__icon"
        :icon-url="market.resolved.iconUrl"
        :alt="pickLocalized(market.resolved.name, locale)"
        :size="64"
      />
      <div class="item__body">
        <h2 class="item__name">{{ pickLocalized(market.resolved.name, locale) }}</h2>
        <p class="item__meta">
          <template v-if="locale === 'en'">sell online/ingame · price↑</template>
          <template v-else>在线/游戏中卖单 · 价↑</template>
          <span v-if="market.modRank !== null">
            {{ locale === 'en' ? ` · rank ${market.modRank}` : ` · 等级 ${market.modRank}` }}
          </span>
        </p>
        <p v-if="market.resolved.ducats != null" class="item__ducats">
          {{ formatDucatsLabel(market.resolved.ducats, locale) }}
        </p>
      </div>
    </div>

    <!-- 套装部件：列表卡 + 杜卡德条形可视化 -->
    <section
      v-if="market.resolved.isSet && (market.resolved.components?.length ?? 0) > 0"
      class="parts"
      :aria-label="locale === 'en' ? 'Set components' : '套装部件'"
    >
      <h3 class="parts__title">
        {{ locale === 'en' ? 'Set components' : '套装部件' }}
      </h3>
      <ul class="parts__list">
        <li v-for="part in market.resolved.components" :key="part.urlName" class="part">
          <OfficialItemIcon
            class="part__icon"
            :icon-url="part.iconUrl"
            :alt="pickLocalized(part.name, locale)"
            :size="36"
          />
          <div class="part__main">
            <div class="part__row">
              <span class="part__name">{{ pickLocalized(part.name, locale) }}</span>
              <span v-if="part.quantityInSet != null" class="part__qty">
                ×{{ part.quantityInSet }}
              </span>
              <span v-if="part.ducats != null" class="part__ducats">
                {{ formatDucatsLabel(part.ducats, locale) }}
              </span>
            </div>
            <div class="part__bar" aria-hidden="true">
              <span class="part__bar-fill" :style="{ width: `${ducatBarPercent(part.ducats)}%` }" />
            </div>
          </div>
        </li>
      </ul>
    </section>

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
        <!-- 售价：【白金图标 数值】与【数量】两段分开 -->
        <div class="deal">
          <span class="deal__plat" :aria-label="formatMarketPlatinumLabel(order.platinum, locale)">
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
          <span class="deal__qty">{{ formatMarketQuantityLabel(order.quantity, locale) }}</span>
          <span v-if="order.modRank !== null" class="rank">
            {{ locale === 'en' ? `r${order.modRank}` : `等级${order.modRank}` }}
          </span>
        </div>
        <div class="seller">
          <span class="seller__name">{{ order.seller }}</span>
          <span class="seller__rep">{{
            formatSellerReputationLabel(order.sellerReputation, locale)
          }}</span>
          <span class="status" :class="`status--${sellerStatusTone(order.status)}`">
            {{ formatSellerStatusLabel(order.status, locale) }}
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
.item__ducats {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--lanius-accent-dim, #2f8fc4);
}
.parts {
  margin: 0 0 12px;
}
.parts__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-text-muted);
  letter-spacing: 0.02em;
}
.parts__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.part {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  background: var(--lanius-panel);
}
.part__icon {
  flex: 0 0 auto;
}
.part__main {
  min-width: 0;
  flex: 1 1 auto;
}
.part__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  margin-bottom: 5px;
}
.part__name {
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-text);
}
.part__qty {
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.part__ducats {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--lanius-accent-dim, #2f8fc4);
}
.part__bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(62, 78, 110, 0.12);
  overflow: hidden;
}
.part__bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4eb7e8, #2f8fc4);
  transition: width 0.25s ease;
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
.deal {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-weight: 700;
  font-size: 13px;
}
.deal__plat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 2px 6px;
  border-radius: 8px;
  background: rgba(78, 183, 232, 0.12);
}
.deal__plat-num {
  font-variant-numeric: tabular-nums;
}
.deal__qty {
  font-weight: 600;
  font-size: 12px;
  color: var(--lanius-text-muted);
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(62, 78, 110, 0.06);
}
.plat {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
}
.rank {
  font-weight: 600;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.seller {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
.seller__name {
  font-weight: 600;
  color: var(--lanius-text);
}
.seller__rep {
  font-weight: 600;
}
.status {
  font-weight: 700;
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
</style>
