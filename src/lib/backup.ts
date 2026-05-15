import type { Expense } from './expense'
import type { Category } from './category'
import type { MonthlyBudget } from './budget'
import type { RecurringTemplate } from './recurring'
import type { CategoryBudget } from './categoryBudget'

// Bump this when the backup JSON shape changes in a non-backwards-compat
// way. Restore (P5.C) will refuse to load a snapshot whose schemaVersion
// it doesn't understand.
//
// v2 (iter-021, P5.D): added `categoryBudgets` array. v1 snapshots are
// refused — silently loading v1 would drop the new entity on restore.
export const BACKUP_SCHEMA_VERSION = 2

export interface BackupSnapshot {
  schemaVersion: number
  exportedAt: string
  expenses: Expense[]
  categories: Category[]
  monthlyBudgets: MonthlyBudget[]
  recurringTemplates: RecurringTemplate[]
  categoryBudgets: CategoryBudget[]
}

export interface BackupInput {
  expenses: Expense[]
  categories: Category[]
  monthlyBudgets: MonthlyBudget[]
  recurringTemplates: RecurringTemplate[]
  categoryBudgets: CategoryBudget[]
}

// Pure builder. Caller supplies entity arrays from the five
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
    categoryBudgets: input.categoryBudgets,
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
    categoryBudgets: snapshot.categoryBudgets,
  }
  return JSON.stringify(ordered, null, 2)
}
