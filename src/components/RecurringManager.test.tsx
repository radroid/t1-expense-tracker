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

  // P7.A — inline edit affordance
  describe('inline edit mode', () => {
    it('renders an Edit button per row when not editing', () => {
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
      expect(
        screen.getByRole('button', { name: /edit rent/i }),
      ).toBeInTheDocument()
    })

    it('clicking Edit opens an inline edit form prefilled with row values', async () => {
      const user = userEvent.setup()
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
      await user.click(screen.getByRole('button', { name: /edit rent/i }))
      // Edit form inputs are present (use label-based getters scoped to the edit form).
      const descInput = screen.getByLabelText(
        /edit description/i,
      ) as HTMLInputElement
      const amountInput = screen.getByLabelText(
        /edit amount/i,
      ) as HTMLInputElement
      const dayInput = screen.getByLabelText(
        /edit day of month/i,
      ) as HTMLInputElement
      expect(descInput.value).toBe('Rent')
      expect(amountInput.value).toBe('1500')
      expect(dayInput.value).toBe('1')
      // Save + Cancel render; Edit + Delete buttons for this row are gone.
      expect(
        screen.getByRole('button', { name: /save/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /edit rent/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /delete rent/i }),
      ).not.toBeInTheDocument()
    })

    it('Save calls onUpdate with existing + cleaned input then exits edit mode', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn().mockResolvedValue(true)
      render(
        <RecurringManager
          templates={[template]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onUpdate={onUpdate}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      await user.click(screen.getByRole('button', { name: /edit rent/i }))
      const descInput = screen.getByLabelText(/edit description/i)
      await user.clear(descInput)
      await user.type(descInput, 'Rent (new)')
      const amountInput = screen.getByLabelText(/edit amount/i)
      await user.clear(amountInput)
      await user.type(amountInput, '1600')
      const dayInput = screen.getByLabelText(/edit day of month/i)
      await user.clear(dayInput)
      await user.type(dayInput, '5')
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(onUpdate.mock.calls[0][0]).toEqual(template)
      expect(onUpdate.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          description: 'Rent (new)',
          amount: 1600,
          frequency: 'monthly',
          dayOfMonth: 5,
        }),
      )
      // Exits edit mode — Edit button is back.
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /edit rent/i }),
        ).toBeInTheDocument(),
      )
    })

    it('Cancel discards changes and exits edit mode without calling onUpdate', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn().mockResolvedValue(true)
      render(
        <RecurringManager
          templates={[template]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onUpdate={onUpdate}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      await user.click(screen.getByRole('button', { name: /edit rent/i }))
      const descInput = screen.getByLabelText(/edit description/i)
      await user.clear(descInput)
      await user.type(descInput, 'Discarded')
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onUpdate).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', { name: /edit rent/i }),
      ).toBeInTheDocument()
      // Re-entering edit mode shows the original value, not the cancelled draft.
      await user.click(screen.getByRole('button', { name: /edit rent/i }))
      expect(
        (screen.getByLabelText(/edit description/i) as HTMLInputElement).value,
      ).toBe('Rent')
    })

    it('validation failure during edit keeps edit mode open and marks the bad input aria-invalid', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn().mockResolvedValue(true)
      render(
        <RecurringManager
          templates={[template]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onUpdate={onUpdate}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      await user.click(screen.getByRole('button', { name: /edit rent/i }))
      const descInput = screen.getByLabelText(/edit description/i)
      await user.clear(descInput)
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onUpdate).not.toHaveBeenCalled()
      // Still in edit mode (Save button still visible).
      expect(
        screen.getByRole('button', { name: /save/i }),
      ).toBeInTheDocument()
      expect(descInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('keeps edit mode open when onUpdate resolves false', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn().mockResolvedValue(false)
      render(
        <RecurringManager
          templates={[template]}
          categories={categories}
          onAdd={vi.fn().mockResolvedValue(true)}
          onAddMany={vi
            .fn()
            .mockResolvedValue({ added: 0, skipped: 0, errors: [] })}
          onUpdate={onUpdate}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      )
      await user.click(screen.getByRole('button', { name: /edit rent/i }))
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onUpdate).toHaveBeenCalledTimes(1)
      // Still in edit mode — user can adjust and try again.
      expect(
        screen.getByRole('button', { name: /save/i }),
      ).toBeInTheDocument()
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
