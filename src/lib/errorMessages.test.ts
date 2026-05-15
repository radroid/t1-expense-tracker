import { describe, expect, it } from 'vitest'
import {
  budgetMessages,
  categoryBudgetMessages,
  categoryMessages,
  expenseMessages,
  recurringTemplateMessages,
} from './errorMessages'

// These tests pin the exact strings the hooks emit today. The hook tests and
// some component tests assert error visibility by these phrases (or substrings
// of them); if anyone tweaks the wording here, those tests should fail loudly
// rather than silently drifting.
describe('errorMessages', () => {
  it('expenseMessages match the strings useExpenses emitted pre-refactor', () => {
    expect(expenseMessages.load).toBe('Failed to load expenses.')
    expect(expenseMessages.add).toBe('Failed to add expense.')
    expect(expenseMessages.update).toBe('Failed to save changes.')
    expect(expenseMessages.remove).toBe('Failed to delete expense.')
  })

  it('categoryMessages match the strings useCategories emitted pre-refactor', () => {
    expect(categoryMessages.load).toBe('Failed to load categories.')
    expect(categoryMessages.add).toBe('Failed to add category.')
    expect(categoryMessages.update).toBe('Failed to rename category.')
    expect(categoryMessages.remove).toBe('Failed to delete category.')
  })

  it('budgetMessages match the strings useMonthlyBudgets emitted pre-refactor', () => {
    expect(budgetMessages.load).toBe('Failed to load budgets.')
    expect(budgetMessages.add).toBe('Failed to save budget.')
    expect(budgetMessages.remove).toBe('Failed to delete budget.')
  })

  it('recurringTemplateMessages match the strings useRecurringTemplates emitted pre-refactor', () => {
    expect(recurringTemplateMessages.load).toBe(
      'Failed to load recurring templates.',
    )
    expect(recurringTemplateMessages.add).toBe(
      'Failed to add recurring template.',
    )
    expect(recurringTemplateMessages.remove).toBe(
      'Failed to delete recurring template.',
    )
  })

  it('categoryBudgetMessages cover load/add/update/remove for per-category budgets (P5.D)', () => {
    expect(categoryBudgetMessages.load).toBe('Failed to load category budgets.')
    expect(categoryBudgetMessages.add).toBe('Failed to save category budget.')
    expect(categoryBudgetMessages.update).toBe(
      'Failed to save category budget.',
    )
    expect(categoryBudgetMessages.remove).toBe(
      'Failed to delete category budget.',
    )
  })

  it('message bundles are frozen so hooks can hold them by reference safely', () => {
    expect(Object.isFrozen(expenseMessages)).toBe(true)
    expect(Object.isFrozen(categoryMessages)).toBe(true)
    expect(Object.isFrozen(budgetMessages)).toBe(true)
    expect(Object.isFrozen(recurringTemplateMessages)).toBe(true)
    expect(Object.isFrozen(categoryBudgetMessages)).toBe(true)
  })
})
