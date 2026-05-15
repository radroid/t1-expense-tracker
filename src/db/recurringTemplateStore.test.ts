import { beforeEach, describe, expect, it } from 'vitest'
import type { RecurringTemplate } from '../lib/recurring'
import {
  addRecurringTemplate,
  getAllRecurringTemplates,
  putRecurringTemplate,
  removeRecurringTemplate,
} from './recurringTemplateStore'

function makeTemplate(overrides: Partial<RecurringTemplate> = {}): RecurringTemplate {
  return {
    id: 't1',
    description: 'Rent',
    amount: 1500,
    frequency: 'monthly',
    dayOfMonth: 1,
    ...overrides,
  }
}

describe('recurringTemplateStore', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('expense-tracker')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () =>
        reject(new Error('deleteDatabase blocked — a connection was left open'))
    })
  })

  it('add then getAll returns the template', async () => {
    const t = makeTemplate()
    await addRecurringTemplate(t)
    const all = await getAllRecurringTemplates()
    expect(all).toEqual([t])
  })

  it('add multiple then getAll returns all', async () => {
    const t1 = makeTemplate({ id: 't1' })
    const t2 = makeTemplate({ id: 't2', description: 'Gym', amount: 50, dayOfMonth: 5 })
    await addRecurringTemplate(t1)
    await addRecurringTemplate(t2)
    const all = await getAllRecurringTemplates()
    expect(all).toHaveLength(2)
    expect(all).toEqual(expect.arrayContaining([t1, t2]))
  })

  it('remove deletes the template', async () => {
    const t1 = makeTemplate({ id: 't1' })
    const t2 = makeTemplate({ id: 't2' })
    await addRecurringTemplate(t1)
    await addRecurringTemplate(t2)
    await removeRecurringTemplate('t1')
    const all = await getAllRecurringTemplates()
    expect(all).toEqual([t2])
  })

  it('getAll on empty store returns []', async () => {
    const all = await getAllRecurringTemplates()
    expect(all).toEqual([])
  })

  it('persists optional categoryId on round-trip', async () => {
    const t = makeTemplate({ categoryId: 'cat-1' })
    await addRecurringTemplate(t)
    const all = await getAllRecurringTemplates()
    expect(all[0].categoryId).toBe('cat-1')
  })

  it('putRecurringTemplate overwrites an existing template with the same id', async () => {
    const original = makeTemplate({ id: 't1', description: 'Rent', amount: 1500 })
    await addRecurringTemplate(original)

    const edited = makeTemplate({
      id: 't1',
      description: 'Rent (updated)',
      amount: 1800,
      dayOfMonth: 5,
      categoryId: 'cat-new',
    })
    await putRecurringTemplate(edited)

    const all = await getAllRecurringTemplates()
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(edited)
  })
})
