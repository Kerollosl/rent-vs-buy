import { useEffect, useMemo, useState } from 'react'
import PlanningTools from './PlanningTools'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookmarkPlus,
  ChevronDown,
  Copy,
  Download,
  Home,
  Info,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
} from 'lucide-react'
import {
  BASELINE_INPUTS,
  calculateScenario,
  calculateSensitivity,
  findBreakEvenStockReturn,
  type CalculatorInputs,
  type YearResult,
} from './lib/calculator'

type FolioTab = 'buy' | 'rent'
type DownPaymentMode = 'dollars' | 'percent'
type MaintenanceMode = 'rate' | 'fixed'
type ChartView =
  | 'netWorth'
  | 'homeDebt'
  | 'equity'
  | 'portfolios'
  | 'annualCosts'
  | 'unrecoverable'
  | 'principalInterest'
  | 'advantage'

interface SavedScenario {
  id: string
  name: string
  inputs: CalculatorInputs
  savedAt: string
}

interface FieldSpec {
  key: keyof CalculatorInputs
  label: string
  min: number
  max: number
  step: number
  format: 'currency' | 'percent' | 'number'
  help: string
}

const PRESETS: Record<string, CalculatorInputs> = {
  Baseline: { ...BASELINE_INPUTS },
  'High market returns': { ...BASELINE_INPUTS, stockReturnRate: 0.1 },
  'High housing appreciation': {
    ...BASELINE_INPUTS,
    stockReturnRate: 0.1,
    homeAppreciationRate: 0.045,
  },
}

const BUY_FIELDS: FieldSpec[] = [
  { key: 'homePrice', label: 'Purchase price', min: 100000, max: 2500000, step: 10000, format: 'currency', help: 'The agreed purchase price before buyer closing costs.' },
  { key: 'mortgageInterestRate', label: 'Mortgage rate', min: 0, max: 0.14, step: 0.0005, format: 'percent', help: 'Fixed annual interest rate used for monthly amortization.' },
  { key: 'homeAppreciationRate', label: 'Home appreciation', min: -0.03, max: 0.1, step: 0.001, format: 'percent', help: 'Expected annual change in the home value.' },
  { key: 'propertyTaxRate', label: 'Property tax', min: 0, max: 0.04, step: 0.0005, format: 'percent', help: 'Annual property tax as a share of beginning-of-year home value.' },
  { key: 'homeownersInsuranceAnnual', label: 'Home insurance', min: 0, max: 20000, step: 100, format: 'currency', help: 'Annual homeowners insurance in year one.' },
  { key: 'hoaMonthly', label: 'Monthly HOA', min: 0, max: 3000, step: 25, format: 'currency', help: 'Recurring homeowners association dues.' },
  { key: 'buyerClosingCosts', label: 'Buyer closing costs', min: 0, max: 100000, step: 1000, format: 'currency', help: 'Up-front cash costs not added to equity.' },
  { key: 'sellingCostRate', label: 'Selling costs', min: 0, max: 0.12, step: 0.005, format: 'percent', help: 'Deducted from home value to show realizable equity at every horizon.' },
]

const RENT_FIELDS: FieldSpec[] = [
  { key: 'initialMonthlyRent', label: 'Monthly rent', min: 500, max: 15000, step: 50, format: 'currency', help: 'Starting monthly rent before annual rent growth.' },
  { key: 'rentInflationRate', label: 'Rent growth', min: -0.02, max: 0.12, step: 0.001, format: 'percent', help: 'Expected annual increase in rent.' },
  { key: 'rentersInsuranceAnnual', label: 'Renters insurance', min: 0, max: 3000, step: 25, format: 'currency', help: 'Annual renters insurance in year one.' },
  { key: 'renterInitialInvestment', label: 'Initial investment', min: 0, max: 1500000, step: 5000, format: 'currency', help: 'Starting renter portfolio. By default it equals the down payment plus buyer closing costs.' },
  { key: 'stockReturnRate', label: 'Market return', min: -0.05, max: 0.18, step: 0.001, format: 'percent', help: 'Expected annual return before management and tax drag.' },
  { key: 'investmentManagementDrag', label: 'Management drag', min: 0, max: 0.03, step: 0.0005, format: 'percent', help: 'Annual fees or return drag subtracted from market return.' },
  { key: 'additionalMonthlyInvestment', label: 'Monthly investment', min: 0, max: 10000, step: 100, format: 'currency', help: 'A contribution made to both strategies before cash-flow equalization.' },
  { key: 'additionalAnnualInvestment', label: 'Annual investment', min: 0, max: 120000, step: 1000, format: 'currency', help: 'An additional year-end contribution made to both strategies.' },
]

const ADVANCED_FIELDS: FieldSpec[] = [
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

const CHART_TABS: Array<{ id: ChartView; label: string }> = [
  { id: 'netWorth', label: 'Net worth' },
  { id: 'homeDebt', label: 'Home & mortgage' },
  { id: 'equity', label: 'Home equity' },
  { id: 'portfolios', label: 'Portfolios' },
  { id: 'annualCosts', label: 'Annual costs' },
  { id: 'unrecoverable', label: 'Unrecoverable' },
  { id: 'principalInterest', label: 'Principal & interest' },
  { id: 'advantage', label: 'Advantage' },
]

const HORIZONS = [5, 10, 15, 20, 25, 30, 40]
const STOCK_RATES = [0.04, 0.06, 0.08, 0.1, 0.12]
const HOME_RATES = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`
}

function fieldValue(value: number, format: FieldSpec['format']): number {
  return format === 'percent' ? Number((value * 100).toFixed(2)) : value
}

function storedValue(value: number, format: FieldSpec['format']): number {
  return format === 'percent' ? value / 100 : value
}

function NumericField({
  spec,
  inputs,
  onChange,
}: {
  spec: FieldSpec
  inputs: CalculatorInputs
  onChange: (key: keyof CalculatorInputs, value: number | undefined) => void
}) {
  const raw = Number(inputs[spec.key] ?? 0)
  const shown = fieldValue(raw, spec.format)
  const min = fieldValue(spec.min, spec.format)
  const max = fieldValue(spec.max, spec.format)
  const step = fieldValue(spec.step, spec.format)
  const prefix = spec.format === 'currency' ? '$' : undefined
  const suffix = spec.format === 'percent' ? '%' : undefined

  const update = (value: number) => {
    const clamped = Math.max(min, Math.min(max, Number.isFinite(value) ? value : min))
    onChange(spec.key, storedValue(clamped, spec.format))
  }

  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={`field-${String(spec.key)}`}>{spec.label}</label>
        <span className="info-icon" title={spec.help} aria-label={spec.help} tabIndex={0}><Info size={14} /></span>
      </div>
      <div className="field-value-row">
        <input
          aria-label={`${spec.label} slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={shown}
          onChange={(event) => update(Number(event.target.value))}
        />
        <div className="number-wrap">
          {prefix && <span aria-hidden="true">{prefix}</span>}
          <input
            id={`field-${String(spec.key)}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={shown}
            onChange={(event) => update(Number(event.target.value))}
          />
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </div>
      </div>
    </div>
  )
}

function ModeField({
  label,
  help,
  mode,
  modes,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onMode,
  onValue,
}: {
  label: string
  help: string
  mode: string
  modes: Array<{ id: string; label: string }>
  value: number
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
  onMode: (mode: string) => void
  onValue: (value: number) => void
}) {
  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={`mode-${label}`}>{label}</label>
        <span className="info-icon" title={help} aria-label={help} tabIndex={0}><Info size={14} /></span>
      </div>
      <div className="mini-toggle" role="group" aria-label={`${label} format`}>
        {modes.map((item) => <button type="button" key={item.id} className={mode === item.id ? 'active' : ''} onClick={() => onMode(item.id)}>{item.label}</button>)}
      </div>
      <div className="field-value-row">
        <input aria-label={`${label} slider`} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onValue(Number(event.target.value))} />
        <div className="number-wrap">
          {prefix && <span aria-hidden="true">{prefix}</span>}
          <input id={`mode-${label}`} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onValue(Number(event.target.value))} />
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </div>
      </div>
    </div>
  )
}

function AssumptionFolio({
  inputs,
  tab,
  downPaymentMode,
  maintenanceMode,
  includeClosingCash,
  onTab,
  onDownPaymentMode,
  onMaintenanceMode,
  onIncludeClosingCash,
  onChange,
}: {
  inputs: CalculatorInputs
  tab: FolioTab
  downPaymentMode: DownPaymentMode
  maintenanceMode: MaintenanceMode
  includeClosingCash: boolean
  onTab: (tab: FolioTab) => void
  onDownPaymentMode: (mode: DownPaymentMode) => void
  onMaintenanceMode: (mode: MaintenanceMode) => void
  onIncludeClosingCash: (value: boolean) => void
  onChange: (key: keyof CalculatorInputs, value: number | undefined) => void
}) {
  const fields = tab === 'buy' ? BUY_FIELDS : RENT_FIELDS
  const downPayment = Number(inputs.downPayment ?? inputs.homePrice * (inputs.downPaymentPercent ?? 0.2))
  const downPaymentShown = downPaymentMode === 'percent' ? Number(((downPayment / inputs.homePrice) * 100).toFixed(2)) : downPayment
  const fixedMaintenance = inputs.maintenanceAnnual ?? inputs.homePrice * inputs.maintenanceRate
  return (
    <aside className="assumptions" aria-label="Scenario assumptions">
      <div className="folio-head">
        <h2>Assumptions</h2>
        <p>Every change recalculates the full timeline.</p>
        <div className="folio-tabs" role="tablist" aria-label="Assumption groups">
          {(['buy', 'rent'] as FolioTab[]).map((item) => (
            <button
              key={item}
              className={`folio-tab ${tab === item ? 'active' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => onTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="control-sheet" role="tabpanel">
        {tab === 'buy' && (
          <div className="control-group">
            <h3>Financing</h3>
            <div className="field">
              <div className="field-label"><label htmlFor="mortgage-term">Mortgage term</label></div>
              <select
                id="mortgage-term"
                className="scenario-select"
                value={inputs.mortgageTermYears}
                onChange={(event) => onChange('mortgageTermYears', Number(event.target.value))}
              >
                {[10, 15, 20, 30, 40].map((year) => <option key={year} value={year}>{year} years</option>)}
              </select>
            </div>
          </div>
        )}
        <div className="control-group">
          <h3>{tab === 'buy' ? 'Home and ownership' : 'Rent and investment'}</h3>
          {fields.map((spec) => (
            <div key={String(spec.key)}>
              {tab === 'buy' && spec.key === 'mortgageInterestRate' && (
                <ModeField
                  label="Down payment"
                  help="Choose an exact cash amount or percentage of purchase price."
                  mode={downPaymentMode}
                  modes={[{ id: 'dollars', label: '$ amount' }, { id: 'percent', label: '% of price' }]}
                  value={downPaymentShown}
                  min={0}
                  max={downPaymentMode === 'percent' ? 100 : inputs.homePrice}
                  step={downPaymentMode === 'percent' ? 0.5 : 5000}
                  prefix={downPaymentMode === 'dollars' ? '$' : undefined}
                  suffix={downPaymentMode === 'percent' ? '%' : undefined}
                  onMode={(mode) => onDownPaymentMode(mode as DownPaymentMode)}
                  onValue={(value) => onChange('downPayment', downPaymentMode === 'percent' ? inputs.homePrice * value / 100 : value)}
                />
              )}
              <NumericField spec={spec} inputs={inputs} onChange={onChange} />
              {tab === 'buy' && spec.key === 'homeownersInsuranceAnnual' && (
                <ModeField
                  label="Annual maintenance"
                  help="Model maintenance as a share of home value or a fixed year-one cost."
                  mode={maintenanceMode}
                  modes={[{ id: 'rate', label: '% of value' }, { id: 'fixed', label: '$ fixed' }]}
                  value={maintenanceMode === 'rate' ? inputs.maintenanceRate * 100 : fixedMaintenance}
                  min={0}
                  max={maintenanceMode === 'rate' ? 5 : 100000}
                  step={maintenanceMode === 'rate' ? 0.1 : 500}
                  prefix={maintenanceMode === 'fixed' ? '$' : undefined}
                  suffix={maintenanceMode === 'rate' ? '%' : undefined}
                  onMode={(mode) => {
                    const nextMode = mode as MaintenanceMode
                    onMaintenanceMode(nextMode)
                    if (nextMode === 'fixed') onChange('maintenanceAnnual', fixedMaintenance)
                    else onChange('maintenanceAnnual', undefined)
                  }}
                  onValue={(value) => onChange(maintenanceMode === 'rate' ? 'maintenanceRate' : 'maintenanceAnnual', maintenanceMode === 'rate' ? value / 100 : value)}
                />
              )}
            </div>
          ))}
        </div>
        <details className="advanced">
          <summary>Advanced assumptions <ChevronDown size={16} /></summary>
          <div className="advanced-content">
            {ADVANCED_FIELDS.map((spec) => <NumericField key={String(spec.key)} spec={spec} inputs={inputs} onChange={onChange} />)}
            <label className="check-row">
              <input type="checkbox" checked={includeClosingCash} onChange={(event) => onIncludeClosingCash(event.target.checked)} />
              <span><strong>Invest avoided closing cash</strong><small>Add buyer closing costs to the renter’s starting portfolio.</small></span>
            </label>
            <p className="method-note">Volatility and general inflation are stored for the future stochastic and real-dollar views. The current primary result remains a deterministic nominal expected-value comparison.</p>
          </div>
        </details>
      </div>
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><span className="metric-value">{value}</span></div>
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; payload?: YearResult }>; label?: number }) {
  if (!active || !payload?.length) return null
  const year = payload[0]?.payload
  return (
    <div className="custom-tooltip">
      <p className="tooltip-year">Year {label}</p>
      {payload.map((entry) => (
        <div className="tooltip-row" key={entry.name}>
          <span style={{ color: entry.color }}>{entry.name}</span>
          <strong>{money.format(entry.value ?? 0)}</strong>
        </div>
      ))}
      {year && <div className="tooltip-detail">
        <div className="tooltip-row"><span>Owner equity after sale</span><strong>{money.format(year.realizableHomeEquity)}</strong></div>
        <div className="tooltip-row"><span>Owner portfolio</span><strong>{money.format(year.ownerInvestmentPortfolio)}</strong></div>
        <div className="tooltip-row"><span>Renter portfolio</span><strong>{money.format(year.renterInvestmentPortfolio)}</strong></div>
        <div className="tooltip-row"><span>Owner / renter cash</span><strong>{compactMoney.format(year.ownerHousingCost)} / {compactMoney.format(year.renterHousingCost)}</strong></div>
        <div className="tooltip-row"><span>Net-worth spread</span><strong>{money.format(year.netWorthDifference)}</strong></div>
      </div>}
    </div>
  )
}

function ComparisonChart({
  data,
  view,
  selectedYear,
  width,
  height,
}: {
  data: YearResult[]
  view: ChartView
  selectedYear: number
  width?: number
  height?: number
}) {
  const chartSize = { width, height }
  const axis = <YAxis tickFormatter={(value: number) => compactMoney.format(value)} tick={{ fill: 'var(--ink-soft)', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
  const common = <>
    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 5" />
    <XAxis dataKey="year" tick={{ fill: 'var(--ink-soft)', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={12} />
    {axis}
    <Tooltip content={<ChartTooltip />} />
    <ReferenceLine x={selectedYear} stroke="var(--ink-soft)" strokeDasharray="3 4" />
  </>

  if (view === 'netWorth') return <LineChart {...chartSize} data={data}>{common}<Line type="monotone" dataKey="ownerNetWorth" name="Buy + invest" stroke="var(--rust)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="renterNetWorth" name="Rent + invest" stroke="var(--sage)" strokeWidth={3} strokeDasharray="8 5" dot={false} activeDot={{ r: 5 }} /></LineChart>
  if (view === 'homeDebt') return <LineChart {...chartSize} data={data}>{common}<Line type="monotone" dataKey="homeValue" name="Home value" stroke="var(--rust)" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="mortgageBalance" name="Mortgage balance" stroke="var(--ink-soft)" strokeWidth={2} dot={false} /></LineChart>
  if (view === 'equity') return <AreaChart {...chartSize} data={data}>{common}<Area type="monotone" dataKey="grossHomeEquity" name="Gross equity" stroke="var(--rust)" fill="var(--rust-soft)" strokeWidth={3} /></AreaChart>
  if (view === 'portfolios') return <LineChart {...chartSize} data={data}>{common}<Line type="monotone" dataKey="ownerInvestmentPortfolio" name="Owner portfolio" stroke="var(--rust)" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="renterInvestmentPortfolio" name="Renter portfolio" stroke="var(--sage)" strokeWidth={3} strokeDasharray="8 5" dot={false} /></LineChart>
  if (view === 'annualCosts') return <BarChart {...chartSize} data={data}>{common}<Bar dataKey="ownerHousingCost" name="Owner cash cost" fill="var(--rust)" radius={[4, 4, 0, 0]} /><Bar dataKey="renterHousingCost" name="Renter cash cost" fill="var(--sage)" radius={[4, 4, 0, 0]} /></BarChart>
  if (view === 'unrecoverable') return <LineChart {...chartSize} data={data}>{common}<Line type="monotone" dataKey="cumulativeOwnerUnrecoverableCost" name="Owner unrecoverable" stroke="var(--rust)" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="cumulativeRenterHousingCost" name="Renter unrecoverable" stroke="var(--sage)" strokeWidth={3} strokeDasharray="8 5" dot={false} /></LineChart>
  if (view === 'principalInterest') return <BarChart {...chartSize} data={data}>{common}<Bar dataKey="principalPaid" name="Principal" fill="var(--sage)" stackId="mortgage" /><Bar dataKey="interestPaid" name="Interest" fill="var(--rust)" stackId="mortgage" radius={[4, 4, 0, 0]} /></BarChart>
  return <AreaChart {...chartSize} data={data}>{common}<ReferenceLine y={0} stroke="var(--ink)" /><Area type="monotone" dataKey="netWorthDifference" name="Buy advantage" stroke="var(--rust)" fill="var(--rust-soft)" strokeWidth={3} /></AreaChart>
}

function csvForYears(years: YearResult[]): string {
  const columns: Array<[string, keyof YearResult]> = [
    ['Year', 'year'], ['Home Value', 'homeValue'], ['Mortgage Balance', 'mortgageBalance'], ['Home Equity After Sale', 'realizableHomeEquity'], ['Owner Portfolio', 'ownerInvestmentPortfolio'], ['Owner Net Worth', 'ownerNetWorth'], ['Annual Owner Cost', 'ownerHousingCost'], ['Annual Rent', 'rent'], ['Renter Contributions', 'renterInvestmentContributions'], ['Renter Portfolio', 'renterInvestmentPortfolio'], ['Renter Net Worth', 'renterNetWorth'], ['Buy Minus Rent', 'netWorthDifference'],
  ]
  return [columns.map(([label]) => label).join(','), ...years.map((year) => columns.map(([, key]) => year[key]).join(','))].join('\n')
}

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function withVisibleInitialInvestment(value: CalculatorInputs): CalculatorInputs {
  if (value.renterInitialInvestment !== undefined) return value
  const downPayment = value.downPayment ?? value.homePrice * (value.downPaymentPercent ?? 0.2)
  return { ...value, renterInitialInvestment: downPayment + value.buyerClosingCosts }
}

function sanitizeInputs(value: unknown): CalculatorInputs | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const allowed = new Set(Object.keys(BASELINE_INPUTS))
  const candidate: CalculatorInputs = { ...BASELINE_INPUTS }
  for (const [key, raw] of Object.entries(value)) {
    if (!allowed.has(key)) continue
    if (typeof raw !== 'number' || !Number.isFinite(raw) || Math.abs(raw) > 100_000_000) return null
    if (/Rate|Volatility|Drag|Percent/.test(key) && (raw < -0.5 || raw > 1)) return null
    Object.assign(candidate, { [key]: raw })
  }
  if (!Number.isInteger(candidate.horizonYears) || candidate.horizonYears < 1 || candidate.horizonYears > 40) return null
  if (!Number.isInteger(candidate.mortgageTermYears) || candidate.mortgageTermYears < 1 || candidate.mortgageTermYears > 50) return null
  if (candidate.homePrice < 0 || candidate.homePrice > 10_000_000 || candidate.initialMonthlyRent < 0 || candidate.initialMonthlyRent > 50_000) return null
  if (candidate.mortgageInterestRate < 0 || candidate.mortgageInterestRate > 0.5 || candidate.stockReturnRate < -0.5 || candidate.stockReturnRate > 0.5 || candidate.homeAppreciationRate < -0.5 || candidate.homeAppreciationRate > 0.5) return null
  try {
    calculateScenario(candidate)
    return withVisibleInitialInvestment(candidate)
  } catch {
    return null
  }
}

function readHashScenario(): { inputs: CalculatorInputs; error: string } {
  const hash = window.location.hash.slice(1)
  if (!hash) return { inputs: withVisibleInitialInvestment({ ...BASELINE_INPUTS }), error: '' }
  try {
    const inputs = sanitizeInputs(JSON.parse(decodeURIComponent(atob(hash))))
    if (!inputs) throw new Error('Invalid scenario')
    return { inputs, error: '' }
  } catch {
    return { inputs: withVisibleInitialInvestment({ ...BASELINE_INPUTS }), error: 'Shared scenario was invalid. Baseline loaded instead.' }
  }
}

function readSavedScenarios(): SavedScenario[] {
  try {
    const raw = JSON.parse(localStorage.getItem('equity-fold-scenarios') ?? '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.slice(0, 100).flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const record = item as Partial<SavedScenario>
      const inputs = sanitizeInputs(record.inputs)
      if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.savedAt !== 'string' || !inputs) return []
      return [{ id: record.id, name: record.name, savedAt: record.savedAt, inputs }]
    })
  } catch {
    return []
  }
}

export default function App() {
  const initialHash = useMemo(readHashScenario, [])
  const [inputs, setInputs] = useState<CalculatorInputs>(initialHash.inputs)
  const [folioTab, setFolioTab] = useState<FolioTab>('buy')
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentMode>('dollars')
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>('rate')
  const [includeClosingCash, setIncludeClosingCash] = useState(true)
  const [chartView, setChartView] = useState<ChartView>('netWorth')
  const [selectedYear, setSelectedYear] = useState(inputs.horizonYears)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('equity-fold-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' }
  })
  const [toast, setToast] = useState(initialHash.error)
  const [scenarioName, setScenarioName] = useState('My scenario')
  const [saved, setSaved] = useState<SavedScenario[]>(readSavedScenarios)
  const [compareA, setCompareA] = useState('current')
  const [compareB, setCompareB] = useState('')

  const result = useMemo(() => calculateScenario(inputs), [inputs])
  const final = result.years.at(-1)!
  const inspected = result.years[Math.min(selectedYear, inputs.horizonYears)] ?? final
  const sensitivity = useMemo(() => calculateSensitivity(inputs, STOCK_RATES, HOME_RATES), [inputs])
  const breakEven = useMemo(() => findBreakEvenStockReturn(inputs, { minRate: 0, maxRate: 0.2, dollarTolerance: 50 }), [inputs])
  const winnerLabel = result.summary.winner === 'buy' ? 'Buying' : result.summary.winner === 'rent' ? 'Renting' : 'Both strategies'
  const loserLabel = result.summary.winner === 'buy' ? 'renting' : 'buying'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('equity-fold-theme', theme) } catch { setToast('Theme preference could not be saved in this browser.') }
  }, [theme])

  useEffect(() => {
    setSelectedYear((year) => Math.min(year, inputs.horizonYears))
  }, [inputs.horizonYears])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const commitSaved = (next: SavedScenario[], successMessage?: string) => {
    try {
      localStorage.setItem('equity-fold-scenarios', JSON.stringify(next))
      setSaved(next)
      if (successMessage) setToast(successMessage)
    } catch {
      setToast('This browser blocked local saving. Export the configuration instead.')
    }
  }

  const updateInput = (key: keyof CalculatorInputs, value: number | undefined) => {
    if (key === 'renterInitialInvestment') setIncludeClosingCash(false)
    setInputs((current) => {
      const next = { ...current, [key]: value }
      if (key === 'homePrice' && Number(next.downPayment) > Number(value)) next.downPayment = Number(value)
      if (key === 'downPayment' && Number(value) > next.homePrice) next.downPayment = next.homePrice
      if (includeClosingCash && ['homePrice', 'downPayment', 'buyerClosingCosts'].includes(String(key))) {
        const downPayment = next.downPayment ?? next.homePrice * (next.downPaymentPercent ?? 0.2)
        next.renterInitialInvestment = downPayment + next.buyerClosingCosts
      }
      return next
    })
  }

  const updateClosingCash = (value: boolean) => {
    setIncludeClosingCash(value)
    setInputs((current) => {
      const downPayment = Number(current.downPayment ?? current.homePrice * (current.downPaymentPercent ?? 0.2))
      return { ...current, renterInitialInvestment: downPayment + (value ? current.buyerClosingCosts : 0) }
    })
  }

  const applyPreset = (name: string) => {
    setInputs(withVisibleInitialInvestment({ ...PRESETS[name] }))
    setIncludeClosingCash(true)
    setSelectedYear(PRESETS[name].horizonYears)
    setToast(`${name} loaded`)
  }

  const saveScenario = () => {
    const scenario: SavedScenario = { id: crypto.randomUUID(), name: scenarioName.trim() || 'Untitled scenario', inputs: { ...inputs }, savedAt: new Date().toISOString() }
    commitSaved([scenario, ...saved], 'Scenario saved locally')
    setCompareB(scenario.id)
  }

  const copyScenario = async () => {
    try {
      const hash = btoa(encodeURIComponent(JSON.stringify(inputs)))
      const shareUrl = `${window.location.origin}${window.location.pathname}#${hash}`
      await navigator.clipboard.writeText(shareUrl)
      setToast('Shareable scenario link copied')
    } catch {
      setToast('Clipboard access failed. Export the configuration instead.')
    }
  }

  const scenarioById = (id: string): CalculatorInputs | null => {
    if (id === 'current') return inputs
    return saved.find((item) => item.id === id)?.inputs ?? null
  }

  const comparison = useMemo(() => {
    const first = scenarioById(compareA)
    const second = scenarioById(compareB)
    if (!first || !second) return null
    const a = calculateScenario(first).years.at(-1)!
    const b = calculateScenario(second).years.at(-1)!
    if (first.horizonYears !== second.horizonYears) return { horizonMismatch: true, difference: 0, aBest: 0, bBest: 0, horizonA: first.horizonYears, horizonB: second.horizonYears }
    const aBest = Math.max(a.ownerNetWorth, a.renterNetWorth)
    const bBest = Math.max(b.ownerNetWorth, b.renterNetWorth)
    return { horizonMismatch: false, difference: aBest - bBest, aBest, bBest, horizonA: first.horizonYears, horizonB: second.horizonYears }
  }, [compareA, compareB, inputs, saved])

  const ownerMetrics = [
    ['Home value', money.format(final.homeValue)],
    ['Mortgage left', money.format(final.mortgageBalance)],
    ['Sale-ready equity', money.format(final.realizableHomeEquity)],
    ['Outside portfolio', money.format(final.ownerInvestmentPortfolio)],
    ['Interest paid', money.format(final.cumulativeInterestPaid)],
    ['Property taxes', money.format(final.cumulativePropertyTaxes)],
    ['Maintenance', money.format(final.cumulativeMaintenance)],
    ['Monthly P&I', money.format(result.summary.mortgagePaymentMonthly)],
  ]
  const renterMetrics = [
    ['Portfolio', money.format(final.renterInvestmentPortfolio)],
    ['Rent paid', money.format(final.cumulativeRentPaid)],
    ['Contributions', money.format(final.cumulativeRenterInvestmentContributions + result.summary.initialRenterInvestment)],
    ['Investment gains', money.format(final.renterInvestmentGains)],
    ['Year-one rent', money.format(inputs.initialMonthlyRent * 12)],
    ['Year-final rent', money.format(final.rent)],
    ['Initial investment', money.format(result.summary.initialRenterInvestment)],
    ['Effective return', formatPercent(result.summary.effectiveStockReturnRate)],
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><Home size={18} /></span>
          <span className="brand-name">Rent vs Buy</span>
          <span className="brand-subtitle">Buy or rent, compared fairly</span>
        </div>
        <div className="top-actions">
          <button className="quiet-button" type="button" onClick={copyScenario}><Copy size={15} /><span>Copy scenario</span></button>
          <button className="icon-button" type="button" title="Reset assumptions" aria-label="Reset assumptions" onClick={() => applyPreset('Baseline')}><RotateCcw size={16} /></button>
          <button className="icon-button" type="button" title={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      <nav className="section-nav" aria-label="Explore the decision">
        {[['verdict-title', 'Overview'], ['budget', 'Budget & cash'], ['stress', 'Stress test'], ['chart-title', 'Wealth path'], ['scenario-title', 'Saved scenarios']].map(([id, label]) => <button type="button" key={id} onClick={() => { const target = document.getElementById(id); target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); target?.setAttribute('tabindex', '-1'); target?.focus({ preventScroll: true }) }}>{label}</button>)}
      </nav>

      <main className="dashboard">
        <AssumptionFolio inputs={inputs} tab={folioTab} downPaymentMode={downPaymentMode} maintenanceMode={maintenanceMode} includeClosingCash={includeClosingCash} onTab={setFolioTab} onDownPaymentMode={setDownPaymentMode} onMaintenanceMode={setMaintenanceMode} onIncludeClosingCash={updateClosingCash} onChange={updateInput} />
        <div className="workspace">
          <details className="mobile-assumptions">
            <summary>Adjust assumptions <ChevronDown size={17} /></summary>
            <AssumptionFolio inputs={inputs} tab={folioTab} downPaymentMode={downPaymentMode} maintenanceMode={maintenanceMode} includeClosingCash={includeClosingCash} onTab={setFolioTab} onDownPaymentMode={setDownPaymentMode} onMaintenanceMode={setMaintenanceMode} onIncludeClosingCash={updateClosingCash} onChange={updateInput} />
          </details>

          <section className="verdict-sheet" aria-labelledby="verdict-title">
            <h1 className="verdict-title" id="verdict-title" key={`${result.summary.winner}-${Math.round(result.summary.advantage / 1000)}`}>
              {result.summary.winner === 'tie' ? <>{winnerLabel} <em>finish even.</em></> : <>{winnerLabel} leaves you <em>{compactMoney.format(result.summary.advantage)} ahead.</em></>}
            </h1>
            <p className="verdict-copy">
              {result.summary.winner === 'tie' ? <span>The modeled net worth is equal at year {inputs.horizonYears}, after selling costs.</span> : <><span className="verdict-amount">{formatPercent(result.summary.percentageAdvantage)} more net worth</span><span>than {loserLabel} at year {inputs.horizonYears}, after selling costs. {result.summary.crossoverYear ? `The lead first changes in year ${result.summary.crossoverYear}.` : 'The lead does not change within this horizon.'}</span></>}
            </p>
            <div className="strategy-grid">
              <article className="strategy-summary">
                <div className="strategy-name"><h3>Buy + invest savings</h3><Home size={18} aria-hidden="true" /></div>
                <strong className="strategy-number">{money.format(final.ownerNetWorth)}</strong>
                <div className="metric-grid">{ownerMetrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>
              </article>
              <article className="strategy-summary">
                <div className="strategy-name"><h3>Rent + invest savings</h3><span className="metric-label">Cash-flow matched</span></div>
                <strong className="strategy-number">{money.format(final.renterNetWorth)}</strong>
                <div className="metric-grid">{renterMetrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>
              </article>
            </div>
          </section>

          <section className="summary-sheet" aria-label="Timeline controls">
            <div className="section-heading">
              <div><h2>Set the decision horizon</h2><p>Year 0 includes the renter’s invested down payment and buyer closing cash.</p></div>
              <div className="horizon-row" aria-label="Horizon in years">
                {HORIZONS.map((year) => <button type="button" key={year} className={`chip ${inputs.horizonYears === year ? 'active' : ''}`} onClick={() => updateInput('horizonYears', year)}>{year}y</button>)}
              </div>
            </div>
            <div className="preset-row" style={{ padding: '14px 22px' }}>
              {Object.keys(PRESETS).map((name) => <button type="button" key={name} className="quiet-button" onClick={() => applyPreset(name)}>{name}</button>)}
            </div>
          </section>

          <PlanningTools inputs={inputs} result={result} />

          <section className="chart-sheet" aria-labelledby="chart-title">
            <div className="section-heading">
              <div><h2 id="chart-title">The wealth path</h2><p>Hover for exact values. The dashed line always represents renting.</p></div>
              <label className="metric-label">Inspect year <select className="scenario-select" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{result.years.map((year) => <option key={year.year} value={year.year}>{year.year}</option>)}</select></label>
            </div>
            <div className="view-tabs" role="tablist" aria-label="Chart views">
              {CHART_TABS.map((view) => <button type="button" role="tab" aria-selected={chartView === view.id} className={`view-tab ${chartView === view.id ? 'active' : ''}`} key={view.id} onClick={() => setChartView(view.id)}>{view.label}</button>)}
            </div>
            <div className="chart-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <ComparisonChart data={result.years} view={chartView} selectedYear={selectedYear} />
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                {({ netWorth: ['Buy strategy', 'Rent strategy'], homeDebt: ['Home value', 'Mortgage balance'], equity: ['Gross home equity', ''], portfolios: ['Owner portfolio', 'Renter portfolio'], annualCosts: ['Owner cash cost', 'Renter cash cost'], unrecoverable: ['Owner unrecoverable', 'Renter unrecoverable'], principalInterest: ['Principal', 'Interest'], advantage: ['Buy-minus-rent advantage', ''] } as Record<ChartView, string[]>)[chartView].filter(Boolean).map((label, index) => <span className="legend-item" key={label}><span className={`legend-line ${index === 0 ? 'buy' : 'rent'}`} />{label}</span>)}
              </div>
            </div>
            <div className="selected-year-strip">
              <div className="year-fact"><Metric label={`Owner cost · year ${inspected.year}`} value={money.format(inspected.ownerHousingCost)} /></div>
              <div className="year-fact"><Metric label={`Renter cost · year ${inspected.year}`} value={money.format(inspected.renterHousingCost)} /></div>
              <div className="year-fact"><Metric label="Cheaper side invests" value={money.format(inspected.ownerCashFlowDifferenceInvested + inspected.renterCashFlowDifferenceInvested)} /></div>
              <div className="year-fact"><Metric label="Net-worth difference" value={money.format(inspected.netWorthDifference)} /></div>
            </div>
          </section>

          <section className="sensitivity-sheet" aria-labelledby="sensitivity-title">
            <div className="sensitivity-copy">
              <h2 id="sensitivity-title">Where the answer flips</h2>
              <p>Each cell shows the buy-minus-rent net-worth advantage after {inputs.horizonYears} years. Rust favors buying; sage favors renting.</p>
              <div className="break-even"><span className="metric-label">Approximate break-even stock return</span><strong>{breakEven === null ? 'Outside range' : formatPercent(breakEven)}</strong></div>
            </div>
            <div className="heatmap-wrap">
              <div className="heatmap" style={{ gridTemplateColumns: `76px repeat(${STOCK_RATES.length}, minmax(80px, 1fr))` }}>
                <div className="heat-label">Home / Stock</div>
                {STOCK_RATES.map((rate) => <div className="heat-label" key={rate}>{formatPercent(rate)}</div>)}
                {sensitivity.cells.flatMap((row, rowIndex) => [
                  <div className="heat-label" key={`label-${rowIndex}`}>{formatPercent(HOME_RATES[rowIndex])}</div>,
                  ...row.map((cell) => {
                    const strength = `${Math.min(88, 24 + Math.abs(cell.advantage) / Math.max(12000, inputs.homePrice * 0.02) * 10)}%`
                    return <div className={`heat-cell ${cell.winner}`} style={{ '--strength': strength } as React.CSSProperties} key={`${cell.homeAppreciationRate}-${cell.stockReturnRate}`} title={`${cell.winner === 'buy' ? 'Buy' : 'Rent'} advantage ${money.format(Math.abs(cell.advantage))}`}>{cell.advantage >= 0 ? '+' : '−'}{compactMoney.format(Math.abs(cell.advantage))}</div>
                  }),
                ])}
              </div>
            </div>
          </section>

          <section className="table-sheet" aria-labelledby="table-title">
            <div className="section-heading">
              <div><h2 id="table-title">Every year, reconciled</h2><p>Principal builds equity; interest, rent, tax, insurance, HOA, and maintenance are expenses.</p></div>
              <button className="quiet-button" type="button" onClick={() => { try { downloadText('buy-vs-rent.csv', csvForYears(result.years), 'text/csv') } catch { setToast('CSV export failed. Try another browser or export the scenario configuration.') } }}><Download size={15} />Export CSV</button>
            </div>
            <details>
              <summary className="quiet-button" style={{ margin: '16px 22px' }}>Open year-by-year table</summary>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Year</th><th>Home value</th><th>Mortgage</th><th>Sale-ready equity</th><th>Owner portfolio</th><th>Owner net worth</th><th>Owner cost</th><th>Annual rent</th><th>Renter contribution</th><th>Renter portfolio</th><th>Renter net worth</th><th>Buy − rent</th></tr></thead>
                  <tbody>{result.years.map((year) => <tr key={year.year}><td>{year.year}</td><td>{money.format(year.homeValue)}</td><td>{money.format(year.mortgageBalance)}</td><td>{money.format(year.realizableHomeEquity)}</td><td>{money.format(year.ownerInvestmentPortfolio)}</td><td>{money.format(year.ownerNetWorth)}</td><td>{money.format(year.ownerHousingCost)}</td><td>{money.format(year.rent)}</td><td>{money.format(year.renterInvestmentContributions)}</td><td>{money.format(year.renterInvestmentPortfolio)}</td><td>{money.format(year.renterNetWorth)}</td><td className={year.netWorthDifference >= 0 ? 'positive' : 'negative'}>{money.format(year.netWorthDifference)}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </section>

          <section className="scenario-sheet" aria-labelledby="scenario-title">
            <div className="scenario-layout">
              <div>
                <div className="section-heading" style={{ padding: 0, border: 0 }}><div><h2 id="scenario-title">Your scenario folio</h2><p>Saved only in this browser.</p></div></div>
                <div className="button-row" style={{ marginTop: 16 }}>
                  <input className="scenario-input" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} aria-label="Scenario name" />
                  <button className="primary-button" type="button" onClick={saveScenario}><BookmarkPlus size={15} />Save</button>
                </div>
                <label className="scenario-import">Import an exported configuration<input type="file" accept=".json,application/json" onChange={async event => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  if (file.size > 100000) { setToast('Configuration is too large. Choose a Rent vs Buy JSON export.'); return }
                  try {
                    const raw = JSON.parse(await file.text())
                    if (!raw || typeof raw !== 'object' || !('homePrice' in raw) || !('horizonYears' in raw)) throw new Error('Invalid configuration')
                    const imported = sanitizeInputs(raw)
                    if (!imported) throw new Error('Invalid configuration')
                    setInputs(imported)
                    setScenarioName(file.name.replace(/\.json$/i, '').slice(0, 100))
                    setToast('Configuration loaded. Save it to keep a copy in this browser.')
                  } catch { setToast('Could not import this file. Choose a valid Rent vs Buy JSON configuration.') }
                }} /></label>
                <div className="scenario-list">
                  {saved.length === 0 && <p className="method-note">No saved scenarios yet. Save the current assumptions to compare alternatives.</p>}
                  {saved.map((scenario) => <div className="scenario-row" key={scenario.id}><div><strong>{scenario.name}</strong><span>{new Date(scenario.savedAt).toLocaleDateString()}</span></div><div className="button-row"><button className="quiet-button" type="button" onClick={() => { setInputs(scenario.inputs); setToast(`${scenario.name} loaded`) }}>Load</button><button className="icon-button" type="button" aria-label={`Delete ${scenario.name}`} onClick={() => commitSaved(saved.filter((item) => item.id !== scenario.id), `${scenario.name} removed`)}><Trash2 size={14} /></button></div></div>)}
                </div>
              </div>
              <div>
                <div className="section-heading" style={{ padding: 0, border: 0 }}><div><h2>Compare two folios</h2><p>Compares the best strategy in each saved scenario.</p></div></div>
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  <select className="scenario-select" value={compareA} onChange={(event) => setCompareA(event.target.value)}><option value="current">Current scenario</option>{saved.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.name}</option>)}</select>
                  <select className="scenario-select" value={compareB} onChange={(event) => setCompareB(event.target.value)}><option value="">Choose a saved scenario</option>{saved.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.name}</option>)}</select>
                </div>
                <div className="compare-result"><span className="metric-label">First folio versus second</span><strong>{comparison?.horizonMismatch ? 'Match horizons first' : comparison ? money.format(comparison.difference) : 'Select two scenarios'}</strong>{comparison && <p className="method-note">{comparison.horizonMismatch ? `These folios end at years ${comparison.horizonA} and ${comparison.horizonB}; comparing final dollar values would mislead.` : `Best-strategy outcomes at year ${comparison.horizonA}: ${money.format(comparison.aBest)} and ${money.format(comparison.bBest)}.`}</p>}</div>
                <button className="quiet-button" style={{ marginTop: 12 }} type="button" onClick={() => { try { downloadText('equity-fold-scenario.json', JSON.stringify(inputs, null, 2), 'application/json') } catch { setToast('Export failed. Try another browser or copy the scenario link.') } }}><Download size={15} />Export configuration</button>
              </div>
            </div>
          </section>

          <section className="planning-sheet model-notes" aria-label="How to read this model">
            <h2>Know what is behind the numbers.</h2>
            <details><summary>What counts as wealth?</summary><p>The owner’s portfolio plus home equity after mortgage payoff, selling costs, and entered home-gains tax. The renter’s wealth is the investment portfolio. Principal payments build equity; they also use monthly cash.</p></details>
            <details><summary>How is the comparison kept fair?</summary><p>Both strategies receive the same base investment contributions. The cheaper housing strategy invests the annual cost difference at year-end. By default, renters invest the cash otherwise spent on a down payment and closing. Custom starting portfolios can create unequal starting wealth.</p></details>
            <details><summary>What can change the answer?</summary><p>Returns, rent increases, repairs, transaction costs, and how long you stay. Stress tests change one assumption at a time and do not assign probabilities. Tax benefits are manual estimates; refinancing uses the remaining original loan term and does not include refinance fees.</p></details>
            <details><summary>What is saved or shared?</summary><p>Saved scenarios live in this browser. Export a configuration to back it up and import it later. Scenario links contain housing and investment assumptions. The household budget stays in this tab, resets on reload, and is never included in scenario links or exports.</p></details>
          </section>
        </div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
