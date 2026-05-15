import { describe, it, expect, beforeEach } from 'vitest'
import { makeStore } from './store'
import { openDb } from './db'

interface Thing {
  id: string
  name: string
}

// Use a real existing store from the schema so the factory exercises the
// same withStore path the domain stores use. The 'recurringTemplates'
// store is the simplest 3-op consumer (add/getAll/remove) so reusing
// it keeps the test from depending on Expense/Category/etc shape.
const STORE = 'recurringTemplates'

async function wipe(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

describe('makeStore<T, K>', () => {
  beforeEach(async () => {
    await wipe()
  })

  it('add + getAll round-trips one item', async () => {
    const store = makeStore<Thing>(STORE)
    await store.add({ id: 't1', name: 'one' })
    expect(await store.getAll()).toEqual([{ id: 't1', name: 'one' }])
  })

  it('put performs an upsert (overwrites an existing id)', async () => {
    const store = makeStore<Thing>(STORE)
    await store.add({ id: 't1', name: 'one' })
    await store.put({ id: 't1', name: 'one-prime' })
    expect(await store.getAll()).toEqual([{ id: 't1', name: 'one-prime' }])
  })

  it('get fetches a single item by key, returns undefined for misses', async () => {
    const store = makeStore<Thing>(STORE)
    await store.add({ id: 't1', name: 'one' })
    expect(await store.get('t1')).toEqual({ id: 't1', name: 'one' })
    expect(await store.get('missing')).toBeUndefined()
  })

  it('remove deletes by key', async () => {
    const store = makeStore<Thing>(STORE)
    await store.add({ id: 't1', name: 'one' })
    await store.add({ id: 't2', name: 'two' })
    await store.remove('t1')
    expect(await store.getAll()).toEqual([{ id: 't2', name: 'two' }])
  })

  it('add throws when the key already exists (uses IDB.add not put)', async () => {
    const store = makeStore<Thing>(STORE)
    await store.add({ id: 't1', name: 'one' })
    await expect(store.add({ id: 't1', name: 'dup' })).rejects.toBeDefined()
  })
})
