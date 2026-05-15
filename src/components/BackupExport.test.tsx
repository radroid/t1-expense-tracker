import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupExport } from './BackupExport'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import type { MonthlyBudget } from '../lib/budget'
import type { RecurringTemplate } from '../lib/recurring'
import type { CategoryBudget } from '../lib/categoryBudget'

const expenses: Expense[] = [
  { id: 'e1', amount: 10, description: 'Coffee', date: '2026-05-15' },
]
const categories: Category[] = [{ id: 'c1', name: 'Food', color: '#ff0000' }]
const monthlyBudgets: MonthlyBudget[] = [
  { month: '2026-05', amount: 500 },
]
const recurringTemplates: RecurringTemplate[] = [
  {
    id: 't1',
    description: 'Rent',
    amount: 1200,
    dayOfMonth: 1,
    frequency: 'monthly',
  },
]
const categoryBudgets: CategoryBudget[] = [
  { id: '2026-05|c1', month: '2026-05', categoryId: 'c1', amount: 200 },
]

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function stubAnchorClicks(): HTMLAnchorElement[] {
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
  return clicks
}

describe('BackupExport', () => {
  it('renders an "Export backup (JSON)" button', () => {
    render(
      <BackupExport
        expenses={expenses}
        categories={categories}
        monthlyBudgets={monthlyBudgets}
        recurringTemplates={recurringTemplates}
        categoryBudgets={categoryBudgets}
      />,
    )
    expect(
      screen.getByRole('button', { name: /export backup \(json\)/i }),
    ).toBeInTheDocument()
  })

  it('on click, calls URL.createObjectURL exactly once with an application/json Blob', async () => {
    const clicks = stubAnchorClicks()
    const user = userEvent.setup()
    render(
      <BackupExport
        expenses={expenses}
        categories={categories}
        monthlyBudgets={monthlyBudgets}
        recurringTemplates={recurringTemplates}
        categoryBudgets={categoryBudgets}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /export backup \(json\)/i }),
    )

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = (URL.createObjectURL as unknown as {
      mock: { calls: [Blob][] }
    }).mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toMatch(/application\/json/)
    expect(clicks).toHaveLength(1)
    expect(clicks[0].href).toContain('blob:mock-url')
    expect(clicks[0].download).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('exported Blob contents parse to a snapshot with all four arrays', async () => {
    let capturedBlob: Blob | undefined
    vi.mocked(URL.createObjectURL).mockImplementation(
      (obj: Blob | MediaSource) => {
        if (obj instanceof Blob) capturedBlob = obj
        return 'blob:mock-url'
      },
    )
    stubAnchorClicks()

    const user = userEvent.setup()
    render(
      <BackupExport
        expenses={expenses}
        categories={categories}
        monthlyBudgets={monthlyBudgets}
        recurringTemplates={recurringTemplates}
        categoryBudgets={categoryBudgets}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /export backup \(json\)/i }),
    )

    expect(capturedBlob).toBeDefined()
    const text = await capturedBlob!.text()
    const parsed = JSON.parse(text)
    expect(parsed.schemaVersion).toBe(2)
    expect(parsed.expenses).toEqual(expenses)
    expect(parsed.categories).toEqual(categories)
    expect(parsed.monthlyBudgets).toEqual(monthlyBudgets)
    expect(parsed.recurringTemplates).toEqual(recurringTemplates)
    expect(parsed.categoryBudgets).toEqual(categoryBudgets)
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('still produces a valid download when all data arrays are empty', async () => {
    const clicks = stubAnchorClicks()
    let capturedBlob: Blob | undefined
    vi.mocked(URL.createObjectURL).mockImplementation(
      (obj: Blob | MediaSource) => {
        if (obj instanceof Blob) capturedBlob = obj
        return 'blob:mock-url'
      },
    )

    const user = userEvent.setup()
    render(
      <BackupExport
        expenses={[]}
        categories={[]}
        monthlyBudgets={[]}
        recurringTemplates={[]}
        categoryBudgets={[]}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /export backup \(json\)/i }),
    )

    expect(clicks).toHaveLength(1)
    expect(clicks[0].download).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.json$/)
    const text = await capturedBlob!.text()
    const parsed = JSON.parse(text)
    expect(parsed.expenses).toEqual([])
    expect(parsed.categories).toEqual([])
    expect(parsed.monthlyBudgets).toEqual([])
    expect(parsed.recurringTemplates).toEqual([])
    expect(parsed.categoryBudgets).toEqual([])
  })
})
