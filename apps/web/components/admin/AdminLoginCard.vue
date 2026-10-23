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
    <UCard class="admin-login__card" :ui="{ body: 'space-y-5' }">
      <div class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wider text-muted">Lanius Operations</p>
        <h1 class="text-2xl font-semibold text-highlighted">登录管理控制台</h1>
        <p class="text-sm text-muted">
          会话使用 HttpOnly cookie；公开导航不展示本入口。口令来自
          <code class="text-xs">config/local/admin.yaml</code>。
        </p>
      </div>

      <UForm class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="用户名" name="username" required>
          <UInput
            v-model="username"
            autocomplete="username"
            placeholder="admin"
            size="lg"
            class="w-full"
            icon="i-lucide-user"
          />
        </UFormField>
        <UFormField label="口令" name="password" required>
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            size="lg"
            class="w-full"
            icon="i-lucide-lock"
          />
        </UFormField>
        <UButton type="submit" block size="lg" :loading="pending" icon="i-lucide-log-in">
          {{ pending ? '登录中…' : '登录' }}
        </UButton>
      </UForm>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="error"
      />
    </UCard>
  </div>
</template>
