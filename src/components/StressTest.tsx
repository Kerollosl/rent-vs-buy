import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowLeftRight, Coins, Home, KeyRound } from 'lucide-react'
import type { CalculationResult, CalculatorInputs } from '../lib/calculator'
import { presentValue, type stressScenarios } from '../lib/planning'
import { money, signedCompact } from '../lib/format'

type Variants = ReturnType<typeof stressScenarios>

export default function StressTest({ inputs, result, variants }: { inputs: CalculatorInputs; result: CalculationResult; variants: Variants }) {
  const [real, setReal] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const inflation = result.inputs.inflationRate
  const years = inputs.horizonYears
  const adjust = (value: number) => (real ? presentValue(value, years, inflation) : value)
  const signed = (variant: Variants[number]) => adjust(variant.final.netWorthDifference)
  const maxAbs = Math.max(1, ...variants.map((variant) => Math.abs(signed(variant))))
  const baseWinner = variants[0].summary.winner
  const final = result.years.at(-1)!

  return (
    <section className="sheet stress-sheet" id="stress" aria-labelledby="stress-title">
      <header className="sheet-head">
        <div>
          <h2 id="stress-title">Stress test</h2>
          <p>Change one thing at a time and see who comes out ahead. Illustrations, not forecasts.</p>
        </div>
        <button type="button" role="switch" aria-checked={real} className={`switch ${real ? 'on' : ''}`} onClick={() => setReal((value) => !value)}>
          <span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span>
          <Coins size={16} aria-hidden="true" />Today’s dollars
        </button>
      </header>

      <p className="stress-caption">
        {real
          ? `Adjusted for ${(inflation * 100).toFixed(1)}% yearly inflation, so year-${years} money is shown at today’s buying power.`
          : <>Year {years} dollars. In today’s buying power: Buy <b>{money.format(presentValue(final.ownerNetWorth, years, inflation))}</b> · Rent <b>{money.format(presentValue(final.renterNetWorth, years, inflation))}</b>.</>}
      </p>

      <div className="tornado" role="list">
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
                <h3>{variant.name}{flips && <span className="flip-badge"><ArrowLeftRight size={12} aria-hidden="true" />Flips</span>}</h3>
                <p>{variant.detail}</p>
              </div>
              <div className={`tornado-chart ${ready ? 'ready' : ''}`} style={{ '--k': ready ? share / 100 : 0 } as CSSProperties}>
                <span className="tornado-zero" aria-hidden="true" />
                <span className={`tornado-bar ${side}`} aria-hidden="true" />
                <span className={`tornado-value ${side}`}>
                  {side === 'buy' ? <Home size={13} aria-hidden="true" /> : <KeyRound size={13} aria-hidden="true" />}
                  {signedCompact(value)}
                </span>
              </div>
              <p className="tornado-detail">
                Buy <b>{money.format(adjust(variant.final.ownerNetWorth))}</b> · Rent <b>{money.format(adjust(variant.final.renterNetWorth))}</b>
                <span className="sr-only">. {value >= 0 ? 'Buying' : 'Renting'} ahead by {money.format(Math.abs(value))}.</span>
              </p>
            </article>
          )
        })}
      </div>
      <p className="note stress-foot">Same horizon, starting cash and contributions in every row.</p>
    </section>
  )
}
