import type { CategoryBudget } from '../lib/categoryBudget'
import { categoryBudgetId } from '../lib/categoryBudget'
import { withStore } from './db'

const STORE_NAME = 'categoryBudgets'

// IDB put = upsert. No separate add/update path — the composite id collapses
// "set the budget for (month, categoryId)" to a single op, matching the
// monthlyBudgets `setBudget` pattern.
export async function setCategoryBudget(budget: CategoryBudget): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.put(budget))
}

export function getCategoryBudget(
  month: string,
  categoryId: string,
): Promise<CategoryBudget | undefined> {
  return withStore<CategoryBudget | undefined>(
    STORE_NAME,
    'readonly',
    (store) => store.get(categoryBudgetId(month, categoryId)),
  )
}

export function getAllCategoryBudgets(): Promise<CategoryBudget[]> {
  return withStore<CategoryBudget[]>(STORE_NAME, 'readonly', (store) =>
    store.getAll(),
  )
}

export async function removeCategoryBudget(id: string): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.delete(id))
}
