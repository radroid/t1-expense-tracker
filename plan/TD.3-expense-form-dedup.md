# TD.3 — Deepen AddExpenseForm + EditExpenseForm into one ExpenseForm

Refactor iter (no new feature behaviour). `AddExpenseForm` and `EditExpenseForm` are
~90% identical controlled forms; collapse them into one `ExpenseForm` so the next
feature (P2.C category picker) adds its field ONCE.

## Files (sub-agent allowlist)
- `src/components/ExpenseForm.tsx` (create)
- `src/components/ExpenseForm.test.tsx` (create)
- `src/components/ExpenseForm.css` (create)
- `src/components/AddExpenseForm.tsx` (DELETE)
- `src/components/AddExpenseForm.test.tsx` (DELETE)
- `src/components/AddExpenseForm.css` (DELETE)
- `src/components/EditExpenseForm.tsx` (DELETE)
- `src/components/EditExpenseForm.test.tsx` (DELETE)
- `src/components/EditExpenseForm.css` (DELETE)

`src/App.tsx` / `src/App.test.tsx` are NOT in the allowlist — the main agent re-wires App.

## Step 0 — read the two existing components first
Read `src/components/AddExpenseForm.tsx` and `src/components/EditExpenseForm.tsx` (+ their
tests + css). The new `ExpenseForm` must preserve EVERY behaviour both currently have.

## Contract
```ts
import type { ExpenseInput } from '../lib/expense'

interface ExpenseFormProps {
  initial?: ExpenseInput            // pre-fill (edit mode). Absent → blank, date = today.
  submitLabel: string               // 'Add expense' | 'Save'
  onSubmit: (input: ExpenseInput) => void
  onCancel?: () => void             // present → render a Cancel button (edit mode)
  clearOnSubmit?: boolean           // true → clear amount + description after submit (add mode)
}
export function ExpenseForm(props: ExpenseFormProps): JSX.Element
```

Behaviour to preserve from BOTH old forms:
- Controlled amount (number) / description (text) / date (date) inputs, labelled
  "Amount" / "Description" / "Date" via `htmlFor`/`id` (use ids like `expense-form-*`).
- Blank-field guards: blank-or-NaN amount, blank description, empty date → inline
  `role="alert"` message, do NOT call `onSubmit`.
- Valid submit → `onSubmit({ amount, description, date })`.
- `initial` absent → amount '' / description '' / date = today (`new Date().toISOString().slice(0,10)`).
- `initial` present → fields pre-filled from it.
- `clearOnSubmit` true → after a successful submit, clear amount + description, keep date.
  False/absent → leave fields as-is after submit.
- `onCancel` present → render a `type="button"` Cancel button calling `onCancel`.
- `:focus-visible` outline on inputs (carry over from AddExpenseForm.css).
- Semicolon-free (Vite scaffold convention).

## Tests (ExpenseForm.test.tsx — cover BOTH modes)
Port the union of AddExpenseForm.test.tsx + EditExpenseForm.test.tsx:
- add mode (no `initial`, `clearOnSubmit`): valid submit → onSubmit with correct shape;
  amount+description clear, date retained; blank amount / blank description / cleared
  date → no onSubmit + alert; date defaults to today on mount.
- edit mode (`initial` given, `onCancel` given): fields pre-fill from `initial`; valid
  submit → onSubmit with edited values; does NOT clear after submit; Cancel → onCancel;
  same blank-field guards.

## Peer-review charter
Verify ExpenseForm preserves every behaviour of both old forms (no behaviour lost in the
merge); both modes covered by tests; old files fully deleted (no dangling imports); blank
guards + clearOnSubmit + onCancel all correct.
