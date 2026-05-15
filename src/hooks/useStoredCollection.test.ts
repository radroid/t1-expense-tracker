import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  useStoredCollection,
  type Store,
  type StoredCollectionMessages,
} from './useStoredCollection'

// A trivially-typed entity used throughout. The generic doesn't care what
// shape T is; we just need an id so remove() has a useful key.
interface Item {
  id: string
  name: string
}

interface ItemInput {
  name: string
}

const messages: StoredCollectionMessages = {
  load: 'Failed to load items.',
  add: 'Failed to add item.',
  update: 'Failed to save item.',
  remove: 'Failed to delete item.',
}

// Each store method is a vi.fn() so individual tests can `mockRejectedValueOnce`
// or `mockImplementation` per case. We type the returned object as both the
// Store contract (so it slots into the hook options) and a MockStore that
// preserves the vi.fn-ness of each method.
type MockStore = {
  add: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  getAll: ReturnType<typeof vi.fn>
  readonly state: Item[]
}

function makeStore(initial: Item[] = []): Store<Item> & MockStore {
  let data: Item[] = [...initial]
  const obj: MockStore = {
    add: vi.fn(async (entity: Item) => {
      data = [...data, entity]
    }),
    update: vi.fn(async (entity: Item) => {
      data = data.map((d) => (d.id === entity.id ? entity : d))
    }),
    remove: vi.fn(async (id: string) => {
      data = data.filter((d) => d.id !== id)
    }),
    getAll: vi.fn(async () => [...data]),
    get state() {
      return data
    },
  }
  return obj as unknown as Store<Item> & MockStore
}

const validateAdd = (input: ItemInput): Item => {
  if (!input.name) throw new Error('Name is required.')
  return { id: `id-${input.name}`, name: input.name }
}

const validateUpdate = (existing: Item, input: ItemInput): Item => {
  if (!input.name) throw new Error('Name is required.')
  return { ...existing, name: input.name }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStoredCollection', () => {
  it('loads items on mount, loading flips false, no error on success', async () => {
    const store = makeStore([{ id: '1', name: 'Apple' }])
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual([{ id: '1', name: 'Apple' }])
    expect(result.current.error).toBe('')
    expect(store.getAll).toHaveBeenCalledTimes(1)
  })

  it('surfaces messages.load when initial getAll throws', async () => {
    const store = makeStore()
    store.getAll.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(messages.load)
    expect(result.current.items).toEqual([])
  })

  it('add() happy path persists and clears prior error', async () => {
    const store = makeStore()
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Prime an error so we can assert it gets cleared on success.
    act(() => result.current.setError('stale'))
    expect(result.current.error).toBe('stale')

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({ name: 'Apple' })
    })
    expect(ok).toBe(true)
    expect(store.add).toHaveBeenCalledOnce()
    expect(result.current.items).toEqual([{ id: 'id-Apple', name: 'Apple' }])
    expect(result.current.error).toBe('')
  })

  it("add() validation throw surfaces the Error's own message (domain text)", async () => {
    const store = makeStore()
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({ name: '' })
    })
    expect(ok).toBe(false)
    expect(result.current.error).toBe('Name is required.')
    expect(store.add).not.toHaveBeenCalled()
  })

  it('add() store throw surfaces messages.add', async () => {
    const store = makeStore()
    store.add.mockRejectedValueOnce(new Error('store boom'))
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({ name: 'Apple' })
    })
    expect(ok).toBe(false)
    expect(result.current.error).toBe(messages.add)
    expect(result.current.items).toEqual([])
  })

  it('update() happy / validation throw / store throw matrix', async () => {
    const store = makeStore([{ id: 'id-A', name: 'A' }])
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    const existing = result.current.items[0]

    // Happy path.
    let ok!: boolean
    await act(async () => {
      ok = await result.current.update(existing, { name: 'B' })
    })
    expect(ok).toBe(true)
    expect(result.current.items[0].name).toBe('B')
    expect(result.current.error).toBe('')

    // Validation throw — domain message surfaces.
    await act(async () => {
      ok = await result.current.update(result.current.items[0], { name: '' })
    })
    expect(ok).toBe(false)
    expect(result.current.error).toBe('Name is required.')

    // Store throw — messages.update surfaces.
    store.update.mockRejectedValueOnce(new Error('store boom'))
    await act(async () => {
      ok = await result.current.update(result.current.items[0], { name: 'C' })
    })
    expect(ok).toBe(false)
    expect(result.current.error).toBe(messages.update)
  })

  it('remove() happy / store throw', async () => {
    const store = makeStore([{ id: '1', name: 'A' }])
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Store throw first.
    store.remove.mockRejectedValueOnce(new Error('store boom'))
    let ok!: boolean
    await act(async () => {
      ok = await result.current.remove('1')
    })
    expect(ok).toBe(false)
    expect(result.current.error).toBe(messages.remove)
    expect(result.current.items).toHaveLength(1)

    // Happy path.
    await act(async () => {
      ok = await result.current.remove('1')
    })
    expect(ok).toBe(true)
    expect(result.current.items).toEqual([])
    expect(result.current.error).toBe('')
  })

  it('bootstrap runs once before the initial getAll', async () => {
    const seq: string[] = []
    const store = makeStore()
    store.getAll.mockImplementation(async () => {
      seq.push('getAll')
      return []
    })
    const bootstrap = vi.fn(async () => {
      seq.push('bootstrap')
    })

    const { result } = renderHook(() =>
      useStoredCollection({
        store,
        validateAdd,
        validateUpdate,
        messages,
        bootstrap,
      }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(bootstrap).toHaveBeenCalledTimes(1)
    expect(seq).toEqual(['bootstrap', 'getAll'])
  })

  it('refresh() and setError() escape hatches work', async () => {
    const store = makeStore([{ id: '1', name: 'A' }])
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, validateUpdate, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Mutate the underlying store out-of-band, then refresh().
    await store.add({ id: '2', name: 'B' })
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.items).toHaveLength(2)

    act(() => result.current.setError('custom summary'))
    expect(result.current.error).toBe('custom summary')
  })

  it('update() without validateUpdate / store.update sets error and returns false', async () => {
    const store: Store<Item> = {
      add: vi.fn(),
      getAll: vi.fn(async () => []),
      remove: vi.fn(),
    }
    const { result } = renderHook(() =>
      useStoredCollection({ store, validateAdd, messages }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.update({ id: 'x', name: 'x' }, { name: 'y' })
    })
    expect(ok).toBe(false)
    expect(result.current.error).not.toBe('')
  })
})
