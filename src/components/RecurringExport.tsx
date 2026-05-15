import { formatTemplatesCsv } from '../lib/recurringCsv'
import type { RecurringTemplate } from '../lib/recurring'
import './RecurringExport.css'

interface RecurringExportProps {
  templates: RecurringTemplate[]
}

function todayIsoDate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Mirrors <ExportButton> for the recurring-template list. Unlike the expense
// export, this button is NOT disabled when the list is empty — the resulting
// header-only CSV is still a valid template-list export, and that's a useful
// "starter file" the user can edit and re-import.
export function RecurringExport({ templates }: RecurringExportProps) {
  function handleClick() {
    const text = formatTemplatesCsv(templates)
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recurring-templates-${todayIsoDate()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      className="recurring-export"
      onClick={handleClick}
    >
      Export templates CSV
    </button>
  )
}
