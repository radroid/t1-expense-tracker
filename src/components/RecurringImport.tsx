import { parseTemplatesCsv } from '../lib/recurringCsv'
import type { RecurringTemplateInput } from '../lib/recurring'
import type { RecurringBulkAddResult } from '../hooks/useRecurringTemplates'
import { useFilePicker } from '../hooks/useFilePicker'
import { useParsedFileImporter } from '../hooks/useParsedFileImporter'
import './RecurringImport.css'

interface RecurringImportProps {
  onImport: (
    inputs: RecurringTemplateInput[],
  ) => Promise<RecurringBulkAddResult>
}

// Mirrors <ImportButton> for recurring templates. File picker → text →
// parse → onImport. Header errors render inline (role="alert"); per-row
// parse/import errors render inside the status summary as "Row N: …" so
// the user can find the offending CSV line.
//
// TD.14: shared mechanics live in useFilePicker + useParsedFileImporter.
export function RecurringImport({ onImport }: RecurringImportProps) {
  const importer = useParsedFileImporter<RecurringTemplateInput>({
    parse: parseTemplatesCsv,
    importFn: onImport,
  })
  const { inputRef, onChange } = useFilePicker({
    onFile: (text) => importer.onFile(text),
  })

  return (
    <div className="recurring-import">
      <label className="recurring-import__label">
        <span className="recurring-import__cta">Import templates CSV</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="recurring-import__input"
          onChange={onChange}
        />
      </label>
      {importer.headerError !== '' && (
        <p
          role="alert"
          className="recurring-import__result recurring-import__result--error"
        >
          {importer.headerError}
        </p>
      )}
      {importer.summary !== '' && (
        // P6.C a11y-028: `<p>` cannot legally contain `<details>` (block
        // child) — the browser auto-closes the `<p>`, breaking the live
        // region. Switch the root to a `<div>` so the live region stays
        // intact when the disclosure is toggled.
        <div
          role="status"
          aria-live="polite"
          className="recurring-import__result"
        >
          {importer.summary}
          {importer.rowErrors.length > 0 && (
            <details className="recurring-import__errors">
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
