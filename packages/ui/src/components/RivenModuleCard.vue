<script setup lang="ts">
import type { Locale, RivenSearchDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';

defineProps<{
  riven: RivenSearchDto;
  locale: Locale;
}>();
</script>

<template>
  <QqCardShell :title="locale === 'en' ? 'Riven' : '紫卡'" :subtitle="riven.query" :locale="locale">
    <p v-if="!riven.results.length" class="empty">
      {{ locale === 'en' ? 'No riven samples.' : '暂无紫卡样本。' }}
    </p>
    <ul v-else class="rows">
      <li v-for="row in riven.results" :key="row.weaponUrlName" class="row">
        <div class="name">{{ pickLocalized(row.weaponName, locale) }}</div>
        <div class="prices">
          <span>min {{ row.minPlatinum ?? '—' }}</span>
          <span>med {{ row.medianPlatinum ?? '—' }}</span>
          <span>max {{ row.maxPlatinum ?? '—' }}</span>
          <span>n={{ row.sampleCount }}</span>
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
.prices {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}
</style>
