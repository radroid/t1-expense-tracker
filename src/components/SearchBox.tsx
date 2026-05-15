import './SearchBox.css'

interface SearchBoxProps {
  value: string
  onChange: (term: string) => void
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="search-box">
      <label htmlFor="search-box-input" className="search-box__label">
        Search
      </label>
      <input
        id="search-box-input"
        type="text"
        className="search-box__input"
        placeholder="Search descriptions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value !== '' && (
        <button
          type="button"
          className="search-box__clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
