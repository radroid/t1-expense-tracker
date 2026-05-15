import { useId } from 'react'
import {
  CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from '../lib/currency'
import './CurrencySelector.css'

interface CurrencySelectorProps {
  value: CurrencyCode
  onChange: (c: CurrencyCode) => void
}

/**
 * Labeled <select> for picking the display currency from the allowlist.
 * Stateless — App owns the currency via useCurrency().
 */
export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const id = useId()
  return (
    <span className="currency-selector">
      <label htmlFor={id} className="currency-selector__label">
        Currency
      </label>
      <select
        id={id}
        className="currency-selector__select"
        value={value}
        onChange={(e) => {
          // The <select>'s value is constrained to the rendered options;
          // the guard is belt-and-braces against a future option leak.
          const next = e.target.value
          if (isCurrencyCode(next)) onChange(next)
        }}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </span>
  )
}
