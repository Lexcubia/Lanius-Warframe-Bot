<script setup lang="ts">
import type { ArchonHuntDto, SortieMissionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 执行官狩猎 QQ 截图卡：Boss + 三步任务链（通常无修正）。
 * 单列铺满：任务类型左、节点右跨满行宽。
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
 * 单步任务类型文案。
 *
 * @param mission - 任务步
 * @returns 类型；缺省 —
 */
function missionType(mission: SortieMissionDto): string {
  if (mission.missionType) {
    return label(mission.missionType);
  }
  return mission.missionTypeKey ?? '—';
}

/**
 * 单步节点文案。
 *
 * @param mission - 任务步
 * @returns 节点；缺省空串
 */
function missionNode(mission: SortieMissionDto): string {
  if (mission.node) {
    return label(mission.node);
  }
  return mission.nodeKey ?? '';
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
          <div class="archon__primary">
            <span class="archon__type">{{ missionType(mission) }}</span>
            <span v-if="missionNode(mission)" class="archon__node">{{ missionNode(mission) }}</span>
          </div>
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
  margin-bottom: 3px;
  width: 100%;
}
.archon__boss {
  font-size: var(--lanius-type-lead, 16px);
  font-weight: 700;
  color: var(--lanius-text);
  min-width: 0;
}
.archon__expiry {
  flex-shrink: 0;
  font-size: var(--lanius-type-meta, 12px);
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
  padding: 5px 0;
  border-bottom: 1px solid var(--lanius-border);
  width: 100%;
  box-sizing: border-box;
}
.archon__row--zebra {
  background: color-mix(in srgb, var(--lanius-warn) 8%, transparent);
}
.archon__idx {
  flex-shrink: 0;
  width: 1.15em;
  font-size: var(--lanius-type-body, 14px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-warn);
  line-height: 1.35;
}
.archon__primary {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.archon__type {
  font-size: var(--lanius-type-body, 14px);
  font-weight: 700;
  color: var(--lanius-text);
  min-width: 0;
}
.archon__node {
  flex-shrink: 0;
  max-width: 58%;
  font-size: var(--lanius-type-body, 14px);
  font-weight: 600;
  color: var(--lanius-text);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.archon__empty {
  margin: 0;
  font-size: var(--lanius-type-body, 14px);
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
