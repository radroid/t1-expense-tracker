import { describe, it, expect } from 'vitest'
import {
  RECURRING_CSV_HEADER,
  formatTemplatesCsv,
  parseTemplatesCsv,
} from './recurringCsv'
import type { RecurringTemplate } from './recurring'

describe('formatTemplatesCsv', () => {
  it('emits only the header line (with trailing newline) for an empty list', () => {
    expect(formatTemplatesCsv([])).toBe(RECURRING_CSV_HEADER + '\n')
  })

  it('round-trips a simple template through parseTemplatesCsv', () => {
    const templates: RecurringTemplate[] = [
      {
        id: 't1',
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ]
    const text = formatTemplatesCsv(templates)
    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toEqual([
      {
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ])
  })

  it('renders categoryId when present and as an empty cell when missing', () => {
    const templates: RecurringTemplate[] = [
      {
        id: 't1',
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
        categoryId: 'cat-rent',
      },
      {
        id: 't2',
        description: 'Gym',
        amount: 50,
        frequency: 'monthly',
        dayOfMonth: 15,
      },
    ]
    const text = formatTemplatesCsv(templates)
    const lines = text.split('\n')
    expect(lines[0]).toBe(RECURRING_CSV_HEADER)
    expect(lines[1]).toBe('Rent,1500,1,cat-rent')
    expect(lines[2]).toBe('Gym,50,15,')
  })

  it('quotes and escapes descriptions containing commas, newlines, and quotes', () => {
    const templates: RecurringTemplate[] = [
      {
        id: 't1',
        description: 'a,b',
        amount: 5,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
      {
        id: 't2',
        description: 'line1\nline2',
        amount: 7,
        frequency: 'monthly',
        dayOfMonth: 2,
      },
      {
        id: 't3',
        description: 'has "quotes"',
        amount: 9,
        frequency: 'monthly',
        dayOfMonth: 3,
      },
    ]
    const text = formatTemplatesCsv(templates)
    expect(text).toContain('"a,b"')
    expect(text).toContain('"line1\nline2"')
    expect(text).toContain('"has ""quotes"""')

    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows.map((r) => r.description)).toEqual([
      'a,b',
      'line1\nline2',
      'has "quotes"',
    ])
  })
})

describe('parseTemplatesCsv', () => {
  it('rejects missing/wrong header — returns header error and no rows', () => {
    const result = parseTemplatesCsv('foo,bar,baz,qux\nRent,1500,1,\n')
    expect(result.rows).toEqual([])
    expect(result.errors).toEqual([
      { row: 0, message: 'Invalid or missing header' },
    ])
  })

  it('accepts header with mixed case and extra spaces around columns', () => {
    const text =
      ' Description , Amount , DayOfMonth , CategoryId \nRent,1500,1,\n'
    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toEqual([
      {
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ])
  })

  it('returns empty rows and empty errors when body is empty', () => {
    expect(parseTemplatesCsv(RECURRING_CSV_HEADER + '\n')).toEqual({
      rows: [],
      errors: [],
    })
    expect(parseTemplatesCsv(RECURRING_CSV_HEADER)).toEqual({
      rows: [],
      errors: [],
    })
  })

  it('reports an error for invalid amount (0, negative, NaN)', () => {
    const text =
      `${RECURRING_CSV_HEADER}\n` +
      `Bad1,0,1,\n` +
      `Bad2,-5,1,\n` +
      `Bad3,not-a-number,1,\n` +
      `Good,10,1,\n`
    const { rows, errors } = parseTemplatesCsv(text)
    expect(rows).toEqual([
      {
        description: 'Good',
        amount: 10,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ])
    expect(errors).toHaveLength(3)
    expect(errors[0].row).toBe(2)
    expect(errors[1].row).toBe(3)
    expect(errors[2].row).toBe(4)
    // Either parser-level amount error or domain "Invalid amount" message —
    // both must reference amount.
    for (const e of errors) {
      expect(e.message.toLowerCase()).toMatch(/amount/)
    }
  })

  it('reports an error for invalid dayOfMonth (0, 29, fractional)', () => {
    const text =
      `${RECURRING_CSV_HEADER}\n` +
      `Bad1,10,0,\n` +
      `Bad2,10,29,\n` +
      `Bad3,10,1.5,\n`
    const { rows, errors } = parseTemplatesCsv(text)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(3)
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4])
    for (const e of errors) {
      expect(e.message.toLowerCase()).toMatch(/day/)
    }
  })

  it('omits categoryId when its cell is empty', () => {
    const text = `${RECURRING_CSV_HEADER}\nRent,1500,1,\n`
    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
    expect(Object.prototype.hasOwnProperty.call(rows[0], 'categoryId')).toBe(
      false,
    )
  })

  it('ignores trailing empty lines', () => {
    const text = `${RECURRING_CSV_HEADER}\nRent,1500,1,\n\n\n`
    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
  })

  it('uses 1-indexed row numbers with header = row 1, first data row = row 2', () => {
    const text =
      `${RECURRING_CSV_HEADER}\n` +
      `Rent,1500,1,\n` + // row 2 ok
      `Bad,10,0,\n` + // row 3 bad dayOfMonth
      `Gym,50,15,\n` // row 4 ok
    const { rows, errors } = parseTemplatesCsv(text)
    expect(rows).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(3)
  })

  it('reports an error when a row has the wrong number of columns', () => {
    const text = `${RECURRING_CSV_HEADER}\nRent,1500,1\n`
    const { rows, errors } = parseTemplatesCsv(text)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(2)
    expect(errors[0].message.toLowerCase()).toMatch(/column/)
  })

  it('handles quoted fields containing commas, newlines, and escaped quotes', () => {
    const text =
      `${RECURRING_CSV_HEADER}\n` +
      `"has, comma",10,1,\n` +
      `"line1\nline2",11,2,\n` +
      `"has ""quotes""",12,3,\n`
    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows.map((r) => r.description)).toEqual([
      'has, comma',
      'line1\nline2',
      'has "quotes"',
    ])
  })

  it('round-trips formatted output back to the same row data', () => {
    const templates: RecurringTemplate[] = [
      {
        id: 't1',
        description: 'a,b',
        amount: 10,
        frequency: 'monthly',
        dayOfMonth: 1,
        categoryId: 'cat-1',
      },
      {
        id: 't2',
        description: 'plain',
        amount: 25.5,
        frequency: 'monthly',
        dayOfMonth: 14,
      },
    ]
    const text = formatTemplatesCsv(templates)
    const { rows, errors } = parseTemplatesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toEqual([
      {
        description: 'a,b',
        amount: 10,
        frequency: 'monthly',
        dayOfMonth: 1,
        categoryId: 'cat-1',
      },
      {
        description: 'plain',
        amount: 25.5,
        frequency: 'monthly',
        dayOfMonth: 14,
      },
    ])
  })
})
