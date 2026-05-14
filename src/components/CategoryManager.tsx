import { useState } from 'react'
import type { Category, CategoryInput } from '../lib/category'
import './CategoryManager.css'

interface CategoryManagerProps {
  categories: Category[]
  onAdd: (input: CategoryInput) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

const DEFAULT_COLOR = '#888888'

export function CategoryManager({
  categories,
  onAdd,
  onRename,
  onDelete,
}: CategoryManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (trimmedName === '') {
      setError('Please enter a category name.')
      return
    }

    onAdd({ name: trimmedName, color })
    setError('')
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

        {error && (
          <p className="category-manager__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit">Add category</button>
      </form>
    </div>
  )
}

interface CategoryRowProps {
  category: Category
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function CategoryRow({ category, onRename, onDelete }: CategoryRowProps) {
  const [name, setName] = useState(category.name)

  function handleRename() {
    const trimmedName = name.trim()
    if (trimmedName === '') {
      return
    }
    onRename(category.id, trimmedName)
  }

  return (
    <li className="category-manager__row">
      <span
        className="category-manager__swatch"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span className="category-manager__name">{category.name}</span>
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
        aria-label={`Delete ${category.name}`}
        onClick={() => onDelete(category.id)}
      >
        Delete
      </button>
    </li>
  )
}
