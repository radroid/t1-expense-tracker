import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurringExport } from './RecurringExport'
import {
  RECURRING_CSV_HEADER,
  formatTemplatesCsv,
} from '../lib/recurringCsv'
import type { RecurringTemplate } from '../lib/recurring'

const sample: RecurringTemplate[] = [
  {
    id: 't1',
    description: 'Rent',
    amount: 1500,
    frequency: 'monthly',
    dayOfMonth: 1,
  },
]

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RecurringExport', () => {
  it('renders an "Export templates" button', () => {
    render(<RecurringExport templates={[]} />)
    expect(
      screen.getByRole('button', { name: /export.*template/i }),
    ).toBeInTheDocument()
  })

  it('on click, creates a Blob (text/csv) and triggers a download anchor with a dated filename', async () => {
    const clicks: HTMLAnchorElement[] = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        const a = el as HTMLAnchorElement
        a.click = vi.fn(() => {
          clicks.push(a)
        })
      }
      return el
    })

    const user = userEvent.setup()
    render(<RecurringExport templates={sample} />)
    await user.click(screen.getByRole('button', { name: /export.*template/i }))

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = (
      URL.createObjectURL as unknown as { mock: { calls: [Blob][] } }
    ).mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toMatch(/text\/csv/)
    expect(clicks).toHaveLength(1)
    expect(clicks[0].href).toContain('blob:mock-url')
    expect(clicks[0].download).toMatch(
      /^recurring-templates-\d{4}-\d{2}-\d{2}\.csv$/,
    )
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('clicking with an empty list still produces a header-only CSV blob', async () => {
    let capturedBlob: Blob | undefined
    vi.mocked(URL.createObjectURL).mockImplementation(
      (obj: Blob | MediaSource) => {
        if (obj instanceof Blob) capturedBlob = obj
        return 'blob:mock-url'
      },
    )
    // Stub anchor click so jsdom doesn't whine.
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        const a = el as HTMLAnchorElement
        a.click = vi.fn()
      }
      return el
    })

    const user = userEvent.setup()
    render(<RecurringExport templates={[]} />)
    await user.click(screen.getByRole('button', { name: /export.*template/i }))

    expect(capturedBlob).toBeDefined()
    const text = await capturedBlob!.text()
    expect(text).toBe(formatTemplatesCsv([]))
    expect(text).toBe(RECURRING_CSV_HEADER + '\n')
  })
})
