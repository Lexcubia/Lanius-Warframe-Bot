/**
 * Lanius 公开站与管理壳的 Nuxt 配置。
 */
export default defineNuxtConfig({
  compatibilityDate: '2025-10-01',
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  // Nuxt UI 内置 color-mode：公开站不跟系统暗色，避免与暖底 anime 冲突
  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'lanius.nuxt-color-mode',
  },
  css: [
    '@lanius/ui/tokens.css',
    '~/assets/css/main.css',
    '~/assets/css/anime.css',
    '~/assets/css/admin.css',
  ],
  app: {
    head: {
      title: 'Lanius',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;700&family=Source+Sans+3:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap',
        },
      ],
      // 公开站固定亮色暖底；仅 Admin 路径才恢复本地暗色偏好
      script: [
        {
          key: 'lanius-color-mode',
          innerHTML:
            "(function(){try{var p=location.pathname;var admin=p==='/admin'||/\\/admin\\/?$/.test(p);if(!admin){document.documentElement.classList.remove('theme-dark');document.documentElement.style.colorScheme='light';document.documentElement.classList.add('theme-anime-boot');return;}var m=localStorage.getItem('lanius.colorMode');var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('theme-dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();",
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
