import { useRef, useState } from 'react'
import { parseBackup, BackupParseError } from '../lib/parseBackup'
import { restoreBackup } from '../db/restoreBackup'
import type { BackupSnapshot } from '../lib/backup'
import { useFilePicker } from '../hooks/useFilePicker'
import './BackupRestore.css'

interface BackupRestoreProps {
  // Hook-refresh hand-off after the DB write succeeds. Returns true if
  // the downstream refresh succeeded — the component uses that to decide
  // whether to show "Restored" vs. an error. The component itself owns
  // the restoreBackup() call (mirrors <ImportButton>'s pass-through
  // shape from P4.D).
  onRestore: () => Promise<boolean>
}

// jsdom (as of v29) does not implement HTMLDialogElement.showModal /
// .close — they're not on the prototype. We feature-detect and fall back
// to toggling the `open` attribute, which keeps tests deterministic
// without changing production a11y (real browsers always have the real
// methods).
function openDialog(d: HTMLDialogElement | null) {
  if (!d) return
  if (typeof d.showModal === 'function') {
    d.showModal()
  } else {
    d.setAttribute('open', '')
  }
}

function closeDialog(d: HTMLDialogElement | null) {
  if (!d) return
  if (typeof d.close === 'function') {
    d.close()
  } else {
    d.removeAttribute('open')
  }
}

// P6.C a11y-011: inline pluralization helper. Local to this file — promote
// to a shared util only when a second caller earns it (future TD).
function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

function reasonToMessage(reason: BackupParseError['reason']): string {
  switch (reason) {
    case 'invalid-json':
      return 'Could not read backup file: invalid JSON.'
    case 'unsupported-schema-version':
      return 'Unsupported backup version. This app cannot read this file.'
    case 'invalid-shape':
      return 'Backup file is missing or has invalid fields.'
  }
}

export function BackupRestore({ onRestore }: BackupRestoreProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<BackupSnapshot | null>(null)
  const [inlineError, setInlineError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  // TD.14: ref-reset + file.text() boilerplate now lives in useFilePicker.
  // The dialog-confirmation + atomic-restore flow stays local — this
  // component's needs diverge from the plain "parse + import" shape.
  const { inputRef, onChange: handleFile } = useFilePicker({
    onFile: (text) => {
      setInlineError('')
      setStatus('')
      try {
        const snapshot = parseBackup(text)
        setPending(snapshot)
        setDialogError('')
        openDialog(dialogRef.current)
      } catch (err) {
        if (err instanceof BackupParseError) {
          setInlineError(reasonToMessage(err.reason))
        } else {
          setInlineError('Could not read backup file.')
        }
      }
    },
  })

  function handleCancel() {
    closeDialog(dialogRef.current)
    setPending(null)
    setDialogError('')
  }

  // P6.C a11y-006: when the user dismisses the dialog via Escape, the
  // browser fires the native `close` event without going through our
  // handleCancel button click. Reset pending state + any dialog-scoped
  // error so a subsequent file pick starts clean.
  function handleClose() {
    setPending(null)
    setDialogError('')
  }

  async function handleConfirm() {
    if (!pending) return
    setBusy(true)
    setDialogError('')
    try {
      await restoreBackup(pending)
      const refreshOk = await onRestore()
      if (!refreshOk) {
        setDialogError('Restore completed but UI refresh failed.')
        return
      }
      closeDialog(dialogRef.current)
      setPending(null)
      setStatus('Restored.')
    } catch {
      // Atomic rollback at the DB layer — nothing changed. Keep dialog
      // open so the user can retry or cancel.
      setDialogError('Restore failed. No changes were applied.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="backup-restore">
      <label className="backup-restore__label">
        <span>Restore from backup</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="backup-restore__input"
          onChange={handleFile}
        />
      </label>
      {inlineError !== '' && (
        <p role="alert" className="backup-restore__error">
          {inlineError}
        </p>
      )}
      {status !== '' && (
        <p role="status" className="backup-restore__status">
          {status}
        </p>
      )}
      <dialog
        ref={dialogRef}
        className="backup-restore__dialog"
        aria-labelledby="backup-restore-dialog-heading"
        onClose={handleClose}
      >
        <h2 id="backup-restore-dialog-heading">Restore from backup?</h2>
        <p className="backup-restore__warning">
          This replaces all data — current expenses, categories, budgets,
          recurring templates, and per-category budgets will be deleted.
        </p>
        {pending && (
          <p className="backup-restore__counts">
            {pluralize(pending.expenses.length, 'expense', 'expenses')},{' '}
            {pluralize(pending.categories.length, 'category', 'categories')},{' '}
            {pluralize(pending.monthlyBudgets.length, 'budget', 'budgets')},{' '}
            {pluralize(
              pending.recurringTemplates.length,
              'recurring template',
              'recurring templates',
            )}
            ,{' '}
            {pluralize(
              pending.categoryBudgets.length,
              'per-category budget',
              'per-category budgets',
            )}
            .
          </p>
        )}
        {dialogError !== '' && (
          <p role="alert" className="backup-restore__error">
            {dialogError}
          </p>
        )}
        <div className="backup-restore__actions">
          <button
            type="button"
            className="backup-restore__button"
            onClick={handleCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="backup-restore__button backup-restore__button--danger"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
