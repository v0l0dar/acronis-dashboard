import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchDeals,
  fetchDealById,
  pollUpdates,
  clearAllCaches,
  TimeoutError
} from '../api/dealService'
import { ROLES, safeLog } from '../utils/security'
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

  // AbortControllers for in-flight requests
  let currentAbortController: AbortController | null = null
  let currentDetailAbortController: AbortController | null = null

  // In-flight guard for polling — prevents concurrent runPoll executions
  let isPollInFlight = false

  // Monotonically increasing generation counter for loadDeals; ensures the
  // finally block only resets loading when this invocation is still the latest.
  let loadDealsGeneration = 0

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

  // Server returns the already-filtered page; this is a passthrough, not client-side filtering
  const visibleDeals = computed(() => deals.value)

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
    // Snapshot the generation so the finally block can tell whether a newer
    // call has superseded this one (including after the pagination retry
    // replaces currentAbortController with a fresh controller).
    const gen = ++loadDealsGeneration

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

      // If the stored page exceeds totalPages, re-fetch from page 1 with a fresh
      // AbortController so the retry can be independently cancelled by future calls.
      if (result.totalPages > 0 && page.value > result.totalPages) {
        page.value = 1
        const retryController = new AbortController()
        currentAbortController = retryController
        result = (await fetchDeals({
          ...params,
          page: 1,
          signal: retryController.signal
        })) as DealsPage
      }

      deals.value = result.deals
      total.value = result.total
      totalPages.value = result.totalPages
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      safeLog('loadDeals:error', e instanceof Error ? { name: e.name, message: e.message } : { message: String(e) })
      error.value = e instanceof TimeoutError ? 'timeout' : 'error'
      deals.value = []
    } finally {
      // Only clear the loading flag when this invocation is still the latest.
      // A superseded call must not extinguish the active request's loading state.
      if (gen === loadDealsGeneration) {
        loading.value = false
      }
    }
  }

  async function loadDealDetail(dealId: string): Promise<void> {
    currentDetailAbortController?.abort()
    const controller = new AbortController()
    currentDetailAbortController = controller
    const { signal } = controller

    detailLoading.value = true
    detailError.value = null
    detailNotFound.value = false
    currentDeal.value = null

    try {
      const deal = (await fetchDealById(dealId, signal)) as Deal | null
      currentDeal.value = deal
      detailNotFound.value = deal === null
      if (deal) {
        // Sync the freshly fetched deal into the list, replacing any stale entry
        deals.value = deduplicateDeals([deal, ...deals.value]) as Deal[]
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      safeLog('loadDealDetail:error', e instanceof Error ? { name: e.name, message: e.message } : { message: String(e) })
      detailError.value = e instanceof TimeoutError ? 'timeout' : (e instanceof Error ? e.message : 'Failed to load deal')
    } finally {
      // Guard: a superseded request must not clear the active request's loading state.
      if (currentDetailAbortController === controller) {
        detailLoading.value = false
      }
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

  function setStateFromUrl(params: {
    search: string
    page: number
    filters: DealFilters
  }): void {
    searchQuery.value = params.search
    page.value = params.page
    filters.value = params.filters
    loadDeals(false)
  }

  function setRole(role: string): void {
    currentRole.value = role
    clearAllCaches()
    loadDeals(true)
  }

  function startPolling(): void {
    stopPolling()

    const runPoll = async (): Promise<void> => {
      if (isPollInFlight) return
      isPollInFlight = true
      try {
        const updates = (await pollUpdates(lastPollTimestamp.value)) as Deal[]
        if (updates.length > 0) {
          lastPollTimestamp.value = new Date().toISOString()

          // Build a lookup of updated deals by id for O(1) access
          const updatedById = new Map<string, Deal>(
            updates.map((d) => [d.dealId, d])
          )

          // Remove deals that were updated but no longer match active filters
          const afterEviction = deals.value.filter((d) => {
            const updated = updatedById.get(d.dealId)
            return updated === undefined || dealMatchesCurrentFilters(updated)
          })

          // Merge in updates that do match active filters
          const matching = updates.filter(dealMatchesCurrentFilters)
          deals.value = (
            matching.length > 0
              ? mergeAndDeduplicate(afterEviction, matching)
              : afterEviction
          ) as Deal[]
        }
      } catch {
        // Silent fail for polling – non-critical
      } finally {
        isPollInFlight = false
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
    visibleDeals,
    // Actions
    loadDeals,
    loadDealDetail,
    goToPage,
    setSearch,
    setFilters,
    clearFilters,
    setStateFromUrl,
    setRole,
    startPolling,
    stopPolling
  }
})
