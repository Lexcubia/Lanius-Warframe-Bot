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
  /** 保存中 */
  saving?: boolean;
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

/**
 * 全选可见模块。
 *
 * @returns 无返回值
 */
function selectAll(): void {
  patchDraft({ visibleModuleIds: [...props.moduleIds] });
}

/**
 * 清空可见模块。
 *
 * @returns 无返回值
 */
function clearAll(): void {
  patchDraft({ visibleModuleIds: [] });
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-highlighted">帮助菜单</h2>
          <p class="mt-1 text-sm text-muted">
            写入后由 GET /v1/help 展示标题/简介与可见模块；公开站与 QQ 共用。
          </p>
        </div>
        <UButton icon="i-lucide-save" :loading="saving" @click="emit('save')">
          保存帮助菜单
        </UButton>
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="标题（中文）">
          <UInput
            class="w-full"
            :model-value="draft.titleZh"
            @update:model-value="patchDraft({ titleZh: String($event) })"
          />
        </UFormField>
        <UFormField label="标题（英文）">
          <UInput
            class="w-full"
            :model-value="draft.titleEn"
            @update:model-value="patchDraft({ titleEn: String($event) })"
          />
        </UFormField>
      </div>

      <UFormField label="简介（中文）">
        <UTextarea
          class="w-full"
          :rows="3"
          :model-value="draft.introZh"
          @update:model-value="patchDraft({ introZh: String($event) })"
        />
      </UFormField>
      <UFormField label="简介（英文）">
        <UTextarea
          class="w-full"
          :rows="3"
          :model-value="draft.introEn"
          @update:model-value="patchDraft({ introEn: String($event) })"
        />
      </UFormField>

      <div class="rounded-lg border border-default p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium text-highlighted">
            可见模块（{{ draft.visibleModuleIds.length }} / {{ moduleIds.length }}）
          </p>
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="soft" @click="selectAll"> 全选 </UButton>
            <UButton size="xs" color="neutral" variant="ghost" @click="clearAll"> 清空 </UButton>
          </div>
        </div>
        <div v-if="moduleIds.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label
            v-for="id in moduleIds"
            :key="id"
            class="flex items-center gap-2 rounded-md border border-default px-3 py-2 text-sm"
          >
            <UCheckbox
              :model-value="draft.visibleModuleIds.includes(id)"
              @update:model-value="toggleModule(id, Boolean($event))"
            />
            <code>{{ id }}</code>
          </label>
        </div>
        <UEmpty
          v-else
          icon="i-lucide-blocks"
          title="无模块可选"
          description="请先在「模块」分区加载 ModuleId。"
        />
      </div>
    </div>
  </UCard>
</template>
