import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import type { Expense } from '../lib/expense'
import { EditExpenseForm } from './EditExpenseForm'

const expense: Expense = {
  id: 'expense-1',
  amount: 12.5,
  description: 'Coffee',
  date: '2026-05-14',
}

describe('EditExpenseForm', () => {
  it('pre-fills the inputs from the expense', () => {
    render(
      <EditExpenseForm expense={expense} onSave={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.getByLabelText('Amount')).toHaveValue(12.5)
    expect(screen.getByLabelText('Description')).toHaveValue('Coffee')
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-14')
  })

  it('calls onSave with the edited input on valid submit', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <EditExpenseForm expense={expense} onSave={onSave} onCancel={vi.fn()} />,
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

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
    })
  })

  it('trims the description before calling onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <EditExpenseForm expense={expense} onSave={onSave} onCancel={vi.fn()} />,
    )

    const description = screen.getByLabelText('Description')
    await user.clear(description)
    await user.type(description, '  Tea  ')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith({
      amount: 12.5,
      description: 'Tea',
      date: '2026-05-14',
    })
  })

  it('shows an alert and does not call onSave when amount is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <EditExpenseForm expense={expense} onSave={onSave} onCancel={vi.fn()} />,
    )

    await user.clear(screen.getByLabelText('Amount'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows an alert and does not call onSave when description is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <EditExpenseForm expense={expense} onSave={onSave} onCancel={vi.fn()} />,
    )

    await user.clear(screen.getByLabelText('Description'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows an alert and does not call onSave when date is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <EditExpenseForm expense={expense} onSave={onSave} onCancel={vi.fn()} />,
    )

    await user.clear(screen.getByLabelText('Date'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls onCancel when the Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <EditExpenseForm expense={expense} onSave={vi.fn()} onCancel={onCancel} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
