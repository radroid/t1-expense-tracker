import { formatExpensesCsv } from '../lib/csv'
import { downloadFile } from '../lib/downloadFile'
import { isoDateToday } from '../lib/month'
import type { Expense } from '../lib/expense'
import './ExportButton.css'

interface ExportButtonProps {
  expenses: Expense[]
}

export function ExportButton({ expenses }: ExportButtonProps) {
  const disabled = expenses.length === 0

  function handleClick() {
    downloadFile({
      filename: `expenses-${isoDateToday()}.csv`,
      mime: 'text/csv;charset=utf-8',
      body: formatExpensesCsv(expenses),
    })
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
