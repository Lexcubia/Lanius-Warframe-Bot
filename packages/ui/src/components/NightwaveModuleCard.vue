<script setup lang="ts">
import type { WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';

/**
 * 午夜电波 QQ/截图模块卡片（消费 `WorldstateDto.nightwave`）。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 最多展示挑战条数 */
  maxItems?: number;
}>();

/**
 * 取双语字段。
 *
 * @param name - LocalizedName
 * @returns 当前 locale 文案
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, props.locale);
}

const nw = props.worldstate.nightwave;
const limit = props.maxItems ?? 8;
const challenges = nw?.activeChallenges.slice(0, limit) ?? [];
const stamp = props.worldstate.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, '');
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'NIGHTWAVE' : '午夜电波'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
  >
    <template v-if="nw">
      <div class="nw__meta">
        <span>
          {{ locale === 'en' ? 'Season' : '赛季' }} {{ nw.season ?? '—' }}
          ·
          {{ locale === 'en' ? 'Phase' : '阶段' }} {{ nw.phase ?? '—' }}
        </span>
        <span class="nw__count">{{ challenges.length }}</span>
      </div>
      <ul v-if="challenges.length" class="nw__list">
        <li v-for="(challenge, index) in challenges" :key="challenge.id" class="nw__row">
          <span class="nw__idx" :class="index % 2 === 0 ? 'nw__idx--a' : 'nw__idx--b'">
            {{ index + 1 }}
          </span>
          <div class="nw__body">
            <strong>{{ challenge.title ? label(challenge.title) : challenge.id }}</strong>
            <p v-if="challenge.description">{{ label(challenge.description) }}</p>
          </div>
        </li>
      </ul>
      <p v-else class="nw__empty">
        {{ locale === 'en' ? 'No active challenges' : '当前无活跃挑战' }}
      </p>
    </template>
    <p v-else class="nw__empty">
      {{ locale === 'en' ? 'No Nightwave data' : '暂无午夜电波数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.nw__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}

.nw__count {
  min-width: 1.5em;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8f5fc;
  color: var(--lanius-brand);
  font-weight: 700;
  text-align: center;
}

.nw__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nw__row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.nw__idx {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--lanius-font-display);
}

.nw__idx--a {
  background: #e8f5fc;
  color: var(--lanius-brand);
}

.nw__idx--b {
  background: #fff4e8;
  color: var(--lanius-warn);
}

.nw__body {
  flex: 1;
  min-width: 0;
}

.nw__body strong {
  display: block;
  font-size: 13px;
  color: var(--lanius-text);
}

.nw__body p {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--lanius-text-muted);
}

.nw__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 16px 0;
}
</style>
