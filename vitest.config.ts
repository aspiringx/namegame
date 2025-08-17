import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    globalSetup: ['src/lib/vitest.setup.ts'],
    include: ['src/lib/**/*.test.ts'],
  },
})
