// Single source of truth for currency display. Components and tests must
// import this rather than instantiating their own Intl.NumberFormat — keeps
// locale, symbol, and rounding consistent everywhere money is shown.
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatUSD(amount: number): string {
  return usdFormatter.format(amount)
}
