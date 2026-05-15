import { describe, it, expect } from 'vitest'
import {
  currentMonth,
  monthOf,
  prevMonth,
  nextMonth,
  formatMonthLabel,
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
