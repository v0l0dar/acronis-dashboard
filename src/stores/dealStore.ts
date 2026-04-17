import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchDeals,
  fetchDealById,
  pollUpdates,
  clearAllCaches
} from '../api/dealService'
import { ROLES } from '../utils/security'
import { deduplicateDeals, mergeAndDeduplicate } from '../utils/deduplication'
import type { Deal, DealFilters, DealsPage } from '../types'

export const useDealStore = defineStore('deals', () => {
  // State
  const deals = ref<Deal[]>([])
  const currentDeal = ref<Deal | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref<string | null>(null)
  const detailError = ref<string | null>(null)
  const detailNotFound = ref(false)

  // Pagination
  const page = ref(1)
  const pageSize = ref(15)
  const total = ref(0)
  const totalPages = ref(0)

  // Search & Filters
  const searchQuery = ref('')
  const filters = ref<DealFilters>({
    statuses: [],
    amountMin: null,
    amountMax: null,
    dateFrom: '',
    dateTo: '',
    accountName: '',
    dealName: ''
  })

  // RBAC
  const currentRole = ref<string>(ROLES.ADMIN)
  const currentPartnerId = ref('partner-1')

  // Polling
  let pollInterval: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null
  const lastPollTimestamp = ref(new Date().toISOString())

  // AbortController for in-flight loadDeals requests
  let currentAbortController: AbortController | null = null

  // Computed
  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.statuses.length) count++
    if (filters.value.amountMin != null) count++
    if (filters.value.amountMax != null) count++
    if (filters.value.dateFrom) count++
    if (filters.value.dateTo) count++
    if (filters.value.accountName) count++
    if (filters.value.dealName) count++
    return count
  })

  // Role filtering is applied at the API layer, so this is a passthrough
  const filteredDeals = computed(() => deals.value)

  // Checks whether a deal satisfies the currently active search query and filters.
  function dealMatchesCurrentFilters(deal: Deal): boolean {
    const f = filters.value
    const q = searchQuery.value.toLowerCase().trim().replace(/\s+/g, ' ')

    if (
      q &&
      !deal.dealName.toLowerCase().includes(q) &&
      !deal.accountName.toLowerCase().includes(q) &&
      !deal.status.toLowerCase().includes(q) &&
      !deal.dealId.toLowerCase().includes(q)
    ) {
      return false
    }
    if (
      f.statuses.length > 0 &&
      !f.statuses
        .map((s) => s.toLowerCase())
        .includes(deal.status.toLowerCase())
    ) {
      return false
    }
    if (f.amountMin != null && deal.amount < f.amountMin) return false
    if (f.amountMax != null && deal.amount > f.amountMax) return false
    if (
      f.dateFrom &&
      new Date(deal.createdDate).getTime() < new Date(f.dateFrom).getTime()
    )
      return false
    if (
      f.dateTo &&
      new Date(deal.createdDate).getTime() > new Date(f.dateTo).getTime()
    )
      return false
    if (
      f.accountName &&
      !deal.accountName
        .toLowerCase()
        .includes(f.accountName.toLowerCase().trim())
    )
      return false
    if (
      f.dealName &&
      !deal.dealName.toLowerCase().includes(f.dealName.toLowerCase().trim())
    )
      return false
    return true
  }

  // Actions
  async function loadDeals(resetPage = true): Promise<void> {
    // Abort any in-flight request before starting a new one
    currentAbortController?.abort()
    currentAbortController = new AbortController()
    const { signal } = currentAbortController

    if (resetPage) page.value = 1
    loading.value = true
    error.value = null

    try {
      const params = {
        page: page.value,
        pageSize: pageSize.value,
        search: searchQuery.value,
        filters: filters.value,
        roleFilter: {
          role: currentRole.value,
          partnerId: currentPartnerId.value
        },
        signal
      }

      let result = (await fetchDeals(params)) as DealsPage

      // If the stored page exceeds totalPages, re-fetch from page 1
      if (result.totalPages > 0 && page.value > result.totalPages) {
        page.value = 1
        result = (await fetchDeals({ ...params, page: 1 })) as DealsPage
      }

      deals.value = result.deals
      total.value = result.total
      totalPages.value = result.totalPages
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = e instanceof Error ? e.message : 'Failed to load deals'
      deals.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadDealDetail(dealId: string): Promise<void> {
    detailLoading.value = true
    detailError.value = null
    detailNotFound.value = false
    currentDeal.value = null

    try {
      const deal = (await fetchDealById(dealId)) as Deal | null
      currentDeal.value = deal
      detailNotFound.value = deal === null
      if (deal) {
        // Sync the freshly fetched deal into the list, replacing any stale entry
        deals.value = deduplicateDeals([deal, ...deals.value]) as Deal[]
      }
    } catch (e: unknown) {
      detailError.value = e instanceof Error ? e.message : 'Failed to load deal'
    } finally {
      detailLoading.value = false
    }
  }

  async function goToPage(p: number): Promise<void> {
    page.value = p
    await loadDeals(false)
  }

  function setSearch(q: string): void {
    searchQuery.value = q
    loadDeals(true)
  }

  function setFilters(newFilters: Partial<DealFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
    loadDeals(true)
  }

  function clearFilters(): void {
    filters.value = {
      statuses: [],
      amountMin: null,
      amountMax: null,
      dateFrom: '',
      dateTo: '',
      accountName: '',
      dealName: ''
    }
    searchQuery.value = ''
    loadDeals(true)
  }

  function setRole(role: string): void {
    currentRole.value = role
    clearAllCaches()
    loadDeals(true)
  }

  function startPolling(): void {
    stopPolling()

    const runPoll = async (): Promise<void> => {
      try {
        const updates = (await pollUpdates(lastPollTimestamp.value)) as Deal[]
        if (updates.length > 0) {
          lastPollTimestamp.value = new Date().toISOString()
          // Only push updates that match the currently active filters
          const matching = updates.filter(dealMatchesCurrentFilters)
          if (matching.length > 0) {
            deals.value = mergeAndDeduplicate(deals.value, matching) as Deal[]
          }
        }
      } catch {
        // Silent fail for polling – non-critical
      }
    }

    pollInterval = setInterval(runPoll, 30000)

    // Pause polling while the tab is hidden; resume (with an immediate tick) when it becomes visible
    visibilityHandler = () => {
      if (document.hidden) {
        if (pollInterval !== null) {
          clearInterval(pollInterval)
          pollInterval = null
        }
      } else {
        if (pollInterval === null) {
          pollInterval = setInterval(runPoll, 30000)
          runPoll()
        }
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  function stopPolling(): void {
    if (pollInterval !== null) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    if (visibilityHandler !== null) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  }

  return {
    // State
    deals,
    currentDeal,
    loading,
    detailLoading,
    error,
    detailError,
    detailNotFound,
    page,
    pageSize,
    total,
    totalPages,
    searchQuery,
    filters,
    currentRole,
    currentPartnerId,
    // Computed
    activeFilterCount,
    filteredDeals,
    // Actions
    loadDeals,
    loadDealDetail,
    goToPage,
    setSearch,
    setFilters,
    clearFilters,
    setRole,
    startPolling,
    stopPolling
  }
})
