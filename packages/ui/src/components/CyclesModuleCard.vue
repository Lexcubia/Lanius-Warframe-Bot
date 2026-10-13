<script setup lang="ts">
import type { OpenWorldCycleDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import { formatRemain } from '../lib/format-remain.js';
import { resolveOpenWorldCycleTheme } from '../lib/open-world-cycle-theme.js';
import OpenWorldCycleIcon from './OpenWorldCycleIcon.vue';
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
 * SVG 环几何与六地主题色。
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
  const theme = resolveOpenWorldCycleTheme(cycle.id);
  return {
    dash: circ * p,
    circ,
    thumbX: cx + r * Math.cos(angle),
    thumbY: cy + r * Math.sin(angle),
    color: theme.accent,
    track: theme.track,
    badgeBg: theme.badgeBg,
    badgeFg: theme.badgeFg,
  };
}

const rows = [() => props.worldstate.cycles.slice(0, 3), () => props.worldstate.cycles.slice(3, 6)];

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
        <article v-for="cycle in rowFn()" :key="cycle.id" class="cycles__tile">
          <template v-for="g in [ringGeom(cycle)]" :key="`${cycle.id}-g`">
            <h3 :style="{ color: g.color }">{{ label(cycle.name) }}</h3>
            <div class="cycles__ring-wrap">
              <svg
                class="cycles__ring"
                viewBox="0 0 88 88"
                width="86"
                height="86"
                aria-hidden="true"
              >
                <circle cx="44" cy="44" r="34" fill="none" stroke-width="8" :stroke="g.track" />
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
              <OpenWorldCycleIcon
                class="cycles__ring-icon"
                :cycle-id="cycle.id"
                :color="g.color"
                :size="26"
              />
            </div>
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
  border-radius: var(--lanius-card-radius, 16px);
  text-align: center;
  box-shadow: 0 2px 8px rgba(62, 78, 110, 0.04);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .cycles__tile:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 8px 18px rgba(62, 78, 110, 0.12);
    transform: translateY(-2px);
  }
}

.cycles__tile h3 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
}

.cycles__ring-wrap {
  position: relative;
  width: 86px;
  height: 86px;
}

.cycles__ring {
  display: block;
}

.cycles__ring-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  pointer-events: none;
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
