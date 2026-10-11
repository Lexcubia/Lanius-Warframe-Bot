<script setup lang="ts">
const props = defineProps<{
  /** 可选模块 id（来自 admin modules） */
  moduleIds: string[];
  /** 表单草稿 */
  draft: {
    titleZh: string;
    titleEn: string;
    introZh: string;
    introEn: string;
    visibleModuleIds: string[];
  };
}>();

const emit = defineEmits<{
  'update:draft': [typeof props.draft];
  save: [];
}>();

/**
 * 更新草稿字段并上抛。
 *
 * @param patch - 局部字段
 * @returns 无返回值
 */
function patchDraft(patch: Partial<typeof props.draft>): void {
  emit('update:draft', { ...props.draft, ...patch });
}

/**
 * 切换可见模块勾选。
 *
 * @param id - 模块 id
 * @param checked - 是否选中
 * @returns 无返回值
 */
function toggleModule(id: string, checked: boolean): void {
  const set = new Set(props.draft.visibleModuleIds);
  if (checked) set.add(id);
  else set.delete(id);
  patchDraft({ visibleModuleIds: [...set] });
}
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">帮助菜单</h2>
    <p class="admin-panel__hint">
      写入后由 GET /v1/help 展示标题/简介与可见模块；公开站与 QQ 共用。
    </p>
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.55rem 1rem;
      "
    >
      <label class="admin-field"
        >标题（中文）
        <input
          class="admin-input"
          :value="draft.titleZh"
          @input="
            patchDraft({
              titleZh: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </label>
      <label class="admin-field"
        >标题（英文）
        <input
          class="admin-input"
          :value="draft.titleEn"
          @input="
            patchDraft({
              titleEn: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </label>
    </div>
    <label class="admin-field"
      >简介（中文）
      <textarea
        class="admin-textarea"
        rows="3"
        style="font-family: inherit; min-height: 4.5rem"
        :value="draft.introZh"
        @input="
          patchDraft({
            introZh: ($event.target as HTMLTextAreaElement).value,
          })
        "
      />
    </label>
    <label class="admin-field"
      >简介（英文）
      <textarea
        class="admin-textarea"
        rows="3"
        style="font-family: inherit; min-height: 4.5rem"
        :value="draft.introEn"
        @input="
          patchDraft({
            introEn: ($event.target as HTMLTextAreaElement).value,
          })
        "
      />
    </label>
    <fieldset
      style="
        margin: 0.75rem 0;
        padding: 0.85rem;
        border: 1px solid var(--admin-line);
        border-radius: 10px;
      "
    >
      <legend style="padding: 0 0.35rem; color: var(--admin-muted); font-size: 0.85rem">
        可见模块
      </legend>
      <div class="admin-check-grid">
        <label v-for="id in moduleIds" :key="id" class="admin-check">
          <input
            type="checkbox"
            :checked="draft.visibleModuleIds.includes(id)"
            @change="
              toggleModule(id, ($event.target as HTMLInputElement).checked)
            "
          />
          <code>{{ id }}</code>
        </label>
      </div>
    </fieldset>
    <div class="admin-actions">
      <button type="button" class="admin-btn admin-btn--primary" @click="emit('save')">
        保存帮助菜单
      </button>
    </div>
  </section>
</template>
