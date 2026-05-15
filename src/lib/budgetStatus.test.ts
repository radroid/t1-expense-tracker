import { describe, expect, it } from 'vitest'
import { computeBudgetStatus } from './budgetStatus'

describe('computeBudgetStatus', () => {
  it('no-budget (undefined) → hasBudget false, ratio 0, isOver false', () => {
    const status = computeBudgetStatus(undefined, 25)
    expect(status.hasBudget).toBe(false)
    expect(status.budget).toBe(0)
    expect(status.actual).toBe(25)
    expect(status.ratio).toBe(0)
    expect(status.isOver).toBe(false)
  })

  it('no-budget (zero amount) → hasBudget false, isOver false', () => {
    const status = computeBudgetStatus(0, 50)
    expect(status.hasBudget).toBe(false)
    expect(status.ratio).toBe(0)
    expect(status.isOver).toBe(false)
  })

  it('under-budget → ratio < 1, positive remaining, not over', () => {
    const status = computeBudgetStatus(100, 40)
    expect(status.hasBudget).toBe(true)
    expect(status.budget).toBe(100)
    expect(status.actual).toBe(40)
    expect(status.ratio).toBeCloseTo(0.4)
    expect(status.remaining).toBe(60)
    expect(status.isOver).toBe(false)
  })

  it('exact-budget → ratio 1, remaining 0, not over', () => {
    const status = computeBudgetStatus(100, 100)
    expect(status.ratio).toBe(1)
    expect(status.remaining).toBe(0)
    expect(status.isOver).toBe(false)
  })

  it('over-budget → ratio > 1, negative remaining, isOver true', () => {
    const status = computeBudgetStatus(100, 150)
    expect(status.ratio).toBeCloseTo(1.5)
    expect(status.remaining).toBe(-50)
    expect(status.isOver).toBe(true)
  })

  it('zero actual against a real budget → ratio 0, full remaining, not over', () => {
    const status = computeBudgetStatus(100, 0)
    expect(status.hasBudget).toBe(true)
    expect(status.ratio).toBe(0)
    expect(status.remaining).toBe(100)
    expect(status.isOver).toBe(false)
  })

  it('fractional amounts compute precisely', () => {
    const status = computeBudgetStatus(33.33, 11.11)
    expect(status.ratio).toBeCloseTo(11.11 / 33.33)
    expect(status.remaining).toBeCloseTo(22.22)
    expect(status.isOver).toBe(false)
  })
})
