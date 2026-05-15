import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CategoryBudgetManager } from './CategoryBudgetManager'
import type { Category } from '../lib/category'
import type { CategoryBudget } from '../lib/categoryBudget'

const categories: Category[] = [
  { id: 'cat-food', name: 'Food', color: '#ff0000' },
  { id: 'cat-rent', name: 'Housing', color: '#00ff00' },
]

const budgets: CategoryBudget[] = [
  {
    id: '2026-05|cat-food',
    month: '2026-05',
    categoryId: 'cat-food',
    amount: 200,
  },
]

describe('CategoryBudgetManager', () => {
  it('renders one row per category for the selected month', () => {
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={budgets}
        onSet={vi.fn().mockResolvedValue(true)}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    expect(screen.getByLabelText('Budget for Food')).toBeInTheDocument()
    expect(screen.getByLabelText('Budget for Housing')).toBeInTheDocument()
  })

  it('shows the existing amount for a category that already has a budget', () => {
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={budgets}
        onSet={vi.fn().mockResolvedValue(true)}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    expect(screen.getByText(/Current: \$200\.00/)).toBeInTheDocument()
    expect(screen.getAllByText(/No budget set/)).toHaveLength(1) // Housing
  })

  it('shows the empty-state copy when no categories exist', () => {
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={[]}
        categoryBudgets={[]}
        onSet={vi.fn().mockResolvedValue(true)}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    expect(
      screen.getByText(/Add a category first to set a per-category budget/i),
    ).toBeInTheDocument()
  })

  it('calls onSet with (month, categoryId, amount) on save', async () => {
    const user = userEvent.setup()
    const onSet = vi.fn().mockResolvedValue(true)
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={[]}
        onSet={onSet}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    await user.type(screen.getByLabelText('Budget for Food'), '150')
    await user.click(screen.getByLabelText('Save budget for Food'))

    expect(onSet).toHaveBeenCalledWith('2026-05', 'cat-food', 150)
  })

  it('shows an inline validation error for an empty amount', async () => {
    const user = userEvent.setup()
    const onSet = vi.fn().mockResolvedValue(true)
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={[]}
        onSet={onSet}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    await user.click(screen.getByLabelText('Save budget for Food'))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onSet).not.toHaveBeenCalled()
  })

  it('shows an inline validation error for a non-positive amount', async () => {
    const user = userEvent.setup()
    const onSet = vi.fn().mockResolvedValue(true)
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={[]}
        onSet={onSet}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    await user.type(screen.getByLabelText('Budget for Food'), '-10')
    await user.click(screen.getByLabelText('Save budget for Food'))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onSet).not.toHaveBeenCalled()
  })

  it('calls onRemove with the composite id when Remove is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn().mockResolvedValue(true)
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={budgets}
        onSet={vi.fn().mockResolvedValue(true)}
        onRemove={onRemove}
      />,
    )
    await user.click(screen.getByLabelText('Remove budget for Food'))
    expect(onRemove).toHaveBeenCalledWith('2026-05|cat-food')
  })

  it('does NOT show Remove for categories without an existing budget', () => {
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={budgets}
        onSet={vi.fn().mockResolvedValue(true)}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    expect(screen.getByLabelText('Remove budget for Food')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Remove budget for Housing'),
    ).not.toBeInTheDocument()
  })

  it('clears the draft input after a successful save', async () => {
    const user = userEvent.setup()
    const onSet = vi.fn().mockResolvedValue(true)
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={[]}
        onSet={onSet}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    const input = screen.getByLabelText('Budget for Food') as HTMLInputElement
    await user.type(input, '150')
    await user.click(screen.getByLabelText('Save budget for Food'))
    expect(input.value).toBe('')
  })

  it('preserves the draft when onSet resolves false', async () => {
    const user = userEvent.setup()
    const onSet = vi.fn().mockResolvedValue(false)
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={[]}
        onSet={onSet}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    const input = screen.getByLabelText('Budget for Food') as HTMLInputElement
    await user.type(input, '150')
    await user.click(screen.getByLabelText('Save budget for Food'))
    expect(input.value).toBe('150')
  })

  it('filters by the selected month — budgets for other months are not shown', () => {
    const mixed: CategoryBudget[] = [
      ...budgets,
      {
        id: '2026-04|cat-rent',
        month: '2026-04',
        categoryId: 'cat-rent',
        amount: 999,
      },
    ]
    render(
      <CategoryBudgetManager
        month="2026-05"
        categories={categories}
        categoryBudgets={mixed}
        onSet={vi.fn().mockResolvedValue(true)}
        onRemove={vi.fn().mockResolvedValue(true)}
      />,
    )
    // Food (May) shows Current $200; Housing has no May budget.
    expect(screen.getByText(/Current: \$200\.00/)).toBeInTheDocument()
    expect(screen.queryByText(/Current: \$999\.00/)).not.toBeInTheDocument()
  })
})
