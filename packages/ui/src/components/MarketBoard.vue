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

import { resolveDucatsIconSrc } from '../lib/ducats-icon.js';
import { resolvePlatinumIconSrc } from '../lib/platinum-icon.js';
import OfficialItemIcon from './OfficialItemIcon.vue';

/**
 * 公开站市场看板（物品详情 + 套装部件 + 卖单列表；不依赖 QQ ModuleCard / Shell）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的市场订单 DTO。 */
  market: MarketOrdersDto;
  /** 当前 UI locale。 */
  locale: Locale;
}>();

const platIcon = resolvePlatinumIconSrc();
const ducatIcon = resolveDucatsIconSrc();

/**
 * 按当前 locale 选择中/英标签。
 *
 * @param zh - 中文文案
 * @param en - 英文文案
 * @returns 与 locale 匹配的字符串
 */
function t(zh: string, en: string): string {
  return props.locale === 'en' ? en : zh;
}

/**
 * 当前页码展示串（如「第 1/3 页」）。
 *
 * @returns 页码副标题
 */
const pageLabel = computed(() => {
  const totalPages = Math.max(1, Math.ceil(props.market.total / props.market.pageSize) || 1);
  return t(`第 ${props.market.page}/${totalPages} 页`, `page ${props.market.page}/${totalPages}`);
});

/**
 * 套装部件中最大杜卡德，用于条形相对宽度。
 *
 * @returns 最大杜卡德数值；无部件时为 0
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
  <section class="lanius-mb">
    <header class="lanius-mb__header">
      <div>
        <p class="lanius-mb__eyebrow">{{ t('市场', 'Market') }}</p>
        <h2 class="lanius-mb__title">{{ pickLocalized(market.resolved.name, locale) }}</h2>
      </div>
      <span class="lanius-mb__page">{{ pageLabel }}</span>
    </header>

    <div class="lanius-mb__item">
      <OfficialItemIcon
        class="lanius-mb__icon"
        :icon-url="market.resolved.iconUrl"
        :alt="pickLocalized(market.resolved.name, locale)"
        :size="72"
      />
      <div class="lanius-mb__body">
        <p class="lanius-mb__meta">
          <template v-if="locale === 'en'">sell online/ingame · price↑</template>
          <template v-else>在线/游戏中卖单 · 价↑</template>
          <span v-if="market.modRank !== null">
            {{ locale === 'en' ? ` · rank ${market.modRank}` : ` · 等级 ${market.modRank}` }}
          </span>
        </p>
        <p
          v-if="market.resolved.ducats != null"
          class="lanius-mb__ducats"
          :aria-label="formatDucatsLabel(market.resolved.ducats, locale)"
        >
          <img
            class="lanius-mb__ducat-icon"
            :src="ducatIcon"
            alt=""
            width="16"
            height="16"
            data-lanius-icon="ducats"
          />
          <span>{{ market.resolved.ducats }}</span>
        </p>
      </div>
    </div>

    <section
      v-if="market.resolved.isSet && (market.resolved.components?.length ?? 0) > 0"
      class="lanius-mb__parts"
      :aria-label="t('套装部件', 'Set components')"
    >
      <h3 class="lanius-mb__parts-title">{{ t('套装部件', 'Set components') }}</h3>
      <ul class="lanius-mb__parts-list">
        <li v-for="part in market.resolved.components" :key="part.urlName" class="lanius-mb__part">
          <OfficialItemIcon
            :icon-url="part.iconUrl"
            :alt="pickLocalized(part.name, locale)"
            :size="36"
          />
          <div class="lanius-mb__part-main">
            <div class="lanius-mb__part-row">
              <span class="lanius-mb__part-name">{{ pickLocalized(part.name, locale) }}</span>
              <span v-if="part.quantityInSet != null" class="lanius-mb__part-qty">
                ×{{ part.quantityInSet }}
              </span>
              <span
                v-if="part.ducats != null"
                class="lanius-mb__part-ducats"
                :aria-label="formatDucatsLabel(part.ducats, locale)"
              >
                <img
                  class="lanius-mb__ducat-icon lanius-mb__ducat-icon--sm"
                  :src="ducatIcon"
                  alt=""
                  width="14"
                  height="14"
                  data-lanius-icon="ducats"
                />
                <span>{{ part.ducats }}</span>
              </span>
            </div>
            <div class="lanius-mb__part-bar" aria-hidden="true">
              <span
                class="lanius-mb__part-bar-fill"
                :style="{ width: `${ducatBarPercent(part.ducats)}%` }"
              />
            </div>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="market.total === 0" class="lanius-mb__empty">
      {{
        locale === 'en'
          ? 'No online/ingame sell orders.'
          : `已锁定 ${pickLocalized(market.resolved.name, locale)}，暂无在线/游戏中卖单`
      }}
    </p>
    <ul v-else class="lanius-mb__orders">
      <li
        v-for="(order, index) in market.orders"
        :key="`${order.seller}-${order.platinum}-${index}`"
        class="lanius-mb__order"
      >
        <div class="lanius-mb__deal">
          <span
            class="lanius-mb__plat"
            :aria-label="formatMarketPlatinumLabel(order.platinum, locale)"
          >
            <img
              class="lanius-mb__plat-icon"
              :src="platIcon"
              alt=""
              width="16"
              height="16"
              data-lanius-icon="platinum"
            />
            <span class="lanius-mb__plat-num">{{ order.platinum }}</span>
          </span>
          <span class="lanius-mb__qty">{{
            formatMarketQuantityLabel(order.quantity, locale)
          }}</span>
          <span v-if="order.modRank !== null" class="lanius-mb__rank">
            {{ locale === 'en' ? `r${order.modRank}` : `等级${order.modRank}` }}
          </span>
        </div>
        <div class="lanius-mb__seller">
          <span class="lanius-mb__seller-name">{{ order.seller }}</span>
          <span class="lanius-mb__seller-rep">{{
            formatSellerReputationLabel(order.sellerReputation, locale)
          }}</span>
          <span
            class="lanius-mb__status"
            :class="`lanius-mb__status--${sellerStatusTone(order.status)}`"
          >
            {{ formatSellerStatusLabel(order.status, locale) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lanius-mb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-mb__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.lanius-mb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-mb__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.25rem, 2vw, 1.6rem);
  word-break: break-word;
}

.lanius-mb__page {
  color: var(--lanius-text-muted);
  font-size: 0.8rem;
}

.lanius-mb__item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--lanius-border);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.55);
}

.lanius-mb__icon {
  flex: 0 0 auto;
}

.lanius-mb__body {
  min-width: 0;
  flex: 1 1 auto;
}

.lanius-mb__meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
  line-height: 1.45;
}

.lanius-mb__ducats {
  margin: 0.45rem 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--lanius-accent-dim, #2f8fc4);
  font-variant-numeric: tabular-nums;
}

.lanius-mb__ducat-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.lanius-mb__ducat-icon--sm {
  width: 14px;
  height: 14px;
}

.lanius-mb__parts {
  margin: 0 0 1rem;
}

.lanius-mb__parts-title {
  margin: 0 0 0.55rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--lanius-text-muted);
}

.lanius-mb__parts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

@media (max-width: 640px) {
  .lanius-mb__parts-list {
    grid-template-columns: 1fr;
  }
}

.lanius-mb__part {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--lanius-border);
  border-radius: 0.75rem;
  background: var(--lanius-panel);
}

.lanius-mb__part-main {
  min-width: 0;
  flex: 1 1 auto;
}

.lanius-mb__part-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.65rem;
  margin-bottom: 0.35rem;
}

.lanius-mb__part-name {
  font-size: 0.85rem;
  font-weight: 700;
}

.lanius-mb__part-qty {
  font-size: 0.8rem;
  color: var(--lanius-text-muted);
}

.lanius-mb__part-ducats {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--lanius-accent-dim, #2f8fc4);
  font-variant-numeric: tabular-nums;
}

.lanius-mb__part-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(62, 78, 110, 0.12);
  overflow: hidden;
}

.lanius-mb__part-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4eb7e8, #2f8fc4);
  transition: width 0.25s ease;
}

.lanius-mb__empty {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.95rem;
}

.lanius-mb__orders {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.lanius-mb__order {
  border: 1px solid var(--lanius-border);
  border-radius: 0.75rem;
  padding: 0.7rem 0.85rem;
  background: var(--lanius-panel);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .lanius-mb__order:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.lanius-mb__deal {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.lanius-mb__plat {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem 0.15rem 0.4rem;
  border-radius: 8px;
  background: rgba(78, 183, 232, 0.12);
}

.lanius-mb__plat-num {
  font-variant-numeric: tabular-nums;
}

.lanius-mb__plat-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
}

.lanius-mb__qty {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  background: rgba(62, 78, 110, 0.06);
}

.lanius-mb__rank {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--lanius-text-muted);
}

.lanius-mb__seller {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.75rem;
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
}

.lanius-mb__seller-name {
  font-weight: 600;
  color: var(--lanius-text);
}

.lanius-mb__seller-rep {
  font-weight: 600;
}

.lanius-mb__status {
  font-weight: 700;
}

.lanius-mb__status--online {
  color: var(--lanius-success, #5fd0b0);
}

.lanius-mb__status--ingame {
  color: var(--lanius-accent-dim, #2f8fc4);
}

.lanius-mb__status--offline {
  color: var(--lanius-text-muted, #6b7385);
}
</style>
