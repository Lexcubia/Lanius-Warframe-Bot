<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();
</script>

<template>
  <section class="about">
    <p class="eyebrow">{{ t('about.eyebrow') }}</p>
    <h1>{{ t('about.title') }}</h1>
    <p class="lead">{{ t('about.lead') }}</p>

    <div class="grid">
      <article class="card">
        <h2>{{ t('about.archTitle') }}</h2>
        <p>{{ t('about.archBody') }}</p>
      </article>
      <article class="card">
        <h2>{{ t('about.scopeTitle') }}</h2>
        <p>{{ t('about.scopeBody') }}</p>
      </article>
      <article class="card">
        <h2>{{ t('about.qqTitle') }}</h2>
        <p>{{ t('about.qqBody') }}</p>
        <NuxtLink :to="{ path: localePath('/'), hash: '#mod-subscribe' }">
          {{ t('about.toSubscribe') }}
        </NuxtLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about {
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
  margin: 0 0 1.4rem;
  color: var(--anime-muted, #6b7385);
  max-width: 40rem;
  line-height: 1.55;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
}
.card {
  padding: 1.15rem 1.25rem;
  border-radius: var(--anime-radius, 22px);
  border: 1px solid var(--anime-line, rgba(90, 120, 160, 0.16));
  background: var(--anime-panel, #fff);
  box-shadow: var(--anime-shadow);
}
.card h2 {
  margin: 0 0 0.45rem;
  font-family: var(--anime-font-display, inherit);
  font-size: 1.1rem;
}
.card p {
  margin: 0;
  color: var(--anime-muted, #6b7385);
  line-height: 1.55;
  font-size: 0.95rem;
}
.card a {
  display: inline-flex;
  margin-top: 0.75rem;
  font-weight: 700;
  color: var(--anime-sky-deep, #2f8fc4);
}
</style>
