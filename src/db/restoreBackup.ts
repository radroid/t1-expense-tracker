import type { BackupSnapshot } from '../lib/backup'
import { openDb } from './db'

// Order is stable + the tuple drives the multi-store transaction scope.
// P5.D extends with categoryBudgets so clear+add includes the new store
// inside the same atomic IDB transaction — partial restores remain
// impossible across all five entities.
const STORES = [
  'expenses',
  'categories',
  'monthlyBudgets',
  'recurringTemplates',
  'categoryBudgets',
] as const

// Replaces all four stores with the snapshot content in a single
// multi-store IDB transaction. clear()s every store, then add()s every
// entity. If any operation throws (bad shape, key collision, IDB
// constraint), the transaction aborts and IDB rolls back to pre-restore
// state — so partial restores are impossible.
//
// The `add()` calls are issued synchronously inside the transaction
// without awaiting each one; IDB serializes them on the wire and the
// transaction itself is what we await via the oncomplete/onerror promise.
// Awaiting between requests would let the tx auto-commit before later
// add()s land.
export async function restoreBackup(snapshot: BackupSnapshot): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      // Spread to a mutable string[] for IDB; STORES is a readonly
      // tuple so the literal types stay precise for the for-of loop.
      const tx = db.transaction([...STORES], 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Restore transaction failed.'))
      tx.onabort = () => reject(tx.error ?? new Error('Restore transaction aborted.'))

      try {
        for (const name of STORES) {
          tx.objectStore(name).clear()
        }
        for (const expense of snapshot.expenses) {
          tx.objectStore('expenses').add(expense)
        }
        for (const category of snapshot.categories) {
          tx.objectStore('categories').add(category)
        }
        for (const budget of snapshot.monthlyBudgets) {
          tx.objectStore('monthlyBudgets').add(budget)
        }
        for (const template of snapshot.recurringTemplates) {
          tx.objectStore('recurringTemplates').add(template)
        }
        for (const cb of snapshot.categoryBudgets) {
          tx.objectStore('categoryBudgets').add(cb)
        }
      } catch (err) {
        // Synchronous throw inside the tx (e.g. add() rejecting a null
        // record because it can't extract the keyPath). Force-abort so
        // the onerror/onabort handler still rejects the outer promise
        // with a meaningful error.
        try {
          tx.abort()
        } catch {
          /* tx may already be aborting */
        }
        reject(err)
      }
    })
  } finally {
    db.close()
  }
}
