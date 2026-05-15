import { describe, it, expect } from 'vitest'
import {
  currentMonth,
  monthOf,
  prevMonth,
  nextMonth,
  formatMonthLabel,
  isoDateToday,
} from './month'

describe('currentMonth', () => {
  it('returns a YYYY-MM string', () => {
    expect(currentMonth()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
  })
})

describe('monthOf', () => {
  it('extracts the YYYY-MM prefix from a YYYY-MM-DD date', () => {
    expect(monthOf('2026-05-15')).toBe('2026-05')
  })
  it('extracts month 01 correctly', () => {
    expect(monthOf('2026-01-01')).toBe('2026-01')
  })
})

describe('prevMonth', () => {
  it('rolls back within a year', () => {
    expect(prevMonth('2026-05')).toBe('2026-04')
  })
  it('rolls back across a year boundary (Jan → Dec previous year)', () => {
    expect(prevMonth('2026-01')).toBe('2025-12')
  })
})

describe('nextMonth', () => {
  it('rolls forward within a year', () => {
    expect(nextMonth('2026-05')).toBe('2026-06')
  })
  it('rolls forward across a year boundary (Dec → Jan next year)', () => {
    expect(nextMonth('2026-12')).toBe('2027-01')
  })
})

describe('formatMonthLabel', () => {
  it('formats a month as "Month YYYY"', () => {
    expect(formatMonthLabel('2026-05')).toBe('May 2026')
  })
  it('formats January correctly', () => {
    expect(formatMonthLabel('2026-01')).toBe('January 2026')
  })
})

describe('isoDateToday', () => {
  it('returns a zero-padded YYYY-MM-DD string', () => {
    // Single-digit month + day must be padded.
    expect(isoDateToday(new Date(Date.UTC(2026, 0, 5, 12, 0, 0)))).toBe(
      '2026-01-05',
    )
  })

  it('uses UTC accessors so the value is timezone-independent', () => {
    // 23:30 UTC on Jan 1 — would roll back to Dec 31 in many western zones if
    // local accessors were used; the helper must still return 2026-01-01.
    expect(isoDateToday(new Date('2026-01-01T23:30:00Z'))).toBe('2026-01-01')
    // 00:30 UTC on Jan 1 — would roll forward to Jan 1 in eastern zones; the
    // helper still anchors on UTC.
    expect(isoDateToday(new Date('2026-01-01T00:30:00Z'))).toBe('2026-01-01')
  })

  it('defaults to a real Date when called with no arg', () => {
    expect(isoDateToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
