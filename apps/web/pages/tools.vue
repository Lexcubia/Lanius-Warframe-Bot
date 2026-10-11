<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();
</script>

<template>
  <section class="tools">
    <p class="eyebrow">{{ t('tools.eyebrow') }}</p>
    <h1>{{ t('tools.title') }}</h1>
    <p class="lead">{{ t('tools.lead') }}</p>
    <div class="card">
      <p>{{ t('tools.body') }}</p>
      <NuxtLink class="back" :to="localePath('/')">{{ t('tools.backHome') }}</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.tools {
  max-width: 40rem;
  padding-top: 1rem;
}
.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--anime-coral, #ff7a6e);
  font-family: var(--anime-font-display, inherit);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
}
h1 {
  margin: 0 0 0.55rem;
  font-family: var(--anime-font-display, inherit);
  font-size: clamp(1.8rem, 4vw, 2.5rem);
}
.lead {
  margin: 0 0 1.25rem;
  color: var(--anime-muted, #6b7385);
  line-height: 1.55;
}
.card {
  padding: 1.25rem 1.35rem;
  border-radius: var(--anime-radius, 22px);
  border: 1px solid var(--anime-line, rgba(90, 120, 160, 0.16));
  background: var(--anime-panel, #fff);
  box-shadow: var(--anime-shadow);
}
.card p {
  margin: 0 0 1rem;
  color: var(--anime-muted, #6b7385);
  line-height: 1.55;
}
.back {
  display: inline-flex;
  font-weight: 700;
  color: var(--anime-sky-deep, #2f8fc4);
}
</style>
