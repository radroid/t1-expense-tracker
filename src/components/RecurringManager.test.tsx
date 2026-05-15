import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RecurringManager } from './RecurringManager'
import type { RecurringTemplate } from '../lib/recurring'
import type { Category } from '../lib/category'

const categories: Category[] = [
  { id: 'cat-food', name: 'Food', color: '#ff0000' },
  { id: 'cat-rent', name: 'Housing', color: '#00ff00' },
]

const template: RecurringTemplate = {
  id: 't1',
  description: 'Rent',
  amount: 1500,
  frequency: 'monthly',
  dayOfMonth: 1,
}

describe('RecurringManager', () => {
  it('renders the list of templates', () => {
    render(
      <RecurringManager
        templates={[template]}
        categories={categories}
        onAdd={vi.fn().mockResolvedValue(true)}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )
    expect(screen.getByText(/Rent/)).toBeInTheDocument()
  })

  it('calls onAdd with cleaned input when the form is submitted', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )

    await user.type(screen.getByLabelText('Template description'), 'Gym')
    await user.clear(screen.getByLabelText('Template amount'))
    await user.type(screen.getByLabelText('Template amount'), '50')
    await user.clear(screen.getByLabelText('Day of month'))
    await user.type(screen.getByLabelText('Day of month'), '15')
    await user.click(screen.getByRole('button', { name: /add recurring/i }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Gym',
        amount: 50,
        frequency: 'monthly',
        dayOfMonth: 15,
      }),
    )
  })

  it('shows an inline validation error for empty description', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )

    await user.click(screen.getByRole('button', { name: /add recurring/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows an inline validation error for dayOfMonth out of range', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )
    await user.type(screen.getByLabelText('Template description'), 'Bad')
    await user.clear(screen.getByLabelText('Template amount'))
    await user.type(screen.getByLabelText('Template amount'), '10')
    await user.clear(screen.getByLabelText('Day of month'))
    await user.type(screen.getByLabelText('Day of month'), '31')
    await user.click(screen.getByRole('button', { name: /add recurring/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('forwards selected categoryId to onAdd', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )

    await user.type(screen.getByLabelText('Template description'), 'Rent')
    await user.clear(screen.getByLabelText('Template amount'))
    await user.type(screen.getByLabelText('Template amount'), '1500')
    await user.clear(screen.getByLabelText('Day of month'))
    await user.type(screen.getByLabelText('Day of month'), '1')
    await user.selectOptions(
      screen.getByLabelText('Template category'),
      'cat-rent',
    )
    await user.click(screen.getByRole('button', { name: /add recurring/i }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-rent' }),
    )
  })

  it('calls onDelete with the template id when the delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[template]}
        categories={categories}
        onAdd={vi.fn().mockResolvedValue(true)}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={onDelete}
      />,
    )

    await user.click(screen.getByRole('button', { name: /delete rent/i }))
    expect(onDelete).toHaveBeenCalledWith('t1')
  })

  it('clears the description input after a successful add', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )

    const desc = screen.getByLabelText('Template description') as HTMLInputElement
    await user.type(desc, 'Gym')
    await user.clear(screen.getByLabelText('Template amount'))
    await user.type(screen.getByLabelText('Template amount'), '50')
    await user.clear(screen.getByLabelText('Day of month'))
    await user.type(screen.getByLabelText('Day of month'), '15')
    await user.click(screen.getByRole('button', { name: /add recurring/i }))

    expect(desc.value).toBe('')
  })

  it('does NOT clear the form when onAdd resolves false', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(false)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )

    const desc = screen.getByLabelText('Template description') as HTMLInputElement
    await user.type(desc, 'Gym')
    await user.clear(screen.getByLabelText('Template amount'))
    await user.type(screen.getByLabelText('Template amount'), '50')
    await user.clear(screen.getByLabelText('Day of month'))
    await user.type(screen.getByLabelText('Day of month'), '15')
    await user.click(screen.getByRole('button', { name: /add recurring/i }))

    // Form input is preserved so the user can fix any upstream-surfaced
    // problem and re-submit without retyping.
    expect(desc.value).toBe('Gym')
  })

  it('renders the export + import controls alongside the form', () => {
    render(
      <RecurringManager
        templates={[template]}
        categories={categories}
        onAdd={vi.fn().mockResolvedValue(true)}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )
    // Both new buttons are present, and the existing form is still here.
    expect(
      screen.getByRole('button', { name: /export.*template/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/import.*template/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add recurring/i }),
    ).toBeInTheDocument()
  })

  it('wires the import file-picker to onAddMany', async () => {
    const onAddMany = vi
      .fn()
      .mockResolvedValue({ added: 1, skipped: 0, errors: [] })
    const user = userEvent.setup()
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={vi.fn().mockResolvedValue(true)}
        onAddMany={onAddMany}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )

    const fileInput = screen.getByLabelText(
      /import.*template/i,
    ) as HTMLInputElement
    const text = 'description,amount,dayOfMonth,categoryId\nRent,1500,1,\n'
    await user.upload(fileInput, new File([text], 'r.csv', { type: 'text/csv' }))

    await waitFor(() => expect(onAddMany).toHaveBeenCalledTimes(1))
    expect(onAddMany.mock.calls[0][0]).toEqual([
      {
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ])
  })

  // a11y-P1 TD.18 — form-error association across description/amount/dayOfMonth.
  describe('a11y form-error association', () => {
    it('marks the description input aria-invalid when description validation fails', async () => {
      const user = userEvent.setup()
      render(
        <RecurringManager
          templates={[]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      await user.click(screen.getByRole('button', { name: /add recurring/i }))
      expect(screen.getByLabelText('Template description')).toHaveAttribute(
        'aria-invalid',
        'true',
      )
      expect(screen.getByLabelText('Template amount')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      )
    })

    it('marks the dayOfMonth input aria-invalid when day validation fails', async () => {
      const user = userEvent.setup()
      render(
        <RecurringManager
          templates={[]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      await user.type(screen.getByLabelText('Template description'), 'Bad')
      await user.clear(screen.getByLabelText('Template amount'))
      await user.type(screen.getByLabelText('Template amount'), '10')
      await user.clear(screen.getByLabelText('Day of month'))
      await user.type(screen.getByLabelText('Day of month'), '31')
      await user.click(screen.getByRole('button', { name: /add recurring/i }))

      expect(screen.getByLabelText('Day of month')).toHaveAttribute(
        'aria-invalid',
        'true',
      )
      expect(screen.getByLabelText('Template description')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      )
      expect(screen.getByLabelText('Template amount')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      )
    })

    it('links each validated input to the FieldError via aria-describedby', () => {
      render(
        <RecurringManager
          templates={[]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      const descDB = screen
        .getByLabelText('Template description')
        .getAttribute('aria-describedby')
      const amountDB = screen
        .getByLabelText('Template amount')
        .getAttribute('aria-describedby')
      const dayDB = screen
        .getByLabelText('Day of month')
        .getAttribute('aria-describedby')
      expect(descDB).not.toBeNull()
      expect(descDB).toBe(amountDB)
      expect(descDB).toBe(dayDB)
      expect(document.getElementById(descDB!)).not.toBeNull()
    })
  })

  it('shows an inline validation error for non-positive amount', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(
      <RecurringManager
        templates={[]}
        categories={categories}
        onAdd={onAdd}
        onAddMany={vi
          .fn()
          .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    )
    await user.type(screen.getByLabelText('Template description'), 'Bad')
    await user.clear(screen.getByLabelText('Template amount'))
    await user.type(screen.getByLabelText('Template amount'), '0')
    await user.click(screen.getByRole('button', { name: /add recurring/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })
})
