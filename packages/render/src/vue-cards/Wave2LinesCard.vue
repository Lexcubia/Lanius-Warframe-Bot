<script setup lang="ts">
import type { Locale } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * Wave 2 通用 Orokin 行卡（趋势 / 排行 / 杜卡德 / 紫卡工具 / 遗物等）。
 */
const props = defineProps<{
  /** 卡片主标题 */
  title: string;
  /** EN kicker */
  kicker: string;
  /** 副标题（页码等） */
  subtitle?: string;
  /** 正文行 */
  lines: string[];
  locale: Locale;
  skin?: CardSkinId;
}>();
</script>

<template>
  <QqCardShell
    :title="title"
    :kicker="kicker"
    :subtitle="subtitle"
    :locale="locale"
    :skin="skin"
  >
    <ul class="lines" role="list">
      <li v-for="(line, i) in lines" :key="i" class="lines__item">
        {{ line }}
      </li>
    </ul>
    <p v-if="lines.length === 0" class="empty">
      {{ locale === 'en' ? 'No data' : '暂无数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lines__item {
  margin: 0;
  padding: 0;
  font-size: 28px;
  line-height: 1.35;
  color: var(--lanius-qq-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.empty {
  margin: 0;
  font-size: 28px;
  color: var(--lanius-qq-muted);
}
</style>
