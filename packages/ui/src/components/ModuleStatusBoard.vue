<script setup lang="ts">
import type { HelpDto, Locale } from '@lanius/core';
import { computed } from 'vue';

/**
 * Wave 分组用的 ModuleId 前缀集合（与 packages/core modules 对齐）。
 */
const WAVE1_IDS = new Set([
  'timers',
  'dailyDeals',
  'news',
  'kuva',
  'synthTargets',
  'construction',
  'voidStorms',
  'events',
  'conclave',
  'clanRewards',
  'flashSales',
  'arbTable',
  'calendar1999',
  'steelPath',
  'sliverShop',
  'descendia',
  'incursions',
  'incarnon',
  'acrithis',
]);

const WAVE2_IDS = new Set([
  'marketRank',
  'marketTrend',
  'ducats',
  'rivenAnalysis',
  'rivenRanges',
  'rivenSplice',
  'disposition',
  'lichAuctions',
  'relic',
  'parts',
  'openRelic',
]);

const WAVE3_IDS = new Set(['wiki', 'translate', 'valence']);

const MISSION_IDS = new Set([
  'sortie',
  'archon',
  'circuit',
  'bounties',
  'arbitration',
  'alerts',
  'archimedea',
]);

/**
 * 帮助页 / Admin 可用的指令覆盖状态摘要（按 Wave 分组计数）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的帮助总览。 */
  help: HelpDto;
  /** 当前 UI locale。 */
  locale: Locale;
}>();

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
 * 分组计数。
 *
 * @returns 各组数量
 */
const groups = computed(() => {
  let core = 0;
  let missions = 0;
  let wave1 = 0;
  let wave2 = 0;
  let wave3 = 0;
  for (const line of props.help.lines) {
    if (WAVE1_IDS.has(line.id)) {
      wave1 += 1;
    } else if (WAVE2_IDS.has(line.id)) {
      wave2 += 1;
    } else if (WAVE3_IDS.has(line.id)) {
      wave3 += 1;
    } else if (MISSION_IDS.has(line.id)) {
      missions += 1;
    } else {
      core += 1;
    }
  }
  return [
    { key: 'core', label: t('核心', 'Core'), count: core },
    { key: 'missions', label: t('任务链', 'Missions'), count: missions },
    { key: 'wave1', label: t('日常 Wave1', 'Daily W1'), count: wave1 },
    { key: 'wave2', label: t('市场 Wave2', 'Market W2'), count: wave2 },
    { key: 'wave3', label: t('工具 Wave3', 'Tools W3'), count: wave3 },
  ];
});

/**
 * 指令总数。
 *
 * @returns 行数
 */
const total = computed(() => props.help.lines.length);
</script>

<template>
  <section class="lanius-msb" aria-label="module status">
    <header class="lanius-msb__header">
      <p class="lanius-msb__eyebrow">{{ t('覆盖', 'Coverage') }}</p>
      <h2 class="lanius-msb__title">
        {{ t(`指令状态 · ${total} 条`, `Command status · ${total}`) }}
      </h2>
    </header>
    <ul class="lanius-msb__grid">
      <li v-for="g in groups" :key="g.key" class="lanius-msb__cell">
        <span class="lanius-msb__count">{{ g.count }}</span>
        <span class="lanius-msb__label">{{ g.label }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lanius-msb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  padding: 0.85rem 1rem;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 0.35rem;
}

.lanius-msb__header {
  margin-bottom: 0.75rem;
}

.lanius-msb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.lanius-msb__title {
  margin: 0.2rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: 1.05rem;
  color: var(--lanius-brand);
}

.lanius-msb__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
  gap: 0.45rem;
}

.lanius-msb__cell {
  display: grid;
  gap: 0.15rem;
  padding: 0.45rem 0.5rem;
  background: var(--lanius-panel-raised);
  border: 1px solid var(--lanius-border);
  border-radius: 0.25rem;
  text-align: center;
}

.lanius-msb__count {
  font-family: var(--lanius-font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--lanius-accent);
}

.lanius-msb__label {
  font-size: 0.72rem;
  color: var(--lanius-text-muted);
}
</style>
