import { BASELINE_INPUTS, type CalculatorInputs } from './calculator'

export interface FieldSpec {
  key: keyof CalculatorInputs
  label: string
  min: number
  max: number
  step: number
  format: 'currency' | 'percent' | 'number'
  help: string
}

export const PRESETS: Record<string, CalculatorInputs> = {
  Baseline: { ...BASELINE_INPUTS },
  'High market returns': { ...BASELINE_INPUTS, stockReturnRate: 0.1 },
  'High housing appreciation': {
    ...BASELINE_INPUTS,
    stockReturnRate: 0.1,
    homeAppreciationRate: 0.045,
  },
}

export const BUY_FIELDS: FieldSpec[] = [
  { key: 'homePrice', label: 'Purchase price', min: 100000, max: 2500000, step: 10000, format: 'currency', help: 'The agreed purchase price before buyer closing costs.' },
  { key: 'mortgageInterestRate', label: 'Mortgage rate', min: 0, max: 0.14, step: 0.0005, format: 'percent', help: 'Fixed annual interest rate used for monthly amortization.' },
  { key: 'homeAppreciationRate', label: 'Home appreciation', min: -0.03, max: 0.1, step: 0.001, format: 'percent', help: 'Expected annual change in the home value.' },
  { key: 'propertyTaxRate', label: 'Property tax', min: 0, max: 0.04, step: 0.0005, format: 'percent', help: 'Annual property tax as a share of beginning-of-year home value.' },
  { key: 'homeownersInsuranceAnnual', label: 'Home insurance', min: 0, max: 20000, step: 100, format: 'currency', help: 'Annual homeowners insurance in year one.' },
  { key: 'hoaMonthly', label: 'Monthly HOA', min: 0, max: 3000, step: 25, format: 'currency', help: 'Recurring homeowners association dues.' },
  { key: 'buyerClosingCosts', label: 'Buyer closing costs', min: 0, max: 100000, step: 1000, format: 'currency', help: 'Up-front cash costs not added to equity.' },
  { key: 'sellingCostRate', label: 'Selling costs', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Deducted from home value to show realizable equity at every horizon.' },
]

export const RENT_FIELDS: FieldSpec[] = [
  { key: 'initialMonthlyRent', label: 'Monthly rent', min: 500, max: 15000, step: 50, format: 'currency', help: 'Starting monthly rent before annual rent growth.' },
  { key: 'rentInflationRate', label: 'Rent growth', min: -0.02, max: 0.12, step: 0.001, format: 'percent', help: 'Expected annual increase in rent.' },
  { key: 'rentersInsuranceAnnual', label: 'Renters insurance', min: 0, max: 3000, step: 25, format: 'currency', help: 'Annual renters insurance in year one.' },
  { key: 'renterInitialInvestment', label: 'Initial investment', min: 0, max: 1500000, step: 5000, format: 'currency', help: 'Starting renter portfolio. By default it equals the down payment plus buyer closing costs.' },
  { key: 'stockReturnRate', label: 'Market return', min: -0.05, max: 0.18, step: 0.001, format: 'percent', help: 'Expected annual return before management and tax drag.' },
  { key: 'investmentManagementDrag', label: 'Management drag', min: 0, max: 0.03, step: 0.0005, format: 'percent', help: 'Annual fees or return drag subtracted from market return.' },
  { key: 'additionalMonthlyInvestment', label: 'Monthly investment', min: 0, max: 10000, step: 100, format: 'currency', help: 'A contribution made to both strategies before cash-flow equalization.' },
  { key: 'additionalAnnualInvestment', label: 'Annual investment', min: 0, max: 120000, step: 1000, format: 'currency', help: 'An additional year-end contribution made to both strategies.' },
]

export const ADVANCED_FIELDS: FieldSpec[] = [
  { key: 'renovationCosts', label: 'Initial renovation', min: 0, max: 500000, step: 5000, format: 'currency', help: 'A year-one owner cash expense; it does not automatically increase home value.' },
  { key: 'annualCapitalImprovements', label: 'Annual improvements', min: 0, max: 50000, step: 500, format: 'currency', help: 'Recurring capital improvement cash outlay.' },
  { key: 'extraMortgagePaymentMonthly', label: 'Extra mortgage payment', min: 0, max: 10000, step: 100, format: 'currency', help: 'Additional principal paid each month.' },
  { key: 'pmiAnnual', label: 'Annual PMI', min: 0, max: 15000, step: 100, format: 'currency', help: 'Annual mortgage insurance while a mortgage balance remains.' },
  { key: 'investmentTaxRate', label: 'Investment gains tax', min: 0, max: 0.5, step: 0.01, format: 'percent', help: 'Simplified annual tax on positive portfolio returns.' },
  { key: 'homeCapitalGainsTaxRate', label: 'Home gains tax', min: 0, max: 0.5, step: 0.01, format: 'percent', help: 'Tax applied to home gains above the modeled exclusion when sold.' },
  { key: 'capitalGainsExclusion', label: 'Home gains exclusion', min: 0, max: 1000000, step: 10000, format: 'currency', help: 'Home appreciation excluded before the modeled home capital-gains tax.' },
  { key: 'mortgageInterestTaxBenefitRate', label: 'Interest tax benefit', min: 0, max: 0.5, step: 0.01, format: 'percent', help: 'Share of mortgage interest returned as an estimated tax benefit.' },
  { key: 'propertyTaxBenefitRate', label: 'Property tax benefit', min: 0, max: 0.5, step: 0.01, format: 'percent', help: 'Share of property tax returned as an estimated tax benefit.' },
  { key: 'hoaInflationRate', label: 'HOA increase', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Annual growth in HOA dues.' },
  { key: 'maintenanceInflationRate', label: 'Maintenance inflation', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Annual inflation applied to maintenance costs.' },
  { key: 'homeownersInsuranceInflationRate', label: 'Home insurance inflation', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Annual increase in homeowners insurance.' },
  { key: 'rentersInsuranceInflationRate', label: 'Renters insurance inflation', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Annual increase in renters insurance.' },
  { key: 'inflationRate', label: 'General inflation', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Used to translate stress-test outcomes into today’s purchasing power. Main charts remain nominal.' },
  { key: 'stockReturnVolatility', label: 'Stock volatility', min: 0, max: 0.5, step: 0.01, format: 'percent', help: 'Annual standard-deviation assumption reserved for the stochastic range view.' },
  { key: 'homeAppreciationVolatility', label: 'Home volatility', min: 0, max: 0.3, step: 0.01, format: 'percent', help: 'Annual standard-deviation assumption reserved for the stochastic range view.' },
  { key: 'refinanceYear', label: 'Refinance year', min: 0, max: 40, step: 1, format: 'number', help: 'Start of the year when the remaining mortgage resets; zero disables refinancing.' },
  { key: 'refinanceInterestRate', label: 'Refinance rate', min: 0, max: 0.14, step: 0.0005, format: 'percent', help: 'New rate applied to the remaining original mortgage term.' },
]

export const HORIZONS = [5, 10, 15, 20, 25, 30, 40]
