export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'expense-tracker:theme'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Reads the stored theme. Returns 'light' if unset or invalid.
 */
export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(raw) ? raw : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Persists the theme. Best-effort — swallows storage errors (e.g. quota).
 */
export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

/**
 * Mutates document.documentElement[data-theme] to reflect the theme.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

/**
 * Returns the opposite theme.
 */
export function toggleTheme(theme: Theme): Theme {
  return theme === 'light' ? 'dark' : 'light'
}
