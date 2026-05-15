import { render, screen } from '@testing-library/react'
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
})
