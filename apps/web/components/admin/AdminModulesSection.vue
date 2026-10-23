<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const props = defineProps<{
  /** 模块开关列表 */
  modules: Array<{ id: string; enabled: boolean; sortOrder: number }>;
  /** 是否加载中 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  toggle: [id: string, enabled: boolean];
}>();

const UBadge = resolveComponent('UBadge');
const USwitch = resolveComponent('USwitch');

/**
 * 表格列定义。
 */
const columns: TableColumn<{ id: string; enabled: boolean; sortOrder: number }>[] = [
  {
    accessorKey: 'id',
    header: 'ModuleId',
    cell: ({ row }) => h('code', { class: 'text-sm' }, row.original.id),
  },
  {
    accessorKey: 'sortOrder',
    header: '排序',
  },
  {
    accessorKey: 'enabled',
    header: '状态',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.enabled ? 'success' : 'neutral',
          variant: 'subtle',
        },
        () => (row.original.enabled ? '启用' : '关闭'),
      ),
  },
  {
    id: 'actions',
    header: '开关',
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: row.original.enabled,
        'onUpdate:modelValue': (value: boolean) => emit('toggle', row.original.id, value),
      }),
  },
];
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h2 class="font-semibold text-highlighted">模块开关</h2>
        <p class="mt-1 text-sm text-muted">
          关闭后对应查询/推送能力对客户端返回不可用。门禁、帮助与推送共用 ModuleId。
        </p>
      </div>
    </template>

    <UTable
      v-if="modules.length || loading"
      :data="modules"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />
    <UEmpty v-else icon="i-lucide-blocks" title="暂无模块" description="请刷新或检查 API。" />
  </UCard>
</template>
