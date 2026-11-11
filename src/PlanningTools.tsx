import { useMemo, useState } from 'react'
import type { CalculatorInputs, CalculationResult } from './lib/calculator'
import { planBudget, presentValue, stressScenarios, type HouseholdBudget } from './lib/planning'

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const budgetFields: { key: keyof HouseholdBudget; label: string; max: number; unit: string }[] = [
  { key: 'takeHome', label: 'Monthly take-home income', max: 1000000, unit: '$ / month' },
  { key: 'livingCosts', label: 'Non-housing living expenses', max: 1000000, unit: '$ / month' },
  { key: 'debtPayments', label: 'Other debt payments', max: 1000000, unit: '$ / month' },
  { key: 'liquidSavings', label: 'Available cash savings', max: 100000000, unit: '$' },
  { key: 'reserveMonths', label: 'Desired emergency reserve', max: 60, unit: 'months' },
]

export default function PlanningTools({ inputs, result }: { inputs: CalculatorInputs; result: CalculationResult }) {
  const [budget, setBudget] = useState<HouseholdBudget>({ takeHome: 0, livingCosts: 0, debtPayments: 0, liquidSavings: 0, reserveMonths: 6 })
  const [entered, setEntered] = useState(false)
  const [real, setReal] = useState(false)
  const plan = useMemo(() => planBudget(result, budget), [result, budget])
  const variants = useMemo(() => stressScenarios(inputs), [inputs])
  const inflation = result.inputs.inflationRate
  const amount = (value: number) => money(real ? presentValue(value, inputs.horizonYears, inflation) : value)
  const final = result.years.at(-1)!

  return <>
    <section className="planning-sheet" id="budget" aria-labelledby="budget-title">
      <div className="section-heading"><div><h2 id="budget-title">Can the monthly budget carry it?</h2><p>A wealth advantage and a comfortable monthly payment are different questions.</p></div></div>
      <div className="planning-layout">
        <div className="budget-fields">
          <p className="planning-note">Enter your household figures. They stay in this tab and are excluded from shared scenarios.</p>
          {budgetFields.map(field => <label className="budget-field" key={field.key}><span>{field.label}</span><div><input type="number" min="0" max={field.max} step={field.key === 'reserveMonths' ? 1 : 100} value={budget[field.key] || ''} placeholder="0" onChange={event => { setEntered(true); setBudget(current => ({ ...current, [field.key]: Math.min(field.max, Math.max(0, Number(event.target.value) || 0)) })) }} /><small>{field.unit}</small></div></label>)}
        </div>
        <div className="budget-results">
          <dl className="planning-ledger">
            <div><dt>Owner housing / month</dt><dd>{money(plan.ownerHousing)}</dd></div>
            <div><dt>Renter housing / month</dt><dd>{money(plan.renterHousing)}</dd></div>
            <div><dt>Planned investing / month, each</dt><dd>{money(plan.investment)}</dd></div>
            <div><dt>Cash for down payment, closing & renovation</dt><dd>{money(plan.cashNeeded)}</dd></div>
          </dl>
          {entered ? <>
            <div className="budget-headroom"><span>Monthly room after housing, expenses, debts & planned investing</span><div><p>Buying<strong>{money(plan.ownerHeadroom)}</strong></p><p>Renting<strong>{money(plan.renterHeadroom)}</strong></p></div></div>
            <p role="status" className="planning-note">{plan.ownerHeadroom < 0 ? `Buying exceeds the entered monthly budget by ${money(-plan.ownerHeadroom)}.` : `Buying leaves ${money(plan.ownerHeadroom)} per month before any additional saving.`} {plan.reserveGap > 0 ? `You need ${money(plan.reserveGap)} more cash to fund the purchase and your ${budget.reserveMonths}-month reserve.` : `The entered savings cover the purchase and your ${budget.reserveMonths}-month reserve.`}</p>
            <dl className="planning-ledger"><div><dt>Cash remaining after purchase & owner investment</dt><dd>{money(plan.remainingCash)}</dd></div><div><dt>Emergency reserve target</dt><dd>{money(plan.reserveTarget)}</dd></div></dl>
          </> : <p className="budget-empty">Add your income, spending, and available cash to see monthly breathing room and a purchase reserve check.</p>}
          <p className="planning-note">Year-one averages before estimated tax benefits. Renovation is funded up front; recurring improvements remain in monthly housing. Additional saving from the cheaper strategy is not deducted here. Reserve target covers housing, living expenses, and debts. Moving costs and rental deposits are not included.</p>
        </div>
      </div>
    </section>

    <section className="planning-sheet" id="stress" aria-labelledby="stress-title">
      <div className="section-heading"><div><h2 id="stress-title">Does the decision hold up?</h2><p>Change one assumption at a time. These are illustrative alternatives, not forecasts or probabilities.</p></div></div>
      <div className="stress-controls"><label><input type="checkbox" checked={real} onChange={event => setReal(event.target.checked)} /> Show outcomes in today’s dollars</label><span>{real ? `Deflated at ${(inflation * 100).toFixed(1)}% annually` : `Nominal dollars at year ${inputs.horizonYears}`}</span></div>
      <div className="stress-summary"><p>Under current assumptions, {money(final.ownerNetWorth)} of owner wealth in year {inputs.horizonYears} has the purchasing power of <strong>{money(presentValue(final.ownerNetWorth, inputs.horizonYears, inflation))} today</strong>. The renter’s equivalent is <strong>{money(presentValue(final.renterNetWorth, inputs.horizonYears, inflation))}</strong>.</p></div>
      <div className="stress-list">{variants.map(variant => <article className="stress-row" key={variant.name}><div><h3>{variant.name}</h3><p>{variant.detail}</p></div><dl><div><dt>Buy</dt><dd>{amount(variant.final.ownerNetWorth)}</dd></div><div><dt>Rent</dt><dd>{amount(variant.final.renterNetWorth)}</dd></div><div><dt>{variant.summary.winner === 'tie' ? 'Even' : `${variant.summary.winner === 'buy' ? 'Buy' : 'Rent'} ahead`}</dt><dd className={variant.summary.winner === 'buy' ? 'stress-buy' : 'stress-rent'}>{amount(variant.summary.advantage)}</dd></div></dl></article>)}</div>
      <p className="planning-note planning-footer">All alternatives use the same {inputs.horizonYears}-year horizon, initial cash, and contribution schedule. Adjust general inflation in advanced assumptions. Today’s dollars apply only to this section; the main charts and exports remain nominal.</p>
    </section>
  </>
}
