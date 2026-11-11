import { describe, expect, it } from 'vitest'
import { BASELINE_INPUTS, calculateScenario } from './calculator'
import { planBudget, presentValue, stressScenarios } from './planning'

describe('household planning', () => {
  it('keeps renovation out of recurring housing and funds it once in cash', () => {
    const base = calculateScenario(BASELINE_INPUTS)
    const renovated = calculateScenario({ ...BASELINE_INPUTS, renovationCosts: 20000 })
    const budget = { takeHome: 10000, livingCosts: 2000, debtPayments: 500, liquidSavings: 200000, reserveMonths: 6 }
    const a = planBudget(base, budget), b = planBudget(renovated, budget)
    expect(b.ownerHousing).toBeCloseTo(a.ownerHousing)
    expect(b.remainingCash).toBeCloseTo(a.remainingCash - 20000)
    expect(b.ownerHeadroom).toBeCloseTo(10000 - 2500 - b.ownerHousing - b.investment)
  })
  it('does not count tax benefits as available monthly bill money', () => {
    const budget = { takeHome: 0, livingCosts: 0, debtPayments: 0, liquidSavings: 0, reserveMonths: 6 }
    const a = planBudget(calculateScenario(BASELINE_INPUTS), budget)
    const b = planBudget(calculateScenario({ ...BASELINE_INPUTS, mortgageInterestTaxBenefitRate: 0.3 }), budget)
    expect(b.ownerHousing).toBeCloseTo(a.ownerHousing)
    expect(a.reserveGap).toBeGreaterThan(a.cashNeeded)
    expect(a.ownerHeadroom).toBeLessThan(0)
  })
  it('includes owner investments in the cash reserve check', () => {
    const budget = { takeHome: 1, livingCosts: 1, debtPayments: 0, liquidSavings: 200000, reserveMonths: 0 }
    const a = planBudget(calculateScenario({ ...BASELINE_INPUTS, ownerInitialInvestment: 12345 }), budget)
    expect(a.remainingCash).toBeCloseTo(200000 - a.cashNeeded - 12345)
  })
  it('keeps recurring capital improvements in the monthly budget', () => {
    const budget = { takeHome: 10000, livingCosts: 0, debtPayments: 0, liquidSavings: 200000, reserveMonths: 6 }
    const a = planBudget(calculateScenario(BASELINE_INPUTS), budget)
    const b = planBudget(calculateScenario({ ...BASELINE_INPUTS, annualCapitalImprovements: 12000 }), budget)
    expect(b.ownerHousing - a.ownerHousing).toBeCloseTo(1000)
    expect(b.cashNeeded).toBe(a.cashNeeded)
  })
  it('deflates future values and preserves negative signs', () => {
    expect(presentValue(121, 2, 0.1)).toBeCloseTo(100)
    expect(presentValue(-121, 2, 0.1)).toBeCloseTo(-100)
    expect(presentValue(121, 0, 0.1)).toBe(121)
    expect(() => presentValue(1, 1, -1)).toThrow()
  })
  it('stress alternatives leave input unchanged and keep the same horizon', () => {
    const inputs = { ...BASELINE_INPUTS, maintenanceAnnual: 4000 }
    const before = JSON.stringify(inputs)
    const rows = stressScenarios(inputs)
    expect(JSON.stringify(inputs)).toBe(before)
    expect(rows).toHaveLength(5)
    expect(rows.every(row => row.final.year === inputs.horizonYears)).toBe(true)
    expect(rows[1].final.homeValue).toBeLessThan(rows[0].final.homeValue)
    expect(rows[4].final.maintenance).toBeCloseTo(rows[0].final.maintenance * 1.5)
  })
})
