import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  loadTheme,
  saveTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './theme'

// Node 25 ships an experimental webstorage built-in that shadows jsdom's
// Storage and is missing setItem/getItem/clear in the vitest jsdom env.
// Install a working in-memory Storage so theme code can be exercised.
beforeAll(() => {
  const store = new Map<string, string>()
  const storage: Storage = {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
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
})

describe('theme storage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('loadTheme returns "light" when localStorage is empty', () => {
    expect(loadTheme()).toBe('light')
  })

  it('loadTheme returns the stored theme when set', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(loadTheme()).toBe('dark')
  })

  it('loadTheme returns "light" when localStorage has garbage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    expect(loadTheme()).toBe('light')
  })

  it('saveTheme persists and is round-trip-readable via loadTheme', () => {
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')
    saveTheme('light')
    expect(loadTheme()).toBe('light')
  })

  it('applyTheme sets data-theme on document.documentElement', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('toggleTheme returns the opposite theme', () => {
    expect(toggleTheme('light')).toBe('dark')
    expect(toggleTheme('dark')).toBe('light')
  })
})
