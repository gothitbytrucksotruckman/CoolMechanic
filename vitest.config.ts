import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['contract/**/*.test.ts', 'mock/**/*.test.ts', 'app/**/*.test.{ts,tsx}'],
  },
})
