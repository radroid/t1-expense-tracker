/**
 * URL-hash serialization for the app's view filter state.
 *
 * The lib is pure — no `window.location`, no full-URL parsing. Callers
 * pass and receive the hash fragment WITHOUT the leading "#".
 *
 * Stable key order for the serialized string: month, cat, q, from, to.
 *
 * Encoding follows `URLSearchParams.toString()`, which means spaces in
 * values are encoded as "+", not "%20". Parsing accepts either form.
 */

export interface FilterState {
  selectedMonth: string
  filter: string
  searchTerm: string
  dateRange: { from: string; to: string } | null
}

const MONTH_RE = /^\d{4}-\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function serializeFilters(state: FilterState): string {
  const params = new URLSearchParams()

  if (state.selectedMonth !== '') {
    params.set('month', state.selectedMonth)
  }

  if (state.filter !== 'all') {
    params.set('cat', state.filter)
  }

  const trimmedSearch = state.searchTerm.trim()
  if (trimmedSearch !== '') {
    params.set('q', trimmedSearch)
  }

  if (state.dateRange !== null) {
    const { from, to } = state.dateRange
    if (from !== '') params.set('from', from)
    if (to !== '') params.set('to', to)
  }

  return params.toString()
}

export function parseFilters(hash: string): Partial<FilterState> {
  const params = new URLSearchParams(hash)
  const result: Partial<FilterState> = {}

  const month = params.get('month')
  if (month !== null && MONTH_RE.test(month)) {
    result.selectedMonth = month
  }

  const cat = params.get('cat')
  if (cat !== null) {
    result.filter = cat
  }

  const q = params.get('q')
  if (q !== null) {
    result.searchTerm = q
  }

  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const hasFrom = rawFrom !== null
  const hasTo = rawTo !== null

  if (hasFrom || hasTo) {
    const validFrom = hasFrom && DATE_RE.test(rawFrom!) ? rawFrom! : ''
    const validTo = hasTo && DATE_RE.test(rawTo!) ? rawTo! : ''
    if (validFrom !== '' || validTo !== '') {
      result.dateRange = { from: validFrom, to: validTo }
    }
  }

  return result
}
