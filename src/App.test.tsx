import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import App from './App'
import * as expenseStore from './db/expenseStore'

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('expense-tracker')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () =>
      reject(new Error('deleteDatabase blocked — a connection was left open'))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Renders App and waits for the mount-time IndexedDB load to settle, so no
// connection outlives the test (the next beforeEach deletes the database).
async function renderApp(): Promise<void> {
  render(<App />)
  await screen.findByText('No expenses yet.')
}

async function addExpenseViaForm(
  amount: string,
  description: string,
): Promise<void> {
  const user = userEvent.setup()
  await user.clear(screen.getByLabelText('Amount'))
  await user.type(screen.getByLabelText('Amount'), amount)
  await user.clear(screen.getByLabelText('Description'))
  await user.type(screen.getByLabelText('Description'), description)
  await user.click(screen.getByRole('button', { name: /add expense/i }))
}

describe('App', () => {
  it('renders the heading', async () => {
    await renderApp()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('adds a valid expense via the form and shows it in the list', async () => {
    await renderApp()
    await addExpenseViaForm('12.50', 'Coffee')
    expect(await screen.findByText(/Coffee/)).toBeInTheDocument()
  })

  it('persists added expenses across remounts', async () => {
    const { unmount } = render(<App />)
    await screen.findByText('No expenses yet.')
    await addExpenseViaForm('30', 'Groceries')
    await screen.findByText(/Groceries/)
    unmount()

    render(<App />)
    expect(await screen.findByText(/Groceries/)).toBeInTheDocument()
  })

  it('shows a running total that reflects added expenses', async () => {
    await renderApp()
    await addExpenseViaForm('10', 'Coffee')
    await screen.findByText(/Coffee/)
    await addExpenseViaForm('15.50', 'Lunch')
    await screen.findByText(/Lunch/)

    expect(
      screen.getByText('$25.50', { selector: '.running-total__amount' }),
    ).toBeInTheDocument()
  })

  it('edits an existing expense via the edit form', async () => {
    const user = userEvent.setup()
    await renderApp()
    await addExpenseViaForm('10', 'Coffee')
    await screen.findByText(/Coffee/)

    await user.click(screen.getByRole('button', { name: /edit coffee/i }))
    const description = screen.getByLabelText('Description')
    await user.clear(description)
    await user.type(description, 'Espresso')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText(/Espresso/)).toBeInTheDocument()
    expect(screen.queryByText(/Coffee/)).not.toBeInTheDocument()
  })

  it('rejects an invalid edit and keeps the edit form open', async () => {
    const user = userEvent.setup()
    await renderApp()
    await addExpenseViaForm('10', 'Coffee')
    await screen.findByText(/Coffee/)

    await user.click(screen.getByRole('button', { name: /edit coffee/i }))
    const amount = screen.getByLabelText('Amount')
    await user.clear(amount)
    await user.type(amount, '0')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument()
  })

  it('cancels an edit without changing the expense', async () => {
    const user = userEvent.setup()
    await renderApp()
    await addExpenseViaForm('10', 'Coffee')
    await screen.findByText(/Coffee/)

    await user.click(screen.getByRole('button', { name: /edit coffee/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByText(/Coffee/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
  })

  it('deletes an expense via its row delete button', async () => {
    const user = userEvent.setup()
    await renderApp()
    await addExpenseViaForm('15', 'Lunch')
    await screen.findByText(/Lunch/)

    await user.click(screen.getByRole('button', { name: /delete lunch/i }))

    expect(await screen.findByText('No expenses yet.')).toBeInTheDocument()
  })

  it('shows an error and keeps the expense when delete fails', async () => {
    const user = userEvent.setup()
    await renderApp()
    await addExpenseViaForm('15', 'Lunch')
    await screen.findByText(/Lunch/)

    vi.spyOn(expenseStore, 'removeExpense').mockRejectedValueOnce(
      new Error('store failure'),
    )
    await user.click(screen.getByRole('button', { name: /delete lunch/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Lunch/)).toBeInTheDocument()
  })

  it('rejects an invalid amount and surfaces the error without adding', async () => {
    await renderApp()
    await addExpenseViaForm('-5', 'Bad expense')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/Bad expense/)).not.toBeInTheDocument()
  })

  // Category names also appear as <option>s in the expense form's category
  // picker — scope these assertions to the CategoryManager's name spans.
  const inManager = { selector: '.category-manager__name' } as const

  it('seeds and shows the default categories on first run', async () => {
    await renderApp()
    expect(screen.getByText('Food', inManager)).toBeInTheDocument()
    expect(screen.getByText('Transport', inManager)).toBeInTheDocument()
  })

  it('adds a category via the category manager', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.type(screen.getByLabelText('New category name'), 'Travel')
    await user.click(screen.getByRole('button', { name: /add category/i }))

    expect(await screen.findByText('Travel', inManager)).toBeInTheDocument()
  })

  it('deletes a category via the category manager', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: /delete food/i }))

    await waitFor(() =>
      expect(screen.queryByText('Food', inManager)).not.toBeInTheDocument(),
    )
  })
})
