<script setup lang="ts">
defineProps<{
  /** 模块开关列表 */
  modules: Array<{ id: string; enabled: boolean; sortOrder: number }>;
}>();

const emit = defineEmits<{
  toggle: [id: string, enabled: boolean];
}>();
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">模块开关</h2>
    <p class="admin-panel__hint">关闭后对应查询/推送能力对客户端返回不可用。</p>
    <div class="admin-check-grid">
      <label v-for="m in modules" :key="m.id" class="admin-check">
        <input
          type="checkbox"
          :checked="m.enabled"
          @change="
            emit('toggle', m.id, ($event.target as HTMLInputElement).checked)
          "
        />
        <code>{{ m.id }}</code>
      </label>
    </div>
  </section>
</template>
