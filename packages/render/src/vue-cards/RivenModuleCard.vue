<script setup lang="ts">
import type { Locale, RivenOrdersDto } from '@lanius/core';
import {
  formatSellerReputationLabel,
  formatSellerStatusLabel,
  pickLocalized,
  sellerStatusTone,
} from '@lanius/core';
import { OfficialItemIcon, resolvePlatinumIconSrc } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

const props = defineProps<{
  riven: RivenOrdersDto;
  locale: Locale;
  skin?: CardSkinId;
}>();

const platIcon = resolvePlatinumIconSrc();

/**
 * 缩略图可读：本页拍卖最多展示 6 行。
 *
 * @returns 截断后的拍卖行
 */
const visibleOrders = computed(() => props.riven.orders.slice(0, 6));
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
    :skin="skin"
  >
    <div class="item">
      <OfficialItemIcon
        class="item__icon"
        :icon-url="riven.resolved.iconUrl"
        :alt="pickLocalized(riven.resolved.name, locale)"
        :size="76"
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
        v-for="(order, index) in visibleOrders"
        :key="`${order.seller}-${order.platinum}-${index}`"
        class="row"
        :class="{ 'row--zebra': index % 2 === 1 }"
      >
        <div class="deal">
          <span class="deal__plat">
            <img
              class="plat"
              :src="platIcon"
              alt=""
              width="14"
              height="14"
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
        <div class="meta">
          <span>{{ locale === 'en' ? `MR${order.mastery}` : `段位${order.mastery}` }}</span>
          <span>{{ locale === 'en' ? `rank ${order.rank}` : `等级${order.rank}` }}</span>
          <span>{{ locale === 'en' ? `rerolls ${order.rerolls}` : `循环${order.rerolls}` }}</span>
          <span
            v-for="attr in order.attributes"
            :key="attr.urlName + String(attr.value)"
            class="attr"
            :class="{ 'attr--neg': !attr.positive }"
          >
            {{ pickLocalized(attr.name, locale) }}{{ attr.positive ? '+' : '' }}{{ attr.value }}
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
  gap: 10px;
  margin-bottom: 6px;
  padding-bottom: 6px;
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
  padding: 5px 2px;
  border-bottom: 1px solid var(--lanius-border);
}
.row--zebra {
  background: var(--lanius-zebra);
}
.deal {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px 8px;
  font-size: 13px;
  font-weight: 700;
}
.deal__plat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}
.deal__plat-num {
  font-variant-numeric: tabular-nums;
}
.plat {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.seller__name {
  font-weight: 600;
  font-size: 13px;
  color: var(--lanius-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.seller__rep {
  font-weight: 600;
  font-size: 12px;
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}
.status {
  margin-left: auto;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
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
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
.attr {
  color: var(--lanius-text);
}
.attr--neg {
  color: var(--lanius-danger);
}
</style>
