# ARCHITECTURE.md

## Domain summary

A personal expense tracker. A single user records what they spend, groups expenses into
categories, sets a monthly budget, and sees how they are tracking against it. Local-only —
all data lives in the browser via IndexedDB. No accounts, no network, no sync.

## Tech stack

- Vite + React 19 + TypeScript (strict)
- IndexedDB for persistence, accessed through a typed store wrapper (`src/db/`)
- vitest + @testing-library/react for tests

## Data model

- **Expense** — `id`, `amount` (number, minor units or 2dp), `description`, `date` (ISO),
  `categoryId?`, `recurring?`.
- **Category** — `id`, `name`, `color`.
- **MonthlyBudget** — `month` (`YYYY-MM`), `amount`.

## Key flows

1. **Record** — add / edit / delete an expense; persisted immediately.
2. **Categorize** — manage categories; assign one to an expense; filter and group by it.
3. **Budget** — set a per-month budget; view spend-vs-budget and monthly insights.
4. **Power features** — search, date-range filter, CSV import/export, recurring expenses.

## Layering

- `src/db/` — IndexedDB store wrappers (one object store per entity). Pure, testable.
- `src/lib/` — domain logic: factories, validation, aggregation (totals, grouping). Pure.
- `src/components/` — React components. UI only; call into `lib/` and `db/`.
- A feature (vertical slice) normally touches all three layers + tests.

## Non-goals

- Multi-user, authentication, cloud sync.
- Real currency conversion / multi-currency.
- A backend of any kind — IndexedDB is the whole persistence story.
