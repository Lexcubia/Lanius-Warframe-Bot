<script setup lang="ts">
import type { NightwaveChallengeDto, NightwaveChallengeKind, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

/**
 * 公开站午夜电波看板（按每日/每周分组；不依赖 QQ ModuleCard / Shell）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的 worldstate。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale。 */
  locale: 'zh' | 'en';
  /** 可选：缓存降级提示。 */
  stale?: boolean;
  /** 最多展示挑战条数；默认展示全部。 */
  maxItems?: number;
}>();

/** 分组展示顺序。 */
const KIND_ORDER: NightwaveChallengeKind[] = ['daily', 'weekly', 'other'];

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
 * @param name - LocalizedName
 * @returns 当前 locale 文案
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, props.locale);
}

/**
 * 午夜电波切片。
 *
 * @returns nightwave DTO 或 null
 */
const nw = computed(() => props.worldstate.nightwave);

/**
 * 截断后的挑战列表。
 *
 * @returns 挑战行
 */
const challenges = computed((): NightwaveChallengeDto[] => {
  const all = nw.value?.activeChallenges ?? [];
  const limit = props.maxItems ?? all.length;
  return all.slice(0, Math.max(0, limit));
});

/**
 * 按周期档分组（仅包含有条目的组）。
 *
 * @returns 分组列表
 */
const groups = computed(() => {
  const byKind = new Map<NightwaveChallengeKind, NightwaveChallengeDto[]>();
  for (const kind of KIND_ORDER) {
    byKind.set(kind, []);
  }
  for (const row of challenges.value) {
    byKind.get(row.kind)?.push(row);
  }
  return KIND_ORDER.filter((kind) => (byKind.get(kind)?.length ?? 0) > 0).map((kind) => ({
    kind,
    label: byKind.get(kind)?.[0]?.kindLabel ?? {
      zh: kind,
      en: kind,
    },
    items: byKind.get(kind) ?? [],
  }));
});
</script>

<template>
  <section class="lanius-nw">
    <header class="lanius-nw__header">
      <div>
        <p class="lanius-nw__eyebrow">{{ t('午夜电波', 'Nightwave') }}</p>
        <h2 class="lanius-nw__title">{{ t('赛季挑战', 'Season challenges') }}</h2>
      </div>
      <time class="lanius-nw__time">{{ worldstate.fetchedAt }}</time>
    </header>

    <p v-if="stale" class="lanius-nw__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <template v-if="nw">
      <div class="lanius-nw__meta">
        <span>
          {{ t('赛季', 'Season') }} {{ nw.season ?? '—' }}
          ·
          {{ t('阶段', 'Phase') }} {{ nw.phase ?? '—' }}
        </span>
        <span class="lanius-nw__count">{{ challenges.length }}</span>
      </div>

      <template v-if="groups.length">
        <section v-for="group in groups" :key="group.kind" class="lanius-nw__group">
          <h3 class="lanius-nw__group-title" :data-kind="group.kind">
            {{ label(group.label) }}
          </h3>
          <ul class="lanius-nw__list">
            <li v-for="challenge in group.items" :key="challenge.id" class="lanius-nw__row">
              <span class="lanius-nw__tag" :data-kind="challenge.kind">
                {{ label(challenge.kindLabel) }}
              </span>
              <div class="lanius-nw__body">
                <strong>
                  {{ challenge.title ? label(challenge.title) : challenge.id }}
                </strong>
                <p v-if="challenge.description">
                  {{ label(challenge.description) }}
                </p>
              </div>
            </li>
          </ul>
        </section>
      </template>
      <p v-else class="lanius-nw__empty">
        {{ t('当前无活跃挑战', 'No active challenges') }}
      </p>
    </template>
    <p v-else class="lanius-nw__empty">
      {{ t('暂无午夜电波数据', 'No Nightwave data') }}
    </p>
  </section>
</template>

<style scoped>
.lanius-nw {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-nw__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.lanius-nw__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-nw__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.25rem, 2vw, 1.6rem);
}

.lanius-nw__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-nw__stale {
  color: var(--lanius-warn);
  margin: 0 0 1rem;
}

.lanius-nw__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
}

.lanius-nw__count {
  min-width: 1.5em;
  padding: 0.15rem 0.55rem;
  border-radius: 8px;
  background: rgba(78, 183, 232, 0.14);
  color: var(--lanius-accent-dim);
  font-weight: 700;
  text-align: center;
}

.lanius-nw__group {
  margin-bottom: 1rem;
}

.lanius-nw__group:last-child {
  margin-bottom: 0;
}

.lanius-nw__group-title {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--lanius-text-muted);
}

.lanius-nw__group-title[data-kind='daily'] {
  color: var(--lanius-brand, #2f8fc4);
}

.lanius-nw__group-title[data-kind='weekly'] {
  color: var(--lanius-warn, #d97706);
}

.lanius-nw__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.lanius-nw__row {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  border: 1px solid var(--lanius-border);
  background: var(--lanius-panel);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

@media (hover: hover) {
  .lanius-nw__row:hover {
    border-color: rgba(78, 183, 232, 0.4);
    background: #fff;
    box-shadow: 0 4px 12px rgba(62, 78, 110, 0.08);
    transform: translateY(-1px);
  }
}

.lanius-nw__tag {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  line-height: 1.4;
  margin-top: 0.1rem;
}

.lanius-nw__tag[data-kind='daily'] {
  background: rgba(78, 183, 232, 0.14);
  color: var(--lanius-accent-dim, #2f8fc4);
}

.lanius-nw__tag[data-kind='weekly'] {
  background: rgba(255, 122, 110, 0.12);
  color: var(--lanius-highlight, #ff7a6e);
}

.lanius-nw__tag[data-kind='other'] {
  background: rgba(228, 213, 200, 0.45);
  color: var(--lanius-text-muted, #6b7385);
}

.lanius-nw__body {
  flex: 1;
  min-width: 0;
}

.lanius-nw__body strong {
  display: block;
  font-size: 0.95rem;
  color: var(--lanius-text);
}

.lanius-nw__body p {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
}

.lanius-nw__empty {
  margin: 0;
  font-size: 0.95rem;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 1.25rem 0;
}
</style>
