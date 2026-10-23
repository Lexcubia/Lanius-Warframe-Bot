<script setup lang="ts">
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
import { OfficialItemIcon, resolveDucatsIconSrc, resolvePlatinumIconSrc } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

const props = defineProps<{
  market: MarketOrdersDto;
  locale: Locale;
  /** QQ 皮肤 */
  skin?: CardSkinId;
}>();

const platIcon = resolvePlatinumIconSrc();
const ducatIcon = resolveDucatsIconSrc();

/**
 * 缩略图可读：本页卖单最多展示 6 行（与默认 pageSize 对齐）。
 *
 * @returns 截断后的卖单
 */
const visibleOrders = computed(() => props.market.orders.slice(0, 6));
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
    :skin="skin"
  >
    <div class="item">
      <OfficialItemIcon
        class="item__icon"
        :icon-url="market.resolved.iconUrl"
        :alt="pickLocalized(market.resolved.name, locale)"
        :size="76"
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
        <p
          v-if="market.resolved.ducats != null"
          class="item__ducats"
          :aria-label="formatDucatsLabel(market.resolved.ducats, locale)"
        >
          <img
            class="ducat"
            :src="ducatIcon"
            alt=""
            width="16"
            height="16"
            data-lanius-icon="ducats"
          />
          <span class="item__ducats-num">{{ market.resolved.ducats }}</span>
        </p>
      </div>
    </div>

    <section
      v-if="market.resolved.isSet && (market.resolved.components?.length ?? 0) > 0"
      class="parts"
      :aria-label="locale === 'en' ? 'Set components' : '套装部件'"
    >
      <h3 class="parts__title">
        {{ locale === 'en' ? 'Set components' : '套装部件' }}
      </h3>
      <ul class="parts__grid">
        <li v-for="part in market.resolved.components" :key="part.urlName" class="part">
          <!-- 必须用部件自身 iconUrl（API 侧优先 subIcon），禁止回退套装总图 -->
          <OfficialItemIcon
            class="part__icon"
            :icon-url="part.iconUrl"
            :alt="pickLocalized(part.name, locale)"
            :size="32"
          />
          <span class="part__name">{{ pickLocalized(part.name, locale) }}</span>
          <span v-if="part.quantityInSet != null" class="part__qty">×{{ part.quantityInSet }}</span>
          <span
            v-if="part.ducats != null"
            class="part__ducats"
            :aria-label="formatDucatsLabel(part.ducats, locale)"
          >
            <img
              class="ducat ducat--sm"
              :src="ducatIcon"
              alt=""
              width="14"
              height="14"
              data-lanius-icon="ducats"
            />
            <span>{{ part.ducats }}</span>
          </span>
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
        v-for="(order, index) in visibleOrders"
        :key="`${order.seller}-${order.platinum}-${index}`"
        class="row"
        :class="{ 'row--zebra': index % 2 === 1 }"
      >
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
        <span class="seller__name">{{ order.seller }}</span>
        <span class="seller__rep">{{
          formatSellerReputationLabel(order.sellerReputation, locale)
        }}</span>
        <span class="status" :class="`status--${sellerStatusTone(order.status)}`">
          {{ formatSellerStatusLabel(order.status, locale) }}
        </span>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--lanius-border);
}
.item__icon {
  flex: 0 0 auto;
}
.item__body {
  min-width: 0;
  flex: 1 1 auto;
}
.item__name {
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
  font-family: var(--lanius-font-display);
  color: var(--lanius-text);
  word-break: break-word;
}
.item__meta {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  line-height: 1.3;
}
.item__ducats {
  margin: 4px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--lanius-accent-dim);
}
.item__ducats-num {
  font-variant-numeric: tabular-nums;
}
.ducat {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}
.ducat--sm {
  width: 14px;
  height: 14px;
}
.parts {
  margin: 0 0 4px;
}
.parts__title {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-text-muted);
}
.parts__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 8px;
}
.part {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 0;
  border-bottom: 1px solid var(--lanius-border);
}
.part__icon {
  flex: 0 0 auto;
}
.part__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.part__qty {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
.part__ducats {
  flex-shrink: 0;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-accent-dim);
  font-variant-numeric: tabular-nums;
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
}
.row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px 8px;
  padding: 4px 2px;
  border-bottom: 1px solid var(--lanius-border);
  font-size: 13px;
}
.row--zebra {
  background: var(--lanius-zebra);
}
.deal__plat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 700;
  flex-shrink: 0;
}
.deal__plat-num {
  font-variant-numeric: tabular-nums;
}
.deal__qty {
  flex-shrink: 0;
  color: var(--lanius-text-muted);
  font-weight: 600;
}
.plat {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.rank {
  flex-shrink: 0;
  color: var(--lanius-text-muted);
  font-size: 12px;
}
.seller__name {
  font-weight: 600;
  color: var(--lanius-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.seller__rep {
  flex-shrink: 0;
  color: var(--lanius-text-muted);
}
.status {
  margin-left: auto;
  flex-shrink: 0;
  font-weight: 700;
}
.status--online {
  color: var(--lanius-success);
}
.status--ingame {
  color: var(--lanius-accent-dim);
}
.status--offline {
  color: var(--lanius-text-muted);
}
</style>
