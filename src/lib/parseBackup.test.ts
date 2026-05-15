import { describe, it, expect } from 'vitest'
import { parseBackup, BackupParseError } from './parseBackup'
import { BACKUP_SCHEMA_VERSION, type BackupSnapshot } from './backup'

const validSnapshot: BackupSnapshot = {
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2026-05-15T10:00:00.000Z',
  expenses: [
    { id: 'e1', amount: 10, description: 'Coffee', date: '2026-05-15' },
  ],
  categories: [{ id: 'c1', name: 'Food', color: '#ff0000' }],
  monthlyBudgets: [{ month: '2026-05', amount: 500 }],
  recurringTemplates: [
    {
      id: 't1',
      description: 'Rent',
      amount: 1200,
      dayOfMonth: 1,
      frequency: 'monthly',
    },
  ],
}

describe('parseBackup', () => {
  it('returns the snapshot deep-equal to input for a valid JSON string', () => {
    const text = JSON.stringify(validSnapshot)
    const parsed = parseBackup(text)
    expect(parsed).toEqual(validSnapshot)
  })

  it('throws BackupParseError with reason "invalid-json" on syntactically bad JSON', () => {
    try {
      parseBackup('not json')
      throw new Error('expected parseBackup to throw')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('invalid-json')
    }
  })

  it('throws "invalid-shape" when a required top-level array is missing', () => {
    const broken = { ...validSnapshot } as Record<string, unknown>
    delete broken.categories
    try {
      parseBackup(JSON.stringify(broken))
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('invalid-shape')
    }
  })

  it('throws "invalid-shape" when a top-level array field has the wrong type', () => {
    const broken = { ...validSnapshot, expenses: { not: 'an array' } }
    try {
      parseBackup(JSON.stringify(broken))
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('invalid-shape')
    }
  })

  it('throws "unsupported-schema-version" when schemaVersion differs', () => {
    const broken = { ...validSnapshot, schemaVersion: 999 }
    try {
      parseBackup(JSON.stringify(broken))
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('unsupported-schema-version')
    }
  })

  it('throws "invalid-shape" when schemaVersion is missing entirely', () => {
    const broken = { ...validSnapshot } as Record<string, unknown>
    delete broken.schemaVersion
    try {
      parseBackup(JSON.stringify(broken))
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('invalid-shape')
    }
  })

  it('throws "invalid-shape" when exportedAt is not a string', () => {
    const broken = { ...validSnapshot, exportedAt: 12345 }
    try {
      parseBackup(JSON.stringify(broken))
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('invalid-shape')
    }
  })

  it('throws "invalid-shape" when the parsed value is not an object (e.g. an array)', () => {
    try {
      parseBackup(JSON.stringify([1, 2, 3]))
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BackupParseError)
      expect((e as BackupParseError).reason).toBe('invalid-shape')
    }
  })
})
