import { useEffect, useState } from 'react'
import {
  applyTheme,
  loadTheme,
  saveTheme,
  toggleTheme,
  type Theme,
} from '../lib/theme'
import './ThemeToggle.css'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  // Label describes the action — the theme to switch TO.
  const label = theme === 'light' ? 'Dark mode' : 'Light mode'

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      onClick={() => setTheme((t) => toggleTheme(t))}
    >
      {label}
    </button>
  )
}
