// Helpers for 'YYYY' year strings — mirrors src/lib/month.ts in shape and
// discipline. All functions are pure; input + output are always strings (or
// throw on invalid input). Year arithmetic stays inside this module so
// callers never see raw Date math.

const YEAR_RE = /^\d{4}$/

// Returns the current calendar year as 'YYYY' (based on the local clock).
export function currentYear(): string {
  return String(new Date().getFullYear())
}

// Parses a 'YYYY' string to a number. Throws on anything else (no bounds —
// any 4-digit year is accepted).
export function parseYear(year: string): number {
  if (!YEAR_RE.test(year)) {
    throw new Error(`Invalid year: ${year}`)
  }
  return Number(year)
}

function format(year: number): string {
  return String(year).padStart(4, '0')
}

export function prevYear(year: string): string {
  return format(parseYear(year) - 1)
}

export function nextYear(year: string): string {
  return format(parseYear(year) + 1)
}

// Pass-through for now — kept as a function so the year-switcher header can
// gain richer formatting (e.g. "FY 2026") without touching callers.
export function formatYearLabel(year: string): string {
  return year
}
