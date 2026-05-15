import './Spinner.css'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  label?: string
  size?: SpinnerSize
}

// Pure-CSS loading indicator. The animated ring is decorative (aria-hidden)
// while the label is exposed via aria-label AND a visually-hidden text node
// so screen readers always have something to read. Under
// prefers-reduced-motion the CSS short-circuits the keyframes — the static
// label remains the source of truth for users.
export function Spinner({ label = 'Loading…', size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`spinner spinner--${size}`}
      role="status"
      aria-label={label}
    >
      <span className="spinner__ring" aria-hidden="true" />
      <span className="spinner__label-sr">{label}</span>
    </div>
  )
}
