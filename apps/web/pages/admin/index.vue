<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <strong>Lanius Admin</strong>
      <NuxtLink to="/">← Site</NuxtLink>
    </header>
    <main class="admin__main">
      <h1>{{ t('admin.title') }}</h1>
      <p>{{ t('admin.placeholder') }}</p>
    </main>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  background: var(--lanius-void);
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
}

.admin__bar {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--lanius-border);
}

.admin__main {
  padding: 2rem 1.25rem;
  max-width: 720px;
}

.admin__main h1 {
  font-family: var(--lanius-font-display);
}

.admin__main p {
  color: var(--lanius-text-muted);
}
</style>
