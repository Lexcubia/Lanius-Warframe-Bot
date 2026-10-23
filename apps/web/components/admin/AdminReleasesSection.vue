<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const props = defineProps<{
  /** GitHub releases/tags 列表 */
  releases: Array<{ tag: string; name: string; publishedAt: string | null }>;
  /** 当前运行版本信息 */
  current: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  apply: [tag: string];
}>();

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

const confirmOpen = ref(false);
const pendingTag = ref<string | null>(null);

/**
 * 打开换版确认。
 *
 * @param tag - 目标 tag
 * @returns 无返回值
 */
function askApply(tag: string): void {
  pendingTag.value = tag;
  confirmOpen.value = true;
}

/**
 * 确认 pull 换版。
 *
 * @returns 无返回值
 */
function confirmApply(): void {
  if (pendingTag.value) {
    emit('apply', pendingTag.value);
  }
  confirmOpen.value = false;
  pendingTag.value = null;
}

/**
 * 是否为当前 tag。
 *
 * @param tag - 候选 tag
 * @returns 是否匹配当前镜像/包版本
 */
function isCurrent(tag: string): boolean {
  const image = String(props.current?.imageTag ?? '');
  const pkg = String(props.current?.packageVersion ?? '');
  return tag === image || tag === `v${pkg}` || tag === pkg;
}

/**
 * 表格列。
 */
const columns: TableColumn<{
  tag: string;
  name: string;
  publishedAt: string | null;
}>[] = [
  {
    accessorKey: 'tag',
    header: 'Tag',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('code', { class: 'text-sm' }, row.original.tag),
        isCurrent(row.original.tag)
          ? h(UBadge, { color: 'primary', variant: 'subtle' }, () => '当前')
          : null,
      ]),
  },
  {
    accessorKey: 'name',
    header: '名称',
    cell: ({ row }) => (row.original.name !== row.original.tag ? row.original.name : '—'),
  },
  {
    accessorKey: 'publishedAt',
    header: '发布',
    cell: ({ row }) => row.original.publishedAt ?? '—',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        UButton,
        {
          size: 'xs',
          variant: 'soft',
          icon: 'i-lucide-download',
          disabled: isCurrent(row.original.tag),
          onClick: () => askApply(row.original.tag),
        },
        () => '更新/回退',
      ),
  },
];
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2">
      <UCard>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">Image</p>
        <p class="mt-1 text-lg font-semibold text-highlighted">
          {{ current?.imageTag ?? 'n/a' }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">Package</p>
        <p class="mt-1 text-lg font-semibold text-highlighted">
          {{ current?.packageVersion ?? 'n/a' }}
        </p>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div>
          <h2 class="font-semibold text-highlighted">版本（GitHub / pull 换版）</h2>
          <p class="mt-1 text-sm text-muted">
            选版后走服务器 pull，不在此机 rebuild。确认后才会发起请求。
          </p>
        </div>
      </template>

      <UTable v-if="releases.length" :data="releases" :columns="columns" class="w-full" />
      <UEmpty
        v-else
        icon="i-lucide-git-branch"
        title="暂无 Release/tag"
        description="GitHub API 不可用或尚未配置 github 模块。"
      />
    </UCard>

    <UModal v-model:open="confirmOpen" title="确认换版">
      <template #body>
        <p class="text-sm text-muted">
          将请求服务器更新到
          <code class="text-highlighted">{{ pendingTag }}</code>
          。生产环境请确认维护窗口。
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="confirmOpen = false"> 取消 </UButton>
          <UButton icon="i-lucide-download" @click="confirmApply"> 确认更新 </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
