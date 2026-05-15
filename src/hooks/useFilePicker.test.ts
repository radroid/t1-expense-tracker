import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFilePicker } from './useFilePicker'

// Small helper to fabricate a synthetic ChangeEvent for the hook's onChange.
// We can't use userEvent here because the hook is tested in isolation (no
// DOM-rendered <input>) — we drive it via the public onChange handler with
// a real <input> attached as ref + target.
function makeChangeEvent(input: HTMLInputElement, file: File | null) {
  // jsdom does NOT let you set `files` on an HTMLInputElement directly
  // (the setter is missing). Define it as an own property so the event
  // target shape matches what the hook reads.
  Object.defineProperty(input, 'files', {
    value: file === null ? null : [file],
    configurable: true,
  })
  return {
    target: input,
    currentTarget: input,
  } as unknown as React.ChangeEvent<HTMLInputElement>
}

function fileFromText(text: string, name = 'data.txt'): File {
  return new File([text], name, { type: 'text/plain' })
}

describe('useFilePicker', () => {
  it('calls onFile with the file text content when a file is picked', async () => {
    const onFile = vi.fn<(text: string, file: File) => Promise<void>>(
      async () => {},
    )
    const { result } = renderHook(() => useFilePicker({ onFile }))

    const input = document.createElement('input')
    input.type = 'file'
    // Mirror what attaching the ref would do at render time.
    ;(result.current.inputRef as { current: HTMLInputElement | null }).current =
      input

    const file = fileFromText('hello,world')
    const event = makeChangeEvent(input, file)

    await act(async () => {
      await result.current.onChange(event)
    })

    expect(onFile).toHaveBeenCalledTimes(1)
    expect(onFile.mock.calls[0][0]).toBe('hello,world')
  })

  it('resets input.value BEFORE the onFile callback resolves', async () => {
    // Use a deferred promise so we can observe input.value at the moment
    // onFile is running. The contract: by the time onFile is invoked,
    // the input has already been cleared, so a subsequent identical
    // file-pick re-fires the change event.
    let valueAtCallTime: string | undefined
    let resolveOnFile: () => void = () => {}
    const onFilePromise = new Promise<void>((res) => {
      resolveOnFile = res
    })

    const input = document.createElement('input')
    input.type = 'file'
    input.value = '' // jsdom doesn't actually let us set non-empty values
    // We instead spy on the assignment: track what the hook writes.
    let cleared = false
    Object.defineProperty(input, 'value', {
      get() {
        return cleared ? '' : 'unread'
      },
      set() {
        cleared = true
      },
      configurable: true,
    })

    const onFile = vi.fn<(text: string, file: File) => Promise<void>>(
      async () => {
        valueAtCallTime = input.value
        await onFilePromise
      },
    )

    const { result } = renderHook(() => useFilePicker({ onFile }))
    ;(result.current.inputRef as { current: HTMLInputElement | null }).current =
      input

    const event = makeChangeEvent(input, fileFromText('x'))

    let outerDone: Promise<void> | void = undefined
    act(() => {
      outerDone = result.current.onChange(event) as unknown as Promise<void>
    })

    // Resolve the in-flight onFile so the outer onChange settles.
    resolveOnFile()
    await act(async () => {
      await outerDone
    })

    // At the moment onFile ran, input.value had already been cleared.
    expect(valueAtCallTime).toBe('')
  })

  it('passes the original File object as the second argument to onFile', async () => {
    const onFile = vi.fn<(text: string, file: File) => Promise<void>>(
      async () => {},
    )
    const { result } = renderHook(() => useFilePicker({ onFile }))

    const input = document.createElement('input')
    input.type = 'file'
    ;(result.current.inputRef as { current: HTMLInputElement | null }).current =
      input

    const file = fileFromText('abc', 'thing.txt')
    const event = makeChangeEvent(input, file)

    await act(async () => {
      await result.current.onChange(event)
    })

    expect(onFile.mock.calls[0][1]).toBe(file)
  })

  it('no-ops when the user cancels the file picker (no file)', async () => {
    const onFile = vi.fn<(text: string, file: File) => Promise<void>>(
      async () => {},
    )
    const { result } = renderHook(() => useFilePicker({ onFile }))

    const input = document.createElement('input')
    input.type = 'file'
    ;(result.current.inputRef as { current: HTMLInputElement | null }).current =
      input

    const event = makeChangeEvent(input, null)

    await act(async () => {
      await result.current.onChange(event)
    })

    expect(onFile).not.toHaveBeenCalled()
  })
})
