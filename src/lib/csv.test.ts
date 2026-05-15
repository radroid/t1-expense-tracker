import { describe, it, expect } from 'vitest'
import { CSV_HEADER, formatExpensesCsv, parseExpensesCsv } from './csv'
import type { Expense } from './expense'

describe('formatExpensesCsv', () => {
  it('emits only the header line (with trailing newline) for an empty list', () => {
    expect(formatExpensesCsv([])).toBe(CSV_HEADER + '\n')
  })

  it('formats a simple row that round-trips through parseExpensesCsv', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
      },
    ]
    const text = formatExpensesCsv(expenses)
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toEqual([
      { amount: 10, description: 'Coffee', date: '2026-05-15' },
    ])
  })

  it('quotes and escapes descriptions containing commas, newlines, and quotes', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 5,
        description: 'a,b',
        date: '2026-05-15',
      },
      {
        id: 'e2',
        amount: 7,
        description: 'line1\nline2',
        date: '2026-05-15',
      },
      {
        id: 'e3',
        amount: 9,
        description: 'has "quotes"',
        date: '2026-05-15',
      },
    ]
    const text = formatExpensesCsv(expenses)
    expect(text).toContain('"a,b"')
    expect(text).toContain('"line1\nline2"')
    expect(text).toContain('"has ""quotes"""')

    // Round-trip:
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows.map((r) => r.description)).toEqual([
      'a,b',
      'line1\nline2',
      'has "quotes"',
    ])
  })

  it('renders missing categoryId / recurring as empty cells', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
      },
    ]
    const text = formatExpensesCsv(expenses)
    // header + 1 data row + trailing \n => lines = ['header','data','']
    const lines = text.split('\n')
    expect(lines[1]).toBe('2026-05-15,10,Coffee,,')
  })

  it('renders categoryId and recurring when present', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
        categoryId: 'cat-1',
        recurring: true,
      },
    ]
    const text = formatExpensesCsv(expenses)
    const lines = text.split('\n')
    expect(lines[1]).toBe('2026-05-15,10,Coffee,cat-1,true')
  })
})

describe('parseExpensesCsv', () => {
  it('rejects missing header — returns header error and no rows', () => {
    const result = parseExpensesCsv('2026-05-15,10,Coffee,,\n')
    expect(result.rows).toEqual([])
    expect(result.errors).toEqual([
      { row: 0, message: 'Invalid or missing header' },
    ])
  })

  it('accepts header with mixed case and extra spaces around columns', () => {
    const text = ' Date , Amount , Description , CategoryId , Recurring \n2026-05-15,10,Coffee,,\n'
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toEqual([
      { amount: 10, description: 'Coffee', date: '2026-05-15' },
    ])
  })

  it('returns empty rows and empty errors when body is empty', () => {
    expect(parseExpensesCsv(CSV_HEADER + '\n')).toEqual({ rows: [], errors: [] })
    expect(parseExpensesCsv(CSV_HEADER)).toEqual({ rows: [], errors: [] })
  })

  it('reports an error and skips rows with invalid amount', () => {
    const text = `${CSV_HEADER}\n2026-05-15,-5,Bad,,\n2026-05-15,10,Coffee,,\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(rows).toEqual([
      { amount: 10, description: 'Coffee', date: '2026-05-15' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(2)
    expect(errors[0].message).toMatch(/amount/i)
  })

  it('reports an error and skips rows with invalid date', () => {
    const text = `${CSV_HEADER}\n2026-13-40,10,Coffee,,\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(2)
    expect(errors[0].message).toMatch(/date/i)
  })

  it('reports an error and skips rows with invalid recurring value (not silently false)', () => {
    const text = `${CSV_HEADER}\n2026-05-15,10,Coffee,,maybe\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(2)
    expect(errors[0].message).toMatch(/recurring/i)
  })

  it('parses recurring true/false (case-insensitive)', () => {
    const text = `${CSV_HEADER}\n2026-05-15,10,A,,TRUE\n2026-05-15,11,B,,False\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows[0].recurring).toBe(true)
    expect(rows[1].recurring).toBe(false)
  })

  it('omits categoryId and recurring when their cells are empty', () => {
    const text = `${CSV_HEADER}\n2026-05-15,10,Coffee,,\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
    expect(Object.prototype.hasOwnProperty.call(rows[0], 'categoryId')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(rows[0], 'recurring')).toBe(false)
  })

  it('ignores trailing empty lines', () => {
    const text = `${CSV_HEADER}\n2026-05-15,10,Coffee,,\n\n\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
  })

  it('handles quoted fields containing commas, newlines, and escaped quotes', () => {
    const text =
      `${CSV_HEADER}\n` +
      `2026-05-15,10,"has, comma",,\n` +
      `2026-05-15,11,"line1\nline2",,\n` +
      `2026-05-15,12,"has ""quotes""",,\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows.map((r) => r.description)).toEqual([
      'has, comma',
      'line1\nline2',
      'has "quotes"',
    ])
  })

  it('uses 1-indexed row numbers with header = row 1, first data row = row 2', () => {
    const text =
      `${CSV_HEADER}\n` +
      `2026-05-15,10,Coffee,,\n` + // row 2 - ok
      `2026-13-40,10,Bad,,\n` + // row 3 - bad
      `2026-05-15,12,Good,,\n` // row 4 - ok
    const { rows, errors } = parseExpensesCsv(text)
    expect(rows).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(3)
  })

  it('round-trips formatted output back to the same row data', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 10,
        description: 'a,b',
        date: '2026-05-15',
        categoryId: 'cat-1',
        recurring: true,
      },
      {
        id: 'e2',
        amount: 25.5,
        description: 'plain',
        date: '2026-05-14',
      },
    ]
    const text = formatExpensesCsv(expenses)
    const { rows, errors } = parseExpensesCsv(text)
    expect(errors).toEqual([])
    expect(rows).toEqual([
      {
        amount: 10,
        description: 'a,b',
        date: '2026-05-15',
        categoryId: 'cat-1',
        recurring: true,
      },
      {
        amount: 25.5,
        description: 'plain',
        date: '2026-05-14',
      },
    ])
  })

  it('reports an error when a row has the wrong number of columns', () => {
    const text = `${CSV_HEADER}\n2026-05-15,10,Coffee\n`
    const { rows, errors } = parseExpensesCsv(text)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(2)
  })
})
