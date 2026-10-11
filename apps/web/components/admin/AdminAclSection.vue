<script setup lang="ts">
defineProps<{
  /** ACL 规则（DB snake_case） */
  rules: Array<Record<string, unknown>>;
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

const form = reactive({
  scope: 'global',
  targetId: '',
  subject: 'module',
  effect: 'allow',
  moduleId: 'fissures',
  userOpenid: '',
});

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
}
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">ACL</h2>
    <p class="admin-panel__hint">共 {{ rules.length }} 条规则。按 scope / subject 控制模块或用户访问。</p>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>id</th>
            <th>scope</th>
            <th>target</th>
            <th>subject</th>
            <th>effect</th>
            <th>module / user</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules" :key="String(rule.id)">
            <td>{{ rule.id }}</td>
            <td>{{ rule.scope }}</td>
            <td>{{ rule.target_id || '—' }}</td>
            <td>{{ rule.subject }}</td>
            <td>{{ rule.effect }}</td>
            <td>
              <code>{{ rule.module_id || rule.user_openid || '—' }}</code>
            </td>
            <td>
              <button
                type="button"
                class="admin-btn admin-btn--danger"
                @click="emit('remove', Number(rule.id))"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!rules.length" class="admin-empty">暂无规则。</p>

    <h3 class="admin-panel__title" style="margin-top: 1.25rem; font-size: 1rem">
      新增规则
    </h3>
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.55rem 0.85rem;
        max-width: 720px;
      "
    >
      <label class="admin-field"
        >scope
        <select v-model="form.scope" class="admin-select">
          <option value="global">global</option>
          <option value="group">group</option>
          <option value="c2c">c2c</option>
        </select>
      </label>
      <label v-if="form.scope !== 'global'" class="admin-field"
        >targetId
        <input v-model="form.targetId" class="admin-input" />
      </label>
      <label class="admin-field"
        >subject
        <select v-model="form.subject" class="admin-select">
          <option value="module">module</option>
          <option value="user">user</option>
        </select>
      </label>
      <label class="admin-field"
        >effect
        <select v-model="form.effect" class="admin-select">
          <option value="allow">allow</option>
          <option value="deny">deny</option>
        </select>
      </label>
      <label v-if="form.subject === 'module'" class="admin-field"
        >moduleId
        <input v-model="form.moduleId" class="admin-input" />
      </label>
      <label v-else class="admin-field"
        >userOpenid
        <input v-model="form.userOpenid" class="admin-input" />
      </label>
    </div>
    <div class="admin-actions">
      <button type="button" class="admin-btn admin-btn--primary" @click="onCreate">
        新增
      </button>
    </div>
  </section>
</template>
