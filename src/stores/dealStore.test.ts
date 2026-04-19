import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { DealsPage, Deal } from '../types'

vi.mock('../api/dealService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/dealService')>()
  return {
    ...actual,
    fetchDeals: vi.fn(),
    fetchDealById: vi.fn(),
    pollUpdates: vi.fn(),
    clearAllCaches: vi.fn(),
  }
})

import { fetchDeals, fetchDealById, clearAllCaches } from '../api/dealService'
import { useDealStore } from './dealStore'

const emptyPage: DealsPage = {
  deals: [],
  total: 0,
  page: 1,
  pageSize: 15,
  totalPages: 0,
}

function makeDeal(overrides: Partial<Deal> & { dealId: string }): Deal {
  return {
    dealName: 'Test Deal',
    accountName: 'Acme',
    status: 'Open',
    amount: 5000,
    createdDate: '2024-01-01',
    updatedDate: '2024-01-02',
    assignedTo: 'partner-1',
    description: '',
    contactEmail: 'test@acme.com',
    contactName: 'Test User',
    notes: '',
    ...overrides,
  }
}

describe('dealStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchDeals).mockResolvedValue(emptyPage)
    vi.mocked(fetchDealById).mockResolvedValue(null)
    vi.mocked(clearAllCaches).mockReturnValue(undefined)
  })

  describe('initial state', () => {
    it('has empty deals and default pagination', () => {
      const store = useDealStore()
      expect(store.deals).toEqual([])
      expect(store.page).toBe(1)
      expect(store.pageSize).toBe(15)
      expect(store.total).toBe(0)
    })

    it('has cleared filters and no search query', () => {
      const store = useDealStore()
      expect(store.searchQuery).toBe('')
      expect(store.filters.statuses).toEqual([])
      expect(store.filters.amountMin).toBeNull()
      expect(store.filters.amountMax).toBeNull()
      expect(store.filters.dateFrom).toBe('')
      expect(store.filters.dateTo).toBe('')
    })

    it('starts as admin role', () => {
      const store = useDealStore()
      expect(store.currentRole).toBe('admin')
    })

    it('loading is false initially', () => {
      const store = useDealStore()
      expect(store.loading).toBe(false)
    })
  })

  describe('activeFilterCount', () => {
    it('is 0 when no filters are set', () => {
      const store = useDealStore()
      expect(store.activeFilterCount).toBe(0)
    })

    it('increments once per active filter field', () => {
      const store = useDealStore()
      store.filters.statuses = ['Open']
      expect(store.activeFilterCount).toBe(1)
      store.filters.amountMin = 1000
      expect(store.activeFilterCount).toBe(2)
      store.filters.amountMax = 5000
      expect(store.activeFilterCount).toBe(3)
      store.filters.dateFrom = '2024-01-01'
      expect(store.activeFilterCount).toBe(4)
      store.filters.dateTo = '2024-12-31'
      expect(store.activeFilterCount).toBe(5)
      store.filters.accountName = 'Acme'
      expect(store.activeFilterCount).toBe(6)
      store.filters.dealName = 'Project'
      expect(store.activeFilterCount).toBe(7)
    })
  })

  describe('loadDeals', () => {
    it('populates deals from the API response', async () => {
      const deal = makeDeal({ dealId: 'DEAL-0001' })
      vi.mocked(fetchDeals).mockResolvedValueOnce({
        ...emptyPage,
        deals: [deal],
        total: 1,
        totalPages: 1,
      })
      const store = useDealStore()
      await store.loadDeals()
      expect(store.deals).toHaveLength(1)
      expect(store.deals[0].dealId).toBe('DEAL-0001')
      expect(store.total).toBe(1)
    })

    it('sets error state and clears deals on failure', async () => {
      vi.mocked(fetchDeals).mockRejectedValueOnce(new Error('Network error'))
      const store = useDealStore()
      await store.loadDeals()
      expect(store.error).toBe('error')
      expect(store.deals).toEqual([])
    })

    it('resets page to 1 when resetPage is true', async () => {
      const store = useDealStore()
      store.page = 5
      await store.loadDeals(true)
      expect(store.page).toBe(1)
    })

    it('preserves current page when resetPage is false', async () => {
      const store = useDealStore()
      store.page = 3
      await store.loadDeals(false)
      expect(store.page).toBe(3)
    })

    it('does not leave loading as true after completion', async () => {
      const store = useDealStore()
      await store.loadDeals()
      expect(store.loading).toBe(false)
    })
  })

  describe('setFilters', () => {
    it('merges new filters into existing ones', async () => {
      const store = useDealStore()
      store.filters.accountName = 'Acme'
      store.setFilters({ statuses: ['Open'] })
      await vi.waitFor(() => !store.loading)
      expect(store.filters.statuses).toEqual(['Open'])
      expect(store.filters.accountName).toBe('Acme')
    })

    it('resets page to 1', async () => {
      const store = useDealStore()
      store.page = 4
      store.setFilters({ statuses: ['Approved'] })
      await vi.waitFor(() => !store.loading)
      expect(store.page).toBe(1)
    })

    it('triggers a data reload', async () => {
      const store = useDealStore()
      const callsBefore = vi.mocked(fetchDeals).mock.calls.length
      store.setFilters({ amountMin: 500 })
      await vi.waitFor(() => !store.loading)
      expect(vi.mocked(fetchDeals).mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  describe('clearFilters', () => {
    it('resets all filter fields to their defaults', async () => {
      const store = useDealStore()
      store.filters.statuses = ['Approved']
      store.filters.amountMin = 1000
      store.filters.amountMax = 9000
      store.filters.dateFrom = '2024-01-01'
      store.filters.dateTo = '2024-12-31'
      store.filters.accountName = 'Acme'
      store.filters.dealName = 'Project'
      store.clearFilters()
      await vi.waitFor(() => !store.loading)
      expect(store.filters.statuses).toEqual([])
      expect(store.filters.amountMin).toBeNull()
      expect(store.filters.amountMax).toBeNull()
      expect(store.filters.dateFrom).toBe('')
      expect(store.filters.dateTo).toBe('')
      expect(store.filters.accountName).toBe('')
      expect(store.filters.dealName).toBe('')
    })

    it('clears the search query', async () => {
      const store = useDealStore()
      store.searchQuery = 'something'
      store.clearFilters()
      await vi.waitFor(() => !store.loading)
      expect(store.searchQuery).toBe('')
    })
  })

  describe('goToPage', () => {
    it('updates the page and fetches without resetting to 1', async () => {
      const store = useDealStore()
      await store.goToPage(4)
      expect(store.page).toBe(4)
      expect(vi.mocked(fetchDeals)).toHaveBeenCalled()
    })
  })

  describe('setSearch', () => {
    it('updates searchQuery and resets page to 1', async () => {
      const store = useDealStore()
      store.page = 3
      store.setSearch('Acme')
      await vi.waitFor(() => !store.loading)
      expect(store.searchQuery).toBe('Acme')
      expect(store.page).toBe(1)
    })
  })

  describe('setRole', () => {
    it('updates currentRole', async () => {
      const store = useDealStore()
      store.setRole('partner')
      await vi.waitFor(() => !store.loading)
      expect(store.currentRole).toBe('partner')
    })

    it('calls clearAllCaches', async () => {
      const store = useDealStore()
      store.setRole('partner')
      await vi.waitFor(() => !store.loading)
      expect(vi.mocked(clearAllCaches)).toHaveBeenCalled()
    })
  })

  describe('loadDealDetail', () => {
    it('sets currentDeal on success', async () => {
      const deal = makeDeal({ dealId: 'DEAL-0042' })
      vi.mocked(fetchDealById).mockResolvedValueOnce(deal)
      const store = useDealStore()
      await store.loadDealDetail('DEAL-0042')
      expect(store.currentDeal?.dealId).toBe('DEAL-0042')
      expect(store.detailNotFound).toBe(false)
    })

    it('sets detailNotFound when API returns null', async () => {
      vi.mocked(fetchDealById).mockResolvedValueOnce(null)
      const store = useDealStore()
      await store.loadDealDetail('DEAL-9999')
      expect(store.currentDeal).toBeNull()
      expect(store.detailNotFound).toBe(true)
    })

    it('sets detailError on failure', async () => {
      vi.mocked(fetchDealById).mockRejectedValueOnce(new Error('Not found'))
      const store = useDealStore()
      await store.loadDealDetail('DEAL-0001')
      expect(store.detailError).toBe('Not found')
    })

    it('does not leave detailLoading as true after completion', async () => {
      const store = useDealStore()
      await store.loadDealDetail('DEAL-0001')
      expect(store.detailLoading).toBe(false)
    })
  })
})
