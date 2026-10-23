<script setup lang="ts">
import type { ArchonHuntDto, SortieMissionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 执行官狩猎 QQ 截图卡：Boss + 三步任务链（通常无修正）。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  skin?: CardSkinId;
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
 * 执行官切片。
 *
 * @returns ArchonHuntDto 或 null
 */
const chain = computed((): ArchonHuntDto | null => props.worldstate.archon);

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));

/**
 * Boss 显示名。
 *
 * @returns Boss 文案
 */
const bossName = computed(() => {
  const row = chain.value;
  if (!row) {
    return '';
  }
  if (row.boss) {
    return label(row.boss);
  }
  return row.bossKey ?? '—';
});

/**
 * 过期时间短展示。
 *
 * @returns 副信息；无过期时空串
 */
const expiryLabel = computed(() => {
  const expiry = chain.value?.expiry;
  if (!expiry) {
    return '';
  }
  return formatTimestamp(expiry);
});

/**
 * 单步任务主文案（类型 · 节点）。
 *
 * @param mission - 任务步
 * @returns 主行
 */
function missionPrimary(mission: SortieMissionDto): string {
  const parts: string[] = [];
  if (mission.missionType) {
    parts.push(label(mission.missionType));
  } else if (mission.missionTypeKey) {
    parts.push(mission.missionTypeKey);
  }
  if (mission.node) {
    parts.push(label(mission.node));
  } else if (mission.nodeKey) {
    parts.push(mission.nodeKey);
  }
  return parts.join(' · ') || '—';
}
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'ARCHON HUNT' : '执行官'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="chain">
      <div class="archon__meta">
        <strong class="archon__boss">{{ bossName }}</strong>
        <span v-if="expiryLabel" class="archon__expiry">{{
          locale === 'en' ? `Until ${expiryLabel}` : `至 ${expiryLabel}`
        }}</span>
      </div>
      <ol v-if="chain.missions.length" class="archon__list">
        <li
          v-for="(mission, index) in chain.missions"
          :key="`${mission.nodeKey ?? index}-${mission.missionTypeKey ?? index}`"
          class="archon__row"
          :class="{ 'archon__row--zebra': index % 2 === 1 }"
        >
          <span class="archon__idx">{{ index + 1 }}</span>
          <span class="archon__primary">{{ missionPrimary(mission) }}</span>
        </li>
      </ol>
      <p v-else class="archon__empty">
        {{ locale === 'en' ? 'No missions listed' : '暂无任务' }}
      </p>
    </template>
    <p v-else class="archon__empty">
      {{ locale === 'en' ? 'No Archon Hunt data' : '暂无执行官狩猎数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.archon__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.archon__boss {
  font-size: 13px;
  font-weight: 700;
  color: var(--lanius-text);
}
.archon__expiry {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--lanius-text-muted);
}
.archon__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.archon__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 2px;
  border-bottom: 1px solid var(--lanius-border);
}
.archon__row--zebra {
  background: color-mix(in srgb, var(--lanius-warn) 8%, transparent);
}
.archon__idx {
  flex-shrink: 0;
  width: 14px;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-warn);
  line-height: 1.4;
}
.archon__primary {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.archon__empty {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
