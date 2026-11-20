import { useState, type CSSProperties } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CalculationResult, YearResult } from '../lib/calculator'
import { axisMoney, money } from '../lib/format'
import { useMediaQuery } from '../hooks'
import Segmented, { type SegmentOption } from './Segmented'

type View = 'wealth' | 'assets' | 'cost' | 'mortgage'
type WealthMode = 'totals' | 'lead'
type CostMode = 'annual' | 'total'
type Tone = 'buy' | 'rent' | 'equity' | 'invest' | 'principal' | 'interest' | 'neutral'

const VIEWS: SegmentOption<View>[] = [
  { id: 'wealth', label: 'Wealth' },
  { id: 'assets', label: 'Assets' },
  { id: 'cost', label: 'Costs' },
  { id: 'mortgage', label: 'Mortgage' },
]

const COST_MODES: SegmentOption<CostMode>[] = [
  { id: 'annual', label: 'Each year' },
  { id: 'total', label: 'Through sale' },
]

const WEALTH_MODES: SegmentOption<WealthMode>[] = [
  { id: 'totals', label: 'Total wealth' },
  { id: 'lead', label: 'Dollar lead' },
]

interface Series {
  key: keyof YearResult
  label: string
  tone: Tone
  color: string
  dash?: boolean
}

const WEALTH: Series[] = [
  { key: 'ownerNetWorth', label: 'Buying', tone: 'buy', color: 'var(--buy)' },
  { key: 'renterNetWorth', label: 'Renting', tone: 'rent', color: 'var(--rent)', dash: true },
]

const ASSETS: Series[] = [
  { key: 'realizableHomeEquity', label: 'Equity after sale', tone: 'buy', color: 'var(--buy)' },
  { key: 'ownerInvestmentPortfolio', label: 'Buyer’s investments', tone: 'invest', color: 'var(--principal)' },
  { key: 'renterInvestmentPortfolio', label: 'Renter’s investments', tone: 'rent', color: 'var(--rent)', dash: true },
]

const MORTGAGE: Series[] = [
  { key: 'principalPaid', label: 'Principal paid', tone: 'principal', color: 'var(--principal)' },
  { key: 'interestPaid', label: 'Interest paid', tone: 'interest', color: 'var(--buy)' },
]

const tickStyle = { fill: 'var(--ink-soft)', fontSize: 12 }

export default function WealthPath({ result, selectedYear, onYear }: {
  result: CalculationResult
  selectedYear: number
  onYear: (year: number) => void
}) {
  const [view, setView] = useState<View>('wealth')
  const [wealthMode, setWealthMode] = useState<WealthMode>('totals')
  const [costMode, setCostMode] = useState<CostMode>('annual')
  const compact = useMediaQuery('(max-width: 640px)')
  const last = result.years.length - 1
  const annualCosts = costMode === 'annual'
  const showLead = view === 'wealth' && wealthMode === 'lead'
  const first = view === 'mortgage' || (view === 'cost' && annualCosts) ? 1 : 0
  const year = Math.min(Math.max(first, selectedYear), last)
  const data = first ? result.years.slice(first) : result.years
  const at = result.years[year]
  const cross = result.summary.crossoverYear
  const range = last - first
  const tickCount = Math.min(compact ? 3 : 5, range + 1)
  const ticks = Array.from({ length: tickCount }, (_, index) => first + Math.round(range * index / Math.max(1, tickCount - 1)))

  let series = WEALTH
  let description = 'Estimated wealth includes investments and any home equity you could keep after selling.'
  if (showLead) {
    series = [{ key: 'netWorthDifference', label: 'Dollar lead', tone: 'neutral', color: 'var(--ink)' }]
    description = 'Above zero, buying leads. Below zero, renting leads.'
  } else if (view === 'assets') {
    series = ASSETS
    description = 'Buying combines equity after selling with investments. Renting builds wealth through investments.'
  } else if (view === 'cost') {
    series = [
      { ...WEALTH[0], key: annualCosts ? 'ownerUnrecoverableCost' : 'cumulativeOwnerUnrecoverableCost' },
      { ...WEALTH[1], key: annualCosts ? 'renterHousingCost' : 'cumulativeRenterHousingCost' },
    ]
    description = annualCosts
      ? 'Annual housing expenses include rent or mortgage interest, plus other housing bills. Principal builds equity.'
      : 'Total expenses through the selected year. Buying includes closing costs and what it would cost to sell that year.'
  } else if (view === 'mortgage') {
    series = MORTGAGE
    description = 'Principal reduces your loan balance. Interest is the cost of borrowing.'
  }

  const facts: { label: string; value: number; tone?: Tone; dash?: boolean }[] = showLead
    ? [{ label: at.winner === 'tie' ? 'Even' : at.winner === 'buy' ? 'Buying ahead by' : 'Renting ahead by', value: Math.abs(at.netWorthDifference) }]
    : series.map(({ key, label, tone, dash }) => ({ label, value: Number(at[key]), tone, dash }))
  if (view === 'mortgage') facts.push({ label: 'Mortgage balance', value: at.mortgageBalance })

  const selectPoint = (state: { activeLabel?: number | string } | null) => {
    const point = Number(state?.activeLabel)
    if (Number.isInteger(point) && point >= first && point <= last) onYear(point)
  }

  return (
    <section className="sheet chart-sheet" id="wealth" aria-labelledby="chart-title">
      <header className="sheet-head"><h2 id="chart-title">Compare by year</h2></header>
      <div className="chart-controls">
        <Segmented options={VIEWS} value={view} onChange={setView} label="Chart view" />
        {view === 'wealth' && <Segmented options={WEALTH_MODES} value={wealthMode} onChange={setWealthMode} label="Wealth measure" size="sm" />}
        {view === 'cost' && <Segmented options={COST_MODES} value={costMode} onChange={setCostMode} label="Cost measure" size="sm" />}
        <p className="note chart-description">{description}</p>
      </div>

      <div className="scrub">
        <label htmlFor="year-scrub">Explore a year</label>
        <input
          id="year-scrub" className="range" type="range" min={first} max={last} step={1} value={year} disabled={range === 0}
          aria-valuetext={year === 0 ? 'Today' : `Year ${year}`}
          style={{ '--pct': `${range ? (year - first) / range * 100 : 0}%` } as CSSProperties}
          onChange={(event) => onYear(Number(event.target.value))}
        />
        <output className="scrub-year">{year === 0 ? 'Today' : `Year ${year}`}</output>
      </div>
      <dl className="facts" aria-live="polite">
        {facts.map(({ label, value, tone, dash }) => (
          <div className="fact" key={label}>
            <dt>{tone && <span className={`swatch ${tone} ${dash ? 'dash' : ''}`} aria-hidden="true" />}{label}</dt>
            <dd>{money.format(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="chart-stage" key={`${view}-${wealthMode}-${costMode}`} aria-hidden="true">
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 3, left: 0 }} onClick={selectPoint}>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 5" />
              <XAxis dataKey="year" ticks={ticks} interval={0} tick={tickStyle} tickMargin={8} tickLine={false} axisLine={false} />
              <YAxis width={compact ? 56 : 70} domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} tickCount={5} tickFormatter={axisMoney} tick={tickStyle} tickLine={false} axisLine={false} />
              <Tooltip content={() => null} cursor={false} />
              <ReferenceLine y={0} stroke="var(--ink)" strokeOpacity={showLead ? 0.65 : 0.25} />
              {view === 'wealth' && cross !== null && <ReferenceLine x={cross} stroke="var(--ink)" strokeOpacity={0.35} strokeDasharray="3 4" />}
              <ReferenceLine x={year} stroke="var(--ink)" strokeOpacity={0.5} />
              {series.map(({ key, color, dash }) => view === 'mortgage'
                ? <Bar key={key} dataKey={key} stackId="mortgage" fill={color} maxBarSize={30} isAnimationActive={false} />
                : <Line key={key} dataKey={key} stroke={color} strokeWidth={2.75} strokeDasharray={dash ? '7 5' : undefined} dot={false} activeDot={false} isAnimationActive={false} />)}
              {view !== 'mortgage' && series.map(({ key, color }) => (
                <ReferenceDot key={key} x={year} y={Number(at[key])} r={4.5} fill={color} stroke="var(--paper)" strokeWidth={1.5} isFront />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {view === 'wealth' && cross !== null && <p className="note chart-crossover">The lead first changes in year {cross}. {result.years[cross].winner === 'buy' ? 'Buying' : 'Renting'} pulls ahead.</p>}
    </section>
  )
}
