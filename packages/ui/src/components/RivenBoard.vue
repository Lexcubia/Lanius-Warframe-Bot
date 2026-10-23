<script setup lang="ts">
import { computed } from 'vue';
import type { Locale, RivenOrdersDto } from '@lanius/core';
import {
  formatSellerReputationLabel,
  formatSellerStatusLabel,
  pickLocalized,
  sellerStatusTone,
} from '@lanius/core';

import { resolvePlatinumIconSrc } from '../lib/platinum-icon.js';
import OfficialItemIcon from './OfficialItemIcon.vue';

/**
 * 公开站紫卡看板（武器详情 + 拍卖列表；不依赖 QQ ModuleCard / Shell）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的紫卡订单 DTO。 */
  riven: RivenOrdersDto;
  /** 当前 UI locale。 */
  locale: Locale;
}>();

const platIcon = resolvePlatinumIconSrc();

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
 * 当前页码展示串。
 *
 * @returns 页码副标题
 */
const pageLabel = computed(() => {
  const totalPages = Math.max(1, Math.ceil(props.riven.total / props.riven.pageSize) || 1);
  return t(`第 ${props.riven.page}/${totalPages} 页`, `page ${props.riven.page}/${totalPages}`);
});
</script>

<template>
  <section class="lanius-rb">
    <header class="lanius-rb__header">
      <div>
        <p class="lanius-rb__eyebrow">{{ t('紫卡', 'Riven') }}</p>
        <h2 class="lanius-rb__title">{{ pickLocalized(riven.resolved.name, locale) }}</h2>
      </div>
      <span class="lanius-rb__page">{{ pageLabel }}</span>
    </header>

    <div class="lanius-rb__item">
      <OfficialItemIcon
        class="lanius-rb__icon"
        :icon-url="riven.resolved.iconUrl"
        :alt="pickLocalized(riven.resolved.name, locale)"
        :size="72"
      />
      <div class="lanius-rb__body">
        <p class="lanius-rb__meta">
          <template v-if="locale === 'en'">auctions online/ingame · price↑</template>
          <template v-else>在线/游戏中拍卖 · 价↑</template>
        </p>
      </div>
    </div>

    <p v-if="riven.total === 0" class="lanius-rb__empty">
      {{
        locale === 'en'
          ? 'No online/ingame riven auctions.'
          : `已锁定 ${pickLocalized(riven.resolved.name, locale)}，暂无在线/游戏中紫卡拍卖`
      }}
    </p>
    <ul v-else class="lanius-rb__orders">
      <li
        v-for="(order, index) in riven.orders"
        :key="`${order.seller}-${order.platinum}-${index}`"
        class="lanius-rb__order"
      >
        <div class="lanius-rb__deal">
          <span class="lanius-rb__plat">
            <img
              class="lanius-rb__plat-icon"
              :src="platIcon"
              alt=""
              width="16"
              height="16"
              data-lanius-icon="platinum"
            />
            <span class="lanius-rb__plat-num">{{ order.platinum }}</span>
          </span>
          <span class="lanius-rb__seller-name">{{ order.seller }}</span>
          <span class="lanius-rb__seller-rep">{{
            formatSellerReputationLabel(order.sellerReputation, locale)
          }}</span>
          <span
            class="lanius-rb__status"
            :class="`lanius-rb__status--${sellerStatusTone(order.status)}`"
          >
            {{ formatSellerStatusLabel(order.status, locale) }}
          </span>
        </div>
        <div class="lanius-rb__prices">
          <span>{{ locale === 'en' ? `MR${order.mastery}` : `段位${order.mastery}` }}</span>
          <span>{{ locale === 'en' ? `rank ${order.rank}` : `等级${order.rank}` }}</span>
          <span>{{ locale === 'en' ? `rerolls ${order.rerolls}` : `循环${order.rerolls}` }}</span>
        </div>
        <div v-if="order.attributes.length" class="lanius-rb__attrs">
          <span
            v-for="attr in order.attributes"
            :key="attr.urlName + String(attr.value)"
            class="lanius-rb__attr"
            :class="{ 'lanius-rb__attr--neg': !attr.positive }"
          >
            {{ pickLocalized(attr.name, locale) }}
            {{ attr.positive ? '+' : '' }}{{ attr.value }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lanius-rb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-rb__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.lanius-rb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-rb__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.25rem, 2vw, 1.6rem);
  word-break: break-word;
}

.lanius-rb__page {
  color: var(--lanius-text-muted);
  font-size: 0.8rem;
}

.lanius-rb__item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--lanius-border);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.55);
}

.lanius-rb__icon {
  flex: 0 0 auto;
}

.lanius-rb__body {
  min-width: 0;
  flex: 1 1 auto;
}

.lanius-rb__meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
  line-height: 1.45;
}

.lanius-rb__empty {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.95rem;
}

.lanius-rb__orders {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.lanius-rb__order {
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
  .lanius-rb__order:hover {
    border-color: rgba(255, 122, 110, 0.4);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.lanius-rb__deal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.65rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.lanius-rb__plat {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem 0.15rem 0.4rem;
  border-radius: 8px;
  background: rgba(255, 122, 110, 0.12);
}

.lanius-rb__plat-num {
  font-variant-numeric: tabular-nums;
}

.lanius-rb__plat-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
}

.lanius-rb__seller-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--lanius-text);
}

.lanius-rb__seller-rep {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--lanius-text-muted);
}

.lanius-rb__status {
  font-weight: 700;
  font-size: 0.8rem;
}

.lanius-rb__status--online {
  color: var(--lanius-success, #5fd0b0);
}

.lanius-rb__status--ingame {
  color: var(--lanius-accent-dim, #2f8fc4);
}

.lanius-rb__status--offline {
  color: var(--lanius-text-muted, #6b7385);
}

.lanius-rb__prices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
}

.lanius-rb__attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.45rem;
}

.lanius-rb__attr {
  font-size: 0.8rem;
  color: var(--lanius-text);
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  background: rgba(62, 78, 110, 0.06);
}

.lanius-rb__attr--neg {
  color: var(--lanius-danger, #c44);
  background: rgba(196, 68, 68, 0.08);
}
</style>
