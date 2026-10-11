<script setup lang="ts">
import type { LocalizedName, OpenWorldCycleDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import { resolveOpenWorldCycleTheme } from '../lib/open-world-cycle-theme.js';
import OpenWorldCycleIcon from './OpenWorldCycleIcon.vue';

/**
 * 世界状态模块看板：仅开放世界周期（入侵 / 午夜电波为独立模块，不在此嵌套）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的规范化 worldstate DTO。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale，用于双语标签。 */
  locale: 'zh' | 'en';
  /** 可选：API meta 中的陈旧缓存提示。 */
  stale?: boolean;
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
 * 从 DTO 双语字段选取当前 locale 文案。
 *
 * @param name - 可选 LocalizedName
 * @returns 显示字符串；缺省时为空串
 */
function label(name: LocalizedName | undefined): string {
  return name ? pickLocalized(name, props.locale) : '';
}

/**
 * 格式化周期剩余时间。
 *
 * @param remainingMs - 剩余毫秒
 * @returns 短时文案
 */
function remain(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return props.locale === 'en'
      ? `${hours}h ${minutes}m`
      : `${hours}时 ${minutes}分`;
  }
  return props.locale === 'en'
    ? `${minutes}m ${seconds}s`
    : `${minutes}分 ${seconds}秒`;
}

/**
 * 为单条周期计算 SVG 环几何与地点主题色（模板内只调用一次）。
 *
 * @param cycle - 开放世界周期 DTO
 * @returns 圆环绘制参数
 */
function cycleRing(cycle: OpenWorldCycleDto): {
  r: number;
  cx: number;
  cy: number;
  dash: number;
  circ: number;
  thumbX: number;
  thumbY: number;
  color: string;
  track: string;
} {
  const cx = 36;
  const cy = 36;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, cycle.progress));
  const angle = -Math.PI / 2 + p * Math.PI * 2;
  const theme = resolveOpenWorldCycleTheme(cycle.id);
  return {
    r,
    cx,
    cy,
    dash: circ * p,
    circ,
    thumbX: cx + r * Math.cos(angle),
    thumbY: cy + r * Math.sin(angle),
    color: theme.accent,
    track: theme.track,
  };
}
</script>

<template>
  <section class="lanius-ws">
    <header class="lanius-ws__header">
      <div>
        <p class="lanius-ws__eyebrow">{{ t('世界状态', 'World State') }}</p>
        <h2 class="lanius-ws__title">{{ t('开放世界周期', 'Open-world cycles') }}</h2>
      </div>
      <div class="lanius-ws__meta">
        <span class="lanius-ws__live">LIVE</span>
        <time class="lanius-ws__time">{{ worldstate.fetchedAt }}</time>
      </div>
    </header>

    <p v-if="stale" class="lanius-ws__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <div class="lanius-ws__cycles">
      <article
        v-for="cycle in worldstate.cycles"
        :key="cycle.id"
        class="lanius-ws__cycle"
      >
        <template v-for="ring in [cycleRing(cycle)]" :key="`${cycle.id}-ring`">
          <h3 :style="{ color: ring.color }">{{ label(cycle.name) }}</h3>
          <div class="lanius-ws__ring-wrap">
            <svg
              class="lanius-ws__ring"
              viewBox="0 0 72 72"
              width="72"
              height="72"
              aria-hidden="true"
            >
              <circle
                class="lanius-ws__ring-track"
                :cx="ring.cx"
                :cy="ring.cy"
                :r="ring.r"
                fill="none"
                stroke-width="7"
                :stroke="ring.track"
              />
              <circle
                class="lanius-ws__ring-active"
                :cx="ring.cx"
                :cy="ring.cy"
                :r="ring.r"
                fill="none"
                stroke-width="7"
                stroke-linecap="round"
                :stroke="ring.color"
                :stroke-dasharray="`${ring.dash} ${ring.circ}`"
                transform="rotate(-90 36 36)"
              />
              <circle
                class="lanius-ws__ring-thumb"
                :cx="ring.thumbX"
                :cy="ring.thumbY"
                r="5"
                :fill="ring.color"
                stroke="#fff"
                stroke-width="2"
              />
            </svg>
            <OpenWorldCycleIcon
              class="lanius-ws__ring-icon"
              :cycle-id="cycle.id"
              :color="ring.color"
              :size="22"
            />
          </div>
          <p class="lanius-ws__cycle-state" :style="{ color: ring.color }">
            {{ label(cycle.stateLabel) }}
          </p>
          <p class="lanius-ws__cycle-time" :style="{ color: ring.color }">
            {{ remain(cycle.remainingMs) }}
          </p>
        </template>
      </article>
    </div>
  </section>
</template>

<style scoped>
.lanius-ws {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.lanius-ws__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  min-width: 0;
}

.lanius-ws__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-ws__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.4rem, 2vw, 1.8rem);
}

.lanius-ws__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.lanius-ws__live {
  background: linear-gradient(135deg, var(--lanius-highlight), var(--lanius-bar-defend));
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 0.2rem 0.55rem;
  border-radius: 8px;
}

.lanius-ws__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-ws__stale {
  color: var(--lanius-warn);
  margin: 0 0 1rem;
}

.lanius-ws__cycles {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 1.25rem;
  max-width: 100%;
}

@media (max-width: 900px) {
  .lanius-ws__cycles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .lanius-ws__cycles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 360px) {
  .lanius-ws__cycles {
    grid-template-columns: 1fr;
  }
}

.lanius-ws__cycle {
  background: var(--lanius-panel-raised);
  border: 1px solid var(--lanius-border);
  border-radius: 1rem;
  padding: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 14px rgba(62, 78, 110, 0.06);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .lanius-ws__cycle:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 10px 22px rgba(62, 78, 110, 0.12);
    transform: translateY(-2px);
  }
}

.lanius-ws__cycle h3 {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.lanius-ws__ring-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0.35rem auto 0.5rem;
}

.lanius-ws__ring {
  display: block;
}

.lanius-ws__ring-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  pointer-events: none;
}

.lanius-ws__cycle-state {
  margin: 0;
  font-weight: 700;
  color: var(--lanius-accent-dim);
}

.lanius-ws__cycle-time {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
