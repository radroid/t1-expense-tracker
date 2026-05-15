import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton } from './ExportButton'
import { formatExpensesCsv } from '../lib/csv'
import type { Expense } from '../lib/expense'

const sample: Expense[] = [
  {
    id: 'e1',
    amount: 10,
    description: 'Coffee',
    date: '2026-05-15',
  },
]

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExportButton', () => {
  it('renders an "Export CSV" button — disabled when expenses are empty', () => {
    render(<ExportButton expenses={[]} />)
    const btn = screen.getByRole('button', { name: /export csv/i })
    expect(btn).toBeDisabled()
  })

  it('on click, calls URL.createObjectURL with a Blob and triggers the download anchor', async () => {
    const clicks: HTMLAnchorElement[] = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        const a = el as HTMLAnchorElement
        // Replace click with a recording stub — calling the real click()
        // in jsdom logs "Not implemented: navigation to another Document".
        a.click = vi.fn(() => {
          clicks.push(a)
        })
      }
      return el
    })

    const user = userEvent.setup()
    render(<ExportButton expenses={sample} />)
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = (URL.createObjectURL as unknown as { mock: { calls: [Blob][] } })
      .mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toMatch(/text\/csv/)
    expect(clicks).toHaveLength(1)
    expect(clicks[0].href).toContain('blob:mock-url')
    expect(clicks[0].download).toMatch(/^expenses-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('exported Blob contents match formatExpensesCsv(expenses)', async () => {
    let capturedBlob: Blob | undefined
    vi.mocked(URL.createObjectURL).mockImplementation((obj: Blob | MediaSource) => {
      if (obj instanceof Blob) capturedBlob = obj
      return 'blob:mock-url'
    })

    const user = userEvent.setup()
    render(<ExportButton expenses={sample} />)
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    expect(capturedBlob).toBeDefined()
    const text = await capturedBlob!.text()
    expect(text).toBe(formatExpensesCsv(sample))
  })
})
