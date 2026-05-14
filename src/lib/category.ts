export interface Category {
  id: string
  name: string
  color: string
}

export interface CategoryInput {
  name: string
  color: string
}

const COLOR_RE = /^#[0-9a-fA-F]{6}$/

function validateCategoryInput(input: CategoryInput): CategoryInput {
  const { name, color } = input

  const trimmedName = name.trim()
  if (trimmedName.length === 0) {
    throw new Error('Invalid name: must be non-empty')
  }

  if (!COLOR_RE.test(color)) {
    throw new Error('Invalid color: must be a hex color like #rrggbb')
  }

  return { name: trimmedName, color }
}

export function createCategory(input: CategoryInput): Category {
  const cleaned = validateCategoryInput(input)
  return { id: crypto.randomUUID(), ...cleaned }
}

export const DEFAULT_CATEGORIES: CategoryInput[] = [
  { name: 'Food', color: '#ef4444' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Housing', color: '#8b5cf6' },
  { name: 'Entertainment', color: '#f59e0b' },
  { name: 'Other', color: '#6b7280' },
]
