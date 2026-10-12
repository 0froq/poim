import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],
  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    '@fontsource-variable/instrument-sans/index.css',
    '@fontsource-variable/eb-garamond/index.css',
    '@froq/ui/style.css',
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      title: 'poim',
      htmlAttrs: { lang: 'zh-Hans', class: 'ui' },
      meta: [
        { name: 'description', content: '把帖子做成可嵌入的卡片与图片' },
        { name: 'theme-color', content: '#f4f2ec' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      // Picks the shell theme before first paint so the paper never flashes the wrong stock.
      script: [{
        innerHTML: `try{var t=localStorage.getItem('poim-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}`,
        tagPosition: 'head',
      }],
    },
  },
  build: {
    transpile: ['@froq/ui'],
  },
  runtimeConfig: {
    public: {
      siteOrigin: '',
    },
  },
  nitro: {
    // Workers Builds 会设 WORKERS_CI，Nitro 否则会自选 Cloudflare 预设并丢掉
    // worker/。页面全部预渲染；动态 API 在 worker/（见 cloudflare.config.ts）。
    preset: 'static',
    output: {
      publicDir: 'dist',
    },
    // Nitro 的 rollup 没有 Vite 的 asset 插件：shared/utils/presets.ts 里的 *.css?raw
    // 会被当作字面文件路径导致 ENOENT。这里用一个最小 rollup 插件复刻 Vite 的 ?raw 语义
    // （export default "文件内容"），保证 SSR bundle 也能解析出冻结的 CSS 文本。
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
