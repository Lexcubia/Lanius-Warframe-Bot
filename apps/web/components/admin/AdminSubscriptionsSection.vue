<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const props = defineProps<{
  /** 推送订阅行 */
  subscriptions: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{
  patch: [id: number, patch: { enabled?: boolean; frequency?: string }];
}>();

const USelect = resolveComponent('USelect');
const USwitch = resolveComponent('USwitch');

const query = ref('');
const frequencyFilter = ref<string | 'all'>('all');

/**
 * 频率选项。
 */
const frequencyItems = [
  { label: '变更时', value: 'on_change' },
  { label: '每小时', value: 'hourly' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
];

/**
 * 过滤后的订阅。
 */
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.subscriptions.filter((row) => {
    if (frequencyFilter.value !== 'all' && String(row.frequency) !== frequencyFilter.value) {
      return false;
    }
    if (!q) return true;
    const hay = [row.scene, row.targetId, row.moduleId, row.frequency]
      .map((v) => String(v ?? '').toLowerCase())
      .join(' ');
    return hay.includes(q);
  });
});

/**
 * 表格列。
 */
const columns: TableColumn<Record<string, unknown>>[] = [
  {
    id: 'target',
    header: '场景 / 目标',
    cell: ({ row }) =>
      h('code', { class: 'text-sm' }, `${row.original.scene}/${row.original.targetId}`),
  },
  {
    accessorKey: 'moduleId',
    header: '模块',
    cell: ({ row }) => h('code', { class: 'text-sm' }, String(row.original.moduleId)),
  },
  {
    id: 'frequency',
    header: '频率',
    cell: ({ row }) =>
      h(USelect, {
        modelValue: String(row.original.frequency),
        items: frequencyItems,
        valueKey: 'value',
        size: 'sm',
        class: 'w-36',
        'onUpdate:modelValue': (value: string) =>
          emit('patch', Number(row.original.id), { frequency: value }),
      }),
  },
  {
    id: 'enabled',
    header: '启用',
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.original.enabled),
        'onUpdate:modelValue': (value: boolean) =>
          emit('patch', Number(row.original.id), { enabled: value }),
      }),
  },
];
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-3">
        <div>
          <h2 class="font-semibold text-highlighted">推送订阅</h2>
          <p class="mt-1 text-sm text-muted">
            共 {{ subscriptions.length }} 条（筛选后 {{ filtered.length }}）。公开站不写入 QQ
            订阅，仅在此运维启停与频率。
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="query"
            icon="i-lucide-search"
            placeholder="搜索场景 / 目标 / 模块…"
            class="w-full sm:max-w-xs"
          />
          <USelect
            v-model="frequencyFilter"
            :items="[{ label: '全部频率', value: 'all' }, ...frequencyItems]"
            value-key="value"
            class="w-full sm:w-44"
          />
        </div>
      </div>
    </template>

    <UTable v-if="filtered.length" :data="filtered" :columns="columns" class="w-full" />
    <UEmpty
      v-else
      icon="i-lucide-bell-off"
      title="无匹配订阅"
      description="调整筛选或等待 Bot 写入订阅。"
    />
  </UCard>
</template>
