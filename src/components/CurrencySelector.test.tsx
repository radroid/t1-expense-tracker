import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CurrencySelector } from './CurrencySelector'

describe('<CurrencySelector />', () => {
  it('renders all four allowlisted currencies as options', () => {
    render(<CurrencySelector value="USD" onChange={() => {}} />)
    const select = screen.getByLabelText('Currency') as HTMLSelectElement
    const options = Array.from(select.querySelectorAll('option')).map(
      (o) => o.value,
    )
    expect(options).toEqual(['USD', 'EUR', 'GBP', 'JPY'])
  })

  it('reflects the current value as the selected option', () => {
    render(<CurrencySelector value="EUR" onChange={() => {}} />)
    const select = screen.getByLabelText('Currency') as HTMLSelectElement
    expect(select.value).toBe('EUR')
  })

  it('calls onChange with the new code when the user picks a different option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencySelector value="USD" onChange={onChange} />)
    await user.selectOptions(screen.getByLabelText('Currency'), 'JPY')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('JPY')
  })

  it('shows a human-readable label for each option (e.g. "US Dollar (USD)")', () => {
    render(<CurrencySelector value="USD" onChange={() => {}} />)
    const select = screen.getByLabelText('Currency') as HTMLSelectElement
    const labels = Array.from(select.querySelectorAll('option')).map(
      (o) => o.textContent,
    )
    expect(labels).toContain('US Dollar (USD)')
    expect(labels).toContain('Japanese Yen (JPY)')
  })
})
