import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  useParsedFileImporter,
  type ParserResult,
  type BulkImportResult,
} from './useParsedFileImporter'

interface FakeRow {
  amount: number
}

// Reusable parse() that returns whatever the caller wires.
function makeParser(
  result: ParserResult<FakeRow>,
): (text: string) => ParserResult<FakeRow> {
  return () => result
}

describe('useParsedFileImporter', () => {
  it('successful parse + import: summary "Imported X. Skipped 0." and no rowErrors', async () => {
    const parse = makeParser({ rows: [{ amount: 10 }], errors: [] })
    const importFn = vi
      .fn<(rows: FakeRow[]) => Promise<BulkImportResult>>()
      .mockResolvedValue({ added: 1, skipped: 0, errors: [] })

    const { result } = renderHook(() =>
      useParsedFileImporter<FakeRow>({ parse, importFn }),
    )

    await act(async () => {
      await result.current.onFile('text-content')
    })

    expect(importFn).toHaveBeenCalledWith([{ amount: 10 }])
    expect(result.current.headerError).toBe('')
    expect(result.current.summary).toBe('Imported 1. Skipped 0.')
    expect(result.current.rowErrors).toEqual([])
  })

  it('header error (row 0): sets headerError and does NOT call importFn', async () => {
    const parse = makeParser({
      rows: [],
      errors: [{ row: 0, message: 'Invalid or missing header' }],
    })
    const importFn = vi
      .fn<(rows: FakeRow[]) => Promise<BulkImportResult>>()
      .mockResolvedValue({ added: 0, skipped: 0, errors: [] })

    const { result } = renderHook(() =>
      useParsedFileImporter<FakeRow>({ parse, importFn }),
    )

    await act(async () => {
      await result.current.onFile('bad-header')
    })

    expect(importFn).not.toHaveBeenCalled()
    expect(result.current.headerError).toBe('Invalid or missing header')
    expect(result.current.summary).toBe('')
    expect(result.current.rowErrors).toEqual([])
  })

  it('empty rows + no errors: summary "Imported 0. Skipped 0."', async () => {
    const parse = makeParser({ rows: [], errors: [] })
    const importFn = vi
      .fn<(rows: FakeRow[]) => Promise<BulkImportResult>>()
      .mockResolvedValue({ added: 0, skipped: 0, errors: [] })

    const { result } = renderHook(() =>
      useParsedFileImporter<FakeRow>({ parse, importFn }),
    )

    await act(async () => {
      await result.current.onFile('header-only')
    })

    expect(importFn).toHaveBeenCalledWith([])
    expect(result.current.headerError).toBe('')
    expect(result.current.summary).toBe('Imported 0. Skipped 0.')
    expect(result.current.rowErrors).toEqual([])
  })

  it('mixed: parse errors + import errors compose into summary + Row N: rowErrors', async () => {
    const parse = makeParser({
      rows: [{ amount: 10 }],
      errors: [{ row: 3, message: 'Invalid amount: x' }],
    })
    const importFn = vi
      .fn<(rows: FakeRow[]) => Promise<BulkImportResult>>()
      .mockResolvedValue({
        added: 1,
        skipped: 1,
        errors: ['persistence failure for thing'],
      })

    const { result } = renderHook(() =>
      useParsedFileImporter<FakeRow>({ parse, importFn }),
    )

    await act(async () => {
      await result.current.onFile('mixed')
    })

    // 1 parse skip + 1 importFn skip = 2 skipped
    expect(result.current.summary).toBe('Imported 1. Skipped 2.')
    expect(result.current.rowErrors).toEqual([
      'Row 3: Invalid amount: x',
      'persistence failure for thing',
    ])
    expect(result.current.headerError).toBe('')
  })

  it('reset() clears headerError, summary, and rowErrors', async () => {
    const parse = makeParser({
      rows: [{ amount: 10 }],
      errors: [{ row: 2, message: 'oops' }],
    })
    const importFn = vi
      .fn<(rows: FakeRow[]) => Promise<BulkImportResult>>()
      .mockResolvedValue({ added: 1, skipped: 0, errors: ['boom'] })

    const { result } = renderHook(() =>
      useParsedFileImporter<FakeRow>({ parse, importFn }),
    )

    await act(async () => {
      await result.current.onFile('first')
    })
    expect(result.current.summary).not.toBe('')
    expect(result.current.rowErrors.length).toBeGreaterThan(0)

    act(() => {
      result.current.reset()
    })

    expect(result.current.headerError).toBe('')
    expect(result.current.summary).toBe('')
    expect(result.current.rowErrors).toEqual([])
  })
})
