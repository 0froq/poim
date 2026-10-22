import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const root = fileURLToPath(new URL('..', import.meta.url))

// Keep tool configuration outside the root so Nuxt owns its Vite configuration.
export default defineConfig({
  root,
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('../app', import.meta.url)),
      '@': fileURLToPath(new URL('../app', import.meta.url)),
      '~~': root,
      '@@': root,
    },
  },
  test: {
    environment: 'happy-dom',
    // Let .css?raw go through Vite's asset pipeline instead of vitest's CSS stub.
    css: true,
    include: [
      'shared/**/*.test.ts',
      'app/**/*.test.ts',
      'server/**/*.test.ts',
      'worker/**/*.test.ts',
    ],
  },
})
