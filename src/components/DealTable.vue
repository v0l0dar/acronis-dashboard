<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import StatusBadge from './StatusBadge.vue'
  import { useIsMobile } from '../composables/useIsMobile'
  import { useFormatter } from '../composables/useFormatter'
  import type { Deal } from '../types'

  const { t } = useI18n()

  const {
    deals,
    loading = false,
    isFiltered = false
  } = defineProps<{
    deals: Deal[]
    loading?: boolean
    isFiltered?: boolean
  }>()

  defineEmits<{
    select: [dealId: string]
  }>()

  const { isMobile } = useIsMobile()
  const { formatAmount: _formatAmount, formatDate } = useFormatter()

  function formatAmount(amount: number): string {
    return _formatAmount(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="skeleton-wrapper">
    <div v-for="n in 6" :key="n" class="skeleton-row">
      <div class="skeleton skeleton--wide" />
      <div class="skeleton skeleton--medium" />
      <div class="skeleton skeleton--small" />
      <div class="skeleton skeleton--medium" />
      <div class="skeleton skeleton--medium" />
    </div>
  </div>

  <!-- Empty state -->
  <div v-else-if="deals.length === 0" class="empty-state" role="status">
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true">
      <rect
        x="6"
        y="10"
        width="36"
        height="28"
        rx="4"
        stroke="var(--c-border-strong)"
        stroke-width="2" />
      <path d="M6 18h36" stroke="var(--c-border-strong)" stroke-width="2" />
      <circle
        cx="24"
        cy="32"
        r="3"
        stroke="var(--c-border-strong)"
        stroke-width="2" />
      <path
        d="M22 30l4 4M26 30l-4 4"
        stroke="var(--c-border-strong)"
        stroke-width="1.5"
        stroke-linecap="round" />
    </svg>
    <p class="empty-state__title">
      {{ isFiltered ? t('deals.noDealsFiltered') : t('deals.noDeals') }}
    </p>
    <p class="empty-state__hint">
      {{ isFiltered ? t('deals.noDealsFilteredHint') : t('deals.noDealsHint') }}
    </p>
  </div>

  <!-- Desktop table OR mobile cards — never both in DOM simultaneously -->
  <template v-else>
    <div v-if="!isMobile" class="deal-table-wrapper">
      <table class="deal-table">
        <thead>
          <tr>
            <th>{{ t('deals.dealName') }}</th>
            <th>{{ t('deals.accountName') }}</th>
            <th>{{ t('deals.status') }}</th>
            <th class="text-right">{{ t('deals.amount') }}</th>
            <th>{{ t('deals.createdDate') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="deal in deals"
            :key="deal.dealId"
            class="deal-row"
            tabindex="0"
            role="button"
            :aria-label="t('deals.openDeal', { name: deal.dealName })"
            @click="$emit('select', deal.dealId)"
            @keydown.enter="$emit('select', deal.dealId)">
            <td>
              <div class="deal-name-cell">
                <span class="deal-name">{{ deal.dealName }}</span>
                <span class="deal-id">{{ deal.dealId }}</span>
              </div>
            </td>
            <td>{{ deal.accountName }}</td>
            <td><StatusBadge :status="deal.status" /></td>
            <td class="text-right amount-cell">
              {{ formatAmount(deal.amount) }}
            </td>
            <td class="date-cell">{{ formatDate(deal.createdDate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="deal-cards">
      <div
        v-for="deal in deals"
        :key="deal.dealId"
        class="deal-card"
        tabindex="0"
        role="button"
        :aria-label="t('deals.openDeal', { name: deal.dealName })"
        @click="$emit('select', deal.dealId)"
        @keydown.enter="$emit('select', deal.dealId)">
        <div class="deal-card__top">
          <div>
            <div class="deal-card__name">{{ deal.dealName }}</div>
            <div class="deal-card__account">{{ deal.accountName }}</div>
          </div>
          <StatusBadge :status="deal.status" />
        </div>
        <div class="deal-card__bottom">
          <span class="deal-card__amount">{{ formatAmount(deal.amount) }}</span>
          <span class="deal-card__date">{{
            formatDate(deal.createdDate)
          }}</span>
        </div>
        <div class="deal-card__id">{{ deal.dealId }}</div>
      </div>
    </div>
  </template>
</template>

<style scoped>
  /* Table - Desktop */
  .deal-table-wrapper {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .deal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .deal-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--c-text-muted);
    background: var(--c-surface-alt);
    border-bottom: 1px solid var(--c-border);
    white-space: nowrap;
  }

  .deal-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--c-border);
    vertical-align: middle;
  }

  .deal-row {
    cursor: pointer;
    transition: background var(--duration) var(--ease);
  }

  .deal-row:hover {
    background: var(--c-accent-subtle);
  }

  .deal-row:focus-visible {
    outline: 2px solid var(--c-accent);
    outline-offset: -2px;
  }

  .deal-row:last-child td {
    border-bottom: none;
  }

  .deal-name-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .deal-name {
    font-weight: 600;
    color: var(--c-text);
  }

  .deal-id {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--c-text-muted);
  }

  .amount-cell {
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: 0.875rem;
  }

  .date-cell {
    color: var(--c-text-secondary);
    white-space: nowrap;
  }

  .text-right {
    text-align: right;
  }

  /* Cards - Mobile */
  .deal-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .deal-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    cursor: pointer;
    transition: all var(--duration) var(--ease);
  }

  .deal-card:hover {
    border-color: var(--c-accent);
    box-shadow: var(--shadow-sm);
  }

  .deal-card:focus-visible {
    outline: 2px solid var(--c-accent);
    outline-offset: 2px;
  }

  .deal-card__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .deal-card__name {
    font-weight: 600;
    font-size: 0.9375rem;
    line-height: 1.3;
  }

  .deal-card__account {
    font-size: 0.8125rem;
    color: var(--c-text-secondary);
    margin-top: 2px;
  }

  .deal-card__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .deal-card__amount {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.9375rem;
  }

  .deal-card__date {
    font-size: 0.75rem;
    color: var(--c-text-muted);
  }

  .deal-card__id {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--c-text-muted);
    margin-top: var(--space-xs);
  }

  /* Skeleton */
  .skeleton-wrapper {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .skeleton-row {
    display: flex;
    gap: var(--space-md);
    padding: 14px 0;
    border-bottom: 1px solid var(--c-border);
  }

  .skeleton-row:last-child {
    border-bottom: none;
  }

  .skeleton {
    height: 16px;
    background: var(--c-surface-alt);
    border-radius: 4px;
    animation: pulse 1.5s infinite;
  }

  .skeleton--wide {
    width: 200px;
  }
  .skeleton--medium {
    width: 120px;
  }
  .skeleton--small {
    width: 70px;
  }

  @media (min-width: 1280px) {
    .deal-table th,
    .deal-table td {
      padding-left: 20px;
      padding-right: 20px;
    }
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl) var(--space-lg);
    text-align: center;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
  }

  .empty-state__title {
    font-weight: 600;
    margin-top: var(--space-md);
    color: var(--c-text);
  }

  .empty-state__hint {
    font-size: 0.8125rem;
    color: var(--c-text-muted);
    margin-top: var(--space-xs);
  }
</style>
