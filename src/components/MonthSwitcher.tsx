import { formatMonthLabel, nextMonth, prevMonth } from '../lib/month'
import './MonthSwitcher.css'

interface MonthSwitcherProps {
  value: string
  onChange: (month: string) => void
}

export function MonthSwitcher({ value, onChange }: MonthSwitcherProps) {
  return (
    <div className="month-switcher" role="group" aria-label="Month switcher">
      <button
        type="button"
        className="month-switcher__prev"
        aria-label="Previous month"
        onClick={() => onChange(prevMonth(value))}
      >
        <span aria-hidden="true">←</span>
      </button>
      <span className="month-switcher__label">{formatMonthLabel(value)}</span>
      <button
        type="button"
        className="month-switcher__next"
        aria-label="Next month"
        onClick={() => onChange(nextMonth(value))}
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}
