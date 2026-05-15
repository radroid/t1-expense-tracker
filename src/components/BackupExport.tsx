import { buildBackup, formatBackup } from '../lib/backup'
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

function todayIsoDate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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
    const text = formatBackup(snapshot)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${todayIsoDate()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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
