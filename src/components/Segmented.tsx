import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  id: T
  label: string
  short?: string
  icon?: ReactNode
}

/** A radio-group segmented control with a sliding thumb. Arrow keys move the selection. */
export default function Segmented<T extends string>({
  options, value, onChange, label, size = 'md', stacked = false,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  size?: 'sm' | 'md'
  stacked?: boolean
}) {
  const index = Math.max(0, options.findIndex((option) => option.id === value))

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = options[(index + step + options.length) % options.length]
    onChange(next.id)
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
    buttons[(index + step + options.length) % options.length]?.focus()
  }

  return (
    <div
      className={`segmented ${size} ${stacked ? 'stacked' : ''}`}
      role="radiogroup"
      aria-label={label}
      style={{ '--i': index, '--n': options.length } as CSSProperties}
      onKeyDown={onKeyDown}
    >
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          tabIndex={option.id === value ? 0 : -1}
          className={option.id === value ? 'active' : ''}
          onClick={() => onChange(option.id)}
        >
          {option.icon}
          <span className="seg-full">{option.label}</span>
          <span className="seg-short">{option.short ?? option.label}</span>
        </button>
      ))}
    </div>
  )
}
