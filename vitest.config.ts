// Add Vitest config to enable tsconfig path aliases and set defaults
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    reporters: ['default'],
    watch: false,
    globals: true,
  },
})
