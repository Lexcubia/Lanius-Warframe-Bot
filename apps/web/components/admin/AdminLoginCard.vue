<script setup lang="ts">
const username = defineModel<string>('username', { required: true });
const password = defineModel<string>('password', { required: true });

defineProps<{
  /** 登录失败文案 */
  error: string;
  /** 是否提交中 */
  pending?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

/**
 * 触发表单提交。
 *
 * @returns 无返回值
 */
function onSubmit(): void {
  emit('submit');
}
</script>

<template>
  <div class="admin-login">
    <section class="admin-login__card">
      <p class="admin-login__eyebrow">Operations</p>
      <h2 class="admin-login__title">登录管理控制台</h2>
      <p class="admin-login__hint">
        会话使用 HttpOnly cookie；公开导航不展示本入口。
      </p>
      <form @submit.prevent="onSubmit">
        <label class="admin-field"
          >用户名
          <input v-model="username" autocomplete="username" class="admin-input" />
        </label>
        <label class="admin-field"
          >口令
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="admin-input"
          />
        </label>
        <div class="admin-actions">
          <button
            type="submit"
            class="admin-btn admin-btn--primary"
            :disabled="pending"
          >
            {{ pending ? '登录中…' : '登录' }}
          </button>
        </div>
      </form>
      <p v-if="error" class="admin-flash admin-flash--err" style="margin-top: 1rem">
        {{ error }}
      </p>
    </section>
  </div>
</template>
