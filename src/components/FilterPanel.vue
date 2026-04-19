<script setup lang="ts">
  import { ref, computed, watch, onUnmounted, useId } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { sanitizeSearchQuery, sanitizeNumericInput } from '../utils/security'
  import type { DealFilters, DealStatus } from '../types'

  const { t } = useI18n()
  const emit = defineEmits<{
    'update:filters': [filters: DealFilters]
    clear: []
  }>()

  const { filters, activeCount = 0 } = defineProps<{
    filters: DealFilters
    activeCount?: number
  }>()

  const isOpen = ref(false)
  const panelBodyId = useId()

  // Local copies for controlled inputs
  const localStatuses = ref<DealStatus[]>([...filters.statuses])
  const localAmountMin = ref<string>(
    filters.amountMin != null ? String(filters.amountMin) : ''
  )
  const localAmountMax = ref<string>(
    filters.amountMax != null ? String(filters.amountMax) : ''
  )
  const localDateFrom = ref<string>(
    filters.dateFrom ? filters.dateFrom.slice(0, 10) : ''
  )
  const localDateTo = ref<string>(
    filters.dateTo ? filters.dateTo.slice(0, 10) : ''
  )
  const localAccountName = ref<string>(filters.accountName)
  const localDealName = ref<string>(filters.dealName)

  let textDebounceTimer: ReturnType<typeof setTimeout> | null = null

  onUnmounted(() => {
    if (textDebounceTimer !== null) clearTimeout(textDebounceTimer)
  })

  watch(
    () => filters,
    (f) => {
      localStatuses.value = [...f.statuses]
      localAmountMin.value = f.amountMin != null ? String(f.amountMin) : ''
      localAmountMax.value = f.amountMax != null ? String(f.amountMax) : ''
      // Strip time component so input[type=date] always receives YYYY-MM-DD
      localDateFrom.value = f.dateFrom ? f.dateFrom.slice(0, 10) : ''
      localDateTo.value = f.dateTo ? f.dateTo.slice(0, 10) : ''
      localAccountName.value = f.accountName
      localDealName.value = f.dealName
    },
    { deep: true }
  )

  const statusOptions: DealStatus[] = ['Open', 'Approved', 'Rejected']

  // Reactive validation
  const amountError = computed<string>(() => {
    if (localAmountMin.value === '' || localAmountMax.value === '') return ''
    return Number(localAmountMin.value) > Number(localAmountMax.value)
      ? t('filters.amountRangeError')
      : ''
  })

  const dateError = computed<string>(() => {
    if (!localDateFrom.value || !localDateTo.value) return ''
    return localDateFrom.value > localDateTo.value
      ? t('filters.dateRangeError')
      : ''
  })

  function toggleStatus(status: DealStatus): void {
    const idx = localStatuses.value.indexOf(status)
    if (idx === -1) localStatuses.value.push(status)
    else localStatuses.value.splice(idx, 1)
    applyFilters()
  }

  function applyFilters(): void {
    if (amountError.value || dateError.value) return
    emit('update:filters', {
      statuses: [...localStatuses.value],
      amountMin:
        localAmountMin.value !== ''
          ? (sanitizeNumericInput(localAmountMin.value) as number)
          : null,
      amountMax:
        localAmountMax.value !== ''
          ? (sanitizeNumericInput(localAmountMax.value) as number)
          : null,
      // Normalize to local-midnight ISO to avoid UTC timezone offset shifting the date by 1 day
      dateFrom: localDateFrom.value
        ? new Date(localDateFrom.value + 'T00:00:00').toISOString()
        : '',
      dateTo: localDateTo.value
        ? new Date(localDateTo.value + 'T23:59:59.999').toISOString()
        : '',
      accountName: sanitizeSearchQuery(localAccountName.value) as string,
      dealName: sanitizeSearchQuery(localDealName.value) as string
    })
  }

  function applyFiltersDebounced(): void {
    if (textDebounceTimer !== null) clearTimeout(textDebounceTimer)
    textDebounceTimer = setTimeout(applyFilters, 300)
  }

  function clearAll(): void {
    localStatuses.value = []
    localAmountMin.value = ''
    localAmountMax.value = ''
    localDateFrom.value = ''
    localDateTo.value = ''
    localAccountName.value = ''
    localDealName.value = ''
    emit('clear')
  }

  function statusColorClass(status: DealStatus): string {
    return `status--${status.toLowerCase()}`
  }
</script>

<template>
  <div class="filter-panel">
    <div class="filter-panel__header">
      <button
        class="filter-toggle"
        :aria-expanded="isOpen"
        :aria-controls="panelBodyId"
        @click="isOpen = !isOpen">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 4h12M4 8h8M6 12h4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round" />
        </svg>
        <span>{{ t('filters.toggle') }}</span>
        <span v-if="activeCount > 0" class="filter-badge">{{
          activeCount
        }}</span>
        <svg
          class="filter-toggle__chevron"
          :class="{ 'filter-toggle__chevron--open': isOpen }"
          width="12"
          height="12"
          viewBox="0 0 12 12">
          <path
            d="M3 5l3 3 3-3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>

      <button v-if="activeCount > 0" class="filter-clear" @click="clearAll">
        {{ t('filters.clearAll') }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="isOpen" :id="panelBodyId" class="filter-panel__body">
        <div class="filter-grid">
          <!-- Status multi-select -->
          <div class="filter-group">
            <label class="filter-label">{{ t('filters.status') }}</label>
            <div class="filter-chips">
              <button
                v-for="status in statusOptions"
                :key="status"
                class="filter-chip"
                :class="[
                  statusColorClass(status),
                  { 'filter-chip--active': localStatuses.includes(status) }
                ]"
                @click="toggleStatus(status)">
                {{ t(`status.${status}`) }}
              </button>
            </div>
          </div>

          <!-- Amount range -->
          <div class="filter-group">
            <label class="filter-label">{{ t('filters.amount') }}</label>
            <div class="filter-range">
              <input
                v-model="localAmountMin"
                type="number"
                class="filter-input filter-input--small"
                :class="{ 'filter-input--error': amountError }"
                :placeholder="t('filters.amountMin')"
                min="0"
                step="1000"
                @change="applyFilters" />
              <span class="filter-range__sep">–</span>
              <input
                v-model="localAmountMax"
                type="number"
                class="filter-input filter-input--small"
                :class="{ 'filter-input--error': amountError }"
                :placeholder="t('filters.amountMax')"
                min="0"
                step="1000"
                @change="applyFilters" />
            </div>
            <span v-if="amountError" class="filter-error">{{
              amountError
            }}</span>
          </div>

          <!-- Date range -->
          <div class="filter-group">
            <label class="filter-label">{{ t('filters.dateRange') }}</label>
            <div class="filter-range">
              <input
                v-model="localDateFrom"
                type="date"
                class="filter-input filter-input--small"
                :class="{ 'filter-input--error': dateError }"
                @change="applyFilters" />
              <span class="filter-range__sep">–</span>
              <input
                v-model="localDateTo"
                type="date"
                class="filter-input filter-input--small"
                :class="{ 'filter-input--error': dateError }"
                @change="applyFilters" />
            </div>
            <span v-if="dateError" class="filter-error">{{ dateError }}</span>
          </div>

          <!-- Account name text filter -->
          <div class="filter-group">
            <label class="filter-label">{{ t('filters.accountName') }}</label>
            <input
              v-model="localAccountName"
              type="text"
              class="filter-input"
              :placeholder="t('filters.accountName')"
              maxlength="100"
              @input="applyFiltersDebounced" />
          </div>

          <!-- Deal name text filter -->
          <div class="filter-group">
            <label class="filter-label">{{ t('filters.dealName') }}</label>
            <input
              v-model="localDealName"
              type="text"
              class="filter-input"
              :placeholder="t('filters.dealName')"
              maxlength="100"
              @input="applyFiltersDebounced" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  .filter-panel {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .filter-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
  }

  .filter-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--c-text);
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    transition: background var(--duration) var(--ease);
  }

  .filter-toggle:hover {
    background: var(--c-surface-alt);
  }

  .filter-toggle__chevron {
    transition: transform var(--duration) var(--ease);
  }

  .filter-toggle__chevron--open {
    transform: rotate(180deg);
  }

  .filter-badge {
    background: var(--c-accent);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  }

  .filter-clear {
    font-size: 0.75rem;
    color: var(--c-accent);
    font-weight: 600;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: background var(--duration) var(--ease);
  }

  .filter-clear:hover {
    background: var(--c-accent-light);
  }

  .filter-panel__body {
    padding: var(--space-md);
    padding-top: var(--space-xs);
    border-top: 1px solid var(--c-border);
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--space-md);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--c-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-chip {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--c-border);
    background: var(--c-surface);
    color: var(--c-text-secondary);
    transition: all var(--duration) var(--ease);
  }

  .filter-chip:hover {
    border-color: var(--c-border-strong);
  }

  .filter-chip--active.status--open {
    background: var(--c-open-bg);
    border-color: var(--c-open);
    color: var(--c-open);
  }

  .filter-chip--active.status--approved {
    background: var(--c-approved-bg);
    border-color: var(--c-approved);
    color: var(--c-approved);
  }

  .filter-chip--active.status--rejected {
    background: var(--c-rejected-bg);
    border-color: var(--c-rejected);
    color: var(--c-rejected);
  }

  .filter-range {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .filter-range .filter-input {
    flex: 1 1 0;
    min-width: 0;
    width: 0;
  }

  .filter-range__sep {
    color: var(--c-text-muted);
    font-weight: 500;
  }

  .filter-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    background: var(--c-surface);
    color: var(--c-text);
    font-size: 0.8125rem;
    outline: none;
    transition: border-color var(--duration) var(--ease);
  }

  .filter-input:focus {
    border-color: var(--c-accent);
    box-shadow: var(--shadow-focus);
  }

  .filter-input--small {
    max-width: 140px;
  }

  .filter-input--error {
    border-color: var(--c-rejected);
  }

  .filter-input--error:focus {
    border-color: var(--c-rejected);
    box-shadow: 0 0 0 3px rgba(var(--c-rejected-rgb, 220, 53, 69), 0.15);
  }

  .filter-error {
    font-size: 0.7rem;
    color: var(--c-rejected);
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .filter-grid {
      grid-template-columns: 1fr;
    }
    .filter-input--small {
      max-width: 100%;
    }
  }

  @media (max-width: 360px) {
    .filter-panel {
      overflow: hidden;
    }

    .filter-panel__header {
      padding: var(--space-xs) var(--space-sm);
      flex-wrap: wrap;
      gap: var(--space-xs);
    }

    .filter-panel__body {
      padding: var(--space-sm);
      padding-top: var(--space-xs);
    }

    .filter-grid {
      grid-template-columns: 1fr;
      gap: var(--space-sm);
    }

    .filter-range {
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
    }

    .filter-range__sep {
      text-align: center;
    }

    .filter-range .filter-input {
      width: 100%;
      max-width: 100%;
    }

    .filter-input--small {
      max-width: 100%;
    }

    .filter-chips {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-chip {
      text-align: center;
    }
  }

  @media (min-width: 1280px) {
    .filter-grid {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
  }
</style>
