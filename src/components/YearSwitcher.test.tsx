import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { YearSwitcher } from './YearSwitcher'

describe('YearSwitcher', () => {
  it('renders the current year label and prev/next buttons', () => {
    render(<YearSwitcher value="2026" onChange={() => {}} />)
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /previous year/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /next year/i }),
    ).toBeInTheDocument()
  })

  it('exposes an accessible group label', () => {
    render(<YearSwitcher value="2026" onChange={() => {}} />)
    expect(
      screen.getByRole('group', { name: /year switcher/i }),
    ).toBeInTheDocument()
  })

  it('calls onChange with the previous year when prev is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<YearSwitcher value="2026" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /previous year/i }))
    expect(onChange).toHaveBeenCalledWith('2025')
  })

  it('calls onChange with the next year when next is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<YearSwitcher value="2026" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /next year/i }))
    expect(onChange).toHaveBeenCalledWith('2027')
  })
})
