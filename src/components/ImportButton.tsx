import { parseExpensesCsv } from '../lib/csv'
import type { ExpenseInput } from '../lib/expense'
import type { BulkAddResult } from '../hooks/useExpenses'
import { useFilePicker } from '../hooks/useFilePicker'
import { useParsedFileImporter } from '../hooks/useParsedFileImporter'
import './ImportButton.css'

interface ImportButtonProps {
  onImport: (inputs: ExpenseInput[]) => Promise<BulkAddResult>
}

// TD.14: file-picker mechanics + parse/import orchestration live in
// useFilePicker / useParsedFileImporter. This component is now just
// presentation + wiring.
export function ImportButton({ onImport }: ImportButtonProps) {
  const importer = useParsedFileImporter<ExpenseInput>({
    parse: parseExpensesCsv,
    importFn: onImport,
  })
  const { inputRef, onChange } = useFilePicker({
    onFile: (text) => importer.onFile(text),
  })

  return (
    <div className="import-button">
      <label className="import-button__label">
        <span className="import-button__cta">Import CSV</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="import-button__input"
          onChange={onChange}
        />
      </label>
      {importer.headerError !== '' && (
        // P6.C a11y-029: a rejected CSV header is an immediate error, not a
        // status update — match RecurringImport's role="alert" parity.
        <p role="alert" className="import-button__result import-button__result--error">
          {importer.headerError}
        </p>
      )}
      {importer.summary !== '' && (
        // P6.C a11y-028: `<p>` cannot legally contain a `<details>`
        // (block-level child); the browser auto-closes the `<p>` and that
        // breaks the live region. Use a `<div>` so the live-region root
        // stays intact across the details disclosure.
        <div role="status" aria-live="polite" className="import-button__result">
          {importer.summary}
          {importer.rowErrors.length > 0 && (
            <details className="import-button__errors">
              <summary>Errors ({importer.rowErrors.length})</summary>
              <ul>
                {importer.rowErrors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
