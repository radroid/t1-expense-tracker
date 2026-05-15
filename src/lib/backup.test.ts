import { describe, it, expect } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  buildBackup,
  formatBackup,
  type BackupInput,
} from './backup'
import type { Expense } from './expense'
import type { Category } from './category'
import type { MonthlyBudget } from './budget'
import type { RecurringTemplate } from './recurring'
import type { CategoryBudget } from './categoryBudget'

const sampleExpenses: Expense[] = [
  { id: 'e1', amount: 10, description: 'Coffee', date: '2026-05-15' },
  {
    id: 'e2',
    amount: 25.5,
    description: 'Lunch',
    date: '2026-05-14',
    categoryId: 'c1',
  },
]

const sampleCategories: Category[] = [
  { id: 'c1', name: 'Food', color: '#ff0000' },
]

const sampleBudgets: MonthlyBudget[] = [
  { month: '2026-05', amount: 500 },
]

const sampleTemplates: RecurringTemplate[] = [
  {
    id: 't1',
    description: 'Rent',
    amount: 1200,
    dayOfMonth: 1,
    frequency: 'monthly',
  },
]

const sampleCategoryBudgets: CategoryBudget[] = [
  { id: '2026-05|c1', month: '2026-05', categoryId: 'c1', amount: 200 },
]

const fixedNow = new Date('2026-05-15T12:34:56.000Z')
const fixedNowIso = fixedNow.toISOString()

const fullInput: BackupInput = {
  expenses: sampleExpenses,
  categories: sampleCategories,
  monthlyBudgets: sampleBudgets,
  recurringTemplates: sampleTemplates,
  categoryBudgets: sampleCategoryBudgets,
}

const emptyInput: BackupInput = {
  expenses: [],
  categories: [],
  monthlyBudgets: [],
  recurringTemplates: [],
  categoryBudgets: [],
}

describe('BACKUP_SCHEMA_VERSION', () => {
  it('is exported and pinned at 2 (P5.D — adds categoryBudgets)', () => {
    expect(BACKUP_SCHEMA_VERSION).toBe(2)
  })
})

describe('buildBackup', () => {
  it('builds an empty snapshot with schemaVersion + exportedAt', () => {
    const snap = buildBackup(emptyInput, () => fixedNow)
    expect(snap).toEqual({
      schemaVersion: 2,
      exportedAt: fixedNowIso,
      expenses: [],
      categories: [],
      monthlyBudgets: [],
      recurringTemplates: [],
      categoryBudgets: [],
    })
  })

  it('carries each entity array through unchanged (deep equal)', () => {
    const snap = buildBackup(fullInput, () => fixedNow)
    expect(snap.expenses).toEqual(sampleExpenses)
    expect(snap.categories).toEqual(sampleCategories)
    expect(snap.monthlyBudgets).toEqual(sampleBudgets)
    expect(snap.recurringTemplates).toEqual(sampleTemplates)
    expect(snap.categoryBudgets).toEqual(sampleCategoryBudgets)
    expect(snap.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(snap.exportedAt).toBe(fixedNowIso)
  })

  it('defaults `now` to new Date() when not provided', () => {
    const before = Date.now()
    const snap = buildBackup(emptyInput)
    const after = Date.now()
    const t = Date.parse(snap.exportedAt)
    expect(t).toBeGreaterThanOrEqual(before)
    expect(t).toBeLessThanOrEqual(after)
  })
})

describe('formatBackup', () => {
  it('produces JSON keys in the documented order', () => {
    const snap = buildBackup(fullInput, () => fixedNow)
    const text = formatBackup(snap)
    // Key order: schemaVersion, exportedAt, expenses, categories,
    // monthlyBudgets, recurringTemplates, categoryBudgets.
    const expectedOrder = [
      'schemaVersion',
      'exportedAt',
      'expenses',
      'categories',
      'monthlyBudgets',
      'recurringTemplates',
      'categoryBudgets',
    ]
    const positions = expectedOrder.map((k) => text.indexOf(`"${k}"`))
    for (const p of positions) expect(p).toBeGreaterThan(-1)
    const sorted = [...positions].sort((a, b) => a - b)
    expect(positions).toEqual(sorted)
  })

  it('parses back to a structurally valid snapshot', () => {
    const snap = buildBackup(fullInput, () => fixedNow)
    const text = formatBackup(snap)
    const parsed = JSON.parse(text)
    expect(parsed).toEqual({
      schemaVersion: 2,
      exportedAt: fixedNowIso,
      expenses: sampleExpenses,
      categories: sampleCategories,
      monthlyBudgets: sampleBudgets,
      recurringTemplates: sampleTemplates,
      categoryBudgets: sampleCategoryBudgets,
    })
  })

  it('is pretty-printed with newlines and 2-space indentation', () => {
    const snap = buildBackup(fullInput, () => fixedNow)
    const text = formatBackup(snap)
    expect(text).toContain('\n')
    // First indented line under the opening `{` should start with 2 spaces.
    expect(text).toMatch(/\n {2}"schemaVersion"/)
  })

  it('round-trips: parse(format(build(input))) deep-equals the snapshot', () => {
    const snap = buildBackup(fullInput, () => fixedNow)
    const round = JSON.parse(formatBackup(snap))
    expect(round).toEqual(snap)
  })
})
