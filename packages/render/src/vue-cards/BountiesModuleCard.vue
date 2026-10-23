<script setup lang="ts">
import type { BountyJobDto, BountySyndicateDto, CatalogItemDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { OfficialItemIcon, formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 赏金 QQ 截图卡：按联盟分节；Job 行含等级与奖励图标；空 Jobs 诚实空态。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 每联盟最多展示的 Job 数 */
  maxJobsPerSyndicate?: number;
  /** 每 Job 最多展示的奖励数 */
  maxRewardsPerJob?: number;
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
 * 奖励显示名（数量 >1 时附 ×N）。
 *
 * @param reward - 物品引用
 * @returns 显示串
 */
function rewardText(reward: CatalogItemDto): string {
  const name = label(reward.name);
  if (reward.quantity != null && reward.quantity > 1) {
    return `${name} ×${reward.quantity}`;
  }
  return name;
}

/**
 * Job 标题。
 *
 * @param job - 赏金 Job
 * @returns 标题串
 */
function jobTitle(job: BountyJobDto): string {
  if (job.title) {
    return label(job.title);
  }
  if (job.jobType) {
    return job.jobType.split('/').pop() ?? job.jobType;
  }
  return props.locale === 'en' ? 'Bounty' : '赏金';
}

/**
 * 等级区间短文案。
 *
 * @param job - 赏金 Job
 * @returns 如 `Lv5-15`；缺省空串
 */
function jobLevel(job: BountyJobDto): string {
  if (job.minEnemyLevel === undefined || job.maxEnemyLevel === undefined) {
    return '';
  }
  return `Lv${job.minEnemyLevel}-${job.maxEnemyLevel}`;
}

/**
 * 赏金联盟列表。
 *
 * @returns 联盟块
 */
const syndicates = computed((): BountySyndicateDto[] => props.worldstate.bounties);

/**
 * 每联盟 Job 截断上限。
 *
 * @returns 正整数
 */
const jobLimit = computed(() => props.maxJobsPerSyndicate ?? 5);

/**
 * 每 Job 奖励截断上限。
 *
 * @returns 正整数
 */
const rewardLimit = computed(() => props.maxRewardsPerJob ?? 5);

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));

/**
 * 刷新剩余短文案。
 *
 * @param expiryIso - ISO 到期
 * @returns 短文案
 */
function expiryLabel(expiryIso: string | undefined): string {
  if (!expiryIso) {
    return props.locale === 'en' ? 'refresh unknown' : '刷新未知';
  }
  const ms = Date.parse(expiryIso);
  if (!Number.isFinite(ms)) {
    return props.locale === 'en' ? 'refresh unknown' : '刷新未知';
  }
  const remaining = ms - Date.now();
  if (remaining <= 0) {
    return props.locale === 'en' ? 'expired' : '已到期';
  }
  const totalSec = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return props.locale === 'en' ? `${hours}h${minutes}m` : `${hours}时${minutes}分`;
  }
  return props.locale === 'en' ? `${minutes}m` : `${minutes}分`;
}
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'BOUNTIES' : '赏金'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="syndicates.length">
      <section
        v-for="(syndicate, sIndex) in syndicates"
        :key="syndicate.tag"
        class="bounty"
        :class="{ 'bounty--zebra': sIndex % 2 === 1 }"
      >
        <header class="bounty__head">
          <strong>{{ syndicate.name ? label(syndicate.name) : syndicate.tag }}</strong>
          <span class="bounty__expiry">{{ expiryLabel(syndicate.expiry) }}</span>
        </header>

        <p v-if="syndicate.jobs.length === 0" class="bounty__empty-jobs">
          {{
            locale === 'en'
              ? 'No bounty table this rotation (refresh time only)'
              : '本轮无赏金表（仅刷新时间）'
          }}
        </p>

        <ul v-else class="bounty__jobs">
          <li
            v-for="job in syndicate.jobs.slice(0, jobLimit)"
            :key="job.jobType ?? job.rewardTablePath ?? jobTitle(job)"
            class="bounty__job"
          >
            <div class="bounty__job-head">
              <span class="bounty__job-title">{{ jobTitle(job) }}</span>
              <span v-if="jobLevel(job)" class="bounty__job-lv">{{ jobLevel(job) }}</span>
            </div>
            <div v-if="job.rewards.length" class="bounty__rewards">
              <span
                v-for="(reward, rIndex) in job.rewards.slice(0, rewardLimit)"
                :key="`${reward.uniqueName ?? reward.name.en}-${rIndex}`"
                class="bounty__reward"
              >
                <OfficialItemIcon :icon-url="reward.iconUrl" :alt="rewardText(reward)" :size="18" />
                <span class="bounty__reward-name">{{ rewardText(reward) }}</span>
              </span>
              <span v-if="job.rewards.length > rewardLimit" class="bounty__more"
                >+{{ job.rewards.length - rewardLimit }}</span
              >
            </div>
            <p v-else-if="job.rewardTablePath" class="bounty__unresolved">
              {{ locale === 'en' ? 'Reward table unresolved' : '奖励表待解析' }}
            </p>
          </li>
        </ul>
        <p v-if="syndicate.jobs.length > jobLimit" class="bounty__more-jobs">
          {{
            locale === 'en'
              ? `+${syndicate.jobs.length - jobLimit} more jobs`
              : `另有 ${syndicate.jobs.length - jobLimit} 项赏金`
          }}
        </p>
      </section>
    </template>
    <p v-else class="bounty__empty">
      {{ locale === 'en' ? 'No bounty data' : '暂无赏金数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.bounty {
  padding: 6px 2px 8px;
  border-bottom: 1px solid var(--lanius-border);
}
.bounty:last-child {
  border-bottom: none;
}
.bounty--zebra {
  background: var(--lanius-zebra);
}
.bounty__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 4px;
}
.bounty__head strong {
  color: var(--lanius-brand);
  min-width: 0;
}
.bounty__expiry {
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-text-muted);
}
.bounty__empty-jobs {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  padding: 2px 0 4px;
}
.bounty__jobs {
  list-style: none;
  margin: 0;
  padding: 0;
}
.bounty__job {
  padding: 4px 0 5px;
}
.bounty__job-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 3px;
}
.bounty__job-title {
  font-weight: 700;
  color: var(--lanius-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bounty__job-lv {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-text-muted);
}
.bounty__rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: center;
}
.bounty__reward {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  font-size: 11px;
  color: var(--lanius-text);
}
.bounty__reward-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 9em;
}
.bounty__more,
.bounty__more-jobs {
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.bounty__more-jobs {
  margin: 2px 0 0;
}
.bounty__unresolved {
  margin: 0;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.bounty__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
