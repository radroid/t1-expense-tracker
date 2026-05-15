import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MonthSwitcher } from './MonthSwitcher'

describe('MonthSwitcher', () => {
  it('renders the current month label', () => {
    render(<MonthSwitcher value="2026-05" onChange={() => {}} />)
    expect(screen.getByText('May 2026')).toBeInTheDocument()
  })

  it('calls onChange with the previous month when prev is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MonthSwitcher value="2026-05" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /previous month/i }))
    expect(onChange).toHaveBeenCalledWith('2026-04')
  })

  it('calls onChange with the next month when next is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MonthSwitcher value="2026-05" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(onChange).toHaveBeenCalledWith('2026-06')
  })

  it('rolls back across a year boundary on prev', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MonthSwitcher value="2026-01" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /previous month/i }))
    expect(onChange).toHaveBeenCalledWith('2025-12')
  })

  it('rolls forward across a year boundary on next', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MonthSwitcher value="2026-12" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(onChange).toHaveBeenCalledWith('2027-01')
  })
})
