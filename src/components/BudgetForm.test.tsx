import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BudgetForm } from './BudgetForm'

describe('BudgetForm', () => {
  it('renders with the current amount pre-filled', () => {
    render(
      <BudgetForm
        month="2026-05"
        currentAmount={500}
        onSubmit={vi.fn()}
      />,
    )
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement
    expect(input.value).toBe('500')
  })

  it('renders empty when no currentAmount is supplied', () => {
    render(
      <BudgetForm
        month="2026-05"
        currentAmount={undefined}
        onSubmit={vi.fn()}
      />,
    )
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('fires onSubmit(month, parsed) with a valid number', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <BudgetForm
        month="2026-05"
        currentAmount={undefined}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/amount/i), '750.5')
    await user.click(screen.getByRole('button', { name: /set budget/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('2026-05', 750.5)
  })

  it('does not call onSubmit and shows error when input is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <BudgetForm
        month="2026-05"
        currentAmount={undefined}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: /set budget/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onSubmit and shows error for zero', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <BudgetForm
        month="2026-05"
        currentAmount={undefined}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/amount/i), '0')
    await user.click(screen.getByRole('button', { name: /set budget/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not call onSubmit and shows error for negative', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <BudgetForm
        month="2026-05"
        currentAmount={undefined}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/amount/i), '-50')
    await user.click(screen.getByRole('button', { name: /set budget/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
