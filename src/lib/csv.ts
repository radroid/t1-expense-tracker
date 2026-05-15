import { createExpense, type Expense, type ExpenseInput } from './expense'

// CSV columns: date,amount,description,categoryId
// (categoryId is optional; renders as an empty cell when missing.)
export const CSV_HEADER = 'date,amount,description,categoryId'

const EXPECTED_COLUMNS = ['date', 'amount', 'description', 'categoryid']

export interface ParseError {
  row: number
  message: string
}

export interface ParseResult {
  rows: ExpenseInput[]
  errors: ParseError[]
}

function csvQuote(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return '"' + field.replace(/"/g, '""') + '"'
  }
  return field
}

// Formats expenses as a CSV string (header + rows; \n line endings).
export function formatExpensesCsv(expenses: Expense[]): string {
  const lines: string[] = [CSV_HEADER]
  for (const e of expenses) {
    const cells = [
      e.date,
      String(e.amount),
      csvQuote(e.description),
      e.categoryId !== undefined ? csvQuote(e.categoryId) : '',
    ]
    lines.push(cells.join(','))
  }
  return lines.join('\n') + '\n'
}

// Tokenize a CSV document into rows of fields. Each row is an array of
// (already-unquoted) strings. Handles RFC-4180-ish quoting: a quoted field
// can contain commas, newlines, and `""` for escaped quotes.
function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let i = 0
  let inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    // not in quotes
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (ch === '\r') {
      // handle CRLF + lone CR as line terminators
      if (text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += ch
    i++
  }
  // flush last field/row (no trailing newline case)
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function headerMatches(cells: string[]): boolean {
  if (cells.length !== EXPECTED_COLUMNS.length) return false
  for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
    if (cells[i].trim().toLowerCase() !== EXPECTED_COLUMNS[i]) return false
  }
  return true
}

// Parses a CSV string into ExpenseInput rows. See header comment in this file
// and the test file for the full contract.
export function parseExpensesCsv(text: string): ParseResult {
  const tokenized = tokenizeCsv(text)
  if (tokenized.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'Invalid or missing header' }] }
  }
  const [headerRow, ...dataRows] = tokenized
  if (!headerMatches(headerRow)) {
    return { rows: [], errors: [{ row: 0, message: 'Invalid or missing header' }] }
  }

  const rows: ExpenseInput[] = []
  const errors: ParseError[] = []

  dataRows.forEach((cells, idx) => {
    const rowNumber = idx + 2 // 1-indexed, header is row 1
    // Skip wholly-empty trailing rows.
    if (cells.length === 1 && cells[0] === '') return
    if (cells.length !== EXPECTED_COLUMNS.length) {
      errors.push({
        row: rowNumber,
        message: `Wrong number of columns (expected ${EXPECTED_COLUMNS.length}, got ${cells.length})`,
      })
      return
    }
    const [dateRaw, amountRaw, descriptionRaw, categoryIdRaw] = cells
    const date = dateRaw.trim()
    const amountStr = amountRaw.trim()
    const description = descriptionRaw
    const categoryId = categoryIdRaw.trim()

    const amount = Number(amountStr)
    if (amountStr === '' || Number.isNaN(amount)) {
      errors.push({ row: rowNumber, message: `Invalid amount: ${amountStr}` })
      return
    }

    const input: ExpenseInput = {
      amount,
      description,
      date,
    }
    if (categoryId !== '') input.categoryId = categoryId

    try {
      // Run through createExpense's validation to mirror its contract.
      createExpense(input)
    } catch (e) {
      errors.push({
        row: rowNumber,
        message: e instanceof Error ? e.message : 'Invalid row',
      })
      return
    }

    // Use the trimmed description from validation (createExpense trims it).
    const cleaned: ExpenseInput = {
      amount,
      description: description.trim(),
      date,
    }
    if (categoryId !== '') cleaned.categoryId = categoryId
    rows.push(cleaned)
  })

  return { rows, errors }
}
