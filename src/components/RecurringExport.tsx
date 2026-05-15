import { formatTemplatesCsv } from '../lib/recurringCsv'
import { downloadFile } from '../lib/downloadFile'
import { isoDateToday } from '../lib/month'
import type { RecurringTemplate } from '../lib/recurring'
import './RecurringExport.css'

interface RecurringExportProps {
  templates: RecurringTemplate[]
}

// Mirrors <ExportButton> for the recurring-template list. Unlike the expense
// export, this button is NOT disabled when the list is empty — the resulting
// header-only CSV is still a valid template-list export, and that's a useful
// "starter file" the user can edit and re-import.
export function RecurringExport({ templates }: RecurringExportProps) {
  function handleClick() {
    downloadFile({
      filename: `recurring-templates-${isoDateToday()}.csv`,
      mime: 'text/csv;charset=utf-8',
      body: formatTemplatesCsv(templates),
    })
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
