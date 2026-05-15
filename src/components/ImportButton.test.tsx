import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportButton } from './ImportButton'
import { CSV_HEADER } from '../lib/csv'
import type { ExpenseInput } from '../lib/expense'
import type { BulkAddResult } from '../hooks/useExpenses'

function fileFromText(text: string, name = 'expenses.csv'): File {
  return new File([text], name, { type: 'text/csv' })
}

describe('ImportButton', () => {
  it('renders an "Import CSV" button label', () => {
    const onImport = vi.fn<(inputs: ExpenseInput[]) => Promise<BulkAddResult>>()
    render(<ImportButton onImport={onImport} />)
    expect(screen.getByText(/import csv/i)).toBeInTheDocument()
  })

  it('selecting a valid CSV calls onImport with parsed rows and renders a success summary', async () => {
    const onImport = vi
      .fn<(inputs: ExpenseInput[]) => Promise<BulkAddResult>>()
      .mockResolvedValue({ added: 1, skipped: 0, errors: [] })

    const user = userEvent.setup()
    render(<ImportButton onImport={onImport} />)

    const input = screen.getByLabelText(/import csv/i) as HTMLInputElement
    const text = `${CSV_HEADER}\n2026-05-15,10,Coffee,\n`
    await user.upload(input, fileFromText(text))

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1))
    expect(onImport.mock.calls[0][0]).toEqual([
      { amount: 10, description: 'Coffee', date: '2026-05-15' },
    ])

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/imported 1/i)
    expect(status).toHaveTextContent(/skipped 0/i)
  })

  it('a CSV with a bad header shows the header error and does NOT call onImport', async () => {
    const onImport = vi
      .fn<(inputs: ExpenseInput[]) => Promise<BulkAddResult>>()
      .mockResolvedValue({ added: 0, skipped: 0, errors: [] })

    const user = userEvent.setup()
    render(<ImportButton onImport={onImport} />)

    const input = screen.getByLabelText(/import csv/i) as HTMLInputElement
    // wrong header
    const text = `foo,bar,baz\n2026-05-15,10,Coffee\n`
    await user.upload(input, fileFromText(text))

    // P6.C a11y-029: header error now uses role="alert" (parity with
    // RecurringImport) — a rejected header is an immediate error, not a
    // passive status update.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/invalid or missing header/i)
    expect(onImport).not.toHaveBeenCalled()
  })

  it('mixed validity CSV: onImport gets the valid rows; summary shows skipped count + error lines', async () => {
    const onImport = vi
      .fn<(inputs: ExpenseInput[]) => Promise<BulkAddResult>>()
      .mockResolvedValue({
        added: 1,
        skipped: 1,
        errors: ['persistence failure for Coffee'],
      })

    const user = userEvent.setup()
    render(<ImportButton onImport={onImport} />)

    const input = screen.getByLabelText(/import csv/i) as HTMLInputElement
    const text =
      `${CSV_HEADER}\n` +
      `2026-05-15,10,Coffee,\n` +
      `2026-13-40,5,BadDate,\n` // skipped by parse
    await user.upload(input, fileFromText(text))

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1))
    // parse should have skipped the bad-date row before onImport
    expect(onImport.mock.calls[0][0]).toEqual([
      { amount: 10, description: 'Coffee', date: '2026-05-15' },
    ])

    const status = await screen.findByRole('status')
    // The summary should report what the parser AND onImport saw. We display
    // the combined skipped count (1 parse skip + 1 from onImport's result).
    expect(status).toHaveTextContent(/imported 1/i)
    expect(status).toHaveTextContent(/skipped 2/i)
    expect(status.textContent ?? '').toMatch(/persistence failure/i)
    expect(status.textContent ?? '').toMatch(/date/i)
  })
})
