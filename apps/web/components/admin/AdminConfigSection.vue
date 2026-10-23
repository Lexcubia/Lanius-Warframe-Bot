<script setup lang="ts">
import {
  ADMIN_CONFIG_FIELDS,
  ADMIN_SECRET_MASK,
  adminGetByPath,
  adminSetByPath,
  cloneConfigData,
  hasStructuredConfigFields,
  type AdminConfigFieldDef,
} from '../../utils/admin-config-fields';

const props = defineProps<{
  /** 配置模块描述列表 */
  modules: Array<{
    moduleId: string;
    data: Record<string, unknown>;
    restartRequired: string[];
  }>;
  /** 当前选中模块 id */
  selectedModuleId: string;
}>();

const emit = defineEmits<{
  'update:selectedModuleId': [string];
  save: [body: Record<string, unknown>];
}>();

const toast = useToast();
const saving = ref(false);
const showAdvancedJson = ref(false);
const jsonText = ref('{}');
const draft = ref<Record<string, unknown>>({});

/**
 * 当前模块行。
 */
const currentRow = computed(() => props.modules.find((m) => m.moduleId === props.selectedModuleId));

/**
 * 当前模块结构化字段。
 */
const fields = computed<AdminConfigFieldDef[]>(
  () => ADMIN_CONFIG_FIELDS[props.selectedModuleId] ?? [],
);

/**
 * 模块选择项。
 */
const moduleItems = computed(() =>
  props.modules.map((m) => ({
    label: m.moduleId,
    value: m.moduleId,
  })),
);

/**
 * 需重启字段提示。
 */
const restartHint = computed(() => currentRow.value?.restartRequired ?? []);

/**
 * 从服务端数据同步草稿与高级 JSON。
 *
 * @returns 无返回值
 */
function syncFromServer(): void {
  const data = currentRow.value?.data ?? {};
  draft.value = cloneConfigData(data);
  jsonText.value = JSON.stringify(data, null, 2);
}

/**
 * 读取草稿字段值（表单绑定）。
 *
 * @param field - 字段定义
 * @returns 展示用值
 */
function fieldValue(field: AdminConfigFieldDef): string | number | boolean {
  const raw = adminGetByPath(draft.value, field.path);
  if (field.control === 'boolean') {
    return Boolean(raw);
  }
  if (field.control === 'number') {
    return typeof raw === 'number' ? raw : Number(raw ?? 0);
  }
  if (raw === undefined || raw === null) {
    return field.secret ? '' : '';
  }
  return String(raw);
}

/**
 * 写入草稿字段。
 *
 * @param field - 字段定义
 * @param value - 新值
 * @returns 无返回值
 */
function setFieldValue(
  field: AdminConfigFieldDef,
  value: string | number | boolean | null | undefined,
): void {
  let next: unknown = value;
  if (field.control === 'number') {
    next = value === '' || value === null || value === undefined ? undefined : Number(value);
  }
  if (field.control === 'boolean') {
    next = Boolean(value);
  }
  if (field.secret && (next === '' || next === undefined || next === null)) {
    next = ADMIN_SECRET_MASK;
  }
  adminSetByPath(draft.value, field.path, next);
}

/**
 * 保存结构化表单。
 *
 * @returns 无返回值
 */
async function saveStructured(): Promise<void> {
  saving.value = true;
  try {
    emit('save', cloneConfigData(draft.value));
  } finally {
    saving.value = false;
  }
}

/**
 * 从高级 JSON 保存。
 *
 * @returns 无返回值
 */
async function saveJson(): Promise<void> {
  saving.value = true;
  try {
    const body = JSON.parse(jsonText.value) as Record<string, unknown>;
    emit('save', body);
  } catch (err) {
    toast.add({
      title: 'JSON 无效',
      description: err instanceof Error ? err.message : String(err),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

/**
 * 将结构化草稿同步进高级 JSON 文本框。
 *
 * @returns 无返回值
 */
function pushDraftToJson(): void {
  jsonText.value = JSON.stringify(draft.value, null, 2);
}

watch(
  () => [props.selectedModuleId, props.modules] as const,
  () => syncFromServer(),
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <UFormField label="配置模块" class="w-full max-w-xs">
          <USelect
            :model-value="selectedModuleId"
            :items="moduleItems"
            value-key="value"
            class="w-full"
            @update:model-value="emit('update:selectedModuleId', String($event))"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="path in restartHint" :key="path" color="warning" variant="subtle">
            重启: {{ path }}
          </UBadge>
        </div>
      </div>
      <p class="mt-3 text-sm text-muted">
        密钥显示为掩码；保存时留空或
        <code>{{ ADMIN_SECRET_MASK }}</code>
        表示保持原值。保存后进程内热加载。
      </p>
    </UCard>

    <UCard v-if="hasStructuredConfigFields(selectedModuleId)">
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-semibold text-highlighted">结构化表单</h2>
          <UButton size="sm" :loading="saving" icon="i-lucide-save" @click="saveStructured">
            保存并热加载
          </UButton>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormField
          v-for="field in fields"
          :key="field.path"
          :label="field.label"
          :description="field.description"
          :hint="field.restartRequired ? '需重启' : undefined"
          :name="field.path"
        >
          <USwitch
            v-if="field.control === 'boolean'"
            :model-value="Boolean(fieldValue(field))"
            @update:model-value="setFieldValue(field, $event)"
          />
          <USelect
            v-else-if="field.control === 'select'"
            :model-value="String(fieldValue(field))"
            :items="field.options ?? []"
            value-key="value"
            class="w-full"
            @update:model-value="setFieldValue(field, String($event))"
          />
          <UInput
            v-else-if="field.control === 'number'"
            type="number"
            class="w-full"
            :model-value="Number(fieldValue(field))"
            @update:model-value="setFieldValue(field, $event)"
          />
          <UInput
            v-else-if="field.control === 'password'"
            type="password"
            class="w-full"
            :placeholder="ADMIN_SECRET_MASK"
            :model-value="
              String(fieldValue(field)) === ADMIN_SECRET_MASK ? '' : String(fieldValue(field))
            "
            @update:model-value="setFieldValue(field, $event)"
          />
          <UTextarea
            v-else-if="field.control === 'textarea'"
            class="w-full"
            :rows="4"
            :model-value="String(fieldValue(field))"
            @update:model-value="setFieldValue(field, $event)"
          />
          <UInput
            v-else
            class="w-full"
            :model-value="String(fieldValue(field))"
            @update:model-value="setFieldValue(field, $event)"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard v-else>
      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-braces"
        title="本模块使用高级 JSON 编辑"
        description="site / labels 等复杂结构暂无逐字段表单；请在下方编辑。"
      />
    </UCard>

    <UCollapsible v-model:open="showAdvancedJson">
      <UButton
        block
        color="neutral"
        variant="outline"
        trailing-icon="i-lucide-chevron-down"
        @click="
          showAdvancedJson = !showAdvancedJson;
          if (showAdvancedJson) pushDraftToJson();
        "
      >
        高级：原始 JSON
      </UButton>
      <template #content>
        <div class="mt-3 space-y-3 rounded-lg border border-default p-4">
          <UTextarea v-model="jsonText" :rows="16" class="w-full font-mono text-sm" />
          <div class="flex flex-wrap gap-2">
            <UButton
              size="sm"
              variant="soft"
              icon="i-lucide-arrow-down-to-line"
              @click="pushDraftToJson"
            >
              从结构化草稿同步
            </UButton>
            <UButton size="sm" :loading="saving" icon="i-lucide-save" @click="saveJson">
              保存 JSON
            </UButton>
          </div>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
