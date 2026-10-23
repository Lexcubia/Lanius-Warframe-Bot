<script setup lang="ts">
import type { HelpDto, Locale } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * QQ 帮助总览：多列紧凑，仅指令 + 短别名（无长描述）。
 * 模块详解仍走 `/帮助 <module>` 文本/图路径。
 */
const props = defineProps<{
  help: HelpDto;
  locale: Locale;
  /** QQ 皮肤 */
  skin?: CardSkinId;
}>();

/**
 * 取首个别名短展示（省略过长）。
 *
 * @param aliases - 别名列表
 * @returns 短别名或空串
 */
function shortAlias(aliases: string[]): string {
  const first = aliases[0];
  if (!first) {
    return '';
  }
  return first.length > 16 ? `${first.slice(0, 14)}…` : first;
}

/**
 * 是否为模块详解（单条且含 usage/examples 时应展示详情块）。
 * 总览：多条 → 仅命令+别名；单模块：保留简短 usage。
 *
 * @returns 是否详解模式
 */
function isDetailView(): boolean {
  return props.help.lines.length === 1;
}
</script>

<template>
  <QqCardShell
    :title="pickLocalized(help.title, locale)"
    :subtitle="formatTimestamp(new Date().toISOString())"
    :locale="locale"
    :skin="skin"
  >
    <p v-if="help.intro" class="help-intro">{{ pickLocalized(help.intro, locale) }}</p>

    <!-- 总览：多列，命令 + 别名 -->
    <ul v-if="!isDetailView()" class="help-grid">
      <li v-for="line in help.lines" :key="line.id" class="help-cell">
        <span class="help-cell__cmd">{{ line.command }}</span>
        <span v-if="shortAlias(line.aliases)" class="help-cell__alias">{{
          shortAlias(line.aliases)
        }}</span>
      </li>
    </ul>

    <!-- 单模块详解：保留用法与示例（无厚卡） -->
    <ul v-else class="help-detail">
      <li v-for="line in help.lines" :key="line.id" class="help-detail__row">
        <div class="help-detail__cmd">{{ line.command }}</div>
        <div v-if="line.aliases.length" class="help-detail__alias">
          {{ line.aliases.slice(0, 4).join(' · ') }}
        </div>
        <div class="help-detail__usage">{{ pickLocalized(line.usage, locale) }}</div>
        <div v-if="line.examples.length" class="help-detail__ex">
          {{ line.examples.slice(0, 3).join(' · ') }}
        </div>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.help-intro {
  margin: 0 0 6px;
  font-size: 11px;
  color: var(--lanius-text-muted);
  line-height: 1.35;
}
.help-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--lanius-border);
}
.help-cell {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  padding: 4px 6px;
  border-bottom: 1px solid var(--lanius-border);
  border-right: 1px solid var(--lanius-border);
}
.help-cell:nth-child(2n) {
  border-right: none;
}
.help-cell__cmd {
  font-weight: 700;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: 12px;
  white-space: nowrap;
}
.help-cell__alias {
  min-width: 0;
  font-size: 10px;
  color: var(--lanius-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.help-detail {
  list-style: none;
  margin: 0;
  padding: 0;
}
.help-detail__row {
  padding: 4px 0;
  border-bottom: 1px solid var(--lanius-border);
}
.help-detail__cmd {
  font-weight: 700;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: 13px;
}
.help-detail__alias,
.help-detail__usage,
.help-detail__ex {
  margin-top: 2px;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.help-detail__usage {
  color: var(--lanius-text);
}
</style>
