import { BACKUP_SCHEMA_VERSION, type BackupSnapshot } from './backup'

export type BackupParseReason =
  | 'invalid-json'
  | 'invalid-shape'
  | 'unsupported-schema-version'

export class BackupParseError extends Error {
  // Declared explicitly (rather than via TS parameter-property shorthand)
  // because tsconfig has `erasableSyntaxOnly` — parameter properties are
  // non-erasable.
  reason: BackupParseReason
  constructor(reason: BackupParseReason, message: string) {
    super(message)
    this.name = 'BackupParseError'
    this.reason = reason
  }
}

const ARRAY_FIELDS = [
  'expenses',
  'categories',
  'monthlyBudgets',
  'recurringTemplates',
  'categoryBudgets',
] as const

// Parses a backup JSON string into a BackupSnapshot. Throws BackupParseError
// on:
//   - invalid-json: text doesn't parse via JSON.parse
//   - invalid-shape: parsed value is not an object, schemaVersion not a
//     number, exportedAt not a string, or any of the four top-level entity
//     fields is missing or not an array. We deliberately do NOT validate
//     individual entity fields — that's the entity factories' job, and the
//     restore path will fail downstream if a record is shaped wrong.
//   - unsupported-schema-version: schemaVersion is a number but differs
//     from BACKUP_SCHEMA_VERSION.
export function parseBackup(text: string): BackupSnapshot {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupParseError('invalid-json', 'Could not parse backup JSON.')
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new BackupParseError(
      'invalid-shape',
      'Backup must be a JSON object.',
    )
  }

  const candidate = parsed as Record<string, unknown>

  // schemaVersion must exist and be a number. We check missing first so the
  // error attributes the right reason — "missing" is invalid-shape, "wrong
  // value" is unsupported-schema-version.
  if (!('schemaVersion' in candidate)) {
    throw new BackupParseError(
      'invalid-shape',
      'Backup is missing schemaVersion.',
    )
  }
  if (typeof candidate.schemaVersion !== 'number') {
    throw new BackupParseError(
      'invalid-shape',
      'Backup schemaVersion must be a number.',
    )
  }
  if (candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupParseError(
      'unsupported-schema-version',
      `Unsupported backup version ${candidate.schemaVersion}. This app understands version ${BACKUP_SCHEMA_VERSION}.`,
    )
  }

  if (typeof candidate.exportedAt !== 'string') {
    throw new BackupParseError(
      'invalid-shape',
      'Backup exportedAt must be a string.',
    )
  }

  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(candidate[field])) {
      throw new BackupParseError(
        'invalid-shape',
        `Backup field "${field}" must be an array.`,
      )
    }
  }

  return candidate as unknown as BackupSnapshot
}
