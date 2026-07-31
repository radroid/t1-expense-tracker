# Code review — `t1-expense-tracker`

Date: 2026-05-15
Scope: a walk through `src/` looking for correctness bugs, inefficiencies, and
small-but-real quality issues. Numbers in headers (B1, P1, …) are referenced
from `SCREENSHOTS.md` and from the empty-state screenshot — several findings
are visible there.

Severity legend
- **B** Bug (wrong behaviour, observable to a user)
- **P** Performance / inefficiency
- **Q** Quality / maintainability nit

---

## B1 — `useCategories` double-seeds defaults under React StrictMode

**File:** `src/hooks/useCategories.ts:74`, `src/db/categoryStore.ts:12`, `src/main.tsx:12`

The empty-state screenshot (`docs/screenshots/01-empty-state.png`) shows the
seed defaults rendered *twice* — `Food, Housing, Housing, Transport,
Entertainment, Transport, Food, Other, Entertainment, Other`. That is ten
rows where there should be five.

Cause: `useStoredCollection`'s mount effect calls `bootstrap` ➜
`seedDefaultCategories`. Under `<StrictMode>` in dev, the effect runs twice.
The check-then-write inside `seedDefaultCategories` is not atomic:

```ts
// src/db/categoryStore.ts:12-23
export async function seedDefaultCategories(): Promise<Category[]> {
  const existing = await getAllCategories()
  if (existing.length > 0) return existing
  const created = DEFAULT_CATEGORIES.map(createCategory)
  for (const category of created) {
    await addCategory(category)
  }
  return getAllCategories()
}
```

Both effect runs race past the `existing.length > 0` guard before either has
finished writing, so both proceed to add the full default set with fresh
UUIDs. The user lands on the page with duplicated categories that never go
away (their UUIDs are unique, so they're not collapsed by `.add()`).

The same race exists in production if anything ever triggers two `useCategories`
mounts concurrently (route changes, suspense boundaries, error recovery), but
StrictMode makes it the *default* dev experience.

**Fix sketches:**
- Single-flight the seed at module scope: cache the promise of the first
  `seedDefaultCategories()` call and return it for subsequent callers.
- Or do the check + writes inside one IDB transaction (atomic).
- Or move the seed out of the React lifecycle entirely — run it once in
  `main.tsx` before `createRoot`.

---

## B2 — Hardcoded `$` in two places ignores the currency preference

The app supports USD / EUR / GBP / JPY (`src/lib/currency.ts`) and routes
display through `formatCurrency(amount, currency)` everywhere — except:

- `src/components/CategoryBudgetManager.tsx:115`
  ```ts
  ? `Current: $${existing.amount.toFixed(2)}`
  ```
- `src/components/RecurringManager.tsx:103`
  ```tsx
  ${t.amount.toFixed(2)} · day {t.dayOfMonth}
  ```

For a JPY-preferred user the rest of the UI shows `¥1,450`, while these two
strings show `$1450.00` with the wrong glyph and the wrong number of fraction
digits. Both surfaces are happy to receive `currency` as a prop and call
`formatCurrency`.

---

## B3 — `CategoryBudgetManager` shows the raw `YYYY-MM` month string

`src/components/CategoryBudgetManager.tsx:85`

```tsx
<p className="category-budget-manager__month">For month {month}</p>
```

`month` is a machine string like `"2026-05"`; the user sees `"For month
2026-05"`. Other places (`MonthSwitcher`) format it as `"May 2026"`. Pick a
human-readable month formatter and use it consistently.

---

## B4 — `parseExpensesCsv` wastes a UUID and re-trims per row

`src/lib/csv.ts:154-180`

The CSV parser calls `createExpense(input)` purely as a validation gate, then
throws the result away and constructs a fresh `ExpenseInput`:

```ts
try { createExpense(input) }
catch (e) { errors.push(...); return }

const cleaned: ExpenseInput = {
  amount,
  description: description.trim(),
  date,
}
```

That's a `crypto.randomUUID()` per row that's immediately discarded, plus a
redundant `description.trim()` (createExpense already trimmed). For an import
of 10k rows that's 10k throwaway UUIDs.

**Fix:** export `validateExpenseInput` from `lib/expense.ts` and use it here.
The return value is the cleaned input — assign it directly.

---

## P1 — `App.handleDeleteCategory` and `<CategoryManager getInUseCount=…>` re-scan all expenses per category

`src/App.tsx:195-198` and `src/App.tsx:367-369`

```ts
const inUseCount = expensesHook.expenses.filter(
  (e) => e.categoryId === id,
).length
// …
getInUseCount={(id) =>
  expensesHook.expenses.filter((e) => e.categoryId === id).length
}
```

`CategoryManager` calls `getInUseCount(category.id)` once per render per
row. With N categories and M expenses, every render is O(N·M). The same
counts could be built once with a single `Map<categoryId, number>` reduce:

```ts
const inUseCount = useMemo(() => {
  const m = new Map<string, number>()
  for (const e of expensesHook.expenses) {
    if (!e.categoryId) continue
    m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + 1)
  }
  return m
}, [expensesHook.expenses])
```

Then `getInUseCount={(id) => inUseCount.get(id) ?? 0}`. O(N+M) per
expense-change, O(1) per category-row read.

---

## P2 — `CategoryBudgetManager.existingFor` is a linear scan inside `.map`

`src/components/CategoryBudgetManager.tsx:43-47, 87-88`

```ts
function existingFor(categoryId: string): CategoryBudget | undefined {
  return categoryBudgets.find(
    (b) => b.month === month && b.categoryId === categoryId,
  )
}
// …
categories.map((c) => {
  const existing = existingFor(c.id) // O(B) inside O(C)
```

Same O(N·M) shape. Lift the lookup into a `useMemo`'d
`Map<categoryId, CategoryBudget>` filtered by `month` first.

---

## P3 — `CategoryManager` re-mounts every row on rename

`src/components/CategoryManager.tsx:48`

```tsx
<CategoryRow key={`${category.id}:${category.name}`} … />
```

Including the *current* name in the key means a rename changes the key,
which un-mounts and re-mounts `CategoryRow`. That throws away the row's
local `useState(name)` draft and (if the user happens to be focused on the
input) blurs the active element. Use `key={category.id}` and derive
behaviour through props.

---

## P4 — `useRef` ineffective; consider `useCallback` for re-rendered callbacks

`src/components/CategoryManager.tsx:52`

```ts
inUseCount={(getInUseCount ?? (() => 0))(category.id)}
```

A fresh `() => 0` is allocated per row per render. Hoist the fallback once,
or normalize `getInUseCount` at the top of the component. Tiny.

---

## P5 — `[...expenses].sort` runs on every `ExpenseList` render

`src/components/ExpenseList.tsx:30`

The sort isn't expensive on its own, but `ExpenseList` is the busiest list
in the app and is re-rendered any time a filter / search / category set
changes. A `useMemo([...expenses].sort(...), [expenses])` would pay for
itself the moment the list is non-trivial.

Same comment applies in `src/components/SpendingByCategory.tsx:26-28` and
`src/components/SpendingChart.tsx:27-29` — both `.slice().sort()` on every
render.

---

## P6 — `useExpenses.addMany` re-fetches after every bulk import

`src/hooks/useExpenses.ts:94-119`

The loop awaits one `addExpense` per row, then a single `refresh()` reads
the whole store back. The reads-per-import is fine, but the *writes* each
open and close their own IDB connection through `withStore`
(`src/db/db.ts:32-44`). Importing a CSV of 1,000 rows means 1,001
`indexedDB.open` calls. A bulk-write helper that opens once and reuses one
`readwrite` transaction across all `.add()`s would be 1× the connection
churn and ~order-of-magnitude faster for big imports.

`restoreBackup` already uses this pattern correctly
(`src/db/restoreBackup.ts:33-69`); the bulk-import path could borrow it.

---

## P7 — Connection-per-operation is the default everywhere

`src/db/db.ts:28-45`

`withStore` opens and closes the DB per call. For one-off CRUD this is
fine, but the App boot does five parallel `getAll()`s (one per hook), and
every subsequent mutation re-opens. A long-lived singleton connection
(opened once, kept until tab close) is the idiomatic IDB pattern. Vite's
HMR makes "single connection ever" tricky, but the upgrade path is real.

---

## Q1 — Legacy template CSS is dead

`src/index.css:1-13`

```css
/* ---- Legacy template vars (kept for compatibility) ---- */
--text, --text-h, --bg, --border, --code-bg, --accent, --accent-bg,
--accent-border, --social-bg, --shadow, --sans, --heading, --mono
```

Comment claims they're "kept for compatibility"; nothing in `src/`
references most of them. A grep confirms only `--sans`, `--heading`,
`--mono`, `--code-bg`, and `--app-*` ever resolve. The `#social` selector
on line 125 references an id that does not exist in the app's markup. This
is leftover from the Vite/React template and can be deleted.

## Q2 — `#root` hardcodes a `1126px` width

`src/index.css:130-142`

`#root` is `1126px` wide with vertical borders, but the actual app sits in
`.app { max-width: 640px; margin: 0 auto }` (`src/App.css:1-7`). The two
constraints conflict cosmetically: at viewports between 640px and 1126px
the `#root` border draws a visible rectangle outside the content area for
no reason. Either drop the `#root` width or move the centering up to it.

## Q3 — Disabled-eslint comments for hook deps

`src/App.tsx:180`, `src/hooks/useStoredCollection.ts:93`

Both shrug off `react-hooks/exhaustive-deps`. The `useStoredCollection`
case is justified ("load once on mount"). The `App.tsx` case (the recurring
rollover effect) is more ambiguous — `expensesHook.addMany` is captured
from a closure that is recreated each render, so the dep array under-states
the real dependency. The current code works because addMany is stable in
*practice* but that contract isn't enforced anywhere.

A cleaner version returns a stable identity via `useCallback` in
`useExpenses` and lists `addMany` in the deps explicitly.

## Q4 — `useExpenses.useMemo<Store<…>>` exists only to bridge a test seam

`src/hooks/useExpenses.ts:50-58` (same pattern in `useCategories.ts:56-64`)

```ts
const store = useMemo<Store<Expense>>(
  () => ({
    add: (e) => addExpense(e),
    getAll: () => getAllExpenses(),
    update: (e) => updateExpense(e),
    remove: (id) => removeExpense(id),
  }),
  [],
)
```

The comment explains: closures so `vi.spyOn(expenseStore, 'removeExpense')`
keeps working. That's a real concern but it's been pushed down into every
domain hook. A single helper `bindStore(module)` would dedupe four
near-identical literals.

## Q5 — `useStoredCollection` swallows store errors silently on add/update/remove

`src/hooks/useStoredCollection.ts:114, 143, 158`

```ts
} catch {
  setError(messages.add)
  return false
}
```

A naked `catch` with no `console.error` / no `console.warn` makes
diagnosing a quota or transaction-aborted failure impossible at the
console. A dev-mode `console.error(e)` (gated on `import.meta.env.DEV`)
costs nothing and rescues many "why doesn't it persist" reports.

## Q6 — Empty-state spacing in the empty state

The first screenshot also shows several rendered cards (`Budget vs actual`,
`Monthly summary`, `Spending by category`, `Trends`, `Monthly budget`,
`Per-category budgets`, `Categories`, `Recurring expenses`) when *nothing
is yet entered*. That's a lot of empty real estate for a brand-new user.
Some of these (e.g. Trends, Spending by category) carry their own
EmptyState pill which is good; others (`Per-category budgets`) render an
empty form row per category which is noisy at zero-state. Consider
collapsing the management surfaces behind a "Manage…" disclosure for
first-run users.

## Q7 — `lib/csv.ts` reimplements RFC-4180 by hand

`src/lib/csv.ts:44-106`

A hand-rolled CSV tokenizer in user code is a maintenance hazard (unicode
edge cases, BOM handling, locale-sensitive separators). For a beginner-tier
project this is fine, but if data fidelity matters longer-term a small
dependency (`papaparse`, ~15 kB gzip) gets the right answer for free.

## Q8 — `restoreBackup.ts` comment says "four stores"; the loop iterates five

`src/db/restoreBackup.ts:16-19`

```ts
// Replaces all four stores with the snapshot content…
```

The list below it has five entries (`categoryBudgets` was added in P5.D).
Drift between comment and code. Drop the count or generalise.

## Q9 — Mixed semicolon style

The codebase has a mix: most files don't use semicolons, but `lib/expense.ts`
and `components/ExpenseList.tsx` do, plus a few others. Pick one and let
prettier or eslint enforce it.

---

## Things that look good

A few notes so this isn't entirely a list of complaints:

- The lib layer is genuinely pure and well-tested — `expense.ts`,
  `currency.ts`, `recurring.ts`, `urlFilters.ts`, `expenseFilter.ts` all
  return clean inputs and never touch DOM or storage. `currency.ts` caches
  `Intl.NumberFormat` instances. `expenseFilter.ts` documents the
  pass-through (no-copy) semantics explicitly.
- `useStoredCollection` is a tasteful generic — the duplication it removes
  was real, and the escape hatches (`setError`, `refresh`) are correctly
  scoped.
- IDB migration is properly tested across v2 → v3 → v4 → v5 with data
  preservation assertions (`src/db/dbMigration.test.ts`).
- The category-color swatch is correctly `aria-hidden="true"` and the row
  carries the colour as background only; nothing tries to convey state with
  colour alone.
- 588 tests pass. Test pyramid is wide and shallow — lib + hooks + components
  all have direct tests, not just one big integration test.
- `restoreBackup.ts` uses a single multi-store transaction so a partial
  restore is impossible. That's the hard thing to get right with IDB.

See `docs/screenshots/` for visuals of every section.
