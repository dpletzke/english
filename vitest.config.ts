import { defineConfig } from 'vitest/config'

// Run unit tests (src/**/*) in a jsdom environment. Keep e2e/playwright tests separate.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.*', 'src/**/__tests__/**/*'],
    exclude: ['e2e/**'],
    setupFiles: ['test/setupTests.ts'],
  },
})
