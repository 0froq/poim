import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['shared/**/*.test.ts', 'app/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
