/**
 * Lanius 公开站与管理壳的 Nuxt 配置。
 */
export default defineNuxtConfig({
  compatibilityDate: '2025-10-01',
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['@lanius/ui/tokens.css', '~/assets/css/main.css'],
  app: {
    head: {
      title: 'Lanius',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;700&family=Sora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    /**
     * 服务端 Lanius API 基址（Nitro 代理目标）。
     * 运行时可用 `NUXT_LANIUS_API_BASE` 或构建期 `LANIUS_API_BASE` 覆盖（Docker 内为 `http://api:8787`）。
     */
    laniusApiBase: process.env.LANIUS_API_BASE || 'http://127.0.0.1:8787',
    public: {
      /** 浏览器侧经 Nitro 代理的 API 前缀。 */
      laniusApiPrefix: '/api/lanius',
    },
  },
  i18n: {
    locales: [
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'zh',
    strategy: 'prefix_and_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'lanius_locale',
      redirectOn: 'root',
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  build: {
    transpile: ['@lanius/ui', '@lanius/api', '@lanius/core'],
  },
});
