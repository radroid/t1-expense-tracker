import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupRestore } from './BackupRestore'
import { BACKUP_SCHEMA_VERSION, type BackupSnapshot } from '../lib/backup'
import { getAllExpenses } from '../db/expenseStore'

function snapshot(partial: Partial<BackupSnapshot> = {}): BackupSnapshot {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-05-15T10:00:00.000Z',
    expenses: [],
    categories: [],
    monthlyBudgets: [],
    recurringTemplates: [],
    categoryBudgets: [],
    ...partial,
  }
}

function jsonFile(value: unknown, name = 'backup.json'): File {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return new File([text], name, { type: 'application/json' })
}

function dialogIsOpen(): boolean {
  // jsdom doesn't reflect .open via the DOM property — the component
  // toggles the `open` attribute as a fallback path. We check the
  // attribute directly so we're agnostic to whichever path was taken.
  const d = document.querySelector('dialog')
  return d !== null && d.hasAttribute('open')
}

function getFileInput(): HTMLInputElement {
  // The dialog also contains the word "Restore" — scope the lookup to the
  // visually-hidden file input via its accept attribute.
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement | null
  if (!input) throw new Error('file input not found')
  return input
}

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('expense-tracker')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () =>
      reject(new Error('deleteDatabase blocked — connection left open'))
  })
})

describe('BackupRestore', () => {
  it('renders a "Restore from backup" file input and no open dialog at mount', () => {
    render(<BackupRestore onRestore={async () => true} />)
    expect(getFileInput()).toBeInTheDocument()
    expect(document.querySelector('dialog')).not.toBeNull()
    expect(dialogIsOpen()).toBe(false)
  })

  it('picking an invalid-JSON file shows an inline alert and does not open the dialog', async () => {
    const onRestore = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const user = userEvent.setup()
    render(<BackupRestore onRestore={onRestore} />)

    const input = getFileInput()
    await user.upload(input, jsonFile('not-json'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/invalid json/i)
    expect(dialogIsOpen()).toBe(false)
    expect(onRestore).not.toHaveBeenCalled()
  })

  it('schemaVersion mismatch shows "Unsupported" inline error, dialog stays closed', async () => {
    const onRestore = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const user = userEvent.setup()
    render(<BackupRestore onRestore={onRestore} />)

    const input = getFileInput()
    await user.upload(input, jsonFile(snapshot({ schemaVersion: 999 })))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/unsupported backup version/i)
    expect(dialogIsOpen()).toBe(false)
    expect(onRestore).not.toHaveBeenCalled()
  })

  it('picking a valid snapshot opens the dialog; Cancel closes it without calling onRestore', async () => {
    const onRestore = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const user = userEvent.setup()
    render(<BackupRestore onRestore={onRestore} />)

    const input = getFileInput()
    await user.upload(input, jsonFile(snapshot()))

    await waitFor(() => expect(dialogIsOpen()).toBe(true))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() =>
      expect(dialogIsOpen()).toBe(false),
    )
    expect(onRestore).not.toHaveBeenCalled()
  })

  it('confirming a valid snapshot calls onRestore, closes the dialog, and shows "Restored"', async () => {
    const onRestore = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const user = userEvent.setup()
    render(<BackupRestore onRestore={onRestore} />)

    const input = getFileInput()
    const snap = snapshot({
      expenses: [
        { id: 'r1', amount: 7, description: 'Tea', date: '2026-05-15' },
      ],
    })
    await user.upload(input, jsonFile(snap))

    await waitFor(() => expect(dialogIsOpen()).toBe(true))
    await user.click(screen.getByRole('button', { name: /^restore$/i }))

    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(dialogIsOpen()).toBe(false),
    )

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/restored/i)

    // The DB write actually happened.
    expect(await getAllExpenses()).toEqual(snap.expenses)
  })

  it('picking the same file twice (after a cancel) re-opens the dialog', async () => {
    const onRestore = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const user = userEvent.setup()
    render(<BackupRestore onRestore={onRestore} />)

    const input = getFileInput()
    const file = jsonFile(snapshot())

    await user.upload(input, file)
    await waitFor(() => expect(dialogIsOpen()).toBe(true))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() =>
      expect(dialogIsOpen()).toBe(false),
    )

    // Second upload of an identically-named file would be a no-op without
    // the input.value reset. Verify the dialog reopens.
    await user.upload(input, file)
    await waitFor(() => expect(dialogIsOpen()).toBe(true))
  })
})
