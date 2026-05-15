import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Expense } from '../lib/expense'
import { openDb } from './db'
import { getAllExpenses } from './expenseStore'
import { getBudget, setBudget } from './budgetStore'

const DB_NAME = 'expense-tracker'

function openAtVersion(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, version)
    req.onupgradeneeded = () => {
      const db = req.result
      // Replicate v2's schema: expenses + categories, both keyPath 'id'.
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' })
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

  it('upgrades v2 → v3 preserving expenses and adding monthlyBudgets store', async () => {
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

    // 2. Open via openDb() (which upgrades to v3).
    const v3Db = await openDb()
    expect(v3Db.version).toBe(3)
    expect(v3Db.objectStoreNames.contains('expenses')).toBe(true)
    expect(v3Db.objectStoreNames.contains('categories')).toBe(true)
    expect(v3Db.objectStoreNames.contains('monthlyBudgets')).toBe(true)
    v3Db.close()

    // 3. The seeded expense is still readable.
    const expenses = await getAllExpenses()
    expect(expenses).toEqual([seeded])

    // 4. The new monthlyBudgets store is functional.
    await setBudget({ month: '2026-05', amount: 1000 })
    const budget = await getBudget('2026-05')
    expect(budget).toEqual({ month: '2026-05', amount: 1000 })
  })
})
