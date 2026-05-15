import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Expense } from '../lib/expense'
import type { RecurringTemplate } from '../lib/recurring'
import { openDb } from './db'
import { getAllExpenses } from './expenseStore'
import { getBudget, setBudget } from './budgetStore'
import {
  addRecurringTemplate,
  getAllRecurringTemplates,
} from './recurringTemplateStore'

const DB_NAME = 'expense-tracker'

// Opens at the given version, replicating the historic schema for that
// version. v2: expenses + categories. v3: + monthlyBudgets (the legacy
// shape v4 must extend by adding the recurringTemplates store).
function openAtVersion(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, version)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' })
      }
      if (version >= 3 && !db.objectStoreNames.contains('monthlyBudgets')) {
        db.createObjectStore('monthlyBudgets', { keyPath: 'month' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function putExpense(db: IDBDatabase, e: Expense): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('expenses', 'readwrite')
    tx.objectStore('expenses').put(e)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

describe('IndexedDB migration', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () =>
        reject(new Error('deleteDatabase blocked — a connection was left open'))
    })
  })

  it('upgrades v2 → v4 preserving expenses and adding new stores', async () => {
    // 1. Open at v2, seed an expense.
    const v2Db = await openAtVersion(2)
    const seeded: Expense = {
      id: 'seed-1',
      amount: 42,
      description: 'pre-migration coffee',
      date: '2026-05-14',
    }
    await putExpense(v2Db, seeded)
    v2Db.close()

    // 2. Open via openDb() (which upgrades all the way to current version).
    const upgraded = await openDb()
    expect(upgraded.version).toBe(4)
    expect(upgraded.objectStoreNames.contains('expenses')).toBe(true)
    expect(upgraded.objectStoreNames.contains('categories')).toBe(true)
    expect(upgraded.objectStoreNames.contains('monthlyBudgets')).toBe(true)
    expect(upgraded.objectStoreNames.contains('recurringTemplates')).toBe(true)
    upgraded.close()

    // 3. The seeded expense is still readable.
    const expenses = await getAllExpenses()
    expect(expenses).toEqual([seeded])

    // 4. The monthlyBudgets store is functional.
    await setBudget({ month: '2026-05', amount: 1000 })
    const budget = await getBudget('2026-05')
    expect(budget).toEqual({ month: '2026-05', amount: 1000 })
  })

  it('upgrades v3 → v4: existing data survives + recurringTemplates store works', async () => {
    // 1. Open at v3, seed expense + budget.
    const v3Db = await openAtVersion(3)
    const seededExpense: Expense = {
      id: 'seed-e1',
      amount: 12.5,
      description: 'pre-v4 coffee',
      date: '2026-05-14',
    }
    await putExpense(v3Db, seededExpense)
    // Seed a budget directly via the v3 connection so we exercise the same
    // upgrade-preserves-data property for monthlyBudgets, not just expenses.
    await new Promise<void>((resolve, reject) => {
      const tx = v3Db.transaction('monthlyBudgets', 'readwrite')
      tx.objectStore('monthlyBudgets').put({ month: '2026-05', amount: 500 })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    v3Db.close()

    // 2. Open via openDb() — upgrades v3 → v4.
    const v4Db = await openDb()
    expect(v4Db.version).toBe(4)
    expect(v4Db.objectStoreNames.contains('recurringTemplates')).toBe(true)
    v4Db.close()

    // 3. Old data survives the upgrade.
    expect(await getAllExpenses()).toEqual([seededExpense])
    expect(await getBudget('2026-05')).toEqual({ month: '2026-05', amount: 500 })

    // 4. New store round-trips a template.
    const template: RecurringTemplate = {
      id: 'tpl-1',
      description: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 1,
    }
    await addRecurringTemplate(template)
    expect(await getAllRecurringTemplates()).toEqual([template])
  })
})
