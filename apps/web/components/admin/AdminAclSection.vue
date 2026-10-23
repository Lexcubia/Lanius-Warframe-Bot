<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const props = defineProps<{
  /** ACL 规则（DB snake_case） */
  rules: Array<Record<string, unknown>>;
  /** 可选模块 id（便于选择） */
  moduleIds?: string[];
}>();

const emit = defineEmits<{
  create: [
    body: {
      scope: string;
      targetId?: string;
      subject: string;
      effect: string;
      moduleId?: string;
      userOpenid?: string;
    },
  ];
  remove: [id: number];
}>();

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');

const createOpen = ref(false);
const confirmOpen = ref(false);
const pendingDeleteId = ref<number | null>(null);

const form = reactive({
  scope: 'global',
  targetId: '',
  subject: 'module',
  effect: 'allow',
  moduleId: 'fissures',
  userOpenid: '',
});

/**
 * scope 选项。
 */
const scopeItems = [
  { label: 'global', value: 'global' },
  { label: 'group', value: 'group' },
  { label: 'c2c', value: 'c2c' },
];

/**
 * subject 选项。
 */
const subjectItems = [
  { label: 'module', value: 'module' },
  { label: 'user', value: 'user' },
];

/**
 * effect 选项。
 */
const effectItems = [
  { label: 'allow', value: 'allow' },
  { label: 'deny', value: 'deny' },
];

/**
 * 模块下拉。
 */
const moduleItems = computed(() =>
  (props.moduleIds?.length ? props.moduleIds : ['fissures', 'worldstate', 'market']).map((id) => ({
    label: id,
    value: id,
  })),
);

/**
 * 表格列。
 */
const columns: TableColumn<Record<string, unknown>>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'scope', header: 'Scope' },
  {
    accessorKey: 'target_id',
    header: 'Target',
    cell: ({ row }) => String(row.original.target_id || '—'),
  },
  { accessorKey: 'subject', header: 'Subject' },
  {
    accessorKey: 'effect',
    header: 'Effect',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.effect === 'allow' ? 'success' : 'error',
          variant: 'subtle',
        },
        () => String(row.original.effect),
      ),
  },
  {
    id: 'targetSubject',
    header: 'Module / User',
    cell: ({ row }) =>
      h(
        'code',
        { class: 'text-sm' },
        String(row.original.module_id || row.original.user_openid || '—'),
      ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        UButton,
        {
          size: 'xs',
          color: 'error',
          variant: 'soft',
          icon: 'i-lucide-trash-2',
          onClick: () => askRemove(Number(row.original.id)),
        },
        () => '删除',
      ),
  },
];

/**
 * 打开删除确认。
 *
 * @param id - 规则 id
 * @returns 无返回值
 */
function askRemove(id: number): void {
  pendingDeleteId.value = id;
  confirmOpen.value = true;
}

/**
 * 确认删除。
 *
 * @returns 无返回值
 */
function confirmRemove(): void {
  if (pendingDeleteId.value != null) {
    emit('remove', pendingDeleteId.value);
  }
  confirmOpen.value = false;
  pendingDeleteId.value = null;
}

/**
 * 提交新增 ACL。
 *
 * @returns 无返回值
 */
function onCreate(): void {
  const body: {
    scope: string;
    targetId?: string;
    subject: string;
    effect: string;
    moduleId?: string;
    userOpenid?: string;
  } = {
    scope: form.scope,
    subject: form.subject,
    effect: form.effect,
  };
  if (form.scope !== 'global' && form.targetId.trim()) {
    body.targetId = form.targetId.trim();
  }
  if (form.subject === 'module') {
    body.moduleId = form.moduleId.trim();
  } else {
    body.userOpenid = form.userOpenid.trim();
  }
  emit('create', body);
  createOpen.value = false;
}
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-highlighted">ACL 规则</h2>
            <p class="mt-1 text-sm text-muted">
              共 {{ rules.length }} 条。按 scope / subject 控制模块或用户访问。
            </p>
          </div>
          <UButton icon="i-lucide-plus" @click="createOpen = true"> 新增规则 </UButton>
        </div>
      </template>

      <UTable v-if="rules.length" :data="rules" :columns="columns" class="w-full" />
      <UEmpty
        v-else
        icon="i-lucide-shield"
        title="暂无规则"
        description="点击「新增规则」创建第一条 ACL。"
      />
    </UCard>

    <UModal v-model:open="createOpen" title="新增 ACL 规则">
      <template #body>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Scope">
            <USelect v-model="form.scope" :items="scopeItems" value-key="value" class="w-full" />
          </UFormField>
          <UFormField v-if="form.scope !== 'global'" label="Target ID">
            <UInput v-model="form.targetId" class="w-full" />
          </UFormField>
          <UFormField label="Subject">
            <USelect
              v-model="form.subject"
              :items="subjectItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Effect">
            <USelect v-model="form.effect" :items="effectItems" value-key="value" class="w-full" />
          </UFormField>
          <UFormField v-if="form.subject === 'module'" label="ModuleId">
            <USelect
              v-model="form.moduleId"
              :items="moduleItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField v-else label="User OpenID">
            <UInput v-model="form.userOpenid" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="createOpen = false"> 取消 </UButton>
          <UButton icon="i-lucide-check" @click="onCreate">创建</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" title="确认删除">
      <template #body>
        <p class="text-sm text-muted">删除 ACL #{{ pendingDeleteId }}？此操作不可撤销。</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="confirmOpen = false"> 取消 </UButton>
          <UButton color="error" icon="i-lucide-trash-2" @click="confirmRemove"> 删除 </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
