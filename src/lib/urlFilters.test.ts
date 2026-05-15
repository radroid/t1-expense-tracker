import { describe, it, expect } from 'vitest'
import { serializeFilters, parseFilters, type FilterState } from './urlFilters'

describe('serializeFilters', () => {
  it('emits only month for all-default state', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: '',
      dateRange: null,
    }
    expect(serializeFilters(state)).toBe('month=2026-05')
  })

  it('emits cat when filter is a category id', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'cat-123',
      searchTerm: '',
      dateRange: null,
    }
    expect(serializeFilters(state)).toBe('month=2026-05&cat=cat-123')
  })

  it("emits cat=uncategorized literally", () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'uncategorized',
      searchTerm: '',
      dateRange: null,
    }
    expect(serializeFilters(state)).toBe('month=2026-05&cat=uncategorized')
  })

  it('emits q when searchTerm is non-empty', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: 'lunch',
      dateRange: null,
    }
    expect(serializeFilters(state)).toBe('month=2026-05&q=lunch')
  })

  it('encodes spaces in searchTerm using URLSearchParams (+ for space)', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: 'lunch food',
      dateRange: null,
    }
    // URLSearchParams.toString() encodes space as '+'
    expect(serializeFilters(state)).toBe('month=2026-05&q=lunch+food')
  })

  it('emits both from and to when full dateRange is set', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: '',
      dateRange: { from: '2026-05-01', to: '2026-05-15' },
    }
    expect(serializeFilters(state)).toBe(
      'month=2026-05&from=2026-05-01&to=2026-05-15',
    )
  })

  it('emits only from when to is empty', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: '',
      dateRange: { from: '2026-05-01', to: '' },
    }
    expect(serializeFilters(state)).toBe('month=2026-05&from=2026-05-01')
  })

  it('emits only to when from is empty', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: '',
      dateRange: { from: '', to: '2026-05-15' },
    }
    expect(serializeFilters(state)).toBe('month=2026-05&to=2026-05-15')
  })

  it('omits dateRange entirely when both sides are empty strings', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: '',
      dateRange: { from: '', to: '' },
    }
    expect(serializeFilters(state)).toBe('month=2026-05')
  })

  it('properly encodes special characters in searchTerm (& = #)', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: 'a&b=c#d',
      dateRange: null,
    }
    const out = serializeFilters(state)
    // The raw special chars must not appear unescaped as separators
    // Decoding the q param must restore the original value.
    const params = new URLSearchParams(out)
    expect(params.get('q')).toBe('a&b=c#d')
    expect(params.get('month')).toBe('2026-05')
  })

  it('returns empty string when selectedMonth is empty (lib is pure)', () => {
    const state: FilterState = {
      selectedMonth: '',
      filter: 'all',
      searchTerm: '',
      dateRange: null,
    }
    expect(serializeFilters(state)).toBe('')
  })

  it('combines all fields in stable key order', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'cat-9',
      searchTerm: 'hi',
      dateRange: { from: '2026-05-01', to: '2026-05-15' },
    }
    expect(serializeFilters(state)).toBe(
      'month=2026-05&cat=cat-9&q=hi&from=2026-05-01&to=2026-05-15',
    )
  })
})

describe('parseFilters', () => {
  it('parses month only', () => {
    expect(parseFilters('month=2026-05')).toEqual({ selectedMonth: '2026-05' })
  })

  it('parses month and cat', () => {
    expect(parseFilters('month=2026-05&cat=foo')).toEqual({
      selectedMonth: '2026-05',
      filter: 'foo',
    })
  })

  it("parses cat=all literally", () => {
    expect(parseFilters('cat=all')).toEqual({ filter: 'all' })
  })

  it('decodes q with %20 spaces', () => {
    expect(parseFilters('q=lunch%20food')).toEqual({ searchTerm: 'lunch food' })
  })

  it('decodes q with + spaces (URLSearchParams default encoding)', () => {
    expect(parseFilters('q=lunch+food')).toEqual({ searchTerm: 'lunch food' })
  })

  it('parses full date range', () => {
    expect(parseFilters('from=2026-05-01&to=2026-05-15')).toEqual({
      dateRange: { from: '2026-05-01', to: '2026-05-15' },
    })
  })

  it('parses from-only into a dateRange with empty to', () => {
    expect(parseFilters('from=2026-05-01')).toEqual({
      dateRange: { from: '2026-05-01', to: '' },
    })
  })

  it('parses to-only into a dateRange with empty from', () => {
    expect(parseFilters('to=2026-05-15')).toEqual({
      dateRange: { from: '', to: '2026-05-15' },
    })
  })

  it('silently drops invalid month', () => {
    expect(parseFilters('month=not-a-month')).toEqual({})
  })

  it('silently drops invalid month but keeps valid cat', () => {
    expect(parseFilters('month=nope&cat=foo')).toEqual({ filter: 'foo' })
  })

  it('drops invalid from but keeps valid to', () => {
    expect(parseFilters('from=2026/05/01&to=2026-05-15')).toEqual({
      dateRange: { from: '', to: '2026-05-15' },
    })
  })

  it('drops both invalid sides — no dateRange in result', () => {
    expect(parseFilters('from=2026/05/01&to=nope')).toEqual({})
  })

  it('returns empty object on empty hash', () => {
    expect(parseFilters('')).toEqual({})
  })

  it('returns empty object on completely unrecognized hash', () => {
    expect(parseFilters('foo=bar&baz=qux')).toEqual({})
  })

  it('round-trips a representative full state', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'cat-123',
      searchTerm: 'coffee',
      dateRange: { from: '2026-05-01', to: '2026-05-15' },
    }
    expect(parseFilters(serializeFilters(state))).toEqual(state)
  })

  it('round-trips minimal state (month only)', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: '',
      dateRange: null,
    }
    // parseFilters returns only fields present in the hash; for the
    // all-default case that's just selectedMonth.
    expect(parseFilters(serializeFilters(state))).toEqual({
      selectedMonth: '2026-05',
    })
  })

  it('round-trips searchTerm with special characters', () => {
    const state: FilterState = {
      selectedMonth: '2026-05',
      filter: 'all',
      searchTerm: 'a&b=c#d e',
      dateRange: null,
    }
    const parsed = parseFilters(serializeFilters(state))
    expect(parsed.searchTerm).toBe('a&b=c#d e')
    expect(parsed.selectedMonth).toBe('2026-05')
  })

  it('ignores a leading "#" tolerantly is NOT supported — caller strips it', () => {
    // Documenting the contract: the caller passes the hash without
    // the leading "#". If they pass it with "#", the first key is
    // garbage; we just silently get nothing useful.
    const result = parseFilters('#month=2026-05')
    // The "#" becomes part of the first key, so month is not parsed.
    expect(result.selectedMonth).toBeUndefined()
  })
})
