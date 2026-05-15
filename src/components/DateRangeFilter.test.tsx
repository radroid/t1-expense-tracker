import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DateRangeFilter } from './DateRangeFilter'

describe('DateRangeFilter', () => {
  it('renders with the current values pre-filled', () => {
    render(
      <DateRangeFilter
        value={{ from: '2026-05-10', to: '2026-05-20' }}
        onChange={() => {}}
      />,
    )
    expect((screen.getByLabelText('From') as HTMLInputElement).value).toBe(
      '2026-05-10',
    )
    expect((screen.getByLabelText('To') as HTMLInputElement).value).toBe(
      '2026-05-20',
    )
  })

  it('fires onChange with the range when both dates are filled', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangeFilter value={null} onChange={onChange} />)

    const from = screen.getByLabelText('From') as HTMLInputElement
    const to = screen.getByLabelText('To') as HTMLInputElement

    await user.type(from, '2026-05-10')
    // Only From filled — should not fire yet.
    expect(onChange).not.toHaveBeenCalled()

    await user.type(to, '2026-05-20')
    expect(onChange).toHaveBeenLastCalledWith({
      from: '2026-05-10',
      to: '2026-05-20',
    })
  })

  it('does not fire onChange when only From is entered', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangeFilter value={null} onChange={onChange} />)

    await user.type(screen.getByLabelText('From'), '2026-05-10')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('fires onChange(null) when the clear button is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DateRangeFilter
        value={{ from: '2026-05-10', to: '2026-05-20' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear date range' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('hides the clear button when value is null', () => {
    render(<DateRangeFilter value={null} onChange={() => {}} />)
    expect(
      screen.queryByRole('button', { name: 'Clear date range' }),
    ).not.toBeInTheDocument()
  })
})
