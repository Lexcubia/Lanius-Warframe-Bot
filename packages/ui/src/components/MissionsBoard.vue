<script setup lang="ts">
import type { LocalizedName, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

/**
 * 公开站任务链看板：突击 / 执行官 / 回廊 / 仲裁 / 警报 / 科研摘要（同源 worldstate）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的 worldstate。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale。 */
  locale: 'zh' | 'en';
  /** 可选：缓存降级提示。 */
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
 * 取双语字段。
 *
 * @param name - 可选 LocalizedName
 * @returns 展示字符串
 */
function label(name: LocalizedName | undefined): string {
  return name ? pickLocalized(name, props.locale) : '—';
}

/**
 * 突击摘要行。
 *
 * @returns 标题与详情
 */
const sortieLine = computed(() => {
  const s = props.worldstate.sortie;
  if (!s) {
    return null;
  }
  const boss = label(s.boss);
  const steps = s.missions.length;
  return {
    title: t('突击', 'Sortie'),
    detail: boss !== '—' ? `${boss} · ${steps}` : String(steps),
  };
});

/**
 * 执行官摘要行。
 *
 * @returns 标题与详情
 */
const archonLine = computed(() => {
  const a = props.worldstate.archon;
  if (!a) {
    return null;
  }
  return {
    title: t('执行官', 'Archon'),
    detail: label(a.boss),
  };
});

/**
 * 回廊摘要行。
 *
 * @returns 标题与详情
 */
const circuitLine = computed(() => {
  const c = props.worldstate.circuit;
  if (!c) {
    return null;
  }
  const names = [...c.normalChoices, ...c.hardChoices]
    .slice(0, 4)
    .map((row) => label(row.name) || row.key)
    .filter(Boolean);
  return {
    title: t('回廊', 'Circuit'),
    detail: names.length ? names.join(' · ') : t('本周轮换', 'Weekly rotation'),
  };
});

/**
 * 仲裁摘要行。
 *
 * @returns 标题与详情
 */
const arbitrationLine = computed(() => {
  const arb = props.worldstate.arbitration;
  if (!arb) {
    return null;
  }
  const parts = [label(arb.node), label(arb.missionType), label(arb.enemy)].filter(
    (part) => part && part !== '—',
  );
  return {
    title: t('仲裁', 'Arbitration'),
    detail: parts.join(' · ') || t('有数据', 'Available'),
  };
});

/**
 * 警报条数。
 *
 * @returns 计数文案
 */
const alertsLine = computed(() => {
  const n = props.worldstate.alerts.length;
  return {
    title: t('警报', 'Alerts'),
    detail: n > 0 ? String(n) : t('无', 'None'),
  };
});

/**
 * 科研摘要。
 *
 * @returns 标题与详情
 */
const archimedeaLine = computed(() => {
  const a = props.worldstate.archimedea;
  if (!a || a.seasons.length === 0) {
    return null;
  }
  const bits = a.seasons.map((season) =>
    season.kind === 'lab' ? t('精英', 'Deep') : t('时光', 'Temporal'),
  );
  return {
    title: t('科研', 'Archimedea'),
    detail: bits.join(' / ') || t('有数据', 'Available'),
  };
});

/**
 * 赏金联盟数。
 *
 * @returns 标题与详情
 */
const bountiesLine = computed(() => {
  const n = props.worldstate.bounties.length;
  return {
    title: t('赏金', 'Bounties'),
    detail: n > 0 ? String(n) : t('无', 'None'),
  };
});

/**
 * 展示行列表（过滤空模块）。
 *
 * @returns 看板行
 */
const rows = computed(() =>
  [
    sortieLine.value,
    archonLine.value,
    circuitLine.value,
    arbitrationLine.value,
    alertsLine.value,
    archimedeaLine.value,
    bountiesLine.value,
  ].filter((row): row is { title: string; detail: string } => row != null),
);
</script>

<template>
  <section class="lanius-mb">
    <header class="lanius-mb__header">
      <div>
        <p class="lanius-mb__eyebrow">{{ t('任务链', 'Missions') }}</p>
        <h2 class="lanius-mb__title">
          {{ t('突击 · 执行官 · 回廊', 'Sortie · Archon · Circuit') }}
        </h2>
      </div>
      <time class="lanius-mb__time">{{ worldstate.fetchedAt }}</time>
    </header>

    <p v-if="stale" class="lanius-mb__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <ul v-if="rows.length" class="lanius-mb__list">
      <li v-for="(row, idx) in rows" :key="`${row.title}-${idx}`" class="lanius-mb__row">
        <span class="lanius-mb__label">{{ row.title }}</span>
        <span class="lanius-mb__detail">{{ row.detail }}</span>
      </li>
    </ul>
    <p v-else class="lanius-mb__empty">
      {{ t('暂无任务链数据', 'No mission-module data') }}
    </p>
  </section>
</template>

<style scoped>
.lanius-mb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-mb__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.lanius-mb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-mb__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.15rem, 2vw, 1.45rem);
}

.lanius-mb__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-mb__stale {
  color: var(--lanius-warn);
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
}

.lanius-mb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.lanius-mb__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.85rem;
  padding: 0.65rem 0.75rem;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-left: 3px solid var(--lanius-accent);
  border-radius: 0.35rem;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .lanius-mb__row:hover {
    border-color: var(--lanius-border-bright);
    background: var(--lanius-panel-raised);
  }
}

.lanius-mb__label {
  font-weight: 700;
  color: var(--lanius-brand);
  min-width: 4.5rem;
}

.lanius-mb__detail {
  flex: 1;
  min-width: 0;
  color: var(--lanius-text);
  font-size: 0.9rem;
  text-align: right;
}

.lanius-mb__empty {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.9rem;
}
</style>
