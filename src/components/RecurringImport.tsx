import { useRef, useState } from 'react'
import { parseTemplatesCsv, type ParseError } from '../lib/recurringCsv'
import type { RecurringTemplateInput } from '../lib/recurring'
import type { RecurringBulkAddResult } from '../hooks/useRecurringTemplates'
import './RecurringImport.css'

interface RecurringImportProps {
  onImport: (
    inputs: RecurringTemplateInput[],
  ) => Promise<RecurringBulkAddResult>
}

interface Summary {
  added: number
  skipped: number
  errors: string[]
}

// Mirrors <ImportButton> for recurring templates. File picker → text →
// parse → onImport. Header errors render inline (role="alert"); per-row
// parse/import errors render inside the status summary as "Row N: …" so
// the user can find the offending CSV line.
export function RecurringImport({ onImport }: RecurringImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [headerError, setHeaderError] = useState<string>('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (inputRef.current !== null) inputRef.current.value = ''
    if (!file) return

    setHeaderError('')
    setSummary(null)

    const text = await file.text()
    const { rows, errors } = parseTemplatesCsv(text)

    const headerErr = errors.find((er: ParseError) => er.row === 0)
    if (headerErr !== undefined) {
      setHeaderError(headerErr.message)
      return
    }

    const parseErrorMessages = errors.map(
      (er) => `Row ${er.row}: ${er.message}`,
    )

    const result = await onImport(rows)
    setSummary({
      added: result.added,
      skipped: errors.length + result.skipped,
      errors: [...parseErrorMessages, ...result.errors],
    })
  }

  return (
    <div className="recurring-import">
      <label className="recurring-import__label">
        <span className="recurring-import__cta">Import templates CSV</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="recurring-import__input"
          onChange={handleChange}
        />
      </label>
      {headerError !== '' && (
        <p
          role="alert"
          className="recurring-import__result recurring-import__result--error"
        >
          {headerError}
        </p>
      )}
      {summary !== null && (
        <p role="status" className="recurring-import__result">
          Imported {summary.added}. Skipped {summary.skipped}.
          {summary.errors.length > 0 && (
            <details className="recurring-import__errors">
              <summary>Errors ({summary.errors.length})</summary>
              <ul>
                {summary.errors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </details>
          )}
        </p>
      )}
    </div>
  )
}
