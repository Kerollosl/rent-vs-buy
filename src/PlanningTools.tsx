import { useMemo, useState } from 'react'
import { ChevronDown, Home, KeyRound, TriangleAlert, Wallet } from 'lucide-react'
import type { CalculationResult } from './lib/calculator'
import { planBudget, type HouseholdBudget } from './lib/planning'
import { money } from './lib/format'

const budgetFields: { key: keyof HouseholdBudget; label: string; max: number; unit: string }[] = [
  { key: 'takeHome', label: 'Monthly take-home income', max: 1000000, unit: '$ / month' },
  { key: 'livingCosts', label: 'Non-housing living expenses', max: 1000000, unit: '$ / month' },
  { key: 'debtPayments', label: 'Other debt payments', max: 1000000, unit: '$ / month' },
  { key: 'liquidSavings', label: 'Available cash savings', max: 100000000, unit: '$' },
  { key: 'reserveMonths', label: 'Desired emergency reserve', max: 60, unit: 'months' },
]

/** Optional household-budget check. Inputs stay in this tab and never enter shared links. */
export default function Affordability({ result }: { result: CalculationResult }) {
  const [budget, setBudget] = useState<HouseholdBudget>({ takeHome: 0, livingCosts: 0, debtPayments: 0, liquidSavings: 0, reserveMonths: 6 })
  const [entered, setEntered] = useState(false)
  const plan = useMemo(() => planBudget(result, budget), [result, budget])

  return (
    <details className="sheet afford-sheet" id="afford">
      <summary className="afford-summary">
        <span className="afford-icon" aria-hidden="true"><Wallet size={20} /></span>
        <span className="afford-title">
          <h2 id="budget-title">Can you afford it?</h2>
          <span>Optional. Check monthly room and purchase cash against your own budget. Stays in this tab.</span>
        </span>
        <ChevronDown className="chevron" size={20} aria-hidden="true" />
      </summary>
      <div className="afford-body">
        <div className="budget-fields">
          {budgetFields.map((field) => (
            <label className="budget-field" key={field.key}>
              <span>{field.label}</span>
              <div>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={field.max}
                  step={field.key === 'reserveMonths' ? 1 : 100}
                  value={budget[field.key] || ''}
                  placeholder="0"
                  onChange={(event) => {
                    setEntered(true)
                    setBudget((current) => ({ ...current, [field.key]: Math.min(field.max, Math.max(0, Number(event.target.value) || 0)) }))
                  }}
                />
                <small>{field.unit}</small>
              </div>
            </label>
          ))}
        </div>
        <div className="budget-results">
          <dl className="ledger">
            <div><dt><Home size={15} aria-hidden="true" />Owner housing / month</dt><dd>{money.format(plan.ownerHousing)}</dd></div>
            <div><dt><KeyRound size={15} aria-hidden="true" />Renter housing / month</dt><dd>{money.format(plan.renterHousing)}</dd></div>
            <div><dt>Planned investing / month, each</dt><dd>{money.format(plan.investment)}</dd></div>
            <div><dt>Cash for down payment, closing and renovation</dt><dd>{money.format(plan.cashNeeded)}</dd></div>
          </dl>
          {entered ? (
            <>
              <div className="headroom">
                <span className="eyebrow">Monthly room after expenses and planned investing</span>
                <div>
                  {([['Buying', plan.ownerHeadroom, Home], ['Renting', plan.renterHeadroom, KeyRound]] as const).map(([label, value, Icon]) => (
                    <p key={label} className={value < 0 ? 'short' : ''}>
                      <span><Icon size={15} aria-hidden="true" />{label}</span>
                      <strong>{value < 0 && <TriangleAlert size={18} aria-label="Over budget" />}{money.format(value)}</strong>
                    </p>
                  ))}
                </div>
              </div>
              <p role="status" className="note">
                {plan.ownerHeadroom < 0 ? `Buying exceeds the entered monthly budget by ${money.format(-plan.ownerHeadroom)}.` : `Buying leaves ${money.format(plan.ownerHeadroom)} per month before any additional saving.`}{' '}
                {plan.reserveGap > 0 ? `You need ${money.format(plan.reserveGap)} more cash to fund the purchase and your ${budget.reserveMonths}-month reserve.` : `The entered savings cover the purchase and your ${budget.reserveMonths}-month reserve.`}
              </p>
              <dl className="ledger">
                <div><dt>Cash remaining after purchase and owner investment</dt><dd>{money.format(plan.remainingCash)}</dd></div>
                <div><dt>Emergency reserve target</dt><dd>{money.format(plan.reserveTarget)}</dd></div>
              </dl>
            </>
          ) : (
            <p className="budget-empty">Add your income, spending and savings on the left to see how each option fits your month.</p>
          )}
          <details className="budget-method">
            <summary>How this is calculated <ChevronDown size={15} aria-hidden="true" /></summary>
            <p className="note">Year-one averages before tax benefits. Renovation is funded up front; recurring improvements are monthly. Extra investing from the cheaper strategy is not deducted twice. The reserve covers housing, living expenses and debts; moving costs and rental deposits are excluded.</p>
          </details>
        </div>
      </div>
    </details>
  )
}
