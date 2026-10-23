<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { AdminSectionId } from '../../types/admin-section';

const props = defineProps<{
  /** 当前激活分区 */
  modelValue: AdminSectionId;
}>();

const emit = defineEmits<{
  'update:modelValue': [AdminSectionId];
  /** 选择分区后通知父级（便于窄屏收起侧栏） */
  select: [];
}>();

/**
 * 侧栏分区定义（顺序即运营常用路径）。
 */
const SECTIONS: Array<{
  id: AdminSectionId;
  label: string;
  icon: string;
}> = [
  { id: 'overview', label: '概览', icon: 'i-lucide-layout-dashboard' },
  { id: 'config', label: '配置', icon: 'i-lucide-settings-2' },
  { id: 'releases', label: '版本', icon: 'i-lucide-git-branch' },
  { id: 'modules', label: '模块', icon: 'i-lucide-blocks' },
  { id: 'subscriptions', label: '订阅', icon: 'i-lucide-bell' },
  { id: 'rotations', label: '轮换', icon: 'i-lucide-refresh-cw' },
  { id: 'acl', label: 'ACL', icon: 'i-lucide-shield' },
  { id: 'helpMenu', label: '帮助菜单', icon: 'i-lucide-book-open' },
  { id: 'audit', label: '审计', icon: 'i-lucide-scroll-text' },
];

/**
 * 切换分区。
 *
 * @param id - 目标分区 id
 * @returns 无返回值
 */
function select(id: AdminSectionId): void {
  emit('update:modelValue', id);
  emit('select');
}

/**
 * Nuxt UI 导航菜单项（单列）。
 */
const items = computed<NavigationMenuItem[][]>(() => [
  SECTIONS.map((section) => ({
    label: section.label,
    icon: section.icon,
    active: props.modelValue === section.id,
    onSelect: () => select(section.id),
  })),
]);
</script>

<template>
  <UNavigationMenu
    :items="items"
    orientation="vertical"
    class="w-full"
    aria-label="Admin sections"
  />
</template>
