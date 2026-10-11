<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();
</script>

<template>
  <section class="page">
    <header class="page__header">
      <p class="eyebrow">{{ t('subscribe.eyebrow') }}</p>
      <h1>{{ t('subscribe.title') }}</h1>
      <p class="intro">{{ t('subscribe.intro') }}</p>
    </header>

    <article class="panel">
      <h2>{{ t('subscribe.qqTitle') }}</h2>
      <p>{{ t('subscribe.qqBody') }}</p>
      <ul>
        <li><code>/订阅 裂隙</code></li>
        <li><code>/订阅 虚空商人</code></li>
        <li><code>/订阅 瓦奇娅</code></li>
        <li><code>/订阅 信条轮换</code> / <code>/订阅 终幕轮换</code></li>
        <li><code>/取消订阅 …</code></li>
      </ul>
      <p class="note">{{ t('subscribe.webNote') }}</p>
      <NuxtLink class="link" :to="localePath('/help')">
        {{ t('subscribe.toHelp') }}
      </NuxtLink>
    </article>
  </section>
</template>

<style scoped>
.page__header {
  margin-bottom: 1.25rem;
}
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--lanius-accent-dim);
  font-family: var(--lanius-font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
}
h1 {
  margin: 0 0 0.5rem;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: clamp(1.8rem, 4vw, 2.4rem);
}
.intro {
  margin: 0;
  color: var(--lanius-text-muted);
  max-width: 40rem;
  line-height: 1.55;
}
.panel {
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--lanius-border);
  border-radius: 14px;
  background: linear-gradient(165deg, var(--lanius-panel), var(--lanius-panel-raised));
  max-width: 40rem;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.panel h2 {
  margin: 0 0 0.55rem;
  font-size: 1.1rem;
}
.panel p {
  margin: 0 0 0.75rem;
  color: var(--lanius-text-muted);
  line-height: 1.55;
}
.panel ul {
  margin: 0 0 1rem;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.35rem;
}
.panel code {
  font-family: var(--lanius-font-mono);
  color: var(--lanius-accent-dim);
  background: rgba(78, 183, 232, 0.12);
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  font-size: 0.9rem;
}
.note {
  font-size: 0.9rem;
}
.link {
  color: var(--lanius-accent);
  font-weight: 600;
  transition: color 0.18s ease;
}

@media (hover: hover) {
  .panel:hover {
    border-color: rgba(78, 183, 232, 0.35);
    box-shadow: 0 10px 24px rgba(62, 78, 110, 0.1);
  }

  .link:hover {
    color: var(--lanius-highlight);
  }
}
</style>
