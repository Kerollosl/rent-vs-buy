export const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatPercent(value: number | null, digits = 1): string {
  return value === null ? '—' : `${(value * 100).toFixed(digits)}%`
}

/** "+$72K" / "−$1.2M" — uses a true minus so columns line up. */
export function signedCompact(value: number): string {
  return `${value >= 0 ? '+' : '−'}${compactMoney.format(Math.abs(value))}`
}

/** Heat-map cell: signed and short enough for a phone column, e.g. "+$865K", "−$1.2M". */
export function signedHeat(value: number): string {
  const abs = Math.abs(value)
  const sign = value >= 0 ? '+' : '−'
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`
  return `${sign}$${Math.round(abs)}`
}

/** Axis tick: "$0", "$400K", "$1.2M". */
export function axisMoney(value: number): string {
  return value === 0 ? '$0' : compactMoney.format(value)
}

export function signedAxisMoney(value: number): string {
  return value === 0 ? '$0' : signedCompact(value)
}

/** End-of-line label: two decimals in the millions so $1.55M and $1.48M stay distinct. */
export function endMoney(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${Math.round(value)}`
}

/** Rounds a magnitude up to a clean 1 / 2 / 2.5 / 5 / 10 step for axis extents. */
export function niceCeil(value: number): number {
  if (value <= 0) return 0
  const power = Math.pow(10, Math.floor(Math.log10(value)))
  const unit = value / power
  const step = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10
  return step * power
}
