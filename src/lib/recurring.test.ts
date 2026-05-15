import { describe, it, expect } from 'vitest'
import {
  applyRecurringTemplateEdit,
  createRecurringTemplate,
  dueTemplatesForMonth,
  generateDueExpenses,
  type RecurringTemplate,
  type RecurringTemplateInput,
} from './recurring'
import type { Expense } from './expense'

const validInput: RecurringTemplateInput = {
  description: 'Rent',
  amount: 1500,
  frequency: 'monthly',
  dayOfMonth: 1,
}

describe('createRecurringTemplate', () => {
  it('returns a RecurringTemplate with generated id and cleaned fields', () => {
    const t = createRecurringTemplate(validInput)
    expect(typeof t.id).toBe('string')
    expect(t.id.length).toBeGreaterThan(0)
    expect(t.description).toBe('Rent')
    expect(t.amount).toBe(1500)
    expect(t.frequency).toBe('monthly')
    expect(t.dayOfMonth).toBe(1)
  })

  it('trims the description', () => {
    const t = createRecurringTemplate({ ...validInput, description: '  Rent  ' })
    expect(t.description).toBe('Rent')
  })

  it('generates a unique id per call', () => {
    const a = createRecurringTemplate(validInput)
    const b = createRecurringTemplate(validInput)
    expect(a.id).not.toBe(b.id)
  })

  it('passes through optional categoryId', () => {
    const t = createRecurringTemplate({ ...validInput, categoryId: 'cat-1' })
    expect(t.categoryId).toBe('cat-1')
  })

  it('omits categoryId when not provided', () => {
    const t = createRecurringTemplate(validInput)
    expect(t.categoryId).toBeUndefined()
  })

  it('throws when amount is zero', () => {
    expect(() => createRecurringTemplate({ ...validInput, amount: 0 })).toThrow()
  })

  it('throws when amount is negative', () => {
    expect(() => createRecurringTemplate({ ...validInput, amount: -5 })).toThrow()
  })

  it('throws when amount is NaN', () => {
    expect(() => createRecurringTemplate({ ...validInput, amount: NaN })).toThrow()
  })

  it('throws when amount is Infinity', () => {
    expect(() => createRecurringTemplate({ ...validInput, amount: Infinity })).toThrow()
  })

  it('throws when description is empty', () => {
    expect(() => createRecurringTemplate({ ...validInput, description: '' })).toThrow()
  })

  it('throws when description is whitespace-only', () => {
    expect(() => createRecurringTemplate({ ...validInput, description: '   ' })).toThrow()
  })

  it('throws when frequency is not monthly', () => {
    expect(() =>
      // @ts-expect-error invalid frequency on purpose
      createRecurringTemplate({ ...validInput, frequency: 'weekly' }),
    ).toThrow()
  })

  it('throws when dayOfMonth is 0', () => {
    expect(() => createRecurringTemplate({ ...validInput, dayOfMonth: 0 })).toThrow()
  })

  it('throws when dayOfMonth is 29 (out of safe range)', () => {
    expect(() => createRecurringTemplate({ ...validInput, dayOfMonth: 29 })).toThrow()
  })

  it('throws when dayOfMonth is negative', () => {
    expect(() => createRecurringTemplate({ ...validInput, dayOfMonth: -1 })).toThrow()
  })

  it('throws when dayOfMonth is not an integer', () => {
    expect(() => createRecurringTemplate({ ...validInput, dayOfMonth: 1.5 })).toThrow()
  })

  it('accepts dayOfMonth boundary values 1 and 28', () => {
    expect(() => createRecurringTemplate({ ...validInput, dayOfMonth: 1 })).not.toThrow()
    expect(() => createRecurringTemplate({ ...validInput, dayOfMonth: 28 })).not.toThrow()
  })
})

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

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    amount: 1500,
    description: 'Rent',
    date: '2026-05-01',
    ...overrides,
  }
}

describe('dueTemplatesForMonth', () => {
  it('returns all templates when no expenses exist', () => {
    const templates = [makeTemplate({ id: 't1' }), makeTemplate({ id: 't2' })]
    const result = dueTemplatesForMonth(templates, [], '2026-05')
    expect(result).toEqual(templates)
  })

  it('returns empty when every template already has a matching expense in the month', () => {
    const templates = [
      makeTemplate({ id: 't1' }),
      makeTemplate({ id: 't2' }),
    ]
    const expenses = [
      makeExpense({ id: 'e1', sourceTemplateId: 't1', date: '2026-05-01' }),
      makeExpense({ id: 'e2', sourceTemplateId: 't2', date: '2026-05-01' }),
    ]
    expect(dueTemplatesForMonth(templates, expenses, '2026-05')).toEqual([])
  })

  it('returns templates that have no match while skipping matched ones', () => {
    const t1 = makeTemplate({ id: 't1' })
    const t2 = makeTemplate({ id: 't2' })
    const expenses = [
      makeExpense({ id: 'e1', sourceTemplateId: 't1', date: '2026-05-01' }),
    ]
    expect(dueTemplatesForMonth([t1, t2], expenses, '2026-05')).toEqual([t2])
  })

  it('ignores expenses with a different sourceTemplateId', () => {
    const t1 = makeTemplate({ id: 't1' })
    const expenses = [
      makeExpense({ id: 'e1', sourceTemplateId: 'other', date: '2026-05-01' }),
    ]
    expect(dueTemplatesForMonth([t1], expenses, '2026-05')).toEqual([t1])
  })

  it('ignores expenses without a sourceTemplateId at all', () => {
    const t1 = makeTemplate({ id: 't1' })
    const expenses = [makeExpense({ id: 'e1', date: '2026-05-01' })]
    expect(dueTemplatesForMonth([t1], expenses, '2026-05')).toEqual([t1])
  })

  it('ignores matching expenses that fall in a different month', () => {
    const t1 = makeTemplate({ id: 't1' })
    const expenses = [
      makeExpense({ id: 'e1', sourceTemplateId: 't1', date: '2026-04-01' }),
    ]
    expect(dueTemplatesForMonth([t1], expenses, '2026-05')).toEqual([t1])
  })

  it('preserves input order in the result', () => {
    const templates = [
      makeTemplate({ id: 'b' }),
      makeTemplate({ id: 'a' }),
      makeTemplate({ id: 'c' }),
    ]
    const result = dueTemplatesForMonth(templates, [], '2026-05')
    expect(result.map((t) => t.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('generateDueExpenses', () => {
  it('builds an ExpenseInput per template with the correct date', () => {
    const templates = [makeTemplate({ id: 't1', dayOfMonth: 1 })]
    const result = generateDueExpenses(templates, '2026-05')
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-05-01')
    expect(result[0].amount).toBe(1500)
    expect(result[0].description).toBe('Rent')
  })

  it('zero-pads single-digit dayOfMonth in the date', () => {
    const t = makeTemplate({ id: 't1', dayOfMonth: 7 })
    const result = generateDueExpenses([t], '2026-02')
    expect(result[0].date).toBe('2026-02-07')
  })

  it('handles two-digit dayOfMonth without extra padding', () => {
    const t = makeTemplate({ id: 't1', dayOfMonth: 28 })
    const result = generateDueExpenses([t], '2026-02')
    expect(result[0].date).toBe('2026-02-28')
  })

  it('carries categoryId when the template has one', () => {
    const t = makeTemplate({ id: 't1', categoryId: 'cat-1' })
    const result = generateDueExpenses([t], '2026-05')
    expect(result[0].categoryId).toBe('cat-1')
  })

  it('omits categoryId when the template has none', () => {
    const t = makeTemplate({ id: 't1' })
    const result = generateDueExpenses([t], '2026-05')
    expect(result[0].categoryId).toBeUndefined()
  })

  it('attaches sourceTemplateId from the template id', () => {
    const t = makeTemplate({ id: 'template-xyz' })
    const result = generateDueExpenses([t], '2026-05')
    expect(result[0].sourceTemplateId).toBe('template-xyz')
  })

  it('returns one input per template, in input order', () => {
    const templates = [
      makeTemplate({ id: 't1', description: 'A' }),
      makeTemplate({ id: 't2', description: 'B' }),
    ]
    const result = generateDueExpenses(templates, '2026-05')
    expect(result.map((r) => r.description)).toEqual(['A', 'B'])
  })

  it('returns [] when no templates are given', () => {
    expect(generateDueExpenses([], '2026-05')).toEqual([])
  })
})

describe('applyRecurringTemplateEdit', () => {
  const existing: RecurringTemplate = {
    id: 'template-keep-me',
    description: 'Old Rent',
    amount: 1000,
    frequency: 'monthly',
    dayOfMonth: 1,
    categoryId: 'cat-old',
  }

  it('preserves existing id regardless of input', () => {
    const next = applyRecurringTemplateEdit(existing, {
      description: 'New Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 5,
    })
    expect(next.id).toBe('template-keep-me')
  })

  it('preserves frequency as monthly', () => {
    const next = applyRecurringTemplateEdit(existing, {
      description: 'New Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 5,
    })
    expect(next.frequency).toBe('monthly')
  })

  it('overwrites description, amount, dayOfMonth from input (cleaned)', () => {
    const next = applyRecurringTemplateEdit(existing, {
      description: '  Updated  ',
      amount: 2000,
      frequency: 'monthly',
      dayOfMonth: 28,
    })
    expect(next.description).toBe('Updated')
    expect(next.amount).toBe(2000)
    expect(next.dayOfMonth).toBe(28)
  })

  it('preserves existing categoryId when input omits categoryId', () => {
    const next = applyRecurringTemplateEdit(existing, {
      description: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 1,
    })
    expect(next.categoryId).toBe('cat-old')
  })

  it('preserves existing categoryId when input sets categoryId to undefined explicitly', () => {
    const next = applyRecurringTemplateEdit(existing, {
      description: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 1,
      categoryId: undefined,
    })
    expect(next.categoryId).toBe('cat-old')
  })

  it('overwrites categoryId when input supplies a new one', () => {
    const next = applyRecurringTemplateEdit(existing, {
      description: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 1,
      categoryId: 'cat-new',
    })
    expect(next.categoryId).toBe('cat-new')
  })

  it('throws on invalid amount via the shared validator', () => {
    expect(() =>
      applyRecurringTemplateEdit(existing, {
        description: 'Rent',
        amount: -5,
        frequency: 'monthly',
        dayOfMonth: 1,
      }),
    ).toThrow()
  })

  it('throws on dayOfMonth out of range', () => {
    expect(() =>
      applyRecurringTemplateEdit(existing, {
        description: 'Rent',
        amount: 100,
        frequency: 'monthly',
        dayOfMonth: 30,
      }),
    ).toThrow()
  })

  it('throws on empty description', () => {
    expect(() =>
      applyRecurringTemplateEdit(existing, {
        description: '   ',
        amount: 100,
        frequency: 'monthly',
        dayOfMonth: 1,
      }),
    ).toThrow()
  })
})
