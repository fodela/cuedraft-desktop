import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/__tests__/renderer/**/*.test.tsx', 'happy-dom'],
      ['src/__tests__/renderer/**/*.test.ts', 'happy-dom'],
    ],
    globalSetup: ['src/__tests__/setup/globalSetup.ts'],
    setupFiles: ['src/__tests__/setup/vitestSetup.ts'],
    alias: {
      electron: resolve(__dirname, 'src/__tests__/__mocks__/electron.ts'),
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/main/**/*.ts',
        'src/shared/**/*.ts',
        'src/renderer/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/main/index.ts',
        'src/main/tray.ts',
        'src/main/windows.ts',
        'src/**/main.tsx',
        'src/**/*.d.ts',
      ],
      reporter: ['text', 'lcov'],
    },
  },
})
