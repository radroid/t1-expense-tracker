import type { MonthTotal } from '../lib/trends'
import { formatCurrency, type CurrencyCode } from '../lib/currency'
import { EmptyState } from './EmptyState'
import './TrendsChart.css'

interface TrendsChartProps {
  data: MonthTotal[] // 12 entries, one per month, ASCENDING by month
  currency: CurrencyCode
  yearLabel: string // e.g. '2026'
}

// Layout constants — keep simple, tunable in one place. Mirrors SpendingChart.
const VIEWBOX_WIDTH = 480
const VIEWBOX_HEIGHT = 240
const PADDING_LEFT = 24
const PADDING_RIGHT = 16
const PADDING_TOP = 16
const LABEL_BAND_HEIGHT = 24 // reserved at the bottom for "Jan", "Feb", …
const PLOT_TOP = PADDING_TOP
const PLOT_BOTTOM = VIEWBOX_HEIGHT - LABEL_BAND_HEIGHT
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP
const PLOT_WIDTH = VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT
const BAR_GAP = 4

const MONTH_ABBR = [
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
]

function monthLabelFor(month: string): string {
  // month is 'YYYY-MM'; index by month number (1..12)
  const mNum = Number(month.slice(5, 7))
  return MONTH_ABBR[mNum - 1] ?? month
}

export function TrendsChart({ data, currency, yearLabel }: TrendsChartProps) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return <EmptyState title="No data to chart" />
  }

  const maxTotal = data.reduce((m, d) => (d.total > m ? d.total : m), 0)
  const slotWidth = PLOT_WIDTH / data.length
  const barWidth = Math.max(0, slotWidth - BAR_GAP)

  return (
    <svg
      className="trends-chart"
      role="img"
      aria-label={`Spending trends for ${yearLabel}`}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMinYMin meet"
    >
      {data.map((d, i) => {
        const barHeight =
          maxTotal > 0 ? (d.total / maxTotal) * PLOT_HEIGHT : 0
        const x = PADDING_LEFT + i * slotWidth + BAR_GAP / 2
        const y = PLOT_BOTTOM - barHeight
        const monthLabel = monthLabelFor(d.month)
        const formatted = formatCurrency(d.total, currency)
        const noun = d.count === 1 ? 'expense' : 'expenses'
        const tooltip = `${monthLabel}: ${formatted} (${d.count} ${noun})`
        const labelX = x + barWidth / 2
        return (
          <g key={d.month} className="trends-chart__col">
            <rect
              className="trends-chart__bar"
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              aria-label={tooltip}
            >
              <title>{tooltip}</title>
            </rect>
            <text
              className="trends-chart__month-label"
              x={labelX}
              y={PLOT_BOTTOM + LABEL_BAND_HEIGHT / 2 + 4}
              textAnchor="middle"
              aria-hidden="true"
              data-month-index={i}
            >
              {monthLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
