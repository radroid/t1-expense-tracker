import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // fake-indexeddb scales poorly under parallel workers — each worker
    // contends on the in-memory IDB scheduler and tests start blowing
    // through findBy's 1000ms default. Run files in series; the suite is
    // still ~20s and tests stay reliable. Revisit if the suite outgrows
    // this trade-off.
    fileParallelism: false,
  },
})
