---
name: Equity Fold
description: A calm closing-table folio for comparing the long-term wealth paths of buying and renting.
colors:
  canvas: "#e7e1d5"
  paper: "#f7f5ef"
  paper-deep: "#eee9df"
  evergreen-ink: "#19332f"
  evergreen-soft: "#3e5750"
  closing-rust: "#a44a32"
  closing-rust-soft: "#f0d6ca"
  ledger-sage: "#4a766b"
  ledger-sage-soft: "#dbe6e2"
  rule: "#d6cfc2"
  night-canvas: "#111614"
  night-paper: "#1a211f"
  night-paper-deep: "#222b28"
  night-ink: "#f0eee7"
  night-ink-soft: "#c1cec9"
  night-rust: "#e38666"
  night-rust-soft: "#4a3028"
  night-sage: "#9cc6b9"
  night-sage-soft: "#263c37"
  night-rule: "#39443f"
typography:
  display:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(2.5rem, 5.4vw, 5.6rem)"
    fontWeight: 500
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Newsreader, serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Newsreader, serif"
    fontSize: "1.4rem"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.055em"
  data:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 600
    lineHeight: 1.25
  metric:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.25
  tooltipTitle:
    fontFamily: "Newsreader, serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.1
  strategyTotal:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(2rem, 4vw, 3.6rem)"
    fontWeight: 500
    lineHeight: 1
  mobileDisplay:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(2.5rem, 15vw, 4.4rem)"
    fontWeight: 500
    lineHeight: 0.96
    letterSpacing: "-0.035em"
rounded:
  compact: "6px"
  field: "8px"
  control: "10px"
  panel: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  screen-x: "clamp(14px, 2.6vw, 42px)"
components:
  button-primary:
    backgroundColor: "{colors.evergreen-ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "38px"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.evergreen-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "38px"
  chip-active:
    backgroundColor: "{colors.evergreen-ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.field}"
    padding: "7px 10px"
    height: "34px"
  field-number:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.evergreen-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.field}"
    padding: "7px 8px"
    width: "118px"
  folio-surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.evergreen-ink}"
    rounded: "{rounded.panel}"
    padding: "18px"
---

# Design System: Equity Fold

## Overview

**Creative North Star: "The Closing Table"**

Equity Fold should feel like a contemporary closing folio opened on a careful advisor's table: calm cotton-paper surfaces, precise rules, deep evergreen ink, and rust annotations that call attention to consequential numbers. It is editorial without becoming ornamental, financial without resembling a trading terminal, and dense without exposing every expert control at once.

The interface earns confidence through hierarchy and traceability. Assumptions live in a bounded folio; the verdict is the largest sentence on the page; supporting numbers descend into paired summaries, charts, sensitivity, reconciliation, and saved scenarios. The system favors crisp rules, tabular numerals, restrained color, and compact controls over interchangeable dashboard tiles.

**Key Characteristics:**

- Cotton-paper materiality over a faint 32px ledger grid.
- Newsreader for consequential statements; DM Sans for controls, labels, and explanation.
- Evergreen is the structural ink, rust marks buying and the current verdict, and sage marks renting.
- Fine rules and tonal layering organize dense financial content before shadow does.
- One responsive narrative: adjust, decide, inspect, reconcile, and save.

## Colors

The palette reads like annotated closing documents: warm paper, evergreen ink, one rust pencil, and one sage ledger mark, with a complete low-glare night translation.

### Primary

- **Evergreen Ink:** The structural voice for primary text, active controls, the brand mark, zero reference lines, and the historical placeholder surface.
- **Closing Rust:** The decisive annotation for the verdict emphasis, buy-series charts, sliders, selected folio rule, selection color, and buy-favoring sensitivity cells.

### Secondary

- **Ledger Sage:** The comparison voice for rent-series charts, dashed legend samples, hover borders, scrollbars, and rent-favoring sensitivity cells.

### Neutral

- **Cotton Paper:** The main reading surface and light-theme control fill.
- **Pressed Paper:** The recessed fill for inputs, inactive tabs, fact strips, and comparison wells.
- **Canvas Linen:** The outer page field beneath the folio sheets.
- **Soft Evergreen:** Secondary copy, axes, labels, and muted metadata.
- **Ledger Rule:** Hairline separators, borders, grids, and table row rules.
- **Night Paper Set:** Night canvas, paper, pressed paper, ink, annotation, and rule tokens remap the same semantic roles rather than inventing a second visual identity.

**The Two-Ink Rule.** Rust always means the buy/current-verdict side; sage always means the rent/comparison side. Never swap them between charts, legends, tables, or sensitivity views.

**The Paper, Not White Rule.** Product surfaces use the paper tokens. Pure white is reserved for translucent decorative effects and must not become the default dashboard background.

**The Meaning Beyond Hue Rule.** Color is never the only comparison cue: rent lines are dashed, legends are labeled, heatmap cells include signed values and winner titles, and active controls expose selected state.

## Typography

**Display Font:** Newsreader (serif fallback)

**Body Font:** DM Sans (sans-serif fallback)

**Character:** Newsreader gives decisions and major amounts the gravity of a well-set document; DM Sans keeps dense controls and financial detail crisp. The contrast is functional: serif speaks conclusions, sans-serif explains and operates them.

### Hierarchy

- **Display:** The live verdict only. Keep it to roughly 20 characters per line on wide screens and allow the mobile clamp to increase to 15vw so the sentence remains the dominant moment.
- **Headline:** Folio and section headings. Use compact tracking and sentence case.
- **Title:** Strategy names, tooltip years, and other local editorial anchors.
- **Body:** Explanations and decision context. Keep long supporting copy near 62–68 characters per line.
- **Control:** Buttons, numeric inputs, and compact interactive labels. Use tabular numerals for money, rates, tables, and calculated facts.
- **Label:** Uppercase metadata and metric captions. Uppercase is for orientation, not paragraphs.

**The Consequence Serif Rule.** Newsreader is reserved for verdicts, headings, major totals, and break-even figures; it never labels a slider or carries dense table content.

**The Numeric Alignment Rule.** Any repeated financial value uses tabular numerals so changes do not jitter and columns remain auditable.

## Layout

Planning extensions use the existing paper sheets and ruled ledgers. Budget inputs and outcomes share a two-column spread that stacks below 1100px. Stress alternatives use labeled Buy/Rent/Advantage rows, stacking the explanation above the amounts on smaller screens. Section navigation uses wrapping text buttons; it never writes to the scenario URL hash. Household fields use 1rem text and 44px minimum input height. New supporting copy uses the existing 0.9rem metric size for readable explanations.

The desktop shell is a single centered grid with a maximum width of 1680px, a 24px gap, and a left assumptions column constrained between 284px and 330px. The assumptions folio is sticky below the sticky top bar and scrolls within the viewport; the right workspace is one fluid column whose section spacing repeats the same 22–24px rhythm.

The verdict sheet leads every result page. Its strategy summaries form a ruled two-column spread, followed by quieter full-width sheets for time horizon, charts, sensitivity, reconciliation, scenarios, and the honest future-mode placeholder. Section headings pair editorial titles with controls, while dense chart and table areas remain horizontally scrollable instead of crushing their information.

At 980px and below, the fixed folio becomes a full-width disclosure above the verdict and the sensitivity split stacks vertically. At 700px and below, page gutters tighten, the verdict and scenario pairs become one column, supporting copy drops below the emphasized amount, chart tabs become a horizontal rail with a visible “More views” cue, the chart height reduces from 390px to 320px, and selected-year facts use a 2×2 grid. The minimum supported canvas is 320px.

**The Decision-First Rule.** Preserve the order assumptions → verdict → paired strategy totals → path → sensitivity → reconciliation → scenarios. New surfaces may extend the story but must not interrupt the verdict with generic KPI cards.

**The Contain Density Rule.** Dense controls scroll inside the folio; dense evidence scrolls inside its sheet. The page itself should not acquire accidental horizontal overflow.

## Elevation & Depth

Depth is a restrained hybrid. Paper tint and fine rules do most of the structural work; the shared ambient folio shadow (`0 18px 55px rgba(54, 45, 32, 0.10)`, dark variant `0 18px 55px rgba(0, 0, 0, 0.2)`) lifts major sheets from the linen canvas. The top bar uses a 94% paper wash with an 18px backdrop blur so scrolling content remains legible without turning the header into glass decoration.

### Shadow Vocabulary

- **Folio Lift:** The sole resting surface shadow, used on major sheets, the assumptions folio, tooltips, and transient status.
- **Structural Rules:** One-pixel ledger lines provide most internal separation; never add individual card shadows inside a sheet.
- **Historical Rings:** The future-mode panel uses concentric translucent rings as a contained editorial motif, not as a reusable background effect.

**The One-Lift Rule.** Use one shared ambient shadow for complete sheets. Interior metrics, facts, controls, and table rows stay flat.

## Shapes

The form language is softly document-like rather than bubbly. Full sheets use the panel radius, controls use the control or field radius, compact toggles and heat cells use the compact radius, and status tags alone may use the pill radius. Borders are thin and quiet; corners support tactility but never turn every metric into a capsule.

The verdict has one signature detail: a 46px rust corner rule at the top right. The historical placeholder uses a large clipped circle with two offset rings. These silhouettes belong to their named surfaces and should not proliferate as decoration.

**The Nested Radius Rule.** Large radius for the containing sheet, smaller radius for the control inside it, and no radius for plain ruled content.

## Components

### Buttons

- **Primary:** Evergreen fill, paper text, compact semibold type, and a 38px minimum height. Use for a true commit action such as saving a scenario.
- **Quiet:** Paper fill with a ledger-rule border. Use for reversible utilities, presets, exports, and secondary actions.
- **Icon:** A square 38px quiet control with an accessible label; visual icons do not replace accessible names.
- **Hover / Focus / Active:** Hover lifts by 1px and shifts the border to sage. Keyboard focus uses a 3px translucent rust outline with a 3px offset. Active and selected controls invert to evergreen and paper.

### Chips

- **Horizon and View Chips:** Compact, semibold controls that share the quiet state and invert for selection. View chips use a slightly shorter 34px height and remain in a horizontal scroll rail on mobile.
- **Mode Toggles:** Smaller pressed-paper segments use the compact radius; the chosen unit mode inverts to evergreen and paper.

### Cards / Containers

- **Folio Sheets:** Cotton-paper surfaces with the panel radius and one ambient shadow. Section divisions are rules, not nested cards.
- **Decision Sheet:** A generous editorial surface with the rust corner rule, a live verdict, and a ruled two-column strategy spread.
- **Recessed Wells:** Pressed-paper fills identify editable fields, selected-year facts, and scenario comparisons without adding elevation.

### Inputs / Fields

- **Numeric Field:** A fixed 118px recessed wrapper, tabular values, and optional prefix or suffix. Pair it with a full-width range input; both edit the same value.
- **Select and Text Field:** Full-width, 42px minimum-height recessed controls with a one-pixel rule and control radius.
- **Help:** A 14px information icon carries title and accessible label text; keyboard focus receives a rust outline.
- **Validation:** Clamp direct entry to the declared range. If persistence, clipboard, or export fails, explain the failure in a status toast rather than silently dropping work.

### Navigation

- **Top Bar:** Sticky, blurred paper header with the evergreen brand mark, Newsreader wordmark, optional uppercase subtitle, and compact utilities.
- **Assumption Tabs:** A two-column ruled folio tab set. The active tab returns to cotton paper and receives a rust top rule.
- **Mobile Disclosure:** Below 980px, replace the desktop sticky folio with an explicit “Adjust assumptions” disclosure; do not shrink the desktop sidebar into a narrow rail.

### Chart System

- **Buy / Owner:** Solid rust lines and areas, 3px stroke where applicable.
- **Rent / Renter:** Sage lines with an 8px / 5px dash pattern in comparative line views.
- **Axes and Grids:** Soft evergreen axes, no axis lines or tick marks, and horizontal ledger rules using a 2px / 5px dash pattern.
- **Inspection:** A 3px / 4px dashed selected-year reference line, labeled tooltip, and four synchronized selected-year facts.
- **Sensitivity:** Rust cells favor buying and sage cells favor renting. Every cell also shows a signed amount and exposes the winner and absolute advantage in its title.

### Motion and Feedback

- **State Motion:** Controls transition border, background, and 1px lift over 160ms with standard easing.
- **Verdict Rewrite:** A 340ms emphasized entrance clips upward from 25%, fades from 75%, and settles from a 5px offset with an expressive deceleration curve.
- **Toast:** A 240ms upward entrance confirms local save, copy, reset, and export outcomes; status is announced with `role="status"`.
- **Reduced Motion:** When the user requests reduced motion, scrolling becomes immediate and all animation and transition durations collapse to 0.01ms.

## Do's and Don'ts

### Do:

- **Do** keep the live verdict as the single dominant sentence and allow its rust phrase to rewrite as assumptions change.
- **Do** preserve the semantic chart contract: rust/solid for buy, sage/dashed for rent, labeled legends, and signed values.
- **Do** use fine rules, pressed-paper wells, and typographic hierarchy before adding another container or shadow.
- **Do** keep assumptions visibly connected to results through immediate recalculation, synchronized year inspection, and explicit explanatory copy.
- **Do** maintain visible labels, keyboard focus, `aria-selected` states, accessible icon names, and reduced-motion behavior.
- **Do** preserve the complete light/dark semantic remap and test both themes at desktop and 320px-plus narrow widths.

### Don't:

- **Don't** turn the experience into a grid of equal-weight KPI cards; the closing folio has a deliberate reading order.
- **Don't** introduce bright finance blues, neon greens, gradients, glass cards, or glossy trading-terminal effects.
- **Don't** use color alone to communicate winner, series, selection, positive/negative state, or chart meaning.
- **Don't** give interior metrics their own shadows, oversized radii, or pill containers.
- **Don't** use Newsreader for form labels, tabs, dense data tables, or long instructional copy.
- **Don't** fabricate historical-data visuals; the future-mode surface stays clearly labeled until verified sources exist.
