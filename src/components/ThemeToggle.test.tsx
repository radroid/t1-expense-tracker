import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'
import { THEME_STORAGE_KEY } from '../lib/theme'

// localStorage shim lives in src/test/setup.ts now.

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

  it('loads a persisted "dark" theme from localStorage on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeToggle />)

    // When persisted is dark, the button offers to switch to light.
    expect(
      screen.getByRole('button', { name: 'Light mode' }),
    ).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('clicking toggles to dark — updates data-theme and localStorage', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Dark mode' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
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
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(
      screen.getByRole('button', { name: 'Dark mode' }),
    ).toBeInTheDocument()
  })
})
