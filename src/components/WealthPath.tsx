import { useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import {
  Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowDown, ArrowUp, CalendarDays, Landmark, Layers, Receipt, Sigma, TrendingUp } from 'lucide-react'
import type { CalculationResult } from '../lib/calculator'
import { axisMoney, endMoney, money, niceCeil, signedAxisMoney } from '../lib/format'
import { useMediaQuery } from '../hooks'
import Segmented, { type SegmentOption } from './Segmented'

type View = 'worth' | 'own' | 'cost' | 'mortgage'
type CostMode = 'annual' | 'total'
type Tone = 'buy' | 'rent' | 'equity' | 'invest' | 'principal' | 'interest'

const VIEWS: SegmentOption<View>[] = [
  { id: 'worth', label: 'Net worth', short: 'Net worth', icon: <TrendingUp size={17} aria-hidden="true" /> },
  { id: 'own', label: 'What you own', short: 'You own', icon: <Layers size={17} aria-hidden="true" /> },
  { id: 'cost', label: 'What it costs', short: 'Costs', icon: <Receipt size={17} aria-hidden="true" /> },
  { id: 'mortgage', label: 'Mortgage', short: 'Mortgage', icon: <Landmark size={17} aria-hidden="true" /> },
]

const COST_MODES: SegmentOption<CostMode>[] = [
  { id: 'annual', label: 'Each year', icon: <CalendarDays size={15} aria-hidden="true" /> },
  { id: 'total', label: 'Running total', short: 'Total', icon: <Sigma size={15} aria-hidden="true" /> },
]

const BLURBS: Record<View, string> = {
  worth: 'Net worth after selling costs: buy and invest the savings, or rent and invest the rest.',
  own: 'What each strategy is made of. Buyer wealth is home equity plus investments outside the home.',
  cost: 'Housing money that is gone for good: interest, taxes, upkeep and rent. Principal is not a cost, it becomes equity.',
  mortgage: 'Each payment splits into principal, which builds equity, and interest, which is a cost.',
}

interface Row {
  year: number
  buy: number
  rent: number
  diff: number
  lo: number
  gapBuy: number
  gapRent: number
  equity: number
  ownerPortfolio: number
  renterPortfolio: number
  ownerCost: number | null
  renterCost: number | null
  ownerTotal: number
  renterTotal: number
  principal: number
  interest: number
  balance: number
}

interface Fact { label: string; value: string; tone: Tone; dash?: boolean }

const tickStyle = { fill: 'var(--ink-soft)', fontSize: 13 }

function EndLabel({ color, text, dy, dash, index, last, x, y }: { color: string; text: string; dy: number; dash?: boolean; index: number; last: number; x?: number; y?: number }) {
  if (index !== last || x === undefined || y === undefined) return <g />
  return (
    <g pointerEvents="none">
      <line x1={x + 8} x2={x + 24} y1={y + dy} y2={y + dy} stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={dash ? '4 3' : undefined} />
      <text className="end-label" x={x + 30} y={y + dy + 4.5}>{text}</text>
    </g>
  )
}

export default function WealthPath({
  result, selectedYear, onYear,
}: {
  result: CalculationResult
  selectedYear: number
  onYear: (year: number) => void
}) {
  const [view, setView] = useState<View>('worth')
  const [costMode, setCostMode] = useState<CostMode>('annual')
  const compact = useMediaQuery('(max-width: 640px)')

  const years = result.years
  const last = years.length - 1
  const cross = result.summary.crossoverYear
  const startsAtOne = (view === 'cost' && costMode === 'annual') || view === 'mortgage'
  const firstYear = startsAtOne ? 1 : 0
  const year = Math.min(Math.max(selectedYear, 0), last)
  const shown = Math.max(year, firstYear)

  const rows: Row[] = useMemo(
    () => years.map((y) => ({
      year: y.year,
      buy: y.ownerNetWorth,
      rent: y.renterNetWorth,
      diff: y.netWorthDifference,
      lo: Math.min(y.ownerNetWorth, y.renterNetWorth),
      gapBuy: Math.max(0, y.netWorthDifference),
      gapRent: Math.max(0, -y.netWorthDifference),
      equity: y.realizableHomeEquity,
      ownerPortfolio: y.ownerInvestmentPortfolio,
      renterPortfolio: y.renterInvestmentPortfolio,
      ownerCost: y.year === 0 ? null : y.ownerHousingCost,
      renterCost: y.year === 0 ? null : y.renterHousingCost,
      ownerTotal: y.cumulativeOwnerUnrecoverableCost,
      renterTotal: y.cumulativeRenterHousingCost,
      principal: y.principalPaid,
      interest: y.interestPaid,
      balance: y.mortgageBalance,
    })),
    [years],
  )
  const data = startsAtOne ? rows.slice(1) : rows
  const at = rows[year]
  const final = rows[last]
  const buyLeads = final.diff >= 0

  const margin = compact ? { top: 14, right: 100, bottom: 10, left: 0 } : { top: 16, right: 128, bottom: 10, left: 4 }
  const ticks = useMemo(() => {
    const step = last > 30 ? 10 : 5
    const list: number[] = []
    for (let value = Math.ceil(firstYear / step) * step; value <= last; value += step) list.push(value)
    if (firstYear === 1 && !list.includes(1)) list.unshift(1)
    if (!list.includes(last)) list.push(last)
    return list
  }, [firstYear, last])

  const onMove = (state: { activeLabel?: number | string } | null) => {
    const next = Number(state?.activeLabel)
    if (Number.isFinite(next)) onYear(next)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = { ArrowLeft: year - 1, ArrowRight: year + 1, Home: 0, End: last, PageDown: year - 5, PageUp: year + 5 }
    if (!(event.key in map)) return
    event.preventDefault()
    onYear(Math.min(last, Math.max(0, map[event.key])))
  }

  const xAxis = (hide: boolean) => (
    <XAxis dataKey="year" type="number" domain={[firstYear, last]} ticks={ticks} hide={hide} tick={tickStyle} axisLine={{ stroke: 'var(--line)' }} tickLine={false} tickMargin={8} height={hide ? 0 : 28} interval={0} />
  )
  const yAxis = (formatter: (v: number) => string, domain: [number | string, number | string] = [0, 'auto'], tickList?: number[]) => (
    <YAxis width={compact ? 50 : 58} domain={domain} ticks={tickList} tickCount={5} tickFormatter={formatter} tick={tickStyle} axisLine={false} tickLine={false} />
  )
  const grid = <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 6" />
  const probe = <Tooltip content={() => null} cursor={{ stroke: 'var(--ink)', strokeOpacity: 0.35, strokeWidth: 1 }} isAnimationActive={false} />
  const crossMarker = (withDot: boolean, yValue?: number) => cross !== null && cross >= firstYear && (
    <>
      <ReferenceLine x={cross} stroke="var(--ink)" strokeOpacity={0.18} strokeDasharray="3 4" />
      {withDot && yValue !== undefined && (
        <ReferenceDot x={cross} y={yValue} r={6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} isFront
          label={{ position: 'top', content: (props: { viewBox?: unknown }) => {
            const { x = 0, y = 0 } = (props.viewBox ?? {}) as { x?: number; y?: number }
            const leader = rows[Math.min(last, cross + 1)].diff >= 0 ? 'Buying' : 'Renting'
            return <text className="annotation" x={x - 10} y={y - 14} textAnchor="end">{leader} pulls ahead · year {cross}</text>
          } }} />
      )}
    </>
  )
  const scrubLine = <ReferenceLine x={shown} stroke="var(--ink)" strokeOpacity={0.55} strokeWidth={1.25} />
  const scrubDots = (keys: Array<[keyof Row, string]>) => keys.map(([key, color]) => (
    <ReferenceDot key={key} x={shown} y={rows[shown][key] as number} r={5.5} fill={color} stroke="var(--paper)" strokeWidth={2} isFront />
  ))

  const dyBuy = buyLeads ? -9 : 9
  const dyRent = buyLeads ? 9 : -9
  const lastIndex = data.length - 1
  const lineLabel = (color: string, text: string, dy: number, dash = false) => (props: { index?: number; x?: number; y?: number }) => (
    <EndLabel color={color} text={text} dy={dy} dash={dash} index={props.index ?? -1} last={lastIndex} x={props.x} y={props.y} />
  )
  const short = (v: number) => axisMoney(v)

  let facts: Fact[]
  let chart: ReactNode
  if (view === 'worth') {
    const lead = at.diff
    facts = [
      { label: 'Buy', value: money.format(at.buy), tone: 'buy' },
      { label: 'Rent', value: money.format(at.rent), tone: 'rent', dash: true },
      { label: lead === 0 ? 'Even' : lead > 0 ? 'Buying ahead' : 'Renting ahead', value: money.format(Math.abs(lead)), tone: lead >= 0 ? 'buy' : 'rent' },
    ]
    const diffs = rows.map((row) => row.diff)
    const max = Math.max(...diffs)
    const min = Math.min(...diffs)
    const fillOffset = max === min ? 0.5 : Math.max(0, Math.min(1, Math.max(max, 0) / (Math.max(max, 0) - Math.min(min, 0) || 1)))
    const strokeOffset = max === min ? 0.5 : Math.max(0, Math.min(1, max / (max - min)))
    const advTop = niceCeil(Math.max(max, 1))
    const advBottom = -niceCeil(Math.max(-min, 0))
    const advTicks = advBottom === 0 ? [0, advTop] : [advBottom, 0, advTop]
    const crossValue = cross !== null ? (rows[cross].buy + rows[cross].rent) / 2 : undefined
    chart = (
      <>
        <div className="chart-box main">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={margin} onMouseMove={onMove} onClick={onMove}>
              {grid}
              {xAxis(true)}
              {yAxis(short)}
              {probe}
              <Area dataKey="lo" stackId="gap" stroke="none" fill="none" isAnimationActive={false} activeDot={false} legendType="none" />
              <Area dataKey="gapBuy" stackId="gap" stroke="none" fill="var(--buy-wash)" isAnimationActive={false} activeDot={false} />
              <Area dataKey="gapRent" stackId="gap" stroke="none" fill="var(--rent-wash)" isAnimationActive={false} activeDot={false} />
              {crossMarker(true, crossValue)}
              {scrubLine}
              <Line dataKey="buy" type="monotone" stroke="var(--buy)" strokeWidth={2.75} dot={false} activeDot={false} isAnimationActive={false} label={lineLabel('var(--buy)', `Buy ${endMoney(final.buy)}`, dyBuy)} />
              <Line dataKey="rent" type="monotone" stroke="var(--rent)" strokeWidth={2.75} strokeDasharray="7 5" dot={false} activeDot={false} isAnimationActive={false} label={lineLabel('var(--rent)', `Rent ${endMoney(final.rent)}`, dyRent, true)} />
              {scrubDots([['buy', 'var(--buy)'], ['rent', 'var(--rent)']])}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="adv-head">
          <span className="eyebrow">Buy minus rent</span>
          <span className="adv-key">
            <span className="key buy"><ArrowUp size={13} aria-hidden="true" />Buying ahead</span>
            <span className="key rent"><ArrowDown size={13} aria-hidden="true" />Renting ahead</span>
          </span>
        </div>
        <div className="chart-box adv">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ ...margin, top: 6, bottom: 0 }} onMouseMove={onMove} onClick={onMove}>
              <defs>
                <linearGradient id="adv-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={fillOffset} style={{ stopColor: 'var(--buy)', stopOpacity: 0.3 }} />
                  <stop offset={fillOffset} style={{ stopColor: 'var(--rent)', stopOpacity: 0.3 }} />
                </linearGradient>
                <linearGradient id="adv-stroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={strokeOffset} style={{ stopColor: 'var(--buy)' }} />
                  <stop offset={strokeOffset} style={{ stopColor: 'var(--rent)' }} />
                </linearGradient>
              </defs>
              {grid}
              {xAxis(false)}
              {yAxis(signedAxisMoney, [advBottom, advTop], advTicks)}
              {probe}
              <ReferenceLine y={0} stroke="var(--ink)" strokeOpacity={0.7} />
              {crossMarker(false)}
              {cross !== null && <ReferenceDot x={cross} y={0} r={4} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2} isFront />}
              {scrubLine}
              <Area dataKey="diff" type="monotone" baseValue={0} stroke="url(#adv-stroke)" strokeWidth={2.5} fill="url(#adv-fill)" isAnimationActive={false} activeDot={false} />
              {scrubDots([['diff', at.diff >= 0 ? 'var(--buy)' : 'var(--rent)']])}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </>
    )
  } else if (view === 'own') {
    facts = [
      { label: 'Home equity after selling', value: money.format(at.equity), tone: 'equity' },
      { label: 'Buyer’s investments', value: money.format(at.ownerPortfolio), tone: 'invest' },
      { label: 'Renter’s investments', value: money.format(at.renterPortfolio), tone: 'rent', dash: true },
    ]
    chart = (
      <div className="chart-box tall">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={margin} onMouseMove={onMove} onClick={onMove}>
            {grid}
            {xAxis(false)}
            {yAxis(short)}
            {probe}
            <Area dataKey="equity" stackId="own" type="monotone" stroke="var(--buy)" strokeWidth={2} fill="var(--buy)" fillOpacity={0.5} isAnimationActive={false} activeDot={false} />
            <Area dataKey="ownerPortfolio" stackId="own" type="monotone" stroke="var(--buy)" strokeWidth={2} fill="var(--buy-wash)" isAnimationActive={false} activeDot={false} />
            {scrubLine}
            <Line dataKey="buy" type="monotone" stroke="none" dot={false} activeDot={false} isAnimationActive={false} legendType="none" label={lineLabel('var(--buy)', `Buy ${endMoney(final.buy)}`, dyBuy)} />
            <Line dataKey="renterPortfolio" type="monotone" stroke="var(--rent)" strokeWidth={2.75} strokeDasharray="7 5" dot={false} activeDot={false} isAnimationActive={false} label={lineLabel('var(--rent)', `Rent ${endMoney(final.rent)}`, dyRent, true)} />
            {scrubDots([['renterPortfolio', 'var(--rent)'], ['buy', 'var(--buy)']])}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  } else if (view === 'cost') {
    const annual = costMode === 'annual'
    const ownerKey = annual ? 'ownerCost' : 'ownerTotal'
    const renterKey = annual ? 'renterCost' : 'renterTotal'
    const ownerNow = rows[shown][ownerKey] ?? 0
    const renterNow = rows[shown][renterKey] ?? 0
    facts = [
      { label: annual ? 'Buyer, cash out this year' : 'Buyer, money gone so far', value: money.format(ownerNow), tone: 'buy' },
      { label: annual ? 'Renter, rent + insurance' : 'Renter, rent paid so far', value: money.format(renterNow), tone: 'rent', dash: true },
    ]
    const lastRow = rows[last]
    const ownerEnd = lastRow[ownerKey] ?? 0
    const renterEnd = lastRow[renterKey] ?? 0
    const ownerHigher = ownerEnd >= renterEnd
    chart = (
      <div className="chart-box tall">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={margin} onMouseMove={onMove} onClick={onMove}>
            {grid}
            {xAxis(false)}
            {yAxis(short)}
            {probe}
            {scrubLine}
            <Line dataKey={ownerKey} type="monotone" stroke="var(--buy)" strokeWidth={2.75} dot={false} activeDot={false} isAnimationActive={false} connectNulls label={lineLabel('var(--buy)', `Buy ${endMoney(ownerEnd)}`, ownerHigher ? -9 : 9)} />
            <Line dataKey={renterKey} type="monotone" stroke="var(--rent)" strokeWidth={2.75} strokeDasharray="7 5" dot={false} activeDot={false} isAnimationActive={false} connectNulls label={lineLabel('var(--rent)', `Rent ${endMoney(renterEnd)}`, ownerHigher ? 9 : -9, true)} />
            {scrubDots([[ownerKey, 'var(--buy)'], [renterKey, 'var(--rent)']])}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  } else {
    const row = rows[shown]
    facts = [
      { label: 'Principal this year', value: money.format(row.principal), tone: 'principal' },
      { label: 'Interest this year', value: money.format(row.interest), tone: 'interest' },
      { label: 'Balance left', value: money.format(row.balance), tone: 'buy' },
    ]
    chart = (
      <div className="chart-box tall">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ ...margin, right: compact ? 12 : 24 }} onMouseMove={onMove} onClick={onMove}>
            {grid}
            {xAxis(false)}
            {yAxis(short)}
            {probe}
            <Area dataKey="principal" stackId="pay" type="monotone" stroke="var(--principal)" strokeWidth={2} fill="var(--principal)" fillOpacity={0.55} isAnimationActive={false} activeDot={false} />
            <Area dataKey="interest" stackId="pay" type="monotone" stroke="var(--buy)" strokeWidth={2} fill="var(--buy)" fillOpacity={0.4} isAnimationActive={false} activeDot={false} />
            {scrubLine}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const summary = view === 'worth'
    ? `Net worth over ${last} years. At year ${last}, buying reaches ${money.format(final.buy)} and renting ${money.format(final.rent)}, so ${buyLeads ? 'buying' : 'renting'} leads by ${money.format(Math.abs(final.diff))}. ${cross !== null ? `The lead first changes in year ${cross}.` : 'The lead does not change.'}`
    : `${VIEWS.find((v) => v.id === view)?.label} chart for years ${firstYear} to ${last}. Year ${shown}: ${facts.map((f) => `${f.label} ${f.value}`).join(', ')}.`

  return (
    <section className="sheet chart-sheet" id="wealth" aria-labelledby="chart-title">
      <header className="sheet-head">
        <div>
          <h2 id="chart-title">The wealth path</h2>
          <p>{BLURBS[view]}</p>
        </div>
      </header>
      <div className="chart-controls">
        <Segmented options={VIEWS} value={view} onChange={setView} label="Chart view" stacked={compact} />
        {view === 'cost' && <Segmented options={COST_MODES} value={costMode} onChange={setCostMode} label="Cost measure" size="sm" />}
      </div>

      <div
        className="chart-stage"
        key={`${view}-${costMode}`}
        tabIndex={0}
        role="group"
        aria-roledescription="interactive chart"
        aria-label={summary}
        onKeyDown={onKeyDown}
      >
        {chart}
      </div>

      <div className="scrub">
        <label htmlFor="year-scrub">Inspect year</label>
        <input
          id="year-scrub"
          className="range"
          type="range"
          min={0}
          max={last}
          step={1}
          value={year}
          aria-valuetext={`Year ${year}`}
          style={{ '--pct': `${last ? (year / last) * 100 : 0}%` } as CSSProperties}
          onChange={(event) => onYear(Number(event.target.value))}
        />
        <output className="scrub-year">Year {year}</output>
      </div>

      <div className="facts" aria-live="polite">
        {facts.map((fact) => (
          <div className="fact" key={fact.label}>
            <span className={`swatch ${fact.tone} ${fact.dash ? 'dash' : ''}`} aria-hidden="true" />
            <span className="fact-label">{fact.label}</span>
            <strong className="fact-value">{fact.value}</strong>
          </div>
        ))}
      </div>
      {firstYear === 1 && year === 0 && <p className="note facts-note">Costs begin in year 1; showing year 1.</p>}
    </section>
  )
}
