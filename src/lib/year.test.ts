import { describe, it, expect } from 'vitest'
import {
  currentYear,
  parseYear,
  prevYear,
  nextYear,
  formatYearLabel,
} from './year'

describe('currentYear', () => {
  it('returns a YYYY string', () => {
    expect(currentYear()).toMatch(/^\d{4}$/)
  })
})

describe('parseYear', () => {
  it('returns the numeric value for a valid year', () => {
    expect(parseYear('2026')).toBe(2026)
  })
  it('throws on a non-4-digit string', () => {
    expect(() => parseYear('26')).toThrow()
  })
  it('throws on garbage', () => {
    expect(() => parseYear('bad-year')).toThrow()
  })
})

describe('prevYear', () => {
  it('subtracts one', () => {
    expect(prevYear('2026')).toBe('2025')
  })
})

describe('nextYear', () => {
  it('adds one', () => {
    expect(nextYear('2026')).toBe('2027')
  })
})

describe('formatYearLabel', () => {
  it('passes through the year string', () => {
    expect(formatYearLabel('2026')).toBe('2026')
  })
})
