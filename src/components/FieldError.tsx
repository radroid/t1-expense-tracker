import './FieldError.css'

interface FieldErrorProps {
  // id consumed by the associated input's aria-describedby. Stable across
  // empty/non-empty toggles so the input can describe-by it unconditionally.
  id: string
  // Empty string OR null hides the message but keeps the slot in the DOM
  // so the layout doesn't jump on error AND the live-region reference
  // stays stable for assistive tech.
  message: string | null
}

// Inline form-error slot with first-class screen-reader behavior:
//   - Always rendered in the DOM under a stable id, so any number of
//     inputs can `aria-describedby={id}` unconditionally.
//   - `aria-live="polite"` so SR announces the text on insertion.
//   - `role="alert"` is added only when the message is non-empty — this
//     mirrors the original per-form alert behavior (visible alert ↔ has
//     role) and ensures empty/initial state isn't announced as an alert.
//   - Reserves vertical space via CSS so the layout doesn't jump when the
//     error appears.
export function FieldError({ id, message }: FieldErrorProps) {
  const hasMessage = message !== null && message !== ''
  return (
    <p
      id={id}
      className={`field-error${hasMessage ? ' field-error--shown' : ''}`}
      role={hasMessage ? 'alert' : undefined}
      aria-live="polite"
    >
      {hasMessage ? message : ''}
    </p>
  )
}
