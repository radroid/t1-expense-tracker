import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

// Smoke test — confirms the test runner + jsdom + RTL pipeline works.
// The autonomous loop replaces/extends this with real feature tests (TDD).
describe('App', () => {
  it('renders', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
