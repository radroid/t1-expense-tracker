import { buildBackup, formatBackup } from '../lib/backup'
import { downloadFile } from '../lib/downloadFile'
import { isoDateToday } from '../lib/month'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import type { MonthlyBudget } from '../lib/budget'
import type { RecurringTemplate } from '../lib/recurring'
import type { CategoryBudget } from '../lib/categoryBudget'
import './BackupExport.css'

interface BackupExportProps {
  expenses: Expense[]
  categories: Category[]
  monthlyBudgets: MonthlyBudget[]
  recurringTemplates: RecurringTemplate[]
  categoryBudgets: CategoryBudget[]
}

export function BackupExport({
  expenses,
  categories,
  monthlyBudgets,
  recurringTemplates,
  categoryBudgets,
}: BackupExportProps) {
  function handleClick() {
    const snapshot = buildBackup({
      expenses,
      categories,
      monthlyBudgets,
      recurringTemplates,
      categoryBudgets,
    })
    downloadFile({
      filename: `backup-${isoDateToday()}.json`,
      mime: 'application/json',
      body: formatBackup(snapshot),
    })
  }

  return (
    <button
      type="button"
      className="backup-export-button"
      onClick={handleClick}
    >
      Export backup (JSON)
    </button>
  )
}
