<script setup lang="ts">
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
 * 侧栏分区列表（顺序即运营常用路径）。
 */
const sections: Array<{ id: AdminSectionId; label: string }> = [
  { id: 'overview', label: '概览' },
  { id: 'config', label: '配置' },
  { id: 'releases', label: '版本' },
  { id: 'modules', label: '模块' },
  { id: 'subscriptions', label: '订阅' },
  { id: 'rotations', label: '轮换' },
  { id: 'acl', label: 'ACL' },
  { id: 'helpMenu', label: '帮助菜单' },
  { id: 'audit', label: '审计' },
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
</script>

<template>
  <nav class="admin-nav" aria-label="Admin sections">
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="admin-nav__item"
      :class="{ 'admin-nav__item--active': props.modelValue === section.id }"
      @click="select(section.id)"
    >
      {{ section.label }}
    </button>
  </nav>
</template>
