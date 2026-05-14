import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import type { ExpenseInput } from '../lib/expense'
import { ExpenseForm } from './ExpenseForm'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

describe('ExpenseForm — add mode (no initial, clearOnSubmit)', () => {
  it('calls onSubmit once with correct ExpenseInput shape on submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} clearOnSubmit />,
    )

    await user.type(screen.getByLabelText(/amount/i), '12.5')
    await user.type(screen.getByLabelText(/description/i), 'Coffee')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      amount: 12.5,
      description: 'Coffee',
      date: today(),
    })
  })

  it('clears amount and description after submit but retains date', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} clearOnSubmit />,
    )

    const amount = screen.getByLabelText(/amount/i) as HTMLInputElement
    const description = screen.getByLabelText(/description/i) as HTMLInputElement
    const date = screen.getByLabelText(/date/i) as HTMLInputElement

    await user.clear(date)
    await user.type(date, '2026-01-15')
    await user.type(amount, '40')
    await user.type(description, 'Groceries')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(amount.value).toBe('')
    expect(description.value).toBe('')
    expect(date.value).toBe('2026-01-15')
  })

  it('does not call onSubmit and shows validation message when amount is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} clearOnSubmit />,
    )

    await user.type(screen.getByLabelText(/description/i), 'No amount')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onSubmit and shows validation message when description is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} clearOnSubmit />,
    )

    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onSubmit and shows validation message when description is whitespace-only', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} clearOnSubmit />,
    )

    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.type(screen.getByLabelText(/description/i), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onSubmit and shows validation message when the date is cleared', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} clearOnSubmit />,
    )

    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.type(screen.getByLabelText(/description/i), 'No date')
    await user.clear(screen.getByLabelText(/date/i))
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('defaults the date input to today on mount', () => {
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={vi.fn()} clearOnSubmit />,
    )
    const date = screen.getByLabelText(/date/i) as HTMLInputElement
    expect(date.value).toBe(today())
  })

  it('does not render a Cancel button when onCancel is absent', () => {
    render(
      <ExpenseForm submitLabel="Add expense" onSubmit={vi.fn()} clearOnSubmit />,
    )
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })
})

describe('ExpenseForm — edit mode (initial given, onCancel given)', () => {
  const initial: ExpenseInput = {
    amount: 12.5,
    description: 'Coffee',
    date: '2026-05-14',
  }

  it('pre-fills the inputs from initial', () => {
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Amount')).toHaveValue(12.5)
    expect(screen.getByLabelText('Description')).toHaveValue('Coffee')
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-14')
  })

  it('calls onSubmit with the edited input on valid submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    const amount = screen.getByLabelText('Amount')
    await user.clear(amount)
    await user.type(amount, '20')

    const description = screen.getByLabelText('Description')
    await user.clear(description)
    await user.type(description, 'Tea')

    const date = screen.getByLabelText('Date')
    await user.clear(date)
    await user.type(date, '2026-05-15')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
    })
  })

  it('trims the description before calling onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    const description = screen.getByLabelText('Description')
    await user.clear(description)
    await user.type(description, '  Tea  ')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 12.5,
      description: 'Tea',
      date: '2026-05-14',
    })
  })

  it('does not clear the fields after a successful submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    const amount = screen.getByLabelText('Amount') as HTMLInputElement
    const description = screen.getByLabelText('Description') as HTMLInputElement
    const date = screen.getByLabelText('Date') as HTMLInputElement

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(amount.value).toBe('12.5')
    expect(description.value).toBe('Coffee')
    expect(date.value).toBe('2026-05-14')
  })

  it('shows an alert and does not call onSubmit when amount is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Amount'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows an alert and does not call onSubmit when description is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Description'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows an alert and does not call onSubmit when date is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Date'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls onCancel when the Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders a type="button" Cancel button', () => {
    render(
      <ExpenseForm
        initial={initial}
        submitLabel="Save"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    expect(cancel).toHaveAttribute('type', 'button')
  })
})
