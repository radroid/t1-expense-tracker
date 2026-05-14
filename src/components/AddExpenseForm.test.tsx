import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AddExpenseForm } from './AddExpenseForm'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

describe('AddExpenseForm', () => {
  it('calls onAdd once with correct ExpenseInput shape on submit', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/amount/i), '12.5')
    await user.type(screen.getByLabelText(/description/i), 'Coffee')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({
      amount: 12.5,
      description: 'Coffee',
      date: today(),
    })
  })

  it('clears amount and description after submit but retains date', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddExpenseForm onAdd={onAdd} />)

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

  it('does not call onAdd and shows validation message when amount is blank', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/description/i), 'No amount')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onAdd and shows validation message when description is blank', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onAdd and shows validation message when description is whitespace-only', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.type(screen.getByLabelText(/description/i), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onAdd and shows validation message when the date is cleared', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.type(screen.getByLabelText(/description/i), 'No date')
    await user.clear(screen.getByLabelText(/date/i))
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('defaults the date input to today on mount', () => {
    render(<AddExpenseForm onAdd={vi.fn()} />)
    const date = screen.getByLabelText(/date/i) as HTMLInputElement
    expect(date.value).toBe(today())
  })
})
