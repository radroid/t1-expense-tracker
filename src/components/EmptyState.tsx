import type { ReactNode } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  title: string
  hint?: string
  icon?: ReactNode
}

// Shared zero-data presentation. role="status" so screen readers announce it
// when it appears (e.g. after a filter wipes the list to empty). The icon, if
// provided, is purely decorative — kept out of the accessibility tree.
export function EmptyState({ title, hint, icon }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      {icon ? (
        <span className="empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="empty-state__title">{title}</p>
      {hint ? <p className="empty-state__hint">{hint}</p> : null}
    </div>
  )
}
