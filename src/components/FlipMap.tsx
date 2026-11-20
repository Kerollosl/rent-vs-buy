import { useMemo, useState, type CSSProperties } from 'react'
import { Equal, Home, KeyRound } from 'lucide-react'
import { calculateSensitivity, type CalculatorInputs, type SensitivityCell } from '../lib/calculator'
import { formatPercent, money } from '../lib/format'

const round = (value: number) => Math.round(value * 10000) / 10000
const icons = { buy: Home, rent: KeyRound, tie: Equal }

function describe(cell: SensitivityCell) {
  if (cell.winner === 'tie') return 'Buying and renting come out even'
  return `${cell.winner === 'buy' ? 'Buying' : 'Renting'} ahead by ${money.format(Math.abs(cell.advantage))}`
}

export default function FlipMap({ inputs, breakEven }: {
  inputs: CalculatorInputs
  breakEven: number | null
}) {
  const stockRates = useMemo(() => [-2, -1, 0, 1, 2].map((k) => round(inputs.stockReturnRate + k * 0.02)), [inputs.stockReturnRate])
  const homeRates = useMemo(() => [2, 1, 0, -1, -2].map((k) => round(inputs.homeAppreciationRate + k * 0.01)), [inputs.homeAppreciationRate])
  const grid = useMemo(() => calculateSensitivity(inputs, stockRates, homeRates), [inputs, stockRates, homeRates])
  const maxAbs = Math.max(1, ...grid.cells.flat().map((cell) => Math.abs(cell.advantage)))
  const [selection, setSelection] = useState({ row: 2, column: 2 })
  const active = grid.cells[selection.row][selection.column]
  const isCenter = selection.row === 2 && selection.column === 2

  return (
    <section className="sheet flip-sheet" id="flip" aria-labelledby="flip-title">
      <header className="sheet-head">
        <div>
          <h2 id="flip-title">What changes the answer?</h2>
          <p>See who comes out ahead by year {inputs.horizonYears} at different annual rates. Tap a square to see the dollar gap.</p>
        </div>
      </header>
      <div className="flip-body">
        <div className="gauge">
          <div className="gauge-copy">
            <h3>Stock return needed to break even</h3>
            {breakEven === null
              ? <p>The calculator found no break-even point between 0% and 20% annual stock returns.</p>
              : <><strong className="gauge-value">{formatPercent(breakEven)}</strong><p>At about this return, buying and renting end with the same wealth at year {inputs.horizonYears}.</p></>}
            <p>Your assumed return is <b>{formatPercent(inputs.stockReturnRate)}</b>.</p>
          </div>
        </div>
        <div className="heat-wrap">
          <div className="heat" role="group" aria-label="Compare home price growth and stock return assumptions">
            <div className="heat-axis-top">Annual stock return</div>
            <div className="heat-axis-left"><span>Annual home price growth</span></div>
            <div className="heat-cols" aria-hidden="true">
              <span />
              {stockRates.map((rate, index) => <span key={rate} className={index === 2 ? 'now' : ''}>{formatPercent(rate)}</span>)}
            </div>
            {grid.cells.map((row, r) => (
              <div className="heat-row" key={r}>
                <span className={`heat-rowlabel ${r === 2 ? 'now' : ''}`} aria-hidden="true">{formatPercent(homeRates[r])}</span>
                {row.map((cell, c) => {
                  const Icon = icons[cell.winner]
                  const strength = 14 + 65 * Math.sqrt(Math.abs(cell.advantage) / maxAbs)
                  const baseline = r === 2 && c === 2
                  const selected = selection.row === r && selection.column === c
                  return (
                    <button
                      type="button" key={c} className={`heat-cell ${cell.winner} ${baseline ? 'current' : ''}`}
                      style={{ '--strength': `${strength}%` } as CSSProperties}
                      aria-label={`${baseline ? 'Your assumptions. ' : ''}Home price growth ${formatPercent(cell.homeAppreciationRate)}, stock return ${formatPercent(cell.stockReturnRate)}. ${describe(cell)}.`}
                      aria-pressed={selected}
                      onClick={() => setSelection({ row: r, column: c })}
                    >
                      <Icon size={17} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="heat-key" aria-hidden="true">
            <span className="key buy"><Home size={15} />Buying ahead</span>
            <span className="key rent"><KeyRound size={15} />Renting ahead</span>
            <span className="key"><Equal size={15} />Even</span>
          </div>
          <p className="note">Darker squares show a bigger lead. The dashed outline marks your assumptions.</p>
          <div className="heat-caption" aria-live="polite">
            <b>{isCenter ? 'Your assumptions' : `Home growth ${formatPercent(active.homeAppreciationRate)} · stock return ${formatPercent(active.stockReturnRate)}`}</b>
            <span>{describe(active)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
