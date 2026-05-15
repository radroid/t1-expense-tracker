import { useRef, useState } from 'react'
import { parseExpensesCsv, type ParseError } from '../lib/csv'
import type { ExpenseInput } from '../lib/expense'
import type { BulkAddResult } from '../hooks/useExpenses'
import './ImportButton.css'

interface ImportButtonProps {
  onImport: (inputs: ExpenseInput[]) => Promise<BulkAddResult>
}

interface Summary {
  added: number
  skipped: number
  errors: string[]
}

export function ImportButton({ onImport }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [headerError, setHeaderError] = useState<string>('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset the input so picking the same file twice re-fires onChange.
    if (inputRef.current !== null) inputRef.current.value = ''
    if (!file) return

    setHeaderError('')
    setSummary(null)

    const text = await file.text()
    const { rows, errors } = parseExpensesCsv(text)

    // Header error: row === 0 means parser rejected the document outright.
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
      // Combine parse-time skips with bulk-add-time skips.
      skipped: errors.length + result.skipped,
      errors: [...parseErrorMessages, ...result.errors],
    })
  }

  return (
    <div className="import-button">
      <label className="import-button__label">
        <span className="import-button__cta">Import CSV</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="import-button__input"
          onChange={handleChange}
        />
      </label>
      {headerError !== '' && (
        <p role="status" className="import-button__result import-button__result--error">
          {headerError}
        </p>
      )}
      {summary !== null && (
        <p role="status" className="import-button__result">
          Imported {summary.added}. Skipped {summary.skipped}.
          {summary.errors.length > 0 && (
            <details className="import-button__errors">
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
