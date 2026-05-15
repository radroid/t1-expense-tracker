import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  loadTheme,
  saveTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './theme'

// The in-memory localStorage shim is installed in src/test/setup.ts so every
// test file can rely on it without the Node-25 ritual.

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
