<script setup lang="ts">
/**
 * 页脚：备案等信息来自 `GET /v1/site`（config/default + config/local），不入库真实备案号。
 */
const api = useLaniusApi();

const { data } = await useAsyncData('site-footer', async () => {
  const envelope = await api.getSite();
  if (!envelope.ok) {
    return { footer: { copyright: '', lines: [] as Array<{ text: string; href?: string }> } };
  }
  return envelope.data;
});

const footer = computed(() => data.value?.footer);
const hasContent = computed(() => {
  const f = footer.value;
  if (!f) {
    return false;
  }
  return Boolean(f.copyright?.trim()) || f.lines.length > 0;
});
</script>

<template>
  <footer v-if="hasContent" class="site-footer">
    <p v-if="footer?.copyright" class="site-footer__copy">{{ footer.copyright }}</p>
    <nav v-if="footer?.lines?.length" class="site-footer__links" aria-label="beian">
      <template v-for="(line, index) in footer.lines" :key="`${line.text}-${index}`">
        <a
          v-if="line.href"
          class="site-footer__link"
          :href="line.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ line.text }}
        </a>
        <span v-else class="site-footer__text">{{ line.text }}</span>
      </template>
    </nav>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
  padding: 1.25rem clamp(1rem, 4vw, 2rem) 1.75rem;
  border-top: 1px solid var(--lanius-border);
  background: rgba(255, 255, 255, 0.65);
  color: var(--lanius-text-muted);
  font-size: 0.8rem;
  text-align: center;
  display: grid;
  gap: 0.45rem;
  max-width: 100%;
  overflow-x: clip;
  word-break: break-word;
}

.site-footer__copy {
  margin: 0;
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem 1rem;
}

.site-footer__link {
  color: var(--lanius-text-muted);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.site-footer__link:hover {
  color: var(--lanius-brand);
}

.site-footer__text {
  color: var(--lanius-text-muted);
}
</style>
