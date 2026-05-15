import type { CategoryBudget } from '../lib/categoryBudget'
import { categoryBudgetId } from '../lib/categoryBudget'
import { makeStore } from './store'

// IDB put = upsert. No separate add/update path — the composite id collapses
// "set the budget for (month, categoryId)" to a single op, matching the
// monthlyBudgets pattern. Domain owns the composite-id builder; the factory
// stays IDB-thin.
const store = makeStore<CategoryBudget>('categoryBudgets')

export const setCategoryBudget = (b: CategoryBudget): Promise<void> =>
  store.put(b)

export const getCategoryBudget = (
  month: string,
  categoryId: string,
): Promise<CategoryBudget | undefined> =>
  store.get(categoryBudgetId(month, categoryId))

export const getAllCategoryBudgets = (): Promise<CategoryBudget[]> =>
  store.getAll()

export const removeCategoryBudget = (id: string): Promise<void> =>
  store.remove(id)
