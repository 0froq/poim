import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],
  css: [
    '@fontsource-variable/instrument-sans/index.css',
    '@fontsource-variable/eb-garamond/index.css',
    '~/assets/css/tokens.css',
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      title: 'poim',
      htmlAttrs: { lang: 'zh-Hans' },
      meta: [
        { name: 'description', content: '把帖子做成可嵌入的卡片与图片' },
        { name: 'theme-color', content: '#f3f1ec' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      siteOrigin: '',
    },
  },
  nitro: process.env.NITRO_PRESET
    ? { preset: process.env.NITRO_PRESET }
    : {},
  eslint: {
    config: {
      standalone: false,
    },
  },
  compatibilityDate: '2026-08-15',
  alias: {
    '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
  },
})
