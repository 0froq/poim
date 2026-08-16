import { readFileSync } from 'node:fs'
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
  nitro: {
    // Nitro 的 rollup 没有 Vite 的 asset 插件：shared/utils/presets.ts 里的 *.css?raw
    // 会被当作字面文件路径导致 ENOENT。这里用一个最小 rollup 插件复刻 Vite 的 ?raw 语义
    // （export default "文件内容"），保证 SSR bundle 也能解析出冻结的 CSS 文本。
    ...(process.env.NITRO_PRESET ? { preset: process.env.NITRO_PRESET } : {}),
    rollupConfig: {
      plugins: [
        {
          name: 'poim-raw-css',
          resolveId(source) {
            if (source.includes('?raw'))
              return source
          },
          load(id) {
            if (!id.includes('?raw'))
              return null
            let file = id.split('?')[0]!
            if (file.startsWith('~'))
              file = fileURLToPath(new URL(`./app${file.slice(1)}`, import.meta.url))
            return `export default ${JSON.stringify(readFileSync(file, 'utf8'))}`
          },
        },
      ],
    },
  },
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
