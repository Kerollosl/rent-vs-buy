import { useMemo } from 'react'
import RentVsBuy from './App'

const tools = [
  {
    href: '/dayroute/',
    eyebrow: 'Routes & stops',
    title: 'Dayroute',
    description: 'Plan a day of stops, shape the order, and hand the route to Maps when you’re ready to go.',
    accent: 'route',
    action: 'Open Dayroute',
  },
  {
    href: '/rent-vs-buy/',
    eyebrow: 'Long-term decisions',
    title: 'Rent vs Buy',
    description: 'Compare the cost, flexibility, and future equity of renting versus buying with your own assumptions.',
    accent: 'home',
    action: 'Open Rent vs Buy',
  },
]

export default function ToolHub() {
  const path = useMemo(() => window.location.pathname.replace(/\/+$/, '') || '/', [])

  if (path === '/rent-vs-buy') {
    return (
      <div className="tool-standalone">
        <a className="hub-back" href="/">← Personal tools</a>
        <RentVsBuy />
      </div>
    )
  }

  return (
    <main className="hub-page">
      <section className="hub-hero" aria-labelledby="hub-title">
        <div className="hub-kicker"><span className="hub-mark" aria-hidden="true">✳</span> Kero’s personal tools</div>
        <h1 id="hub-title">Make the next move<br /><em>with a clear head.</em></h1>
        <p className="hub-intro">A small, private shelf for the tools that help you plan the day and make the bigger calls.</p>
      </section>

      <section className="hub-tools" aria-label="Available tools">
        {tools.map((tool) => (
          <a className={`hub-card hub-card-${tool.accent}`} href={tool.href} key={tool.title}>
            <div className="hub-card-top"><span>{tool.eyebrow}</span><span className="hub-arrow" aria-hidden="true">↗</span></div>
            <div className="hub-card-icon" aria-hidden="true">{tool.accent === 'route' ? '↝' : '⌂'}</div>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <span className="hub-card-action">{tool.action} <span aria-hidden="true">→</span></span>
          </a>
        ))}
      </section>

      <footer className="hub-footer">
        <span className="hub-footer-dot" aria-hidden="true" />
        <span>Saved in this browser</span>
        <span className="hub-footer-separator" aria-hidden="true">·</span>
        <span>No shared account or synced data</span>
      </footer>
    </main>
  )
}
