<script setup lang="ts">
import type { AdminSectionId } from '../../types/admin-section';

const props = defineProps<{
  /** 功能模块列表 */
  modules: Array<{ id: string; enabled: boolean; sortOrder: number }>;
  /** 订阅条数 */
  subscriptionCount: number;
  /** ACL 条数 */
  aclCount: number;
  /** 最近审计事件 */
  audit: Array<Record<string, unknown>>;
  /** 当前版本信息 */
  currentRelease: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  navigate: [AdminSectionId];
}>();

/**
 * 概览指标卡片。
 */
const stats = computed(() => [
  {
    label: '模块',
    value: String(props.modules.length),
    sub: `启用 ${props.modules.filter((m) => m.enabled).length}`,
    icon: 'i-lucide-blocks',
    section: 'modules' as AdminSectionId,
  },
  {
    label: '订阅',
    value: String(props.subscriptionCount),
    sub: 'push subscriptions',
    icon: 'i-lucide-bell',
    section: 'subscriptions' as AdminSectionId,
  },
  {
    label: 'ACL',
    value: String(props.aclCount),
    sub: 'access rules',
    icon: 'i-lucide-shield',
    section: 'acl' as AdminSectionId,
  },
  {
    label: '审计',
    value: String(props.audit.length),
    sub: 'recent events',
    icon: 'i-lucide-scroll-text',
    section: 'audit' as AdminSectionId,
  },
]);

/**
 * 模块启停摘要（最多展示 12 个）。
 */
const moduleSummary = computed(() => props.modules.slice(0, 12));

/**
 * 最近 5 条审计。
 */
const recentAudit = computed(() => props.audit.slice(0, 5));
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
        class="cursor-pointer transition hover:ring-1 hover:ring-primary/30"
        @click="emit('navigate', stat.section)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              {{ stat.label }}
            </p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-highlighted">
              {{ stat.value }}
            </p>
            <p class="mt-0.5 text-xs text-muted">{{ stat.sub }}</p>
          </div>
          <UIcon :name="stat.icon" class="size-5 text-primary" />
        </div>
      </UCard>

      <UCard>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">版本</p>
        <p class="mt-1 text-lg font-semibold text-highlighted">
          {{ String(currentRelease?.imageTag ?? 'n/a') }}
        </p>
        <p class="mt-0.5 text-xs text-muted">
          pkg {{ String(currentRelease?.packageVersion ?? 'n/a') }}
        </p>
        <UButton
          class="mt-3"
          size="xs"
          variant="soft"
          icon="i-lucide-git-branch"
          @click="emit('navigate', 'releases')"
        >
          管理版本
        </UButton>
      </UCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold text-highlighted">模块启停摘要</h2>
            <UButton size="xs" variant="ghost" @click="emit('navigate', 'modules')"> 全部 </UButton>
          </div>
        </template>
        <div v-if="moduleSummary.length" class="flex flex-wrap gap-2">
          <UBadge
            v-for="m in moduleSummary"
            :key="m.id"
            :color="m.enabled ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ m.id }}
          </UBadge>
        </div>
        <UEmpty
          v-else
          icon="i-lucide-blocks"
          title="暂无模块"
          description="刷新或检查 API 连接。"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold text-highlighted">最近审计</h2>
            <UButton size="xs" variant="ghost" @click="emit('navigate', 'audit')"> 全部 </UButton>
          </div>
        </template>
        <ul v-if="recentAudit.length" class="divide-y divide-default">
          <li
            v-for="ev in recentAudit"
            :key="String(ev.id)"
            class="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <div class="min-w-0">
              <p class="truncate font-medium">
                <code>{{ ev.module_id ?? '—' }}</code>
                <span class="text-muted"> · {{ ev.scene ?? '—' }}</span>
              </p>
              <p class="truncate text-xs text-muted">
                <code>{{ ev.ts }}</code>
              </p>
            </div>
            <UBadge
              :color="ev.outcome === 'ok' || ev.outcome === 'success' ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ String(ev.outcome ?? '—') }}
            </UBadge>
          </li>
        </ul>
        <UEmpty
          v-else
          icon="i-lucide-scroll-text"
          title="暂无审计"
          description="调用产生后将显示在此。"
        />
      </UCard>
    </div>

    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="手动访问 /admin"
      description="公开站导航不展示管理入口；密钥仅存 config/local 与/或数据库。"
    />
  </div>
</template>
