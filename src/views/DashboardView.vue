<script setup lang="ts">
  import { onMounted, onUnmounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useDealStore } from '../stores/dealStore'
  import { isValidDealStatus } from '../utils/security'
  import type { DealFilters } from '../types'
  import SearchBar from '../components/SearchBar.vue'
  import type { SmartSearchResult } from '../utils/smartSearchParser'
  import FilterPanel from '../components/FilterPanel.vue'
  import DealTable from '../components/DealTable.vue'
  import PaginationBar from '../components/PaginationBar.vue'
  import ErrorState from '../components/ErrorState.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const store = useDealStore()

  function initFromUrl(): void {
    const q = route.query

    const search = typeof q.search === 'string' && q.search ? q.search : ''

    const rawPage = typeof q.page === 'string' ? parseInt(q.page, 10) : NaN
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1

    const statuses: string[] =
      typeof q.statuses === 'string' && q.statuses
        ? q.statuses.split(',').filter(isValidDealStatus)
        : []

    const amountMin =
      typeof q.amountMin === 'string' ? parseFloat(q.amountMin) : NaN
    const amountMax =
      typeof q.amountMax === 'string' ? parseFloat(q.amountMax) : NaN

    store.setStateFromUrl({
      search,
      page,
      filters: {
        statuses,
        amountMin: isNaN(amountMin) ? null : amountMin,
        amountMax: isNaN(amountMax) ? null : amountMax,
        dateFrom: typeof q.dateFrom === 'string' ? q.dateFrom : '',
        dateTo: typeof q.dateTo === 'string' ? q.dateTo : '',
        accountName: typeof q.accountName === 'string' ? q.accountName : '',
        dealName: typeof q.dealName === 'string' ? q.dealName : ''
      }
    })
  }

  function syncToUrl(): void {
    const query: Record<string, string> = {}

    if (store.searchQuery) query.search = store.searchQuery
    if (store.page > 1) query.page = String(store.page)
    if (store.filters.statuses.length > 0) {
      query.statuses = store.filters.statuses.join(',')
    }
    if (store.filters.amountMin != null)
      query.amountMin = String(store.filters.amountMin)
    if (store.filters.amountMax != null)
      query.amountMax = String(store.filters.amountMax)
    if (store.filters.dateFrom) query.dateFrom = store.filters.dateFrom
    if (store.filters.dateTo) query.dateTo = store.filters.dateTo
    if (store.filters.accountName) query.accountName = store.filters.accountName
    if (store.filters.dealName) query.dealName = store.filters.dealName

    router.replace({ query })
  }

  watch(
    [() => store.page, () => store.searchQuery, () => store.filters],
    syncToUrl,
    { deep: true }
  )

  onMounted(() => {
    initFromUrl()
    store.startPolling()
  })

  onUnmounted(() => {
    store.stopPolling()
  })

  function onSearch(q: string): void {
    store.setSearch(q)
  }

  function onSmartSearch(result: SmartSearchResult): void {
    if (!result.isStructured) {
      store.setFilters({
        statuses: [],
        amountMin: null,
        amountMax: null,
        dateFrom: '',
        dateTo: '',
      })
      store.setSearch('')
      return
    }
    store.setFilters({
      statuses: result.filters.statuses ?? [],
      amountMin: result.filters.amountMin ?? null,
      amountMax: result.filters.amountMax ?? null,
      dateFrom: result.filters.dateFrom ?? '',
      dateTo: result.filters.dateTo ?? '',
    })
    store.setSearch(result.residualQuery)
  }

  function onFilterUpdate(f: Partial<DealFilters>): void {
    store.setFilters(f)
  }

  function onFilterClear(): void {
    store.clearFilters()
  }

  function onPageChange(p: number): void {
    store.goToPage(p)
  }

  function onSelectDeal(dealId: string): void {
    router.push({ name: 'deal-detail', params: { id: dealId } })
  }
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <h1 class="dashboard__title">{{ t('deals.title') }}</h1>
      <span v-if="!store.loading && store.total > 0" class="dashboard__count">
        {{ t('deals.totalDeals', { count: store.total }) }}
      </span>
    </div>

    <div class="dashboard__toolbar">
      <SearchBar
          :model-value="store.searchQuery"
          @search="onSearch"
          @smart-search="onSmartSearch" />
    </div>

    <FilterPanel
      :filters="store.filters"
      :active-count="store.activeFilterCount"
      @update:filters="onFilterUpdate"
      @clear="onFilterClear" />

    <div class="dashboard__content">
      <ErrorState
        v-if="store.error"
        :message="t('errors.fetchFailed')"
        @retry="store.loadDeals()" />

      <template v-else>
        <DealTable
          :deals="store.visibleDeals"
          :loading="store.loading"
          :is-filtered="
            store.searchQuery.length > 0 || store.activeFilterCount > 0
          "
          @select="onSelectDeal" />

        <PaginationBar
          :page="store.page"
          :total-pages="store.totalPages"
          :total="store.total"
          :page-size="store.pageSize"
          @page-change="onPageChange" />
      </template>
    </div>
  </div>
</template>

<style scoped>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    animation: fadeIn 0.35s var(--ease);
  }

  .dashboard__header {
    display: flex;
    align-items: baseline;
    gap: var(--space-md);
    flex-wrap: wrap;
  }

  .dashboard__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .dashboard__count {
    font-size: 0.8125rem;
    color: var(--c-text-muted);
    font-weight: 500;
  }

  .dashboard__toolbar {
    display: flex;
    gap: var(--space-md);
  }

  .dashboard__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  @media (max-width: 768px) {
    .dashboard__title {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 360px) {
    .dashboard {
      gap: var(--space-sm);
    }

    .dashboard__title {
      font-size: 1.125rem;
    }

    .dashboard__toolbar {
      flex-direction: column;
    }
  }

  @media (min-width: 1280px) {
    .dashboard__title {
      font-size: 1.75rem;
    }
  }
</style>
