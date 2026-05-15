import type { Expense } from './expense'
import type { Category } from './category'
import type { MonthlyBudget } from './budget'
import type { RecurringTemplate } from './recurring'

// Bump this when the backup JSON shape changes in a non-backwards-compat
// way. Restore (P5.C) will refuse to load a snapshot whose schemaVersion
// it doesn't understand.
export const BACKUP_SCHEMA_VERSION = 1

export interface BackupSnapshot {
  schemaVersion: number
  exportedAt: string
  expenses: Expense[]
  categories: Category[]
  monthlyBudgets: MonthlyBudget[]
  recurringTemplates: RecurringTemplate[]
}

export interface BackupInput {
  expenses: Expense[]
  categories: Category[]
  monthlyBudgets: MonthlyBudget[]
  recurringTemplates: RecurringTemplate[]
}

// Pure builder. Caller supplies entity arrays from the four
// useStoredCollection hooks; we don't re-validate (they're already
// validated on write). `now` is injectable for deterministic tests.
export function buildBackup(
  input: BackupInput,
  now: () => Date = () => new Date(),
): BackupSnapshot {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now().toISOString(),
    expenses: input.expenses,
    categories: input.categories,
    monthlyBudgets: input.monthlyBudgets,
    recurringTemplates: input.recurringTemplates,
  }
}

// Serializes with stable top-level key order. We reconstruct the snapshot
// with keys inserted in the documented order, then JSON.stringify (string
// keys are emitted in insertion order per the ECMAScript spec). We
// deliberately do NOT pass a replacer array — that would also filter
// nested entity keys (id, amount, …) which we want to preserve verbatim.
export function formatBackup(snapshot: BackupSnapshot): string {
  const ordered: BackupSnapshot = {
    schemaVersion: snapshot.schemaVersion,
    exportedAt: snapshot.exportedAt,
    expenses: snapshot.expenses,
    categories: snapshot.categories,
    monthlyBudgets: snapshot.monthlyBudgets,
    recurringTemplates: snapshot.recurringTemplates,
  }
  return JSON.stringify(ordered, null, 2)
}
