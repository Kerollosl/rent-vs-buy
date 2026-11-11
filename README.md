# Rent vs Buy

Rent vs Buy is an interactive buy-versus-rent calculator that keeps annual cash flow symmetric. When one housing strategy costs less in a given year, that strategy invests the difference automatically.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Verify

```bash
npm test
npm run build
```

The calculation suite covers fixed-rate amortization, principal-versus-expense accounting, sale-ready equity, cash-flow symmetry, portfolio reconciliation, crossover years, sensitivity analysis, and break-even solving.

## Model conventions

- Mortgage principal is a transfer into equity, not an unrecoverable expense.
- Owner cash cost includes principal when comparing annual budgets, so the cheaper strategy can invest the exact difference.
- Net worth uses home equity after estimated selling costs.
- The renter begins with the cash otherwise used for the down payment and buyer closing costs unless that initial investment is overridden.
- Home appreciation posts annually. Monthly base investment contributions compound monthly; annual base contributions and cash-flow-difference contributions post at year-end for both strategies.
- PMI is charged monthly only while the balance exceeds 80% of the modeled current home value. A refinance can reset the rate on the remaining original mortgage term.
- Home capital-gains tax, when entered, reduces sale-ready equity on modeled gains above the entered exclusion.
- Investment taxes are represented as a simplified annual drag on positive portfolio returns.
- The model is deterministic. Volatility and live historical data remain reserved for future simulation and backtest engines. The entered refinance year and rate are supported; refinance fees are not included.

## Household planning and stress tests

- Budget & cash uses entered take-home income, other spending, debt payments, available savings, and a chosen emergency reserve. Inputs start blank and reset on reload; they are excluded from scenario exports and links.
- Monthly housing uses year-one average cash costs before tax benefits. Initial renovation is funded in purchase cash, while recurring improvements remain in monthly costs. Base investments are deducted from monthly headroom; cash-flow equalization is not deducted a second time.
- Five deterministic alternatives compare current assumptions, slower home appreciation, lower investment returns, faster rent growth, and higher maintenance/insurance. These are illustrative scenarios, not probability estimates.
- Today's-dollar outcomes divide nominal ending values by `(1 + inflationRate) ^ horizonYears`. This toggle applies only to the stress-test section.
- Import configuration restores a validated JSON export. Save the imported configuration to retain it in local browser storage.

## Local data

Saved scenarios and theme preference stay in the browser's local storage. Configuration and yearly results can be exported without a server or account.
