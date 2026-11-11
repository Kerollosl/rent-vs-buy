import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookmarkPlus, Calendar, ChartLine, Coins, Download, FileSpreadsheet, FlaskConical,
  Gauge, Home, Info, KeyRound, Landmark, Moon, PiggyBank, Percent, Receipt, Scale, Share2,
  ShieldAlert, ShieldCheck, SlidersHorizontal, Sun, Trash2, TrendingUp, Trophy, Upload, Wallet, Wrench, X,
  Bookmark, ArrowLeftRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Affordability from './PlanningTools'
import AssumptionFolio, { type DownPaymentMode, type FolioTab, type MaintenanceMode } from './components/Fields'
import WealthPath from './components/WealthPath'
import FlipMap from './components/FlipMap'
import StressTest from './components/StressTest'
import {
  BASELINE_INPUTS,
  calculateScenario,
  findBreakEvenStockReturn,
  type CalculatorInputs,
} from './lib/calculator'
import { PRESETS, HORIZONS } from './lib/fieldSpecs'
import { compactMoney, formatPercent, money } from './lib/format'
import { stressScenarios } from './lib/planning'
import { useAnimatedNumber, useMediaQuery, usePrefersReducedMotion, useScrollSpy } from './hooks'

interface SavedScenario {
  id: string
  name: string
  inputs: CalculatorInputs
  savedAt: string
}

interface Toast {
  message: string
  action?: { label: string; run: () => void }
}

const SECTIONS: Array<{ id: string; label: string; short: string; Icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', short: 'Overview', Icon: Gauge },
  { id: 'wealth', label: 'Wealth path', short: 'Wealth', Icon: ChartLine },
  { id: 'flip', label: 'Flip points', short: 'Flips', Icon: Scale },
  { id: 'stress', label: 'Stress test', short: 'Stress', Icon: FlaskConical },
  { id: 'saved', label: 'Saved scenarios', short: 'Saved', Icon: Bookmark },
  { id: 'afford', label: 'Affordability', short: 'Afford', Icon: Wallet },
]

function csvForYears(years: ReturnType<typeof calculateScenario>['years']): string {
  const columns: Array<[string, keyof (typeof years)[number]]> = [
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
    const raw = JSON.parse(localStorage.getItem('rent-vs-buy-scenarios') ?? localStorage.getItem('equity-fold-scenarios') ?? '[]') as unknown
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

function readTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('rent-vs-buy-theme') ?? localStorage.getItem('equity-fold-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* fall through to the system preference */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function Money({ value }: { value: number }) {
  return <>{money.format(useAnimatedNumber(value))}</>
}

function Metric({ label, value, Icon }: { label: string; value: string; Icon?: LucideIcon }) {
  return (
    <div className="metric">
      <span className="metric-label">{Icon && <Icon size={14} aria-hidden="true" />}{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}

export default function App() {
  const initialHash = useMemo(readHashScenario, [])
  const [inputs, setInputs] = useState<CalculatorInputs>(initialHash.inputs)
  const [folioTab, setFolioTab] = useState<FolioTab>('buy')
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentMode>('dollars')
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>('rate')
  const [includeClosingCash, setIncludeClosingCash] = useState(true)
  const [selectedYear, setSelectedYear] = useState(inputs.horizonYears)
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme)
  const [toast, setToast] = useState<Toast | null>(initialHash.error ? { message: initialHash.error } : null)
  const [scenarioName, setScenarioName] = useState('My scenario')
  const [saved, setSaved] = useState<SavedScenario[]>(readSavedScenarios)
  const [compareA, setCompareA] = useState('current')
  const [compareB, setCompareB] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const narrow = useMediaQuery('(max-width: 980px)')
  const reduced = usePrefersReducedMotion()
  const sheetRef = useRef<HTMLDialogElement>(null)

  const result = useMemo(() => calculateScenario(inputs), [inputs])
  const final = result.years.at(-1)!
  const variants = useMemo(() => stressScenarios(inputs), [inputs])
  const breakEven = useMemo(() => findBreakEvenStockReturn(inputs, { minRate: 0, maxRate: 0.2, dollarTolerance: 50 }), [inputs])
  const winner = result.summary.winner
  const winnerLabel = winner === 'buy' ? 'Buying' : winner === 'rent' ? 'Renting' : 'Both strategies'
  const loserLabel = winner === 'buy' ? 'renting' : 'buying'
  const stressOthers = variants.slice(1)
  const holds = stressOthers.filter((variant) => variant.summary.winner === winner).length
  const active = useScrollSpy(SECTIONS.map((section) => section.id))
  const buyDisplay = useAnimatedNumber(final.ownerNetWorth)
  const rentDisplay = useAnimatedNumber(final.renterNetWorth)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('rent-vs-buy-theme', theme) } catch { setToast({ message: 'Theme preference could not be saved in this browser.' }) }
  }, [theme])

  useEffect(() => {
    setSelectedYear((year) => Math.min(year, inputs.horizonYears))
  }, [inputs.horizonYears])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.action ? 6000 : 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const dialog = sheetRef.current
    if (!dialog) return
    if (sheetOpen && narrow && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('.sheet-scroll')?.focus({ preventScroll: true })
    }
    if ((!sheetOpen || !narrow) && dialog.open) dialog.close()
  }, [sheetOpen, narrow])

  const commitSaved = (next: SavedScenario[], successMessage?: string) => {
    try {
      localStorage.setItem('rent-vs-buy-scenarios', JSON.stringify(next))
      setSaved(next)
      if (successMessage) setToast({ message: successMessage })
    } catch {
      setToast({ message: 'This browser blocked local saving. Export the configuration instead.' })
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
    const before = { inputs, includeClosingCash, year: selectedYear }
    setInputs(withVisibleInitialInvestment({ ...PRESETS[name] }))
    setIncludeClosingCash(true)
    setSelectedYear(PRESETS[name].horizonYears)
    setToast({
      message: `${name} loaded`,
      action: { label: 'Undo', run: () => { setInputs(before.inputs); setIncludeClosingCash(before.includeClosingCash); setSelectedYear(before.year); setToast({ message: 'Restored your assumptions' }) } },
    })
  }

  const saveScenario = () => {
    const scenario: SavedScenario = { id: crypto.randomUUID(), name: scenarioName.trim() || 'Untitled scenario', inputs: { ...inputs }, savedAt: new Date().toISOString() }
    commitSaved([scenario, ...saved], 'Scenario saved in this browser')
    setCompareB(scenario.id)
  }

  const copyScenario = async () => {
    try {
      const hash = btoa(encodeURIComponent(JSON.stringify(inputs)))
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${hash}`)
      setToast({ message: 'Shareable link copied' })
    } catch {
      setToast({ message: 'Clipboard access failed. Export the configuration instead.' })
    }
  }

  const goTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    if (target instanceof HTMLDetailsElement) target.open = true
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    const heading = target.querySelector<HTMLElement>('h1, h2') ?? target
    heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
  }

  const scenarioById = (id: string): CalculatorInputs | null => (id === 'current' ? inputs : saved.find((item) => item.id === id)?.inputs ?? null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareA, compareB, inputs, saved])

  const ownerMetrics: Array<[string, string, LucideIcon]> = [
    ['Home value', money.format(final.homeValue), Home],
    ['Mortgage left', money.format(final.mortgageBalance), Landmark],
    ['Sale-ready equity', money.format(final.realizableHomeEquity), PiggyBank],
    ['Outside portfolio', money.format(final.ownerInvestmentPortfolio), TrendingUp],
    ['Interest paid', money.format(final.cumulativeInterestPaid), Percent],
    ['Property taxes', money.format(final.cumulativePropertyTaxes), Receipt],
    ['Maintenance', money.format(final.cumulativeMaintenance), Wrench],
    ['Monthly P&I', money.format(result.summary.mortgagePaymentMonthly), Calendar],
  ]
  const renterMetrics: Array<[string, string, LucideIcon]> = [
    ['Portfolio', money.format(final.renterInvestmentPortfolio), TrendingUp],
    ['Rent paid', money.format(final.cumulativeRentPaid), KeyRound],
    ['Contributions', money.format(final.cumulativeRenterInvestmentContributions + result.summary.initialRenterInvestment), Coins],
    ['Investment gains', money.format(final.renterInvestmentGains), Trophy],
    ['Year-one rent', money.format(inputs.initialMonthlyRent * 12), Calendar],
    ['Year-final rent', money.format(final.rent), Calendar],
    ['Initial investment', money.format(result.summary.initialRenterInvestment), PiggyBank],
    ['Effective return', formatPercent(result.summary.effectiveStockReturnRate), Percent],
  ]

  const ShieldIcon = holds >= 3 ? ShieldCheck : ShieldAlert
  const folio = (
    <AssumptionFolio
      inputs={inputs} tab={folioTab} downPaymentMode={downPaymentMode} maintenanceMode={maintenanceMode} includeClosingCash={includeClosingCash}
      onTab={setFolioTab} onDownPaymentMode={setDownPaymentMode} onMaintenanceMode={setMaintenanceMode} onIncludeClosingCash={updateClosingCash}
      onChange={updateInput} onPreset={applyPreset}
    />
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><Home size={19} /></span>
          <span className="brand-name">Rent vs Buy</span>
        </div>

        <nav className="nav" aria-label="Sections">
          {SECTIONS.map(({ id, label, short, Icon }) => (
            <button type="button" key={id} className={active === id ? 'active' : ''} aria-current={active === id ? 'true' : undefined} onClick={() => goTo(id)}>
              <Icon size={18} aria-hidden="true" />
              <span className="nav-full">{label}</span>
              <span className="nav-short">{short}</span>
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button className="button ghost" type="button" onClick={copyScenario}><Share2 size={16} aria-hidden="true" /><span>Share link</span></button>
          <button className="icon-button" type="button" title={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className="dashboard">
        {!narrow && <aside className="aside" aria-label="Assumptions">{folio}</aside>}

        <div className="workspace">
          {narrow && (
            <button type="button" className="adjust-bar" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span><b>Adjust assumptions</b><small>Price, rates, rent, returns</small></span>
              <span className={`adjust-live ${winner}`}>{winnerLabel === 'Both strategies' ? 'Even' : `${winner === 'buy' ? 'Buy' : 'Rent'} +${compactMoney.format(result.summary.advantage)}`}</span>
            </button>
          )}

          <section className="sheet verdict-sheet" id="overview" aria-labelledby="verdict-title">
            <h1 className="verdict-title" id="verdict-title" key={`${winner}-${Math.round(result.summary.advantage / 1000)}`}>
              {winner === 'tie' ? <>{winnerLabel} <em>finish even.</em></> : <>{winnerLabel} leaves you <em>{compactMoney.format(result.summary.advantage)} ahead.</em></>}
            </h1>
            <p className="verdict-copy">
              {winner === 'tie'
                ? `The modeled net worth is equal at year ${inputs.horizonYears}, after selling costs.`
                : <><b>{formatPercent(result.summary.percentageAdvantage)} more net worth</b> than {loserLabel} at year {inputs.horizonYears}, after selling costs. {result.summary.crossoverYear ? `The lead first changes in year ${result.summary.crossoverYear}.` : 'The lead does not change within this horizon.'}</>}
            </p>

            <div className="verdict-meta">
              <div className="horizon" role="group" aria-label="Compare at year">
                <span className="eyebrow">At year</span>
                {HORIZONS.map((year) => (
                  <button type="button" key={year} className={`chip ${inputs.horizonYears === year ? 'active' : ''}`} aria-pressed={inputs.horizonYears === year} onClick={() => updateInput('horizonYears', year)}>{year}</button>
                ))}
              </div>
              {winner !== 'tie' && (
                <p className={`resilience r${holds}`} title="Counts the stress tests below where the winner stays the same.">
                  <ShieldIcon size={17} aria-hidden="true" />
                  <span className="pips" aria-hidden="true">{stressOthers.map((variant, index) => <i key={variant.name} className={variant.summary.winner === winner ? 'on' : ''} data-i={index} />)}</span>
                  <span>Holds in <b>{holds} of {stressOthers.length}</b> stress tests</span>
                </p>
              )}
            </div>

            <div className="strategy-grid">
              {([
                ['buy', 'Buy + invest savings', Home, buyDisplay, ownerMetrics, null],
                ['rent', 'Rent + invest savings', KeyRound, rentDisplay, renterMetrics, 'Cash-flow matched'],
              ] as const).map(([side, title, Icon, amount, metrics, tag]) => (
                <article className={`strategy ${side} ${winner === side ? 'ahead' : ''}`} key={side}>
                  <div className="strategy-name">
                    <span className="strategy-icon" aria-hidden="true"><Icon size={18} /></span>
                    <h2>{title}</h2>
                    {winner === side ? <span className="pill"><Trophy size={13} aria-hidden="true" />Ahead</span> : tag && <span className="pill quiet">{tag}</span>}
                  </div>
                  <strong className="strategy-number">{money.format(amount)}</strong>
                  <div className="metric-grid">{metrics.map(([label, value, MetricIcon]) => <Metric key={label} label={label} value={value} Icon={MetricIcon} />)}</div>
                </article>
              ))}
            </div>
          </section>

          <WealthPath result={result} selectedYear={selectedYear} onYear={setSelectedYear} />
          <FlipMap inputs={inputs} breakEven={breakEven} winner={winner} />
          <StressTest inputs={inputs} result={result} variants={variants} />

          <section className="sheet table-sheet" id="table" aria-labelledby="table-title">
            <header className="sheet-head">
              <div><h2 id="table-title">Year-by-year breakdown</h2><p>Principal builds equity; interest, rent, tax, insurance, HOA and maintenance are expenses.</p></div>
              <button className="button" type="button" onClick={() => { try { downloadText('rent-vs-buy.csv', csvForYears(result.years), 'text/csv') } catch { setToast({ message: 'CSV export failed. Try another browser or export the scenario configuration.' }) } }}><FileSpreadsheet size={16} aria-hidden="true" />Export CSV</button>
            </header>
            <details className="table-details">
              <summary>Open year-by-year table</summary>
              <div className="table-wrap">
                <table>
                  <thead><tr><th scope="col">Year</th><th scope="col">Home value</th><th scope="col">Mortgage</th><th scope="col">Sale-ready equity</th><th scope="col">Owner portfolio</th><th scope="col">Owner net worth</th><th scope="col">Owner cost</th><th scope="col">Annual rent</th><th scope="col">Renter contribution</th><th scope="col">Renter portfolio</th><th scope="col">Renter net worth</th><th scope="col">Buy − rent</th></tr></thead>
                  <tbody>{result.years.map((year) => <tr key={year.year} className={year.year === selectedYear ? 'selected' : ''} aria-selected={year.year === selectedYear}><th scope="row">{year.year}</th><td>{money.format(year.homeValue)}</td><td>{money.format(year.mortgageBalance)}</td><td>{money.format(year.realizableHomeEquity)}</td><td>{money.format(year.ownerInvestmentPortfolio)}</td><td>{money.format(year.ownerNetWorth)}</td><td>{money.format(year.ownerHousingCost)}</td><td>{money.format(year.rent)}</td><td>{money.format(year.renterInvestmentContributions)}</td><td>{money.format(year.renterInvestmentPortfolio)}</td><td>{money.format(year.renterNetWorth)}</td><td className={year.netWorthDifference >= 0 ? 'positive' : 'negative'}>{money.format(year.netWorthDifference)}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </section>

          <section className="sheet saved-sheet" id="saved" aria-labelledby="scenario-title">
            <div className="saved-grid">
              <div>
                <header className="mini-head"><h2 id="scenario-title"><Bookmark size={20} aria-hidden="true" />Saved scenarios</h2><p>Kept only in this browser.</p></header>
                <div className="save-row">
                  <input className="input" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} aria-label="Scenario name" />
                  <button className="button primary" type="button" onClick={saveScenario}><BookmarkPlus size={16} aria-hidden="true" />Save</button>
                </div>
                <div className="scenario-list">
                  {saved.length === 0 && <p className="empty"><Bookmark size={18} aria-hidden="true" />Save a scenario to compare it later.</p>}
                  {saved.map((scenario) => (
                    <div className="scenario-row" key={scenario.id}>
                      <div><strong>{scenario.name}</strong><span>{new Date(scenario.savedAt).toLocaleDateString()}</span></div>
                      <div className="row-actions">
                        <button className="button" type="button" onClick={() => { setInputs(scenario.inputs); setToast({ message: `${scenario.name} loaded` }) }}>Load</button>
                        <button className="icon-button" type="button" aria-label={`Delete ${scenario.name}`} onClick={() => commitSaved(saved.filter((item) => item.id !== scenario.id), `${scenario.name} removed`)}><Trash2 size={16} aria-hidden="true" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="file-actions">
                  <label className="button file-button">
                    <Upload size={16} aria-hidden="true" />Import configuration
                    <input type="file" accept=".json,application/json" onChange={async (event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (!file) return
                      if (file.size > 100000) { setToast({ message: 'Configuration is too large. Choose a Rent vs Buy JSON export.' }); return }
                      try {
                        const raw = JSON.parse(await file.text())
                        if (!raw || typeof raw !== 'object' || !('homePrice' in raw) || !('horizonYears' in raw)) throw new Error('Invalid configuration')
                        const imported = sanitizeInputs(raw)
                        if (!imported) throw new Error('Invalid configuration')
                        setInputs(imported)
                        setScenarioName(file.name.replace(/\.json$/i, '').slice(0, 100))
                        setToast({ message: 'Configuration loaded. Save it to keep a copy in this browser.' })
                      } catch { setToast({ message: 'Could not import this file. Choose a valid Rent vs Buy JSON configuration.' }) }
                    }} />
                  </label>
                  <button className="button" type="button" onClick={() => { try { downloadText('rent-vs-buy-scenario.json', JSON.stringify(inputs, null, 2), 'application/json') } catch { setToast({ message: 'Export failed. Try another browser or copy the scenario link.' }) } }}><Download size={16} aria-hidden="true" />Export configuration</button>
                </div>
              </div>
              <div>
                <header className="mini-head"><h2><ArrowLeftRight size={20} aria-hidden="true" />Compare scenarios</h2><p>Compares the best strategy in each saved scenario.</p></header>
                <div className="compare-selects">
                  <select className="select" aria-label="First scenario" value={compareA} onChange={(event) => setCompareA(event.target.value)}><option value="current">Current scenario</option>{saved.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.name}</option>)}</select>
                  <select className="select" aria-label="Second scenario" value={compareB} onChange={(event) => setCompareB(event.target.value)}><option value="">Choose a saved scenario</option>{saved.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.name}</option>)}</select>
                </div>
                <div className="compare-result">
                  <span className="eyebrow">First minus second</span>
                  <strong>{comparison?.horizonMismatch ? 'Match horizons first' : comparison ? money.format(comparison.difference) : 'Select two scenarios'}</strong>
                  {comparison && <p className="note">{comparison.horizonMismatch ? `These scenarios end at years ${comparison.horizonA} and ${comparison.horizonB}; comparing final dollar values would mislead.` : `Best-strategy outcomes at year ${comparison.horizonA}: ${money.format(comparison.aBest)} and ${money.format(comparison.bBest)}.`}</p>}
                </div>
              </div>
            </div>
          </section>

          <Affordability result={result} />

          <section className="sheet notes-sheet" aria-labelledby="how-title">
            <h2 id="how-title"><Info size={20} aria-hidden="true" />How it works</h2>
            <details><summary>What counts as wealth?</summary><p>The owner’s portfolio plus home equity after mortgage payoff, selling costs, and entered home-gains tax. The renter’s wealth is the investment portfolio. Principal payments build equity; they also use monthly cash.</p></details>
            <details><summary>How is the comparison kept fair?</summary><p>Both strategies receive the same base investment contributions. The cheaper housing strategy invests the annual cost difference at year-end. By default, renters invest the cash otherwise spent on a down payment and closing. Custom starting portfolios can create unequal starting wealth.</p></details>
            <details><summary>What can change the answer?</summary><p>Returns, rent increases, repairs, transaction costs, and how long you stay. Stress tests change one assumption at a time and do not assign probabilities. Tax benefits are manual estimates; refinancing uses the remaining original loan term and does not include refinance fees.</p></details>
            <details><summary>What is saved or shared?</summary><p>Saved scenarios live in this browser. Export a configuration to back it up and import it later. Scenario links contain housing and investment assumptions. The household budget stays in this tab, resets on reload, and is never included in scenario links or exports.</p></details>
          </section>
        </div>
      </main>

      <dialog
        ref={sheetRef}
        className="sheet-dialog"
        aria-label="Assumptions"
        onClose={() => setSheetOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) setSheetOpen(false) }}
      >
        {narrow && sheetOpen && (
          <>
            <div className="sheet-grab" aria-hidden="true" />
            <div className="sheet-live">
              <span className={`adjust-live ${winner}`}>{winner === 'tie' ? 'Even' : `${winner === 'buy' ? 'Buying' : 'Renting'} ahead by ${compactMoney.format(result.summary.advantage)}`}</span>
              <button type="button" className="button primary" onClick={() => setSheetOpen(false)}><X size={16} aria-hidden="true" />Done</button>
            </div>
            <div className="sheet-scroll" tabIndex={-1} autoFocus role="region" aria-label="Assumption controls">{folio}</div>
          </>
        )}
      </dialog>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.action && <button type="button" onClick={() => { toast.action?.run() }}>{toast.action.label}</button>}
        </div>
      )}
    </div>
  )
}
