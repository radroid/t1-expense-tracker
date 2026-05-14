import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect } from 'vitest'
import App from './App'

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('expense-tracker')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () =>
      reject(new Error('deleteDatabase blocked — a connection was left open'))
  })
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

  it('deletes an expense via its row delete button', async () => {
    const user = userEvent.setup()
    await renderApp()
    await addExpenseViaForm('15', 'Lunch')
    await screen.findByText(/Lunch/)

    await user.click(screen.getByRole('button', { name: /delete lunch/i }))

    expect(await screen.findByText('No expenses yet.')).toBeInTheDocument()
  })

  it('rejects an invalid amount and surfaces the error without adding', async () => {
    await renderApp()
    await addExpenseViaForm('-5', 'Bad expense')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/Bad expense/)).not.toBeInTheDocument()
  })
})
