import { calculateScenario, type CalculatorInputs, type CalculationResult } from './calculator'

export interface HouseholdBudget {
  takeHome: number
  livingCosts: number
  debtPayments: number
  liquidSavings: number
  reserveMonths: number
}

export function planBudget(result: CalculationResult, budget: HouseholdBudget) {
  for (const value of Object.values(budget)) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Budget values must be finite and non-negative')
  }
  const first = result.years[1]
  if (!first) throw new RangeError('A budget requires at least one modeled year')
  const i = result.inputs
  // Reserve for bills before estimated tax refunds. Renovation is funded separately.
  const ownerHousing = (first.ownerHousingCost + first.ownerTaxBenefits - i.renovationCosts) / 12
  const renterHousing = first.renterHousingCost / 12
  const investment = i.additionalMonthlyInvestment + i.additionalAnnualInvestment / 12
  const other = budget.livingCosts + budget.debtPayments
  const cashNeeded = i.downPayment + i.buyerClosingCosts + i.renovationCosts
  const remainingCash = budget.liquidSavings - cashNeeded - i.ownerInitialInvestment
  const reserveTarget = (ownerHousing + other) * budget.reserveMonths
  return {
    ownerHousing, renterHousing, investment, cashNeeded, remainingCash, reserveTarget,
    reserveGap: Math.max(0, reserveTarget - remainingCash),
    ownerHeadroom: budget.takeHome - ownerHousing - other - investment,
    renterHeadroom: budget.takeHome - renterHousing - other - investment,
    reserveRunway: ownerHousing + other > 0 ? Math.max(0, remainingCash) / (ownerHousing + other) : null,
  }
}

export function presentValue(amount: number, years: number, inflation: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(years) || years < 0 || !Number.isFinite(inflation) || inflation <= -1) throw new RangeError('Invalid purchasing-power inputs')
  return amount / Math.pow(1 + inflation, years)
}

export function stressScenarios(inputs: CalculatorInputs) {
  const variants = [
    { name: 'Current assumptions', detail: 'Your unchanged starting point.', changes: {} },
    { name: 'Slower home growth', detail: 'Home appreciation reduced by 2 percentage points each year.', changes: { homeAppreciationRate: Math.max(-0.5, inputs.homeAppreciationRate - 0.02) } },
    { name: 'Lower market returns', detail: 'Investment return reduced by 3 percentage points each year.', changes: { stockReturnRate: Math.max(-0.5, inputs.stockReturnRate - 0.03) } },
    { name: 'Faster rent increases', detail: 'Annual rent growth raised by 2 percentage points.', changes: { rentInflationRate: Math.min(1, inputs.rentInflationRate + 0.02) } },
    { name: 'Costlier ownership', detail: 'Maintenance and home insurance costs increase by 50%.', changes: { maintenanceRate: inputs.maintenanceRate * 1.5, maintenanceAnnual: inputs.maintenanceAnnual === undefined ? undefined : inputs.maintenanceAnnual * 1.5, homeownersInsuranceAnnual: inputs.homeownersInsuranceAnnual * 1.5 } },
  ]
  return variants.map(variant => {
    const calculation = calculateScenario({ ...inputs, ...variant.changes })
    return { ...variant, final: calculation.years.at(-1)!, summary: calculation.summary }
  })
}
