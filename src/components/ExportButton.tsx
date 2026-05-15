import { formatExpensesCsv } from '../lib/csv'
import type { Expense } from '../lib/expense'
import './ExportButton.css'

interface ExportButtonProps {
  expenses: Expense[]
}

function todayIsoDate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function ExportButton({ expenses }: ExportButtonProps) {
  const disabled = expenses.length === 0

  function handleClick() {
    const text = formatExpensesCsv(expenses)
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${todayIsoDate()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      className="export-button"
      onClick={handleClick}
      disabled={disabled}
    >
      Export CSV
    </button>
  )
}
