<script setup lang="ts">
const props = defineProps<{
  /** 轮换表原始行（snake_case） */
  schedules: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{
  save: [moduleId: string, body: { epochIso: string; periodDays: number; items: string[] }];
}>();

type Draft = {
  moduleId: string;
  epochIso: string;
  periodDays: number;
  itemsText: string;
};

type ItemRow = {
  name: string;
  element: string;
  bonusPct: string;
};

/**
 * 将 DB 条目格式化为可编辑文本行（支持 Valence 管道语法）。
 *
 * @param entry - 字符串或 `{ name, element, bonusPct }`
 * @returns 单行文本
 */
function formatItemLine(entry: unknown): string {
  if (typeof entry === 'string') {
    return entry;
  }
  if (entry && typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    const name = String(row.name ?? '').trim();
    if (!name) {
      return '';
    }
    const element = typeof row.element === 'string' && row.element.trim() ? row.element.trim() : '';
    const bonus =
      typeof row.bonusPct === 'number' && Number.isFinite(row.bonusPct)
        ? String(row.bonusPct)
        : typeof row.bonusPct === 'string'
          ? row.bonusPct.trim()
          : '';
    if (element || bonus) {
      return [name, element || '-', bonus].filter(Boolean).join(' | ');
    }
    return name;
  }
  return '';
}

/**
 * 解析单行 Valence 文本为结构化行。
 *
 * @param line - 如 `Tenet Agendus | heat | 45.2`
 * @returns 结构化行
 */
function parseItemLine(line: string): ItemRow {
  const parts = line.split('|').map((p) => p.trim());
  return {
    name: parts[0] ?? '',
    element: parts[1] && parts[1] !== '-' ? parts[1] : '',
    bonusPct: parts[2] ?? '',
  };
}

/**
 * 结构化行写回文本行。
 *
 * @param row - 结构化行
 * @returns 管道语法文本
 */
function serializeItemRow(row: ItemRow): string {
  const name = row.name.trim();
  if (!name) return '';
  const element = row.element.trim();
  const bonus = row.bonusPct.trim();
  if (element || bonus) {
    return [name, element || '-', bonus].filter((p) => p !== '').join(' | ');
  }
  return name;
}

/**
 * 将 DB 行解析为表单草稿。
 *
 * @param row - 轮换表行
 * @returns 可编辑草稿
 */
function toDraft(row: Record<string, unknown>): Draft {
  let lines: string[] = [];
  try {
    const parsed = JSON.parse(String(row.items_json ?? '[]')) as unknown;
    if (Array.isArray(parsed)) {
      lines = parsed.map(formatItemLine).filter(Boolean);
    }
  } catch {
    lines = [];
  }
  return {
    moduleId: String(row.module_id ?? ''),
    epochIso: String(row.epoch_iso ?? new Date().toISOString()),
    periodDays: Number(row.period_days ?? 4) || 4,
    itemsText: lines.join('\n'),
  };
}

const drafts = ref<Draft[]>([]);
/** 每张表的结构化行编辑态 */
const itemRows = ref<Record<string, ItemRow[]>>({});
/** 是否显示原始多行文本 */
const showRaw = ref<Record<string, boolean>>({});

const elementItems = [
  { label: '（无）', value: '' },
  { label: 'impact', value: 'impact' },
  { label: 'heat', value: 'heat' },
  { label: 'cold', value: 'cold' },
  { label: 'electricity', value: 'electricity' },
  { label: 'toxin', value: 'toxin' },
  { label: 'magnetic', value: 'magnetic' },
  { label: 'radiation', value: 'radiation' },
];

watch(
  () => props.schedules,
  (rows) => {
    drafts.value = rows.map(toDraft);
    const known = new Set(drafts.value.map((d) => d.moduleId));
    for (const id of ['tenetRotation', 'codaRotation']) {
      if (!known.has(id)) {
        drafts.value.push({
          moduleId: id,
          epochIso: new Date().toISOString(),
          periodDays: 4,
          itemsText: '',
        });
      }
    }
    const nextRows: Record<string, ItemRow[]> = {};
    for (const draft of drafts.value) {
      nextRows[draft.moduleId] = draft.itemsText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(parseItemLine);
      if (!nextRows[draft.moduleId]?.length) {
        nextRows[draft.moduleId] = [{ name: '', element: '', bonusPct: '' }];
      }
    }
    itemRows.value = nextRows;
  },
  { immediate: true },
);

/**
 * 新增空武器行。
 *
 * @param moduleId - 轮换模块 id
 * @returns 无返回值
 */
function addItemRow(moduleId: string): void {
  const list = itemRows.value[moduleId] ?? [];
  itemRows.value[moduleId] = [...list, { name: '', element: '', bonusPct: '' }];
}

/**
 * 删除武器行。
 *
 * @param moduleId - 轮换模块 id
 * @param index - 行下标
 * @returns 无返回值
 */
function removeItemRow(moduleId: string, index: number): void {
  const list = [...(itemRows.value[moduleId] ?? [])];
  list.splice(index, 1);
  itemRows.value[moduleId] = list.length ? list : [{ name: '', element: '', bonusPct: '' }];
}

/**
 * 将结构化行同步回草稿文本。
 *
 * @param moduleId - 轮换模块 id
 * @returns 无返回值
 */
function syncRowsToDraft(moduleId: string): void {
  const draft = drafts.value.find((d) => d.moduleId === moduleId);
  if (!draft) return;
  draft.itemsText = (itemRows.value[moduleId] ?? [])
    .map(serializeItemRow)
    .filter(Boolean)
    .join('\n');
}

/**
 * 提交单个轮换表。
 *
 * @param draft - 表单草稿
 * @returns 无返回值
 */
function saveDraft(draft: Draft): void {
  if (!showRaw.value[draft.moduleId]) {
    syncRowsToDraft(draft.moduleId);
  }
  const items = draft.itemsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  emit('save', draft.moduleId, {
    epochIso: draft.epochIso,
    periodDays: Number(draft.periodDays),
    items,
  });
}
</script>

<template>
  <div class="space-y-4">
    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="信条 / 终幕轮换表"
      description="列表即当期货架全部武器（平级展示）。可选 Valence：元素 + 百分比。epochIso / periodDays（通常 4）控制刷新倒计时。"
    />

    <UCard v-for="draft in drafts" :key="draft.moduleId">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-semibold text-highlighted">
            <code>{{ draft.moduleId }}</code>
          </h2>
          <div class="flex gap-2">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              :icon="showRaw[draft.moduleId] ? 'i-lucide-table' : 'i-lucide-file-text'"
              @click="
                showRaw[draft.moduleId] = !showRaw[draft.moduleId];
                if (!showRaw[draft.moduleId]) {
                  itemRows[draft.moduleId] = draft.itemsText
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map(parseItemLine);
                } else {
                  syncRowsToDraft(draft.moduleId);
                }
              "
            >
              {{ showRaw[draft.moduleId] ? '表格编辑' : '原始文本' }}
            </UButton>
            <UButton size="sm" icon="i-lucide-save" @click="saveDraft(draft)"> 保存 </UButton>
          </div>
        </div>
      </template>

      <div class="mb-4 grid gap-4 sm:grid-cols-2">
        <UFormField label="epochIso" description="周期起点（ISO 8601）">
          <UInput v-model="draft.epochIso" class="w-full font-mono text-sm" />
        </UFormField>
        <UFormField label="periodDays" description="通常为 4">
          <UInput
            v-model.number="draft.periodDays"
            type="number"
            :min="1"
            class="w-full max-w-[8rem]"
          />
        </UFormField>
      </div>

      <div v-if="!showRaw[draft.moduleId]" class="space-y-3">
        <div
          v-for="(row, idx) in itemRows[draft.moduleId] ?? []"
          :key="`${draft.moduleId}-${idx}`"
          class="grid gap-2 rounded-lg border border-default p-3 sm:grid-cols-[1fr_9rem_6rem_auto]"
        >
          <UFormField label="武器名">
            <UInput v-model="row.name" class="w-full" placeholder="Tenet Agendus" />
          </UFormField>
          <UFormField label="元素">
            <USelect v-model="row.element" :items="elementItems" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="加成 %">
            <UInput v-model="row.bonusPct" class="w-full" placeholder="45.2" />
          </UFormField>
          <div class="flex items-end">
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="删除行"
              @click="removeItemRow(draft.moduleId, idx)"
            />
          </div>
        </div>
        <UButton
          size="sm"
          color="neutral"
          variant="soft"
          icon="i-lucide-plus"
          @click="addItemRow(draft.moduleId)"
        >
          添加武器
        </UButton>
      </div>

      <UFormField v-else label="items（每行一武器，可选 | 元素 | 百分比）">
        <UTextarea v-model="draft.itemsText" :rows="8" class="w-full font-mono text-sm" />
      </UFormField>
    </UCard>
  </div>
</template>
