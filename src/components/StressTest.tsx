import { useState, type CSSProperties } from 'react'
import { ArrowLeftRight, Coins, Home, KeyRound } from 'lucide-react'
import type { CalculationResult, CalculatorInputs } from '../lib/calculator'
import { presentValue, type stressScenarios } from '../lib/planning'
import { money } from '../lib/format'

type Variants = ReturnType<typeof stressScenarios>

export default function StressTest({ inputs, result, variants }: { inputs: CalculatorInputs; result: CalculationResult; variants: Variants }) {
  const [real, setReal] = useState(false)
  const inflation = result.inputs.inflationRate
  const years = inputs.horizonYears
  const adjust = (value: number) => (real ? presentValue(value, years, inflation) : value)
  const signed = (variant: Variants[number]) => adjust(variant.final.netWorthDifference)
  const maxAbs = Math.max(1, ...variants.map((variant) => Math.abs(signed(variant))))
  const baseWinner = variants[0].summary.winner
  const sameWinner = variants.slice(1).filter((variant) => variant.summary.winner === baseWinner).length

  return (
    <section className="sheet stress-sheet" id="stress" aria-labelledby="stress-title">
      <header className="sheet-head">
        <div>
          <h2 id="stress-title">Stress test</h2>
          <p>{baseWinner === 'tie' ? 'See how changing one assumption affects the result.' : `${baseWinner === 'buy' ? 'Buying' : 'Renting'} still leads in ${sameWinner} of ${variants.length - 1} alternate scenarios.`}</p>
        </div>
        <button type="button" role="switch" aria-checked={real} className={`switch ${real ? 'on' : ''}`} onClick={() => setReal((value) => !value)}>
          <span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span>
          <Coins size={16} aria-hidden="true" />Today’s dollars
        </button>
      </header>

      <p className="stress-caption">
        {real ? `Values use today’s buying power with ${(inflation * 100).toFixed(1)}% annual inflation.` : `Values are in year ${years} dollars.`}
        {' '}Bar length shows the size of the lead.
      </p>

      <div className="tornado" role="list" aria-label="Stress test results">
        <div className="tornado-axis" aria-hidden="true">
          <span />
          <div className="axis-keys">
            <span className="key rent"><KeyRound size={13} />Renting ahead</span>
            <span className="key buy">Buying ahead<Home size={13} /></span>
          </div>
        </div>
        {variants.map((variant, index) => {
          const value = signed(variant)
          const share = (Math.abs(value) / maxAbs) * 100
          const flips = index > 0 && variant.summary.winner !== baseWinner && variant.summary.winner !== 'tie'
          const side = value >= 0 ? 'buy' : 'rent'
          return (
            <article className={`tornado-row ${index === 0 ? 'base' : ''}`} role="listitem" key={variant.name}>
              <div className="tornado-name">
                <h3>{variant.name}{flips && <span className="flip-badge"><ArrowLeftRight size={12} aria-hidden="true" />Winner changes</span>}</h3>
                <p>{variant.detail}</p>
              </div>
              <div className="tornado-chart" style={{ '--k': share / 100 } as CSSProperties} aria-hidden="true">
                <span className="tornado-zero" />
                <span className={`tornado-bar ${side}`} />
              </div>
              <div className="tornado-detail">
                <strong className={value === 0 ? '' : side}>{variant.summary.winner === 'tie' ? 'Even' : `${side === 'buy' ? 'Buying' : 'Renting'} ahead by ${money.format(Math.abs(value))}`}</strong>
                <p>Buy {money.format(adjust(variant.final.ownerNetWorth))} · Rent {money.format(adjust(variant.final.renterNetWorth))}</p>
              </div>
            </article>
          )
        })}
      </div>
      <p className="note stress-foot">All rows use the same time period, starting cash and planned contributions.</p>
    </section>
  )
}
