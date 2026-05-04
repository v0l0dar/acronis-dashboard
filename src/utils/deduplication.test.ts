import { describe, it, expect } from 'vitest'
import { deduplicateDeals, mergeAndDeduplicate } from './deduplication'
import type { Deal } from '../types'

function makeDeal(overrides: Partial<Deal> & { dealId: string }): Deal {
  return {
    dealName: 'Test Deal',
    accountName: 'Acme',
    status: 'Open',
    amount: 1000,
    currency: 'EUR',
    createdDate: '2024-01-01',
    updatedDate: '2024-01-01',
    assignedTo: 'partner-1',
    description: '',
    contactEmail: 'test@acme.com',
    contactName: 'Test User',
    notes: '',
    ...overrides,
  }
}

describe('deduplicateDeals', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateDeals([])).toEqual([])
  })

  it('returns empty array for non-array input', () => {
    expect(deduplicateDeals(null as unknown as Deal[])).toEqual([])
    expect(deduplicateDeals('bad' as unknown as Deal[])).toEqual([])
  })

  it('skips entries without a valid dealId', () => {
    const bad = { dealName: 'No ID', updatedDate: '2024-01-01' } as unknown as Deal
    const good = makeDeal({ dealId: 'DEAL-0001' })
    expect(deduplicateDeals([bad, good])).toHaveLength(1)
  })

  it('keeps unique deals as-is', () => {
    const a = makeDeal({ dealId: 'DEAL-0001' })
    const b = makeDeal({ dealId: 'DEAL-0002' })
    expect(deduplicateDeals([a, b])).toHaveLength(2)
  })

  it('retains the newer entry when the same dealId appears twice', () => {
    const older = makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-01-01', dealName: 'Old' })
    const newer = makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-06-01', dealName: 'New' })
    const result = deduplicateDeals([older, newer])
    expect(result).toHaveLength(1)
    expect(result[0].dealName).toBe('New')
  })

  it('retains the newer entry regardless of input order', () => {
    const older = makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-01-01', dealName: 'Old' })
    const newer = makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-06-01', dealName: 'New' })
    const result = deduplicateDeals([newer, older])
    expect(result).toHaveLength(1)
    expect(result[0].dealName).toBe('New')
  })

  it('handles multiple duplicates across different ids', () => {
    const a1 = makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-01-01' })
    const a2 = makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-03-01' })
    const b1 = makeDeal({ dealId: 'DEAL-0002', updatedDate: '2024-02-01' })
    const b2 = makeDeal({ dealId: 'DEAL-0002', updatedDate: '2024-04-01' })
    const result = deduplicateDeals([a1, b1, a2, b2])
    expect(result).toHaveLength(2)
  })
})

describe('mergeAndDeduplicate', () => {
  it('combines two arrays and deduplicates by dealId', () => {
    const existing = [makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-01-01' })]
    const incoming = [
      makeDeal({ dealId: 'DEAL-0001', updatedDate: '2024-06-01', dealName: 'Updated' }),
      makeDeal({ dealId: 'DEAL-0002' }),
    ]
    const result = mergeAndDeduplicate(existing, incoming)
    expect(result).toHaveLength(2)
    const deal1 = result.find((d) => d.dealId === 'DEAL-0001')
    expect(deal1?.dealName).toBe('Updated')
  })

  it('returns all unique deals when there are no duplicates', () => {
    const a = [makeDeal({ dealId: 'DEAL-0001' })]
    const b = [makeDeal({ dealId: 'DEAL-0002' })]
    expect(mergeAndDeduplicate(a, b)).toHaveLength(2)
  })

  it('returns a copy of existing when incoming is empty', () => {
    const existing = [makeDeal({ dealId: 'DEAL-0001' })]
    expect(mergeAndDeduplicate(existing, [])).toHaveLength(1)
  })
})
