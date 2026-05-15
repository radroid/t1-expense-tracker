import { useState } from 'react'
import type { Category, CategoryInput } from '../lib/category'
import { FieldError } from './FieldError'
import './CategoryManager.css'

interface CategoryManagerProps {
  categories: Category[]
  onAdd: (input: CategoryInput) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  // P6.E — block-while-in-use cascade UX. Optional; when omitted, behaves
  // as if every category has 0 references (Delete always enabled). The
  // App.tsx orchestration layer wires this to expensesHook.expenses.filter(...).
  getInUseCount?: (categoryId: string) => number
}

type AddErrorField = 'add-name' | null

const ADD_ERROR_ID = 'category-add-error'

const DEFAULT_COLOR = '#888888'

export function CategoryManager({
  categories,
  onAdd,
  onRename,
  onDelete,
  getInUseCount,
}: CategoryManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [error, setError] = useState('')
  // Discriminated state for which field the current add-form error
  // belongs to. Single-field today, but the union keeps the wiring
  // shape consistent with the other forms (a11y-P1 TD.18).
  const [errorField, setErrorField] = useState<AddErrorField>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (trimmedName === '') {
      setError('Please enter a category name.')
      setErrorField('add-name')
      return
    }

    onAdd({ name: trimmedName, color })
    setError('')
    setErrorField(null)
    setName('')
  }

  return (
    <div className="category-manager">
      <ul className="category-manager__list">
        {categories.map((category) => (
          <CategoryRow
            key={`${category.id}:${category.name}`}
            category={category}
            onRename={onRename}
            onDelete={onDelete}
            inUseCount={(getInUseCount ?? (() => 0))(category.id)}
          />
        ))}
      </ul>

      <form className="category-manager__add" onSubmit={handleSubmit}>
        <div className="category-manager__field">
          <label htmlFor="category-new-name">New category name</label>
          <input
            id="category-new-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errorField === 'add-name' ? true : undefined}
            aria-describedby={ADD_ERROR_ID}
          />
        </div>

        <div className="category-manager__field">
          <label htmlFor="category-new-color">Color</label>
          <input
            id="category-new-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <FieldError id={ADD_ERROR_ID} message={error === '' ? null : error} />

        <button type="submit">Add category</button>
      </form>
    </div>
  )
}

interface CategoryRowProps {
  category: Category
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  // Computed at the parent level so the (() => 0) fallback only lives in one
  // place. Row stays a dumb renderer.
  inUseCount: number
}

function CategoryRow({
  category,
  onRename,
  onDelete,
  inUseCount,
}: CategoryRowProps) {
  const [name, setName] = useState(category.name)

  function handleRename() {
    const trimmedName = name.trim()
    if (trimmedName === '') {
      // a11y-P1 TD.18: rather than adding an inline error to every row
      // (which would multiply alert regions on the page), we revert the
      // local draft to the canonical name. The Save button silently
      // no-ops were the previous behavior; the revert here makes the
      // resolution visible to the user.
      setName(category.name)
      return
    }
    onRename(category.id, trimmedName)
  }

  const isInUse = inUseCount > 0
  // The "·" separator + count text matches the inline-annotation pattern
  // used elsewhere (cf. expense row date/category). Singular vs plural
  // matters: "1 expense" vs "N expenses".
  const countLabel = isInUse
    ? `· ${inUseCount} ${inUseCount === 1 ? 'expense' : 'expenses'}`
    : ''

  return (
    <li className="category-manager__row">
      <span
        className="category-manager__swatch"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span className="category-manager__name">{category.name}</span>
      {isInUse && (
        <span className="category-manager__count">{countLabel}</span>
      )}
      <input
        type="text"
        aria-label={`Rename ${category.name}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        aria-label={`Save ${category.name}`}
        onClick={handleRename}
      >
        Save
      </button>
      <button
        type="button"
        aria-label={
          isInUse
            ? `Delete ${category.name} (blocked: ${inUseCount} in use)`
            : `Delete ${category.name}`
        }
        title={isInUse ? `${inUseCount} expense(s) use this category` : undefined}
        disabled={isInUse}
        onClick={() => onDelete(category.id)}
      >
        Delete
      </button>
    </li>
  )
}
