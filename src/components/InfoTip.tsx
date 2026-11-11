import { useEffect, useId, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'

/** Tap-, hover- and keyboard-friendly help popover (replaces title-only tooltips). */
export default function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span
      className="info-tip"
      ref={ref}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setOpen(true) }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') setOpen(false) }}
    >
      <button
        type="button"
        className="info-button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleHelp size={15} aria-hidden="true" />
      </button>
      {open && <span role="tooltip" id={id} className="info-pop">{text}</span>}
    </span>
  )
}
