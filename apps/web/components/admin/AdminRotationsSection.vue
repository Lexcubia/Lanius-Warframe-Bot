<script setup lang="ts">
const props = defineProps<{
  /** 轮换表原始行（snake_case） */
  schedules: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{
  save: [
    moduleId: string,
    body: { epochIso: string; periodDays: number; items: string[] },
  ];
}>();

type Draft = {
  moduleId: string;
  epochIso: string;
  periodDays: number;
  itemsText: string;
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
    const element =
      typeof row.element === 'string' && row.element.trim()
        ? row.element.trim()
        : '';
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
  },
  { immediate: true },
);

/**
 * 提交单个轮换表。
 *
 * @param draft - 表单草稿
 * @returns 无返回值
 */
function saveDraft(draft: Draft): void {
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
  <section class="admin-panel">
    <h2 class="admin-panel__title">轮换表（信条 / 终幕）</h2>
    <p class="admin-panel__hint">
      列表即<strong>当期货架全部武器</strong>（平级展示，无主次）。每行一件；可选
      Valence：
      <code>Tenet Agendus | heat | 45.2</code>
      （元素：impact/heat/cold/electricity/toxin/magnetic/radiation）。epochIso /
      periodDays（通常 4）仅控制刷新倒计时。官方 worldState
      不含商店随机加成，百分比需人工按游戏内/wiki 更新。
    </p>
    <div
      v-for="draft in drafts"
      :key="draft.moduleId"
      class="admin-panel"
      style="margin-top: 0.85rem; box-shadow: none"
    >
      <h3 class="admin-panel__title" style="font-size: 0.98rem">
        <code>{{ draft.moduleId }}</code>
      </h3>
      <label class="admin-field"
        >epochIso
        <input v-model="draft.epochIso" class="admin-input" />
      </label>
      <label class="admin-field"
        >periodDays
        <input
          v-model.number="draft.periodDays"
          class="admin-input"
          type="number"
          min="1"
          style="max-width: 8rem"
        />
      </label>
      <label class="admin-field"
        >items（每行一武器，可选 | 元素 | 百分比）
        <textarea v-model="draft.itemsText" class="admin-textarea" rows="8" />
      </label>
      <div class="admin-actions">
        <button
          type="button"
          class="admin-btn admin-btn--primary"
          @click="saveDraft(draft)"
        >
          保存
        </button>
      </div>
    </div>
  </section>
</template>
