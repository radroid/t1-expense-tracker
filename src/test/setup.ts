import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'

// Node 25 ships an experimental webstorage built-in that shadows jsdom's
// Storage and is missing setItem/getItem/clear in the vitest jsdom env.
// Install a working in-memory Storage globally so any test using localStorage
// (theme.ts, currency.ts, hooks, components) Just Works without per-file
// boilerplate. Centralised here as soon as the second consumer (useCurrency)
// landed — was previously installed per-file in theme.test / ThemeToggle.test.
{
  const store = new Map<string, string>()
  const storage: Storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, String(v))
    },
    removeItem: (k) => {
      store.delete(k)
    },
    clear: () => {
      store.clear()
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

// Global isolation: any test that wrote to localStorage gets a clean
// slate on the next test. Keeps test files from inheriting state from
// each other without each one having to remember its own beforeEach.
afterEach(() => {
  localStorage.clear()
})
