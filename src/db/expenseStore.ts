import type { Expense } from '../lib/expense'

const DB_NAME = 'expense-tracker'
const STORE_NAME = 'expenses'

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = fn(tx.objectStore(STORE_NAME))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function addExpense(e: Expense): Promise<void> {
  await withStore('readwrite', (store) => store.add(e))
}

export function getAllExpenses(): Promise<Expense[]> {
  return withStore<Expense[]>('readonly', (store) => store.getAll())
}

export async function updateExpense(e: Expense): Promise<void> {
  await withStore('readwrite', (store) => store.put(e))
}

export async function removeExpense(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}
