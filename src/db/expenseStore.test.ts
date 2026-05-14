import { beforeEach, describe, expect, it } from 'vitest'
import type { Expense } from '../lib/expense'
import {
  addExpense,
  getAllExpenses,
  removeExpense,
  updateExpense,
} from './expenseStore'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    amount: 10,
    description: 'coffee',
    date: '2026-05-14',
    ...overrides,
  }
}

describe('expenseStore', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('expense-tracker')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
  })

  it('add then getAll returns the expense', async () => {
    const e = makeExpense()
    await addExpense(e)
    const all = await getAllExpenses()
    expect(all).toEqual([e])
  })

  it('add multiple then getAll returns all', async () => {
    const e1 = makeExpense({ id: 'e1' })
    const e2 = makeExpense({ id: 'e2', description: 'lunch', amount: 25 })
    await addExpense(e1)
    await addExpense(e2)
    const all = await getAllExpenses()
    expect(all).toHaveLength(2)
    expect(all).toEqual(expect.arrayContaining([e1, e2]))
  })

  it('update reflects the change in getAll', async () => {
    const e = makeExpense()
    await addExpense(e)
    const updated = { ...e, amount: 99, description: 'updated' }
    await updateExpense(updated)
    const all = await getAllExpenses()
    expect(all).toEqual([updated])
  })

  it('remove deletes the expense', async () => {
    const e1 = makeExpense({ id: 'e1' })
    const e2 = makeExpense({ id: 'e2' })
    await addExpense(e1)
    await addExpense(e2)
    await removeExpense('e1')
    const all = await getAllExpenses()
    expect(all).toEqual([e2])
  })

  it('getAll on empty store returns []', async () => {
    const all = await getAllExpenses()
    expect(all).toEqual([])
  })
})
