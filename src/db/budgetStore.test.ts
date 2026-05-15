import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MonthlyBudget } from '../lib/budget'
import {
  getAllBudgets,
  getBudget,
  removeBudget,
  setBudget,
} from './budgetStore'

function makeBudget(overrides: Partial<MonthlyBudget> = {}): MonthlyBudget {
  return {
    month: '2026-05',
    amount: 500,
    ...overrides,
  }
}

describe('budgetStore', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('expense-tracker')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () =>
        reject(new Error('deleteDatabase blocked — a connection was left open'))
    })
  })

  it('set then getBudget returns the budget', async () => {
    const b = makeBudget()
    await setBudget(b)
    const got = await getBudget('2026-05')
    expect(got).toEqual(b)
  })

  it('getAllBudgets returns all set budgets', async () => {
    const b1 = makeBudget({ month: '2026-05', amount: 500 })
    const b2 = makeBudget({ month: '2026-06', amount: 750 })
    await setBudget(b1)
    await setBudget(b2)
    const all = await getAllBudgets()
    expect(all).toHaveLength(2)
    expect(all).toEqual(expect.arrayContaining([b1, b2]))
  })

  it('setBudget twice for the same month overwrites (latest wins)', async () => {
    await setBudget(makeBudget({ month: '2026-05', amount: 500 }))
    await setBudget(makeBudget({ month: '2026-05', amount: 1000 }))
    const got = await getBudget('2026-05')
    expect(got).toEqual({ month: '2026-05', amount: 1000 })
    const all = await getAllBudgets()
    expect(all).toHaveLength(1)
  })

  it('removeBudget deletes the budget', async () => {
    const b1 = makeBudget({ month: '2026-05' })
    const b2 = makeBudget({ month: '2026-06' })
    await setBudget(b1)
    await setBudget(b2)
    await removeBudget('2026-05')
    const all = await getAllBudgets()
    expect(all).toEqual([b2])
  })

  it('getBudget on unknown month returns undefined', async () => {
    const got = await getBudget('2026-05')
    expect(got).toBeUndefined()
  })

  it('getAllBudgets on empty store returns []', async () => {
    const all = await getAllBudgets()
    expect(all).toEqual([])
  })
})
