import {
  createRecurringTemplate,
  type RecurringTemplate,
  type RecurringTemplateInput,
} from './recurring'

// CSV columns: description,amount,dayOfMonth,categoryId
// (categoryId is optional; renders as an empty cell when missing.)
// `frequency` is intentionally NOT a column — today it's always 'monthly',
// and round-tripping that single literal in every row is noise. When
// non-monthly frequencies land we'll need a column for it; parser tests
// would catch the omission.
export const RECURRING_CSV_HEADER = 'description,amount,dayOfMonth,categoryId'

const EXPECTED_COLUMNS = ['description', 'amount', 'dayofmonth', 'categoryid']

export interface ParseError {
  row: number
  message: string
}

export interface ParseResult {
  rows: RecurringTemplateInput[]
  errors: ParseError[]
}

function csvQuote(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return '"' + field.replace(/"/g, '""') + '"'
  }
  return field
}

// Formats recurring templates as a CSV string (header + rows; \n line endings).
export function formatTemplatesCsv(templates: RecurringTemplate[]): string {
  const lines: string[] = [RECURRING_CSV_HEADER]
  for (const t of templates) {
    const cells = [
      csvQuote(t.description),
      String(t.amount),
      String(t.dayOfMonth),
      t.categoryId !== undefined ? csvQuote(t.categoryId) : '',
    ]
    lines.push(cells.join(','))
  }
  return lines.join('\n') + '\n'
}

// Tokenize a CSV document into rows of fields. Duplicated from csv.ts on
// purpose — lifting it into a shared helper is out of scope for this iter,
// flagged as a future tech-debt item. Keep behavior bit-identical to csv.ts.
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

// Parses a CSV string into RecurringTemplateInput rows. See the contract in
// the recurringCsv.test.ts file for full behavior.
export function parseTemplatesCsv(text: string): ParseResult {
  const tokenized = tokenizeCsv(text)
  if (tokenized.length === 0) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'Invalid or missing header' }],
    }
  }
  const [headerRow, ...dataRows] = tokenized
  if (!headerMatches(headerRow)) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'Invalid or missing header' }],
    }
  }

  const rows: RecurringTemplateInput[] = []
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
    const [descriptionRaw, amountRaw, dayRaw, categoryIdRaw] = cells
    const description = descriptionRaw
    const amountStr = amountRaw.trim()
    const dayStr = dayRaw.trim()
    const categoryId = categoryIdRaw.trim()

    const amount = Number(amountStr)
    if (amountStr === '' || Number.isNaN(amount)) {
      errors.push({ row: rowNumber, message: `Invalid amount: ${amountStr}` })
      return
    }

    const dayOfMonth = Number(dayStr)
    if (dayStr === '' || Number.isNaN(dayOfMonth)) {
      errors.push({
        row: rowNumber,
        message: `Invalid dayOfMonth: ${dayStr}`,
      })
      return
    }

    const input: RecurringTemplateInput = {
      description,
      amount,
      frequency: 'monthly',
      dayOfMonth,
    }
    if (categoryId !== '') input.categoryId = categoryId

    try {
      // Run through createRecurringTemplate's validation so parse-time
      // errors match what the hook's createRecurringTemplate would throw.
      createRecurringTemplate(input)
    } catch (e) {
      errors.push({
        row: rowNumber,
        message: e instanceof Error ? e.message : 'Invalid row',
      })
      return
    }

    const cleaned: RecurringTemplateInput = {
      description: description.trim(),
      amount,
      frequency: 'monthly',
      dayOfMonth,
    }
    if (categoryId !== '') cleaned.categoryId = categoryId
    rows.push(cleaned)
  })

  return { rows, errors }
}
