import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import { spendingByCategory } from '../lib/categoryTotals'
import { formatCurrency, type CurrencyCode } from '../lib/currency'
import { EmptyState } from './EmptyState'
import './SpendingChart.css'

interface SpendingChartProps {
  expenses: Expense[]
  categories: Category[]
  currency: CurrencyCode
}

const UNCATEGORIZED_COLOR = '#9ca3af'

// Layout constants — keep simple, tunable in one place.
const BAR_HEIGHT = 24
const BAR_GAP = 6
const ROW_HEIGHT = BAR_HEIGHT + BAR_GAP
const LABEL_WIDTH = 110 // left text column
const VALUE_WIDTH = 80 // right text column
const VIEWBOX_WIDTH = 480
const BAR_TRACK_X = LABEL_WIDTH
const BAR_TRACK_WIDTH = VIEWBOX_WIDTH - LABEL_WIDTH - VALUE_WIDTH

export function SpendingChart({ expenses, categories, currency }: SpendingChartProps) {
  const rows = spendingByCategory(expenses, categories)
    .slice()
    .sort((a, b) => b.total - a.total)

  if (rows.length === 0 || rows.every((r) => r.total === 0)) {
    return <EmptyState title="No data to chart" />
  }

  const maxTotal = rows.reduce((m, r) => (r.total > m ? r.total : m), 0)
  const viewBoxHeight = rows.length * ROW_HEIGHT

  return (
    <svg
      className="spending-chart"
      role="img"
      aria-label="Spending by category"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${viewBoxHeight}`}
      preserveAspectRatio="xMinYMin meet"
    >
      {rows.map((row, i) => {
        const isNull = row.category === null
        const key = isNull ? '__uncategorized__' : row.category!.id
        const name = isNull ? 'Uncategorized' : row.category!.name
        const color = isNull ? UNCATEGORIZED_COLOR : row.category!.color
        const formatted = formatCurrency(row.total, currency)
        const y = i * ROW_HEIGHT
        const barWidth =
          maxTotal > 0 ? (row.total / maxTotal) * BAR_TRACK_WIDTH : 0
        const textY = y + BAR_HEIGHT / 2

        return (
          <g key={key} className="spending-chart__row">
            <text
              className="spending-chart__label"
              x={LABEL_WIDTH - 8}
              y={textY}
              textAnchor="end"
              dominantBaseline="middle"
              aria-hidden="true"
            >
              {name}
            </text>
            <rect
              className="spending-chart__bar-bg"
              x={BAR_TRACK_X}
              y={y}
              width={BAR_TRACK_WIDTH}
              height={BAR_HEIGHT}
              rx={3}
            />
            <rect
              className="spending-chart__bar"
              x={BAR_TRACK_X}
              y={y}
              width={barWidth}
              height={BAR_HEIGHT}
              fill={color}
              rx={3}
              aria-label={`${name}: ${formatted}`}
            >
              <title>{`${name}: ${formatted}`}</title>
            </rect>
            <text
              className="spending-chart__value"
              x={BAR_TRACK_X + BAR_TRACK_WIDTH + 8}
              y={textY}
              dominantBaseline="middle"
              aria-hidden="true"
            >
              {formatted}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
