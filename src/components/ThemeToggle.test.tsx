import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

// Install a working Storage to work around Node 25's broken built-in
// shadowing jsdom's Storage in the vitest jsdom env.
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

describe('<ThemeToggle />', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders with the current theme reflected in its label (light → "Dark mode")', () => {
    render(<ThemeToggle />)
    expect(
      screen.getByRole('button', { name: 'Dark mode' }),
    ).toBeInTheDocument()
  })

  it('clicking toggles to dark — updates data-theme and localStorage', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Dark mode' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('expense-tracker:theme')).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Light mode' }),
    ).toBeInTheDocument()
  })

  it('clicking again toggles back to light', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: 'Dark mode' })
    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Light mode' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('expense-tracker:theme')).toBe('light')
    expect(
      screen.getByRole('button', { name: 'Dark mode' }),
    ).toBeInTheDocument()
  })
})
