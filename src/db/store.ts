import { withStore } from './db'

// Generic IDB-store seam. All five domain stores (expenses, categories,
// monthlyBudgets, recurringTemplates, categoryBudgets) follow the same
// open-tx-do-one-op shape; lift it once. Domain modules pick the public
// names they want (add vs setBudget, get vs getCategoryBudget) and own
// any non-CRUD behaviour (seed defaults, composite-key building).
//
// K defaults to string because every existing keyPath in db.ts is
// `id` | `month` and both are strings; the type param is here for the
// day a numeric or compound key wants the same factory.
export interface Store<T, K extends IDBValidKey = string> {
  add(item: T): Promise<void>
  put(item: T): Promise<void>
  getAll(): Promise<T[]>
  get(key: K): Promise<T | undefined>
  remove(key: K): Promise<void>
}

export function makeStore<T, K extends IDBValidKey = string>(
  name: string,
): Store<T, K> {
  return {
    async add(item) {
      await withStore(name, 'readwrite', (s) => s.add(item))
    },
    async put(item) {
      await withStore(name, 'readwrite', (s) => s.put(item))
    },
    getAll() {
      return withStore<T[]>(name, 'readonly', (s) => s.getAll())
    },
    get(key) {
      return withStore<T | undefined>(name, 'readonly', (s) => s.get(key))
    },
    async remove(key) {
      await withStore(name, 'readwrite', (s) => s.delete(key))
    },
  }
}
