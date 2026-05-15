import './Spinner.css'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  label?: string
  size?: SpinnerSize
}

// Pure-CSS loading indicator. role="status" is a live region (live=polite),
// but per WAI-ARIA `status` is NOT a name-from-content role — without an
// explicit aria-label the element has no accessible *name*, only an
// accessible *description* via its text. Both are kept on purpose:
// aria-label gives assistive tech a name; the visually-hidden span gives
// a visible/printable label that survives `prefers-reduced-motion` (when
// the ring stops animating it remains the cue for users).
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
