import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MonthTotal } from '../lib/trends'
import { TrendsChart } from './TrendsChart'

function makeYear(values: number[], year = '2026'): MonthTotal[] {
  return values.map((total, i) => ({
    month: `${year}-${String(i + 1).padStart(2, '0')}`,
    total,
    count: total > 0 ? 1 : 0,
  }))
}

describe('TrendsChart', () => {
  it('renders an empty state when data is empty', () => {
    render(<TrendsChart data={[]} currency="USD" yearLabel="2026" />)
    expect(screen.getByText('No data to chart')).toBeInTheDocument()
  })

  it('renders an empty state when every entry has total=0', () => {
    const data = makeYear([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    render(<TrendsChart data={data} currency="USD" yearLabel="2026" />)
    expect(screen.getByText('No data to chart')).toBeInTheDocument()
  })

  it('renders 12 bars for a 12-month dataset', () => {
    const data = makeYear([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120])
    const { container } = render(
      <TrendsChart data={data} currency="USD" yearLabel="2026" />,
    )
    const bars = container.querySelectorAll('.trends-chart__bar')
    expect(bars).toHaveLength(12)
  })

  it('scales bar heights proportionally — largest bar maps to full height', () => {
    const data = makeYear([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100])
    const { container } = render(
      <TrendsChart data={data} currency="USD" yearLabel="2026" />,
    )
    const bars = container.querySelectorAll('.trends-chart__bar')
    const heights = Array.from(bars).map((b) =>
      Number(b.getAttribute('height')),
    )
    const maxHeight = Math.max(...heights)
    // Guard against an all-zero-height regression: if maxHeight === 0,
    // the toBe(maxHeight) line below would tautologically pass.
    expect(maxHeight).toBeGreaterThan(0)
    // The last bar (Dec, total=100) should be the tallest.
    expect(Number(bars[11].getAttribute('height'))).toBe(maxHeight)
    // Every other bar (total=0) should have height 0.
    for (let i = 0; i < 11; i += 1) {
      expect(Number(bars[i].getAttribute('height'))).toBe(0)
    }
  })

  it('renders abbreviated month labels Jan…Dec along the x-axis', () => {
    const data = makeYear([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    render(<TrendsChart data={data} currency="USD" yearLabel="2026" />)
    for (const m of [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]) {
      expect(screen.getByText(m)).toBeInTheDocument()
    }
  })

  it('renders a tooltip with month label, formatted currency, and expense-count pluralization', () => {
    const data: MonthTotal[] = [
      { month: '2026-01', total: 25, count: 1 },
      { month: '2026-02', total: 50, count: 3 },
      ...makeYear(new Array(10).fill(0)).map((m, i) => ({
        ...m,
        month: `2026-${String(i + 3).padStart(2, '0')}`,
      })),
    ]
    const { container } = render(
      <TrendsChart data={data} currency="USD" yearLabel="2026" />,
    )
    const titles = Array.from(
      container.querySelectorAll('.trends-chart__bar title'),
    ).map((t) => t.textContent)
    expect(titles).toContain('Jan: $25.00 (1 expense)')
    expect(titles).toContain('Feb: $50.00 (3 expenses)')
  })

  it('marks the svg with role="img" and an aria-label referencing the year', () => {
    const data = makeYear([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120])
    render(<TrendsChart data={data} currency="USD" yearLabel="2026" />)
    expect(
      screen.getByRole('img', { name: /spending trends for 2026/i }),
    ).toBeInTheDocument()
  })
})
