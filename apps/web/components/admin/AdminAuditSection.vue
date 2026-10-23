<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const props = defineProps<{
  /** 审计事件行 */
  events: Array<Record<string, unknown>>;
}>();

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');

const query = ref('');
const outcomeFilter = ref<string | 'all'>('all');
const moduleFilter = ref<string | 'all'>('all');
const page = ref(1);
const pageSize = 15;
const detailOpen = ref(false);
const selected = ref<Record<string, unknown> | null>(null);

/**
 * 结果筛选项。
 */
const outcomeItems = computed(() => {
  const set = new Set(props.events.map((e) => String(e.outcome ?? '')).filter(Boolean));
  return [
    { label: '全部结果', value: 'all' },
    ...[...set].sort().map((v) => ({ label: v, value: v })),
  ];
});

/**
 * 模块筛选项。
 */
const moduleItems = computed(() => {
  const set = new Set(props.events.map((e) => String(e.module_id ?? '')).filter(Boolean));
  return [
    { label: '全部模块', value: 'all' },
    ...[...set].sort().map((v) => ({ label: v, value: v })),
  ];
});

/**
 * 过滤后的事件。
 */
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.events.filter((ev) => {
    if (outcomeFilter.value !== 'all' && String(ev.outcome ?? '') !== outcomeFilter.value) {
      return false;
    }
    if (moduleFilter.value !== 'all' && String(ev.module_id ?? '') !== moduleFilter.value) {
      return false;
    }
    if (!q) return true;
    const hay = [ev.ts, ev.scene, ev.module_id, ev.outcome, ev.request_id, ev.detail]
      .map((v) => String(v ?? '').toLowerCase())
      .join(' ');
    return hay.includes(q);
  });
});

/**
 * 分页后的行。
 */
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

watch([query, outcomeFilter, moduleFilter], () => {
  page.value = 1;
});

/**
 * 打开详情抽屉。
 *
 * @param row - 审计行
 * @returns 无返回值
 */
function openDetail(row: Record<string, unknown>): void {
  selected.value = row;
  detailOpen.value = true;
}

/**
 * 结果徽章颜色。
 *
 * @param outcome - 结果字符串
 * @returns Nuxt UI color
 */
function outcomeColor(outcome: unknown): 'success' | 'warning' | 'error' | 'neutral' {
  const v = String(outcome ?? '').toLowerCase();
  if (v === 'ok' || v === 'success' || v === 'allow') return 'success';
  if (v === 'deny' || v === 'error' || v === 'fail') return 'error';
  if (v) return 'warning';
  return 'neutral';
}

/**
 * 表格列。
 */
const columns: TableColumn<Record<string, unknown>>[] = [
  {
    accessorKey: 'ts',
    header: '时间',
    cell: ({ row }) => h('code', { class: 'text-xs' }, String(row.original.ts ?? '—')),
  },
  {
    accessorKey: 'scene',
    header: '场景',
    cell: ({ row }) => String(row.original.scene ?? '—'),
  },
  {
    accessorKey: 'module_id',
    header: '模块',
    cell: ({ row }) => h('code', { class: 'text-sm' }, String(row.original.module_id ?? '—')),
  },
  {
    accessorKey: 'outcome',
    header: '结果',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: outcomeColor(row.original.outcome),
          variant: 'subtle',
        },
        () => String(row.original.outcome ?? '—'),
      ),
  },
  {
    accessorKey: 'latency_ms',
    header: '耗时',
    cell: ({ row }) => (row.original.latency_ms != null ? `${row.original.latency_ms}ms` : '—'),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        UButton,
        {
          size: 'xs',
          variant: 'ghost',
          icon: 'i-lucide-panel-right-open',
          onClick: () => openDetail(row.original),
        },
        () => '详情',
      ),
  },
];
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <template #header>
        <div class="space-y-3">
          <div>
            <h2 class="font-semibold text-highlighted">调用日志</h2>
            <p class="mt-1 text-sm text-muted">
              已加载 {{ events.length }} 条；筛选后 {{ filtered.length }} 条。
            </p>
          </div>
          <div class="flex flex-col gap-2 lg:flex-row">
            <UInput
              v-model="query"
              icon="i-lucide-search"
              placeholder="搜索时间 / 场景 / 模块 / request_id…"
              class="w-full lg:max-w-sm"
            />
            <USelect
              v-model="moduleFilter"
              :items="moduleItems"
              value-key="value"
              class="w-full lg:w-44"
            />
            <USelect
              v-model="outcomeFilter"
              :items="outcomeItems"
              value-key="value"
              class="w-full lg:w-40"
            />
          </div>
        </div>
      </template>

      <UTable v-if="pageRows.length" :data="pageRows" :columns="columns" class="w-full" />
      <UEmpty
        v-else
        icon="i-lucide-scroll-text"
        title="无匹配审计"
        description="调整筛选条件或等待新调用。"
      />

      <div v-if="filtered.length > pageSize" class="mt-4 flex justify-center">
        <UPagination
          v-model:page="page"
          :total="filtered.length"
          :items-per-page="pageSize"
          :sibling-count="1"
        />
      </div>
    </UCard>

    <USlideover v-model:open="detailOpen" title="审计详情">
      <template #body>
        <dl v-if="selected" class="space-y-3 text-sm">
          <div
            v-for="key in [
              'id',
              'ts',
              'scene',
              'target_id',
              'user_id',
              'module_id',
              'outcome',
              'latency_ms',
              'request_id',
              'detail',
            ]"
            :key="key"
            class="grid gap-1 border-b border-default pb-2"
          >
            <dt class="text-xs uppercase tracking-wide text-muted">
              {{ key }}
            </dt>
            <dd class="break-all font-mono text-sm">
              {{ selected[key] == null || selected[key] === '' ? '—' : String(selected[key]) }}
            </dd>
          </div>
        </dl>
      </template>
    </USlideover>
  </div>
</template>
