import { formatYearLabel, nextYear, prevYear } from '../lib/year'
import './YearSwitcher.css'

interface YearSwitcherProps {
  value: string
  onChange: (year: string) => void
}

export function YearSwitcher({ value, onChange }: YearSwitcherProps) {
  return (
    <div className="year-switcher" role="group" aria-label="Year switcher">
      <button
        type="button"
        className="year-switcher__prev"
        aria-label="Previous year"
        onClick={() => onChange(prevYear(value))}
      >
        ←
      </button>
      <span className="year-switcher__label">{formatYearLabel(value)}</span>
      <button
        type="button"
        className="year-switcher__next"
        aria-label="Next year"
        onClick={() => onChange(nextYear(value))}
      >
        →
      </button>
    </div>
  )
}
