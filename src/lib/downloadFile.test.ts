import { describe, it, expect, vi, afterEach } from 'vitest'
import { downloadFile } from './downloadFile'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('downloadFile', () => {
  it('creates an anchor with the correct download attribute and clicks it', () => {
    const clicks: HTMLAnchorElement[] = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        const a = el as HTMLAnchorElement
        a.click = vi.fn(() => {
          clicks.push(a)
        })
      }
      return el
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    downloadFile({
      filename: 'example.csv',
      mime: 'text/csv',
      body: 'a,b,c\n1,2,3\n',
    })

    expect(clicks).toHaveLength(1)
    expect(clicks[0].download).toBe('example.csv')
    expect(clicks[0].href).toContain('blob:mock-url')
  })

  it('wraps a string body in a Blob with the given mime', () => {
    let captured: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      (obj: Blob | MediaSource) => {
        if (obj instanceof Blob) captured = obj
        return 'blob:mock-url'
      },
    )
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') (el as HTMLAnchorElement).click = vi.fn()
      return el
    })

    downloadFile({ filename: 'x.csv', mime: 'text/csv', body: 'hello' })

    expect(captured).toBeInstanceOf(Blob)
    expect(captured!.type).toBe('text/csv')
  })

  it('accepts a Blob body unchanged (no re-wrap)', () => {
    const blob = new Blob(['payload'], { type: 'application/json' })
    let captured: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      (obj: Blob | MediaSource) => {
        if (obj instanceof Blob) captured = obj
        return 'blob:mock-url'
      },
    )
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') (el as HTMLAnchorElement).click = vi.fn()
      return el
    })

    downloadFile({ filename: 'b.json', mime: 'application/json', body: blob })

    expect(captured).toBe(blob)
  })

  it('removes the anchor from the DOM after click', () => {
    const appended: HTMLElement[] = []
    const removed: HTMLElement[] = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        const a = el as HTMLAnchorElement
        a.click = vi.fn()
        const originalRemove = a.remove.bind(a)
        a.remove = () => {
          removed.push(a)
          originalRemove()
        }
      }
      return el
    })
    const originalAppend = document.body.appendChild.bind(document.body)
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((node: any) => {
        appended.push(node)
        return originalAppend(node)
      }) as typeof document.body.appendChild,
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    downloadFile({ filename: 'r.csv', mime: 'text/csv', body: 'x' })

    expect(appended).toHaveLength(1)
    expect(removed).toHaveLength(1)
    expect(removed[0]).toBe(appended[0])
    // Belt-and-braces: not in the live DOM after the call returns.
    expect(document.body.contains(removed[0])).toBe(false)
  })

  it('schedules URL.revokeObjectURL via the injected scheduleRevoke with the same URL', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:scheduled-url')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      () => {},
    )
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') (el as HTMLAnchorElement).click = vi.fn()
      return el
    })

    const scheduled: Array<() => void> = []
    downloadFile(
      { filename: 's.csv', mime: 'text/csv', body: 'x' },
      { scheduleRevoke: (fn) => scheduled.push(fn) },
    )

    // Revoke must NOT have fired yet — it's deferred.
    expect(revokeSpy).not.toHaveBeenCalled()
    expect(scheduled).toHaveLength(1)

    scheduled[0]()
    expect(revokeSpy).toHaveBeenCalledTimes(1)
    expect(revokeSpy).toHaveBeenCalledWith('blob:scheduled-url')
  })

  it('uses an injected document + url seam without touching the live DOM', () => {
    const fakeAnchor = {
      href: '',
      download: '',
      hidden: false,
      click: vi.fn(),
      remove: vi.fn(),
    }
    const appended: unknown[] = []
    const fakeDoc = {
      createElement: vi.fn((tag: string) => {
        if (tag !== 'a') throw new Error(`unexpected tag: ${tag}`)
        return fakeAnchor
      }),
      body: {
        appendChild: vi.fn((node: unknown) => {
          appended.push(node)
          return node
        }),
      },
    } as unknown as Document
    const fakeUrl = {
      createObjectURL: vi.fn(() => 'blob:injected-url'),
      revokeObjectURL: vi.fn(),
    }

    // Spy on the live DOM too — confirms it was NOT touched.
    const liveCreate = vi.spyOn(document, 'createElement')
    const liveCreateUrl = vi.spyOn(URL, 'createObjectURL')

    downloadFile(
      { filename: 'inj.csv', mime: 'text/csv', body: 'hello' },
      {
        document: fakeDoc,
        url: fakeUrl,
        scheduleRevoke: (fn) => fn(),
      },
    )

    expect(fakeDoc.createElement).toHaveBeenCalledWith('a')
    expect(fakeUrl.createObjectURL).toHaveBeenCalledTimes(1)
    expect(fakeAnchor.click).toHaveBeenCalledTimes(1)
    expect(fakeAnchor.remove).toHaveBeenCalledTimes(1)
    expect(fakeAnchor.download).toBe('inj.csv')
    expect(fakeAnchor.href).toBe('blob:injected-url')
    expect(appended).toEqual([fakeAnchor])
    expect(fakeUrl.revokeObjectURL).toHaveBeenCalledWith('blob:injected-url')

    // Live DOM untouched.
    expect(liveCreate).not.toHaveBeenCalled()
    expect(liveCreateUrl).not.toHaveBeenCalled()
  })
})
