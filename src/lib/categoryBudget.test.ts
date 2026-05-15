import { describe, it, expect } from 'vitest'
import {
  categoryBudgetId,
  createCategoryBudget,
} from './categoryBudget'

describe('categoryBudgetId', () => {
  it('joins month and categoryId with a pipe', () => {
    expect(categoryBudgetId('2026-05', 'cat-abc')).toBe('2026-05|cat-abc')
  })

  it('is deterministic — same inputs produce same id', () => {
    expect(categoryBudgetId('2026-12', 'x')).toBe(categoryBudgetId('2026-12', 'x'))
  })
})

describe('createCategoryBudget', () => {
  it('returns a valid CategoryBudget with composite id', () => {
    const row = createCategoryBudget({
      month: '2026-05',
      categoryId: 'cat-abc',
      amount: 100,
    })
    expect(row).toEqual({
      id: '2026-05|cat-abc',
      month: '2026-05',
      categoryId: 'cat-abc',
      amount: 100,
    })
  })

  it('throws on a malformed month', () => {
    expect(() =>
      createCategoryBudget({
        month: '26-05',
        categoryId: 'cat',
        amount: 100,
      }),
    ).toThrow(/month/i)
  })

  it('throws on a month with a bad month component (e.g. 13)', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-13',
        categoryId: 'cat',
        amount: 100,
      }),
    ).toThrow(/month/i)
  })

  it('throws on an empty categoryId', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-05',
        categoryId: '',
        amount: 100,
      }),
    ).toThrow(/categoryId/i)
  })

  it('throws on a whitespace-only categoryId', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-05',
        categoryId: '   ',
        amount: 100,
      }),
    ).toThrow(/categoryId/i)
  })

  it('throws on amount = 0', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-05',
        categoryId: 'cat',
        amount: 0,
      }),
    ).toThrow(/amount/i)
  })

  it('throws on negative amount', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-05',
        categoryId: 'cat',
        amount: -1,
      }),
    ).toThrow(/amount/i)
  })

  it('throws on NaN amount', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-05',
        categoryId: 'cat',
        amount: Number.NaN,
      }),
    ).toThrow(/amount/i)
  })

  it('throws on Infinity amount', () => {
    expect(() =>
      createCategoryBudget({
        month: '2026-05',
        categoryId: 'cat',
        amount: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(/amount/i)
  })
})
