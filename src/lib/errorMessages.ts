// Centralizes the "Failed to ..." templates used by the storage hooks.
// Each domain's message bundle is a frozen object so it can be referenced
// by-reference in the hook config without leaking write-access. The exact
// strings here are the contract — hook tests and (sometimes) component tests
// assert against them, so changes here must ripple through deliberately.

export const expenseMessages = Object.freeze({
  load: 'Failed to load expenses.',
  add: 'Failed to add expense.',
  update: 'Failed to save changes.',
  remove: 'Failed to delete expense.',
})

export const categoryMessages = Object.freeze({
  load: 'Failed to load categories.',
  add: 'Failed to add category.',
  update: 'Failed to rename category.',
  remove: 'Failed to delete category.',
  // P6.E — block-while-in-use cascade. Factory because the count varies
  // per call. The UI also renders the count separately next to the row,
  // but the error toast still wants it inline for accessibility.
  inUse: (count: number) =>
    count === 1
      ? 'Category is used by 1 expense. Remove or recategorize it first.'
      : `Category is used by ${count} expenses. Remove or recategorize them first.`,
})

export const budgetMessages = Object.freeze({
  load: 'Failed to load budgets.',
  add: 'Failed to save budget.',
  remove: 'Failed to delete budget.',
})

export const recurringTemplateMessages = Object.freeze({
  load: 'Failed to load recurring templates.',
  add: 'Failed to add recurring template.',
  update: 'Failed to update recurring template.',
  remove: 'Failed to delete recurring template.',
})

export const categoryBudgetMessages = Object.freeze({
  load: 'Failed to load category budgets.',
  add: 'Failed to save category budget.',
  update: 'Failed to save category budget.',
  remove: 'Failed to delete category budget.',
})
