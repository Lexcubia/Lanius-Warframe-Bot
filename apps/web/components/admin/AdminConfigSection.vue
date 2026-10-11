<script setup lang="ts">
const props = defineProps<{
  /** 配置模块描述列表 */
  modules: Array<{
    moduleId: string;
    data: Record<string, unknown>;
    restartRequired: string[];
  }>;
  /** 当前选中模块 id */
  selectedModuleId: string;
  /** JSON 编辑正文 */
  editText: string;
}>();

const emit = defineEmits<{
  'update:selectedModuleId': [string];
  'update:editText': [string];
  save: [];
}>();
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">配置（模块 YAML）</h2>
    <p class="admin-panel__hint">
      密钥显示为 ********；保存时留空或掩码表示保持原值。保存后进程内热加载；若返回
      restartRequired，需重启进程后生效。
    </p>
    <label class="admin-field"
      >模块
      <select
        class="admin-select"
        :value="props.selectedModuleId"
        @change="
          emit(
            'update:selectedModuleId',
            ($event.target as HTMLSelectElement).value,
          )
        "
      >
        <option
          v-for="m in props.modules"
          :key="m.moduleId"
          :value="m.moduleId"
        >
          {{ m.moduleId }}
        </option>
      </select>
    </label>
    <label class="admin-field"
      >JSON
      <textarea
        class="admin-textarea"
        rows="18"
        :value="props.editText"
        @input="
          emit('update:editText', ($event.target as HTMLTextAreaElement).value)
        "
      />
    </label>
    <div class="admin-actions">
      <button type="button" class="admin-btn admin-btn--primary" @click="emit('save')">
        保存并热加载
      </button>
    </div>
  </section>
</template>
