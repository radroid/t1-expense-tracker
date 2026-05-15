# UI Screenshots

Captured against `npm run dev` on 2026-05-15 via headless Chromium
(Playwright). Viewport 1280×900 @ 2× DPR unless noted. The app constrains
itself to `max-width: 640px` (see `src/App.css:1-7`), so screenshots look
narrower than the viewport — that's accurate, not a capture artefact.

| Shot | What it shows |
|---|---|
| `01-empty-state.png` | Fresh load, no expenses yet. **Note the duplicated default categories — see CODE_REVIEW B1.** |
| `02-with-data-full.png` | Full app with 7 seeded expenses + a $2000 monthly budget. |
| `03-insights-section.png` | Insights: Budget vs actual, Monthly summary, Spending by category, bar chart. |
| `04-trends-section.png` | Year-over-year trends bar chart with year switcher. |
| `05-budgets-section.png` | Monthly budget input. |
| `05b-category-budgets-section.png` | Per-category budgets editor. |
| `06-categories-section.png` | Category manager (the lazy-loaded chunk). |
| `07-recurring-section.png` | Recurring expense templates manager. |
| `08-dark-theme.png` | Same data, dark theme. |
| `09-mobile-empty.png` | 390×844 mobile viewport, empty state. |

## Repro

If you want to regenerate these:

```bash
npm install
npm run dev &              # leaves vite on http://localhost:5173
# Then run scripts/screenshot.mjs (or copy the one used for this PR)
```

The screenshot script seeds expenses through the in-app form so the
captures reflect the real user flow (validation, IDB writes, rerenders)
rather than a hand-faked store.
