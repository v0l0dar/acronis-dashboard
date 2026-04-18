import { describe, it, expect } from 'vitest'
import {
  sanitizeInput,
  sanitizeSearchQuery,
  sanitizeNumericInput,
  isValidDealStatus,
  filterDealsByRole,
  isValidDealId,
} from './security'
import type { Deal } from '../types'

describe('sanitizeInput', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(42)).toBe('')
    expect(sanitizeInput(null)).toBe('')
    expect(sanitizeInput(undefined)).toBe('')
    expect(sanitizeInput({})).toBe('')
  })

  it('strips null bytes', () => {
    expect(sanitizeInput('hello\0world')).toBe('helloworld')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('truncates to 1000 characters', () => {
    const long = 'a'.repeat(1500)
    expect(sanitizeInput(long)).toHaveLength(1000)
  })

  it('returns an empty string for an empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })
})

describe('sanitizeSearchQuery', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeSearchQuery(123)).toBe('')
    expect(sanitizeSearchQuery(null)).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeSearchQuery('  query  ')).toBe('query')
  })

  it('collapses internal whitespace runs to single space', () => {
    expect(sanitizeSearchQuery('hello   world')).toBe('hello world')
  })

  it('truncates to 200 characters', () => {
    const long = 'x'.repeat(300)
    expect(sanitizeSearchQuery(long)).toHaveLength(200)
  })
})

describe('sanitizeNumericInput', () => {
  it('returns null for NaN input', () => {
    expect(sanitizeNumericInput('abc')).toBeNull()
    expect(sanitizeNumericInput(undefined)).toBeNull()
  })

  it('treats null as 0 (Number(null) === 0) and clamps to minimum', () => {
    expect(sanitizeNumericInput(null)).toBe(0)
  })

  it('returns the number when within default bounds', () => {
    expect(sanitizeNumericInput(500)).toBe(500)
  })

  it('clamps to the minimum', () => {
    expect(sanitizeNumericInput(-5, 0, 100)).toBe(0)
  })

  it('clamps to the maximum', () => {
    expect(sanitizeNumericInput(200, 0, 100)).toBe(100)
  })

  it('returns min when value equals min', () => {
    expect(sanitizeNumericInput(0, 0, 100)).toBe(0)
  })

  it('parses numeric strings', () => {
    expect(sanitizeNumericInput('42', 0, 100)).toBe(42)
  })
})

describe('isValidDealStatus', () => {
  it('accepts valid statuses', () => {
    expect(isValidDealStatus('Open')).toBe(true)
    expect(isValidDealStatus('Approved')).toBe(true)
    expect(isValidDealStatus('Rejected')).toBe(true)
  })

  it('rejects unknown statuses', () => {
    expect(isValidDealStatus('Pending')).toBe(false)
    expect(isValidDealStatus('open')).toBe(false)
    expect(isValidDealStatus('')).toBe(false)
  })
})

describe('filterDealsByRole', () => {
  const makeDeal = (assignedTo: string): Pick<Deal, 'assignedTo'> & { dealId: string } => ({
    dealId: 'DEAL-0001',
    assignedTo,
  })

  const deals = [
    makeDeal('partner-1'),
    makeDeal('partner-2'),
    makeDeal('partner-1'),
  ]

  it('returns all deals for admin role', () => {
    const result = filterDealsByRole(deals, 'admin')
    expect(result).toHaveLength(3)
  })

  it('returns only partner-owned deals for partner role', () => {
    const result = filterDealsByRole(deals, 'partner', 'partner-1')
    expect(result).toHaveLength(2)
    expect(result.every((d) => d.assignedTo === 'partner-1')).toBe(true)
  })

  it('returns empty array for unknown role', () => {
    expect(filterDealsByRole(deals, 'guest')).toHaveLength(0)
  })

  it('uses partner-1 as default partnerId', () => {
    const result = filterDealsByRole(deals, 'partner')
    expect(result).toHaveLength(2)
  })
})

describe('isValidDealId', () => {
  it('accepts DEAL- followed by 4-6 digits', () => {
    expect(isValidDealId('DEAL-0001')).toBe(true)
    expect(isValidDealId('DEAL-12345')).toBe(true)
    expect(isValidDealId('DEAL-999999')).toBe(true)
  })

  it('rejects ids with fewer than 4 digits', () => {
    expect(isValidDealId('DEAL-123')).toBe(false)
  })

  it('rejects ids with more than 6 digits', () => {
    expect(isValidDealId('DEAL-1234567')).toBe(false)
  })

  it('rejects ids without the DEAL- prefix', () => {
    expect(isValidDealId('0001')).toBe(false)
    expect(isValidDealId('deal-0001')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidDealId(1234)).toBe(false)
    expect(isValidDealId(null)).toBe(false)
  })
})
