import { useMemo, useState, type CSSProperties } from 'react'
import { Home, KeyRound, MapPin } from 'lucide-react'
import { calculateSensitivity, type CalculatorInputs, type SensitivityCell } from '../lib/calculator'
import { formatPercent, money, signedHeat } from '../lib/format'

const round = (value: number) => Math.round(value * 10000) / 10000

function Gauge({ current, breakEven, winner }: { current: number; breakEven: number | null; winner: 'buy' | 'rent' | 'tie' }) {
  const lo = Math.min(0, current - 0.02, breakEven ?? 0)
  const hi = Math.max(0.15, current + 0.04, (breakEven ?? 0) + 0.03)
  const pos = (value: number) => `${((value - lo) / (hi - lo)) * 100}%`
  const flipPct = breakEven === null ? null : ((breakEven - lo) / (hi - lo)) * 100
  const youLeft = breakEven !== null && current < breakEven
  const side = (left: boolean) => {
    const here = winner === 'tie' ? 'buy' : winner
    const other = here === 'buy' ? 'rent' : 'buy'
    return left === youLeft ? here : other
  }
  const gap = breakEven === null ? null : Math.abs(breakEven - current) * 100

  return (
    <div className="gauge">
      <div className="gauge-copy">
        <span className="eyebrow">Break-even market return</span>
        <strong className="gauge-value">{breakEven === null ? 'Not in 0–20%' : formatPercent(breakEven)}</strong>
        <p>
          {breakEven === null
            ? 'The winner does not change anywhere between 0% and 20% stock returns.'
            : <>The answer flips at this return — <b>{gap!.toFixed(1)} {gap === 1 ? 'point' : 'points'}</b> {breakEven > current ? 'above' : 'below'} your {formatPercent(current)} assumption.</>}
        </p>
      </div>
      <div className="gauge-track-wrap" aria-hidden="true">
        <div className="gauge-track">
          {flipPct !== null ? (
            <>
              <span className={`gauge-zone ${side(true)}`} style={{ width: `${flipPct}%` }}>{flipPct > 18 && (side(true) === 'buy' ? <Home size={14} /> : <KeyRound size={14} />)}</span>
              <span className={`gauge-zone ${side(false)}`} style={{ width: `${100 - flipPct}%` }}>{100 - flipPct > 18 && (side(false) === 'buy' ? <Home size={14} /> : <KeyRound size={14} />)}</span>
            </>
          ) : (
            <span className={`gauge-zone ${winner === 'rent' ? 'rent' : 'buy'}`} style={{ width: '100%' }} />
          )}
          {breakEven !== null && <span className="gauge-flip" style={{ left: pos(breakEven) }} />}
          <span className="gauge-you" style={{ left: pos(current) }}><MapPin size={20} fill="var(--paper)" /></span>
        </div>
        <div className="gauge-scale"><span>{formatPercent(lo, 0)}</span><span>{formatPercent(hi, 0)}</span></div>
      </div>
    </div>
  )
}

export default function FlipMap({
  inputs, breakEven, winner,
}: {
  inputs: CalculatorInputs
  breakEven: number | null
  winner: 'buy' | 'rent' | 'tie'
}) {
  const stockRates = useMemo(() => [-2, -1, 0, 1, 2].map((k) => round(inputs.stockReturnRate + k * 0.02)), [inputs.stockReturnRate])
  const homeRates = useMemo(() => [-2, -1, 0, 1, 2].map((k) => round(inputs.homeAppreciationRate + k * 0.01)), [inputs.homeAppreciationRate])
  const grid = useMemo(() => calculateSensitivity(inputs, stockRates, homeRates), [inputs, stockRates, homeRates])
  const maxAbs = Math.max(1, ...grid.cells.flat().map((cell) => Math.abs(cell.advantage)))
  const [focus, setFocus] = useState<SensitivityCell | null>(null)
  const center = grid.cells[2][2]
  const active = focus ?? center
  const isCenter = active === center

  const describe = (cell: SensitivityCell) => {
    const lead = cell.advantage >= 0 ? 'Buying' : 'Renting'
    return `${lead} ahead by ${money.format(Math.abs(cell.advantage))}`
  }

  return (
    <section className="sheet flip-sheet" id="flip" aria-labelledby="flip-title">
      <header className="sheet-head">
        <div>
          <h2 id="flip-title">Where the answer flips</h2>
          <p>Each square shows who wins at year {inputs.horizonYears} if home prices and stocks do something different. Your assumptions are in the middle.</p>
        </div>
      </header>
      <div className="flip-body">
        <Gauge current={inputs.stockReturnRate} breakEven={breakEven} winner={winner} />

        <div className="heat-wrap">
          <div className="heat" role="grid" aria-label="Sensitivity: home appreciation against stock return">
            <div className="heat-axis-top">Stock market return <span aria-hidden="true">→</span></div>
            <div className="heat-axis-left"><span>Home growth</span></div>
            <div role="row" className="heat-cols">
              <span />
              {stockRates.map((rate) => <span role="columnheader" key={rate} className={rate === inputs.stockReturnRate ? 'now' : ''}>{formatPercent(rate)}</span>)}
            </div>
            {grid.cells.map((row, r) => (
              <div role="row" className="heat-row" key={homeRates[r]}>
                <span role="rowheader" className={`heat-rowlabel ${homeRates[r] === inputs.homeAppreciationRate ? 'now' : ''}`}>{formatPercent(homeRates[r])}</span>
                {row.map((cell, c) => {
                  const strength = 10 + 78 * Math.sqrt(Math.abs(cell.advantage) / maxAbs)
                  const right = row[c + 1]
                  const below = grid.cells[r + 1]?.[c]
                  const cls = [
                    'heat-cell', cell.winner === 'rent' ? 'rent' : 'buy',
                    r === 2 && c === 2 ? 'current' : '',
                    right && right.winner !== cell.winner ? 'edge-r' : '',
                    below && below.winner !== cell.winner ? 'edge-b' : '',
                  ].join(' ')
                  return (
                    <button
                      type="button"
                      role="gridcell"
                      key={stockRates[c]}
                      className={cls}
                      style={{ '--strength': `${strength}%` } as CSSProperties}
                      aria-label={`Home growth ${formatPercent(cell.homeAppreciationRate)}, stocks ${formatPercent(cell.stockReturnRate)}: ${describe(cell)}${r === 2 && c === 2 ? ' (your assumptions)' : ''}`}
                      onMouseEnter={() => setFocus(cell)}
                      onMouseLeave={() => setFocus(null)}
                      onFocus={() => setFocus(cell)}
                      onBlur={() => setFocus(null)}
                    >
                      {cell.winner === 'rent' ? <KeyRound size={13} aria-hidden="true" /> : <Home size={13} aria-hidden="true" />}
                      <span>{signedHeat(cell.advantage)}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="heat-caption" aria-live="polite">
            <span className={`swatch ${active.winner === 'rent' ? 'rent' : 'buy'}`} aria-hidden="true" />
            <span>
              <b>{isCenter ? 'Your assumptions' : `Home ${formatPercent(active.homeAppreciationRate)} · stocks ${formatPercent(active.stockReturnRate)}`}</b>
              {' — '}{describe(active)}.
            </span>
          </div>
          <div className="heat-key" aria-hidden="true">
            <span className="key buy"><Home size={13} />Buying ahead</span>
            <span className="key rent"><KeyRound size={13} />Renting ahead</span>
            <span className="key flip"><i />Heavy line: where the answer flips</span>
          </div>
        </div>
      </div>
    </section>
  )
}
