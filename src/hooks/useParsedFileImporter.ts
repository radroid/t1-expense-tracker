import { useCallback, useState } from 'react'

// Orchestrator hook for the parse → import → summary flow shared by
// ImportButton (expenses CSV) and RecurringImport (recurring-template CSV).
// Owns three state slots — headerError, summary, rowErrors — and binds
// them to a (pure parse) + (bulk-add) pair. BackupRestore intentionally
// does NOT use this hook: its flow diverges with a confirmation dialog +
// atomic restore, and the iter-030 arch pass decided to keep that
// divergence local rather than overload this orchestrator.

export interface ParserRowError {
  row: number
  message: string
}

export interface ParserResult<TInput> {
  rows: TInput[]
  errors: ParserRowError[]
}

export interface BulkImportResult {
  added: number
  skipped: number
  errors: string[]
}

export interface UseParsedFileImporterArgs<TInput> {
  /**
   * Pure parser — returns rows + per-row errors with 1-indexed row numbers.
   * `row: 0` is the convention for a rejected document header.
   */
  parse: (text: string) => ParserResult<TInput>
  /** Bulk-add handler — e.g. useExpenses.addMany. */
  importFn: (inputs: TInput[]) => Promise<BulkImportResult>
}

export interface UseParsedFileImporter {
  /** Header-rejection error. Empty string when none. */
  headerError: string
  /** "Imported X. Skipped Y." after a non-header outcome. Empty otherwise. */
  summary: string
  /** Combined parse + import row errors, with "Row N: " prefix on parse errors. */
  rowErrors: string[]
  /** onFile handler to wire into useFilePicker.onFile. */
  onFile: (text: string) => Promise<void>
  /** Clear all three state slots — useful when callers want to dismiss. */
  reset: () => void
}

export function useParsedFileImporter<TInput>(
  args: UseParsedFileImporterArgs<TInput>,
): UseParsedFileImporter {
  const { parse, importFn } = args

  const [headerError, setHeaderError] = useState('')
  const [summary, setSummary] = useState('')
  const [rowErrors, setRowErrors] = useState<string[]>([])

  const reset = useCallback(() => {
    setHeaderError('')
    setSummary('')
    setRowErrors([])
  }, [])

  const onFile = useCallback(
    async (text: string): Promise<void> => {
      // Start clean so a previous run's state doesn't bleed in.
      setHeaderError('')
      setSummary('')
      setRowErrors([])

      const { rows, errors } = parse(text)

      // Header rejection: parser refused the document outright. Surface
      // the header message and skip the import call.
      const headerErr = errors.find((e) => e.row === 0)
      if (headerErr !== undefined) {
        setHeaderError(headerErr.message)
        return
      }

      const parseErrorMessages = errors.map((e) => `Row ${e.row}: ${e.message}`)
      const result = await importFn(rows)
      // Parse skips and import skips both count toward "skipped".
      const skipped = errors.length + result.skipped
      setSummary(`Imported ${result.added}. Skipped ${skipped}.`)
      setRowErrors([...parseErrorMessages, ...result.errors])
    },
    [parse, importFn],
  )

  return { headerError, summary, rowErrors, onFile, reset }
}
