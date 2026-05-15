import type { Category } from '../lib/category'
import type { CategoryFilterValue } from '../lib/expenseFilter'
import './CategoryFilter.css'

interface CategoryFilterProps {
  value: CategoryFilterValue
  categories: Category[]
  onChange: (value: CategoryFilterValue) => void
}

export function CategoryFilter({
  value,
  categories,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="category-filter">
      <label htmlFor="category-filter" className="category-filter__label">
        Filter by category
      </label>
      <select
        id="category-filter"
        className="category-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value as CategoryFilterValue)}
      >
        <option value="all">All</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value="uncategorized">Uncategorized</option>
      </select>
    </div>
  )
}
