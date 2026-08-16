import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 与 Nuxt 4 的别名一致：~ / @ → app/（srcDir），~~ / @@ → 根目录。
// 让 shared 模块里的 `~/assets/css/card/*.css?raw` 在测试里可解析。
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '@@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // 让 .css?raw 走 Vite 的 asset 管道而不是 vitest 的 CSS stub
    // （默认 css:false 会把 .css 导入替换为空模块，导致 ?raw 拿到 ''）
    css: true,
    include: ['shared/**/*.test.ts', 'app/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
