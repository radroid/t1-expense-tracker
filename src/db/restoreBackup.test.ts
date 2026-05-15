import { describe, it, expect, beforeEach } from 'vitest'
import { restoreBackup } from './restoreBackup'
import { addExpense, getAllExpenses } from './expenseStore'
import {
  addCategory,
  getAllCategories,
} from './categoryStore'
import { setBudget, getAllBudgets } from './budgetStore'
import {
  addRecurringTemplate,
  getAllRecurringTemplates,
} from './recurringTemplateStore'
import { BACKUP_SCHEMA_VERSION, type BackupSnapshot } from '../lib/backup'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import type { MonthlyBudget } from '../lib/budget'
import type { RecurringTemplate } from '../lib/recurring'

function snapshot(partial: Partial<BackupSnapshot> = {}): BackupSnapshot {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-05-15T10:00:00.000Z',
    expenses: [],
    categories: [],
    monthlyBudgets: [],
    recurringTemplates: [],
    ...partial,
  }
}

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('expense-tracker')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () =>
      reject(new Error('deleteDatabase blocked — connection left open'))
  })
})

describe('restoreBackup', () => {
  it('replaces all four stores with the snapshot content', async () => {
    // Seed each store with pre-restore data we expect to be wiped.
    await addExpense({
      id: 'old-e',
      amount: 1,
      description: 'old expense',
      date: '2026-01-01',
    })
    await addCategory({ id: 'old-c', name: 'Old', color: '#000000' })
    await setBudget({ month: '2026-01', amount: 100 })
    await addRecurringTemplate({
      id: 'old-t',
      description: 'old',
      amount: 5,
      dayOfMonth: 1,
      frequency: 'monthly',
    })

    const expenses: Expense[] = [
      { id: 'new-e1', amount: 12, description: 'Coffee', date: '2026-05-15' },
      { id: 'new-e2', amount: 50, description: 'Lunch', date: '2026-05-16' },
    ]
    const categories: Category[] = [
      { id: 'new-c1', name: 'Food', color: '#ff0000' },
    ]
    const monthlyBudgets: MonthlyBudget[] = [
      { month: '2026-05', amount: 500 },
    ]
    const recurringTemplates: RecurringTemplate[] = [
      {
        id: 'new-t1',
        description: 'Rent',
        amount: 1200,
        dayOfMonth: 1,
        frequency: 'monthly',
      },
    ]

    await restoreBackup(
      snapshot({ expenses, categories, monthlyBudgets, recurringTemplates }),
    )

    expect(await getAllExpenses()).toEqual(expenses)
    expect(await getAllCategories()).toEqual(categories)
    expect(await getAllBudgets()).toEqual(monthlyBudgets)
    expect(await getAllRecurringTemplates()).toEqual(recurringTemplates)
  })

  it('an empty snapshot clears all four stores', async () => {
    await addExpense({
      id: 'e1',
      amount: 1,
      description: 'x',
      date: '2026-01-01',
    })
    await addCategory({ id: 'c1', name: 'C', color: '#000000' })
    await setBudget({ month: '2026-01', amount: 100 })
    await addRecurringTemplate({
      id: 't1',
      description: 't',
      amount: 1,
      dayOfMonth: 1,
      frequency: 'monthly',
    })

    await restoreBackup(snapshot())

    expect(await getAllExpenses()).toEqual([])
    expect(await getAllCategories()).toEqual([])
    expect(await getAllBudgets()).toEqual([])
    expect(await getAllRecurringTemplates()).toEqual([])
  })

  it('aborts atomically: if one entity is malformed the stores are unchanged', async () => {
    // Seed pre-restore state that must survive a failed restore.
    const seedExpense: Expense = {
      id: 'pre-e',
      amount: 1,
      description: 'pre',
      date: '2026-01-01',
    }
    const seedCategory: Category = {
      id: 'pre-c',
      name: 'Pre',
      color: '#000000',
    }
    const seedBudget: MonthlyBudget = { month: '2026-01', amount: 100 }
    const seedTemplate: RecurringTemplate = {
      id: 'pre-t',
      description: 'pre',
      amount: 5,
      dayOfMonth: 1,
      frequency: 'monthly',
    }
    await addExpense(seedExpense)
    await addCategory(seedCategory)
    await setBudget(seedBudget)
    await addRecurringTemplate(seedTemplate)

    // A snapshot whose expenses array contains a null — IDB will reject the
    // add() because there's no keyPath value, aborting the whole tx.
    const bad = snapshot({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expenses: [null as any],
    })

    await expect(restoreBackup(bad)).rejects.toBeDefined()

    // Pre-restore state should survive.
    expect(await getAllExpenses()).toEqual([seedExpense])
    expect(await getAllCategories()).toEqual([seedCategory])
    expect(await getAllBudgets()).toEqual([seedBudget])
    expect(await getAllRecurringTemplates()).toEqual([seedTemplate])
  })
})
