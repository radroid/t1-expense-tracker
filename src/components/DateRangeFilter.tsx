import { useState } from 'react'
import './DateRangeFilter.css'

interface DateRangeFilterProps {
  value: { from: string; to: string } | null
  onChange: (range: { from: string; to: string } | null) => void
}

// Two date inputs with local draft state. We only fire onChange when both
// ends are filled (so the user can pick one end without the parent committing
// a partial range). The clear button resets both draft fields and fires
// onChange(null). The parent's `value` initialises the draft; we don't try to
// reactively re-sync if the parent mutates `value` externally — App owns the
// reset flow via the clear button or a remount key.
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [from, setFrom] = useState(value?.from ?? '')
  const [to, setTo] = useState(value?.to ?? '')

  const emit = (nextFrom: string, nextTo: string) => {
    if (nextFrom !== '' && nextTo !== '') {
      onChange({ from: nextFrom, to: nextTo })
    } else if (value !== null) {
      onChange(null)
    }
  }

  return (
    <div
      className="date-range-filter"
      role="group"
      aria-label="Date range filter"
    >
      <label className="date-range-filter__label" htmlFor="date-range-from">
        From
      </label>
      <input
        id="date-range-from"
        type="date"
        className="date-range-filter__from"
        value={from}
        onChange={(e) => {
          const next = e.target.value
          setFrom(next)
          emit(next, to)
        }}
      />
      <label className="date-range-filter__label" htmlFor="date-range-to">
        To
      </label>
      <input
        id="date-range-to"
        type="date"
        className="date-range-filter__to"
        value={to}
        onChange={(e) => {
          const next = e.target.value
          setTo(next)
          emit(from, next)
        }}
      />
      {value !== null && (
        <button
          type="button"
          className="date-range-filter__clear"
          aria-label="Clear date range"
          onClick={() => {
            setFrom('')
            setTo('')
            onChange(null)
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}
