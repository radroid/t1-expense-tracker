import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Category } from '../lib/category'
import { CategoryManager } from './CategoryManager'

const categories: Category[] = [
  { id: 'c1', name: 'Groceries', color: '#ff0000' },
  { id: 'c2', name: 'Transport', color: '#00ff00' },
]

function setup(overrides: Partial<Parameters<typeof CategoryManager>[0]> = {}) {
  const onAdd = vi.fn()
  const onRename = vi.fn()
  const onDelete = vi.fn()
  render(
    <CategoryManager
      categories={categories}
      onAdd={onAdd}
      onRename={onRename}
      onDelete={onDelete}
      {...overrides}
    />,
  )
  return { onAdd, onRename, onDelete }
}

describe('CategoryManager', () => {
  it('renders all categories passed in', () => {
    setup()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })

  it('add: type a name + submit calls onAdd once and clears the name field', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()

    const nameInput = screen.getByLabelText('New category name')
    await user.type(nameInput, 'Dining')
    await user.click(screen.getByRole('button', { name: /add category/i }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({
      name: 'Dining',
      color: expect.any(String),
    })
    expect((nameInput as HTMLInputElement).value).toBe('')
  })

  it('add: blank name + submit does not call onAdd and shows an alert', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()

    await user.click(screen.getByRole('button', { name: /add category/i }))

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('rename: change a row name + commit calls onRename with id and new name', async () => {
    const user = userEvent.setup()
    const { onRename } = setup()

    const renameInput = screen.getByLabelText('Rename Groceries')
    await user.clear(renameInput)
    await user.type(renameInput, 'Food')
    await user.click(screen.getByRole('button', { name: /save Groceries/i }))

    expect(onRename).toHaveBeenCalledWith('c1', 'Food')
  })

  it('delete: click a row delete button calls onDelete with that id', async () => {
    const user = userEvent.setup()
    const { onDelete } = setup()

    await user.click(screen.getByRole('button', { name: /delete Transport/i }))

    expect(onDelete).toHaveBeenCalledWith('c2')
  })
})
