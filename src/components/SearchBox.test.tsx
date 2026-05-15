import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SearchBox } from './SearchBox'

describe('SearchBox', () => {
  it('renders with the current value', () => {
    render(<SearchBox value="coffee" onChange={() => {}} />)
    expect((screen.getByLabelText('Search') as HTMLInputElement).value).toBe(
      'coffee',
    )
  })

  it('calls onChange with the typed text', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SearchBox value="" onChange={onChange} />)

    await user.type(screen.getByLabelText('Search'), 'c')
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('shows a clear button when value is non-empty and calls onChange("") on click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SearchBox value="coffee" onChange={onChange} />)

    const clearBtn = screen.getByRole('button', { name: 'Clear search' })
    expect(clearBtn).toBeInTheDocument()

    await user.click(clearBtn)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('hides the clear button when value is empty', () => {
    render(<SearchBox value="" onChange={() => {}} />)
    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument()
  })
})
