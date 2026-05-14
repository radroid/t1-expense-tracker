import { describe, expect, it } from 'vitest'
import { createCategory, DEFAULT_CATEGORIES } from './category'

describe('createCategory', () => {
  it('creates a valid category', () => {
    const c = createCategory({ name: 'Food', color: '#ff0000' })
    expect(c.name).toBe('Food')
    expect(c.color).toBe('#ff0000')
    expect(typeof c.id).toBe('string')
    expect(c.id.length).toBeGreaterThan(0)
  })

  it('trims the name', () => {
    const c = createCategory({ name: '  Transport  ', color: '#00ff00' })
    expect(c.name).toBe('Transport')
  })

  it('accepts uppercase hex colors and preserves case', () => {
    const c = createCategory({ name: 'Food', color: '#AbCdEf' })
    expect(c.color).toBe('#AbCdEf')
  })

  it('throws on blank name', () => {
    expect(() => createCategory({ name: '', color: '#ff0000' })).toThrow(
      'Invalid name: must be non-empty',
    )
  })

  it('throws on whitespace-only name', () => {
    expect(() => createCategory({ name: '   ', color: '#ff0000' })).toThrow(
      'Invalid name: must be non-empty',
    )
  })

  it('throws on color missing #', () => {
    expect(() => createCategory({ name: 'Food', color: 'ff0000' })).toThrow(
      'Invalid color: must be a hex color like #rrggbb',
    )
  })

  it('throws on color of wrong length', () => {
    expect(() => createCategory({ name: 'Food', color: '#fff' })).toThrow(
      'Invalid color: must be a hex color like #rrggbb',
    )
  })

  it('throws on non-hex color', () => {
    expect(() => createCategory({ name: 'Food', color: '#gggggg' })).toThrow(
      'Invalid color: must be a hex color like #rrggbb',
    )
  })

  it('generates unique ids', () => {
    const a = createCategory({ name: 'Food', color: '#ff0000' })
    const b = createCategory({ name: 'Food', color: '#ff0000' })
    expect(a.id).not.toBe(b.id)
  })
})

describe('DEFAULT_CATEGORIES', () => {
  it('is non-empty', () => {
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(0)
  })

  it('every entry passes createCategory', () => {
    for (const input of DEFAULT_CATEGORIES) {
      expect(() => createCategory(input)).not.toThrow()
    }
  })
})
