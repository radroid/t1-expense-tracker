import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurringImport } from './RecurringImport'
import { RECURRING_CSV_HEADER } from '../lib/recurringCsv'
import type { RecurringTemplateInput } from '../lib/recurring'
import type { RecurringBulkAddResult } from '../hooks/useRecurringTemplates'

function fileFromText(text: string, name = 'recurring.csv'): File {
  return new File([text], name, { type: 'text/csv' })
}

describe('RecurringImport', () => {
  it('renders an "Import templates" button label', () => {
    const onImport =
      vi.fn<
        (inputs: RecurringTemplateInput[]) => Promise<RecurringBulkAddResult>
      >()
    render(<RecurringImport onImport={onImport} />)
    expect(screen.getByText(/import.*template/i)).toBeInTheDocument()
  })

  it('selecting a valid CSV calls onImport with parsed rows and renders a success summary', async () => {
    const onImport = vi
      .fn<
        (inputs: RecurringTemplateInput[]) => Promise<RecurringBulkAddResult>
      >()
      .mockResolvedValue({ added: 1, skipped: 0, errors: [] })

    const user = userEvent.setup()
    render(<RecurringImport onImport={onImport} />)

    const input = screen.getByLabelText(
      /import.*template/i,
    ) as HTMLInputElement
    const text = `${RECURRING_CSV_HEADER}\nRent,1500,1,\n`
    await user.upload(input, fileFromText(text))

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1))
    expect(onImport.mock.calls[0][0]).toEqual([
      {
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ])

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/imported 1/i)
    expect(status).toHaveTextContent(/skipped 0/i)
  })

  it('a CSV with a bad header shows the header error and does NOT call onImport', async () => {
    const onImport = vi
      .fn<
        (inputs: RecurringTemplateInput[]) => Promise<RecurringBulkAddResult>
      >()
      .mockResolvedValue({ added: 0, skipped: 0, errors: [] })

    const user = userEvent.setup()
    render(<RecurringImport onImport={onImport} />)

    const input = screen.getByLabelText(
      /import.*template/i,
    ) as HTMLInputElement
    const text = `foo,bar,baz,qux\nRent,1500,1,\n`
    await user.upload(input, fileFromText(text))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/invalid or missing header/i)
    expect(onImport).not.toHaveBeenCalled()
  })

  it('mixed validity CSV: onImport gets the valid rows; summary shows skipped count + error lines', async () => {
    const onImport = vi
      .fn<
        (inputs: RecurringTemplateInput[]) => Promise<RecurringBulkAddResult>
      >()
      .mockResolvedValue({
        added: 1,
        skipped: 0,
        errors: [],
      })

    const user = userEvent.setup()
    render(<RecurringImport onImport={onImport} />)

    const input = screen.getByLabelText(
      /import.*template/i,
    ) as HTMLInputElement
    const text =
      `${RECURRING_CSV_HEADER}\n` +
      `Rent,1500,1,\n` +
      `Bad,10,0,\n` // skipped by parse (bad dayOfMonth)
    await user.upload(input, fileFromText(text))

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1))
    expect(onImport.mock.calls[0][0]).toEqual([
      {
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      },
    ])

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/imported 1/i)
    // 1 parse skip + 0 onImport skips = 1
    expect(status).toHaveTextContent(/skipped 1/i)
    expect(status.textContent ?? '').toMatch(/day/i)
  })

  it('preserves parse-time row context (Row N: …) in the displayed error list', async () => {
    const onImport = vi
      .fn<
        (inputs: RecurringTemplateInput[]) => Promise<RecurringBulkAddResult>
      >()
      .mockResolvedValue({ added: 1, skipped: 0, errors: [] })

    const user = userEvent.setup()
    render(<RecurringImport onImport={onImport} />)

    const input = screen.getByLabelText(
      /import.*template/i,
    ) as HTMLInputElement
    const text =
      `${RECURRING_CSV_HEADER}\n` +
      `Bad,10,0,\n` + // row 2 bad dayOfMonth
      `Rent,1500,1,\n` // row 3 ok
    await user.upload(input, fileFromText(text))

    const status = await screen.findByRole('status')
    // Row 2 should be referenced in the error list.
    expect(status.textContent ?? '').toMatch(/Row 2/)
  })
})
