import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import App from './App'
import * as expenseStore from './db/expenseStore'
import { addRecurringTemplate } from './db/recurringTemplateStore'
import { createRecurringTemplate } from './lib/recurring'

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

  it('filters the expense list, running total, and spending breakdown by category', async () => {
    const user = userEvent.setup()
    await renderApp()

    // Pick "Food" in the form for the first expense, "Transport" for the second.
    await user.clear(screen.getByLabelText('Amount'))
    await user.type(screen.getByLabelText('Amount'), '10')
    await user.clear(screen.getByLabelText('Description'))
    await user.type(screen.getByLabelText('Description'), 'Lunch')
    await user.selectOptions(screen.getByLabelText('Category'), 'Food')
    await user.click(screen.getByRole('button', { name: /add expense/i }))
    await screen.findByText(/Lunch/)

    await user.clear(screen.getByLabelText('Amount'))
    await user.type(screen.getByLabelText('Amount'), '25')
    await user.clear(screen.getByLabelText('Description'))
    await user.type(screen.getByLabelText('Description'), 'Taxi')
    await user.selectOptions(screen.getByLabelText('Category'), 'Transport')
    await user.click(screen.getByRole('button', { name: /add expense/i }))
    await screen.findByText(/Taxi/)

    // All: both rows + total $35.
    expect(screen.getByText(/Lunch/)).toBeInTheDocument()
    expect(screen.getByText(/Taxi/)).toBeInTheDocument()
    expect(
      screen.getByText('$35.00', { selector: '.running-total__amount' }),
    ).toBeInTheDocument()

    // Filter → Food: only Lunch + total $10 + breakdown only shows Food $10.
    await user.selectOptions(
      screen.getByLabelText('Filter by category'),
      'Food',
    )
    expect(screen.getByText(/Lunch/)).toBeInTheDocument()
    expect(screen.queryByText(/Taxi/)).not.toBeInTheDocument()
    expect(
      screen.getByText('$10.00', { selector: '.running-total__amount' }),
    ).toBeInTheDocument()
    // SpendingByCategory section now reflects the filtered slice.
    expect(
      screen.getByText('$10.00', { selector: '.spending-by-category__total' }),
    ).toBeInTheDocument()
  })

  it('switches months: previous month hides current-month expenses (P3.C)', async () => {
    const user = userEvent.setup()
    await renderApp()

    await addExpenseViaForm('20', 'This-month coffee')
    await screen.findByText(/This-month coffee/)

    // Visible by default — selectedMonth defaults to the current calendar month.
    expect(screen.getByText(/This-month coffee/)).toBeInTheDocument()

    // Step back one month — the current-month expense should disappear.
    await user.click(screen.getByRole('button', { name: /previous month/i }))
    expect(
      await screen.findByText('No expenses yet.'),
    ).toBeInTheDocument()

    // Step forward again — it returns.
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(await screen.findByText(/This-month coffee/)).toBeInTheDocument()
  })

  it('shows budget vs actual + over-budget warning when spend exceeds budget (P3.B + P3.F)', async () => {
    const user = userEvent.setup()
    await renderApp()

    // Before setting a budget: empty-state copy in BudgetVsActual.
    expect(
      screen.getByText('No budget set for this month.'),
    ).toBeInTheDocument()

    // Set a $50 budget for the current month.
    await user.clear(screen.getByLabelText('Budget amount'))
    await user.type(screen.getByLabelText('Budget amount'), '50')
    await user.click(screen.getByRole('button', { name: /set budget/i }))

    // Budget-vs-actual now shows numbers; no warning yet (no expenses).
    expect(
      screen.queryByText(/over budget by/i),
    ).not.toBeInTheDocument()

    // Spend $75 — past the budget — and the over-budget alert appears.
    await addExpenseViaForm('75', 'Splurge')
    await screen.findByText(/Splurge/)
    const alert = await screen.findByText(/over budget by/i)
    expect(alert).toBeInTheDocument()
  })

  it('searches expense descriptions and narrows the list (P4.A)', async () => {
    const user = userEvent.setup()
    await renderApp()

    await addExpenseViaForm('10', 'Coffee')
    await screen.findByText(/Coffee/)
    await addExpenseViaForm('25', 'Taxi')
    await screen.findByText(/Taxi/)

    // Both visible by default.
    expect(screen.getByText(/Coffee/)).toBeInTheDocument()
    expect(screen.getByText(/Taxi/)).toBeInTheDocument()

    // Search "coff" — Coffee remains, Taxi disappears.
    await user.type(screen.getByLabelText('Search'), 'coff')
    expect(screen.getByText(/Coffee/)).toBeInTheDocument()
    expect(screen.queryByText(/Taxi/)).not.toBeInTheDocument()

    // Clear → both visible again.
    await user.click(screen.getByRole('button', { name: /clear search/i }))
    expect(screen.getByText(/Coffee/)).toBeInTheDocument()
    expect(screen.getByText(/Taxi/)).toBeInTheDocument()
  })

  it('renders MonthlySummary that scopes with the visible expenses (P3.E)', async () => {
    await renderApp()
    await addExpenseViaForm('20', 'Lunch')
    await screen.findByText(/Lunch/)
    await addExpenseViaForm('30', 'Dinner')
    await screen.findByText(/Dinner/)

    // Total $50, Average $25, Count 2 — via the .monthly-summary__value scope.
    expect(
      screen.getByText('$50.00', { selector: '.monthly-summary__value' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('$25.00', { selector: '.monthly-summary__value' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('2', { selector: '.monthly-summary__value' }),
    ).toBeInTheDocument()
  })

  it('auto-generates a recurring expense for the current month on mount (P4.E)', async () => {
    // Seed a recurring template directly via the store BEFORE mount, so the
    // rollover effect fires on the first useEffect tick. We use dayOfMonth=1
    // so the generated date is always YYYY-MM-01 of the current month.
    // We then UNMOUNT the seeding connection's children explicitly before
    // mounting App to avoid concurrent IndexedDB transactions across tests.
    const template = createRecurringTemplate({
      description: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dayOfMonth: 1,
    })
    await addRecurringTemplate(template)

    const { unmount } = render(<App />)
    // The auto-generated expense should appear in the list (no manual add).
    expect(await screen.findByText(/Rent/)).toBeInTheDocument()
    // Settle: idempotent — the post-addMany rollover re-fire must observe
    // Rent and bail. We scope to the expense list because RecurringManager
    // also renders "Rent" as a template; the unscoped match would always
    // see ≥2 elements regardless of dedupe correctness.
    await waitFor(() => {
      const list = document.querySelector('.expense-list')
      expect(list).not.toBeNull()
      expect(
        list!.querySelectorAll('.expense-list__description'),
      ).toHaveLength(1)
    })
    // Explicit unmount + macrotask flush so the trailing IndexedDB close()
    // settles before the next test's deleteDatabase tries to evict it.
    unmount()
    await new Promise<void>((r) => setTimeout(r, 0))
  })

  it('resets the filter to "All" when the filtered-on category is deleted', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.clear(screen.getByLabelText('Amount'))
    await user.type(screen.getByLabelText('Amount'), '10')
    await user.clear(screen.getByLabelText('Description'))
    await user.type(screen.getByLabelText('Description'), 'Lunch')
    await user.selectOptions(screen.getByLabelText('Category'), 'Food')
    await user.click(screen.getByRole('button', { name: /add expense/i }))
    await screen.findByText(/Lunch/)

    const filterSelect = screen.getByLabelText(
      'Filter by category',
    ) as HTMLSelectElement
    await user.selectOptions(filterSelect, 'Food')
    expect(filterSelect.value).not.toBe('all')

    // Delete the Food category — filter must snap back to 'all', and the
    // (now-orphan) Lunch expense stays visible.
    await user.click(screen.getByRole('button', { name: /delete food/i }))

    await waitFor(() => expect(filterSelect.value).toBe('all'))
    expect(screen.getByText(/Lunch/)).toBeInTheDocument()
  })
})
