import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CategoryFilter } from './CategoryFilter'
import type { Category } from '../lib/category'

const food: Category = { id: 'cat-food', name: 'Food', color: '#ff8800' }
const transport: Category = {
  id: 'cat-trans',
  name: 'Transport',
  color: '#0088ff',
}

describe('CategoryFilter', () => {
  it('renders All / each category / Uncategorized options', () => {
    render(
      <CategoryFilter
        value="all"
        categories={[food, transport]}
        onChange={() => {}}
      />,
    )

    const select = screen.getByLabelText('Filter by category')
    const options = Array.from(
      select.querySelectorAll('option'),
    ) as HTMLOptionElement[]
    expect(options.map((o) => o.textContent)).toEqual([
      'All',
      'Food',
      'Transport',
      'Uncategorized',
    ])
    expect(options.map((o) => o.value)).toEqual([
      'all',
      'cat-food',
      'cat-trans',
      'uncategorized',
    ])
  })

  it('reflects the current value', () => {
    render(
      <CategoryFilter
        value="cat-food"
        categories={[food, transport]}
        onChange={() => {}}
      />,
    )
    expect(
      (screen.getByLabelText('Filter by category') as HTMLSelectElement).value,
    ).toBe('cat-food')
  })

  it('calls onChange with the selected value', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CategoryFilter
        value="all"
        categories={[food, transport]}
        onChange={onChange}
      />,
    )

    await user.selectOptions(
      screen.getByLabelText('Filter by category'),
      'cat-trans',
    )
    expect(onChange).toHaveBeenCalledWith('cat-trans')

    await user.selectOptions(
      screen.getByLabelText('Filter by category'),
      'uncategorized',
    )
    expect(onChange).toHaveBeenCalledWith('uncategorized')
  })
})
