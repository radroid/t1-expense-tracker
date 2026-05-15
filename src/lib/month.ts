// Helpers for 'YYYY-MM' month strings — the format MonthlyBudget keys on
// and the month-switcher tracks. All functions are pure; no Date arithmetic
// leaks beyond this module (input + output are always strings).

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/

// Returns the current calendar month as 'YYYY-MM' (based on the local clock).
export function currentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// Returns the 'YYYY-MM' prefix of a 'YYYY-MM-DD' date string.
export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7)
}

function parse(month: string): { year: number; monthNum: number } {
  const match = MONTH_RE.exec(month)
  if (!match) throw new Error(`Invalid month: ${month}`)
  return { year: Number(match[1]), monthNum: Number(match[2]) }
}

function format(year: number, monthNum: number): string {
  return `${year}-${String(monthNum).padStart(2, '0')}`
}

export function prevMonth(month: string): string {
  const { year, monthNum } = parse(month)
  return monthNum === 1 ? format(year - 1, 12) : format(year, monthNum - 1)
}

export function nextMonth(month: string): string {
  const { year, monthNum } = parse(month)
  return monthNum === 12 ? format(year + 1, 1) : format(year, monthNum + 1)
}

const labelFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// Renders 'YYYY-MM' as e.g. 'May 2026' for the month-switcher header.
export function formatMonthLabel(month: string): string {
  const { year, monthNum } = parse(month)
  // Day 1 in UTC avoids timezone bleed (e.g. local date being the prior month
  // in some zones for day 1 of the next month).
  return labelFormatter.format(new Date(Date.UTC(year, monthNum - 1, 1)))
}

// Returns today's date as 'YYYY-MM-DD' for use as a filename suffix on
// downloaded files (CSV, JSON backup, recurring templates). UTC-based to
// match the timezone-safety pattern used by formatMonthLabel — that costs
// users near the day boundary one calendar day of "off-by-one" filename
// labelling, but in exchange every user on every clock gets the same
// deterministic name and we avoid the local-vs-UTC boundary bug that the
// three duplicated todayIsoDate() helpers previously had.
export function isoDateToday(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
