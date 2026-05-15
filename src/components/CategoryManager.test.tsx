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

  // P6.E — category-deletion cascade UX. The block-while-in-use decision
  // surfaces here as a disabled Delete button + an inline count next to the
  // category name. `getInUseCount` is optional so existing tests that don't
  // care can omit it (defaults to a no-op returning 0).
  describe('in-use blocking (P6.E)', () => {
    it('Delete is enabled and unannotated when getInUseCount returns 0', () => {
      setup({ getInUseCount: () => 0 })

      const deleteBtn = screen.getByRole('button', { name: /delete Groceries/i })
      expect(deleteBtn).not.toBeDisabled()
      // No count annotation rendered.
      expect(screen.queryByText(/expense$/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/expenses$/i)).not.toBeInTheDocument()
    })

    it('Delete is enabled when getInUseCount prop is omitted entirely', () => {
      setup()
      const deleteBtn = screen.getByRole('button', { name: /delete Groceries/i })
      expect(deleteBtn).not.toBeDisabled()
    })

    it('Delete is disabled and shows "· 1 expense" when count is 1', () => {
      setup({ getInUseCount: (id) => (id === 'c1' ? 1 : 0) })

      const deleteBtn = screen.getByRole('button', { name: /delete Groceries/i })
      expect(deleteBtn).toBeDisabled()
      // The count text sits next to the name. Use a flexible matcher because
      // the "·" separator and the count share a row with the name.
      expect(screen.getByText(/·\s*1 expense\b/)).toBeInTheDocument()
    })

    it('pluralizes the count as "· 3 expenses" (not "3 expense")', () => {
      setup({ getInUseCount: (id) => (id === 'c2' ? 3 : 0) })

      const deleteBtn = screen.getByRole('button', { name: /delete Transport/i })
      expect(deleteBtn).toBeDisabled()
      expect(screen.getByText(/·\s*3 expenses\b/)).toBeInTheDocument()
    })

    it('disabled delete button does not fire onDelete when clicked', async () => {
      const user = userEvent.setup()
      const { onDelete } = setup({ getInUseCount: () => 2 })

      const deleteBtn = screen.getByRole('button', { name: /delete Groceries/i })
      expect(deleteBtn).toBeDisabled()

      // userEvent respects the `disabled` attribute and refuses to fire click.
      await user.click(deleteBtn)
      expect(onDelete).not.toHaveBeenCalled()
    })
  })

  // a11y-P1 TD.18 — form-error association on the add form's name input.
  describe('a11y form-error association', () => {
    it('marks the name input aria-invalid="true" on blank-name submit', async () => {
      const user = userEvent.setup()
      setup()
      const nameInput = screen.getByLabelText('New category name')
      expect(nameInput).not.toHaveAttribute('aria-invalid', 'true')

      await user.click(screen.getByRole('button', { name: /add category/i }))

      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('links the name input to the FieldError via aria-describedby', () => {
      setup()
      const nameInput = screen.getByLabelText('New category name')
      const describedBy = nameInput.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy!)).not.toBeNull()
    })

    it('reverts the row name draft to the canonical name when the user tries to save a blank rename', async () => {
      const user = userEvent.setup()
      const { onRename } = setup()
      const renameInput = screen.getByLabelText('Rename Groceries') as HTMLInputElement
      await user.clear(renameInput)
      // (input is now empty)
      await user.click(screen.getByRole('button', { name: /save Groceries/i }))
      // onRename was NOT called because the trimmed name was blank.
      expect(onRename).not.toHaveBeenCalled()
      // Draft is reverted to the canonical category name.
      expect(renameInput.value).toBe('Groceries')
    })
  })
})
