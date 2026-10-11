<script setup lang="ts">
import type { OpenWorldCycleDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import { formatRemain } from '../lib/format-remain.js';
import QqCardShell from './QqCardShell.vue';

/**
 * 世界状态（开放世界周期）QQ/截图模块卡片。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
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

/**
 * 周期环配色。
 *
 * @param state - 状态键
 * @returns 主动色与轨道色
 */
function colors(state: string): { ring: string; track: string; badgeBg: string; badgeFg: string } {
  if (state === 'day' || state === 'fass' || state === 'warm' || state === 'anger') {
    return { ring: '#f0a030', track: '#2f5f8a', badgeBg: '#fff4e8', badgeFg: '#d97706' };
  }
  if (state === 'night' || state === 'vome' || state === 'cold' || state === 'corpus') {
    return { ring: '#3aa7d6', track: '#e8a060', badgeBg: '#e8f5fc', badgeFg: '#2486bb' };
  }
  return {
    ring: 'var(--lanius-accent)',
    track: 'var(--lanius-border)',
    badgeBg: '#e8f5fc',
    badgeFg: 'var(--lanius-brand)',
  };
}

/**
 * SVG 环几何。
 *
 * @param cycle - 周期 DTO
 * @returns 绘制参数
 */
function ringGeom(cycle: OpenWorldCycleDto): {
  dash: number;
  circ: number;
  thumbX: number;
  thumbY: number;
  color: string;
  track: string;
  badgeBg: string;
  badgeFg: string;
} {
  const r = 34;
  const cx = 44;
  const cy = 44;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, cycle.progress));
  const angle = -Math.PI / 2 + p * Math.PI * 2;
  const c = colors(cycle.state);
  return {
    dash: circ * p,
    circ,
    thumbX: cx + r * Math.cos(angle),
    thumbY: cy + r * Math.sin(angle),
    color: c.ring,
    track: c.track,
    badgeBg: c.badgeBg,
    badgeFg: c.badgeFg,
  };
}

const rows = [
  () => props.worldstate.cycles.slice(0, 3),
  () => props.worldstate.cycles.slice(3, 6),
];

const stamp = props.worldstate.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, '');
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'WORLD STATE' : '世界状态'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
  >
    <div class="cycles">
      <div v-for="(rowFn, ri) in rows" :key="ri" class="cycles__row">
        <article
          v-for="cycle in rowFn()"
          :key="cycle.id"
          class="cycles__tile"
        >
          <template v-for="g in [ringGeom(cycle)]" :key="`${cycle.id}-g`">
            <h3>{{ label(cycle.name) }}</h3>
            <svg class="cycles__ring" viewBox="0 0 88 88" width="86" height="86" aria-hidden="true">
              <circle
                cx="44"
                cy="44"
                r="34"
                fill="none"
                stroke-width="8"
                :stroke="g.track"
              />
              <circle
                cx="44"
                cy="44"
                r="34"
                fill="none"
                stroke-width="8"
                stroke-linecap="round"
                :stroke="g.color"
                :stroke-dasharray="`${g.dash} ${g.circ}`"
                transform="rotate(-90 44 44)"
              />
              <circle
                :cx="g.thumbX"
                :cy="g.thumbY"
                r="5.5"
                :fill="g.color"
                stroke="#fff"
                stroke-width="2"
              />
            </svg>
            <span class="cycles__badge" :style="{ background: g.badgeBg, color: g.badgeFg }">
              {{ label(cycle.stateLabel) }}
            </span>
            <p class="cycles__time" :style="{ color: g.badgeFg }">
              {{ formatRemain(cycle.remainingMs, locale) }}
            </p>
          </template>
        </article>
      </div>
    </div>
  </QqCardShell>
</template>

<style scoped>
.cycles {
  display: flex;
  flex-direction: column;
  gap: var(--lanius-card-gap, 8px);
}

.cycles__row {
  display: flex;
  gap: 6px;
}

.cycles__tile {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: var(--lanius-card-radius, 12px);
  text-align: center;
}

.cycles__tile h3 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--lanius-brand);
}

.cycles__ring {
  display: block;
}

.cycles__badge {
  margin-top: 8px;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.cycles__time {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--lanius-font-display);
}
</style>
