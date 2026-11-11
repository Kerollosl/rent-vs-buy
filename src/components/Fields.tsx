import { useId, useState, type CSSProperties } from 'react'
import { ChevronDown, Home, KeyRound, RotateCcw } from 'lucide-react'
import type { CalculatorInputs } from '../lib/calculator'
import { ADVANCED_FIELDS, BUY_FIELDS, PRESETS, RENT_FIELDS, type FieldSpec } from '../lib/fieldSpecs'
import InfoTip from './InfoTip'

export type FolioTab = 'buy' | 'rent'
export type DownPaymentMode = 'dollars' | 'percent'
export type MaintenanceMode = 'rate' | 'fixed'
type Change = (key: keyof CalculatorInputs, value: number | undefined) => void

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/** Slider + number input pair. The text box keeps a draft so typing "250000" is never clamped mid-keystroke. */
function ValueRow({
  label, labelId, value, min, max, step, prefix, suffix, onValue,
}: {
  label: string
  labelId: string
  value: number
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
  onValue: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const pct = max > min ? clamp(((value - min) / (max - min)) * 100, 0, 100) : 0

  const commit = (text: string) => {
    const parsed = Number(text)
    if (text.trim() !== '' && Number.isFinite(parsed)) onValue(clamp(parsed, min, max))
    setDraft(null)
  }

  return (
    <div className="field-value-row">
      <input
        className="range"
        aria-label={`${label} slider`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        onChange={(event) => onValue(Number(event.target.value))}
      />
      <div className="number-wrap">
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          aria-labelledby={labelId}
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          onChange={(event) => {
            setDraft(event.target.value)
            const parsed = Number(event.target.value)
            if (event.target.value.trim() !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max) onValue(parsed)
          }}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') commit((event.target as HTMLInputElement).value) }}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
    </div>
  )
}

const fieldValue = (value: number, format: FieldSpec['format']) => (format === 'percent' ? Number((value * 100).toFixed(2)) : value)
const storedValue = (value: number, format: FieldSpec['format']) => (format === 'percent' ? value / 100 : value)

function NumericField({ spec, inputs, onChange }: { spec: FieldSpec; inputs: CalculatorInputs; onChange: Change }) {
  const labelId = useId()
  return (
    <div className="field">
      <div className="field-label">
        <span id={labelId}>{spec.label}</span>
        <InfoTip text={spec.help} label={spec.label} />
      </div>
      <ValueRow
        label={spec.label}
        labelId={labelId}
        value={fieldValue(Number(inputs[spec.key] ?? 0), spec.format)}
        min={fieldValue(spec.min, spec.format)}
        max={fieldValue(spec.max, spec.format)}
        step={fieldValue(spec.step, spec.format)}
        prefix={spec.format === 'currency' ? '$' : undefined}
        suffix={spec.format === 'percent' ? '%' : undefined}
        onValue={(value) => onChange(spec.key, storedValue(value, spec.format))}
      />
    </div>
  )
}

function ModeField({
  label, help, mode, modes, value, min, max, step, prefix, suffix, onMode, onValue,
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
  const labelId = useId()
  return (
    <div className="field">
      <div className="field-label">
        <span id={labelId}>{label}</span>
        <InfoTip text={help} label={label} />
      </div>
      <div className="mini-toggle" role="group" aria-label={`${label} format`}>
        {modes.map((item) => (
          <button type="button" key={item.id} className={mode === item.id ? 'active' : ''} aria-pressed={mode === item.id} onClick={() => onMode(item.id)}>{item.label}</button>
        ))}
      </div>
      <ValueRow label={label} labelId={labelId} value={value} min={min} max={max} step={step} prefix={prefix} suffix={suffix} onValue={onValue} />
    </div>
  )
}

export default function AssumptionFolio({
  inputs, tab, downPaymentMode, maintenanceMode, includeClosingCash,
  onTab, onDownPaymentMode, onMaintenanceMode, onIncludeClosingCash, onChange, onPreset,
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
  onChange: Change
  onPreset: (name: string) => void
}) {
  const fields = tab === 'buy' ? BUY_FIELDS : RENT_FIELDS
  const downPayment = Number(inputs.downPayment ?? inputs.homePrice * (inputs.downPaymentPercent ?? 0.2))
  const downPaymentShown = downPaymentMode === 'percent' ? Number(((downPayment / inputs.homePrice) * 100).toFixed(2)) : downPayment
  const fixedMaintenance = inputs.maintenanceAnnual ?? inputs.homePrice * inputs.maintenanceRate
  const termId = useId()

  return (
    <div className="assumptions" data-tab={tab} aria-label="Scenario assumptions">
      <div className="folio-head">
        <div className="folio-title">
          <h2>Assumptions</h2>
          <p>Results update as you edit.</p>
        </div>
        <div className="folio-tabs" role="tablist" aria-label="Assumption groups">
          {([['buy', 'Buy', Home], ['rent', 'Rent', KeyRound]] as const).map(([id, text, Icon]) => (
            <button key={id} className={`folio-tab ${tab === id ? 'active' : ''} is-${id}`} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)}>
              <Icon size={16} aria-hidden="true" />{text}
            </button>
          ))}
        </div>
      </div>
      <div className="control-sheet" role="tabpanel">
        <div className="preset-block">
          <span className="eyebrow">Start from</span>
          <div className="preset-row">
            {Object.keys(PRESETS).map((name) => (
              <button type="button" key={name} className="chip" onClick={() => onPreset(name)}>
                {name === 'Baseline' && <RotateCcw size={13} aria-hidden="true" />}{name}
              </button>
            ))}
          </div>
        </div>

        {tab === 'buy' && (
          <div className="control-group">
            <h3>Financing</h3>
            <div className="field">
              <div className="field-label"><label htmlFor={termId}>Mortgage term</label></div>
              <select id={termId} className="select" value={inputs.mortgageTermYears} onChange={(event) => onChange('mortgageTermYears', Number(event.target.value))}>
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
                  onValue={(value) => onChange('downPayment', downPaymentMode === 'percent' ? (inputs.homePrice * value) / 100 : value)}
                />
              )}
              <NumericField spec={spec} inputs={inputs} onChange={onChange} />
              {tab === 'buy' && spec.key === 'homeownersInsuranceAnnual' && (
                <ModeField
                  label="Annual maintenance"
                  help="Model maintenance as a share of home value or a fixed year-one cost."
                  mode={maintenanceMode}
                  modes={[{ id: 'rate', label: '% of value' }, { id: 'fixed', label: '$ fixed' }]}
                  value={maintenanceMode === 'rate' ? Number((inputs.maintenanceRate * 100).toFixed(2)) : fixedMaintenance}
                  min={0}
                  max={maintenanceMode === 'rate' ? 5 : 100000}
                  step={maintenanceMode === 'rate' ? 0.1 : 500}
                  prefix={maintenanceMode === 'fixed' ? '$' : undefined}
                  suffix={maintenanceMode === 'rate' ? '%' : undefined}
                  onMode={(mode) => {
                    const next = mode as MaintenanceMode
                    onMaintenanceMode(next)
                    onChange('maintenanceAnnual', next === 'fixed' ? fixedMaintenance : undefined)
                  }}
                  onValue={(value) => onChange(maintenanceMode === 'rate' ? 'maintenanceRate' : 'maintenanceAnnual', maintenanceMode === 'rate' ? value / 100 : value)}
                />
              )}
            </div>
          ))}
        </div>
        <details className="advanced">
          <summary>Advanced assumptions <ChevronDown size={16} aria-hidden="true" /></summary>
          <div className="advanced-content">
            {ADVANCED_FIELDS.map((spec) => <NumericField key={String(spec.key)} spec={spec} inputs={inputs} onChange={onChange} />)}
            <label className="check-row">
              <input type="checkbox" checked={includeClosingCash} onChange={(event) => onIncludeClosingCash(event.target.checked)} />
              <span><strong>Invest avoided closing cash</strong><small>Add buyer closing costs to the renter’s starting portfolio.</small></span>
            </label>
            <p className="note">The main comparison is deterministic and nominal. Inflation adjusts the stress test; volatility is not yet modeled.</p>
          </div>
        </details>
      </div>
    </div>
  )
}
