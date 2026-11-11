# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: React with TypeScript and Vite, selected for a fast local interactive calculator with a lightweight static deployment path. Financial calculations remain framework-independent and testable.

## Users

Individuals evaluating whether buying a home or renting while investing the cash-flow difference is likely to build more net worth over their chosen horizon. The primary user is making a consequential personal-finance decision and needs to explore assumptions without financial-modeling expertise.

## Product Purpose

Make the buy-versus-rent tradeoff legible year by year. Success means the user can change a meaningful assumption, see both strategies update immediately, understand why the result changed, and export or save the scenario.

## Positioning

The comparison is cash-flow symmetric: in every year, whichever housing strategy costs less automatically invests the difference. Mortgage principal is treated as wealth transfer rather than an unrecoverable expense, and sale proceeds are shown after selling costs.

## Operating Context

Users begin with a realistic preset, adjust a compact set of core assumptions, optionally open advanced assumptions, choose a time horizon, inspect net-worth and cost trajectories, review a year-by-year table, and save or export scenarios locally.

## Capabilities and Constraints

- Household budget and purchase-reserve planner with private, session-only inputs.
- Five deterministic stress alternatives and inflation-adjusted ending outcomes.
- Section navigation, validated configuration import, and expandable model explanations.

- Proper fixed-rate mortgage amortization and annual rollups.
- Buy and rent strategies each maintain an outside investment portfolio.
- Cash-flow symmetry is applied annually.
- KPI summaries, synchronized charts, a detailed expandable table, CSV export, presets, local scenario persistence, comparison of saved scenarios, and sensitivity analysis.
- Historical Backtest is architected as a future mode; the first version labels it as planned and does not fabricate live market or housing data.
- Advanced tax, volatility, refinancing, and inflation controls may use deterministic manual assumptions in the MVP; unsupported stochastic or external-data behavior must be labeled honestly.
- No authentication, database, paid APIs, or server is required for the first version.
- Calculations and saved scenarios run locally in the browser.

## Evidence on Hand

The user supplied a detailed functional brief and baseline assumptions. No brand assets, testimonials, historical datasets, or external market data were provided; future work must not fabricate them.

## Product Principles

1. Financial semantics before visual decoration.
2. Every result should be traceable to an editable assumption.
3. Keep the default experience calm; reveal expert complexity progressively.
4. Compare like with like through cash-flow symmetry.
5. Label estimates, limitations, and future capabilities plainly.

## Accessibility & Inclusion

All controls require visible labels, keyboard access, strong focus states, sufficient contrast, and non-color-only winner or chart cues. The dashboard must remain usable on narrow mobile screens and respect reduced-motion preferences.
