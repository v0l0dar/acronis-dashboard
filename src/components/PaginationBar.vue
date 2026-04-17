<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const {
    page,
    totalPages,
    total,
    pageSize
  } = defineProps<{
    page: number
    totalPages: number
    total: number
    pageSize: number
  }>()

  const emit = defineEmits<{
    'page-change': [page: number]
  }>()

  const from = computed(() => (page - 1) * pageSize + 1)
  const to = computed(() => Math.min(page * pageSize, total))

  const visiblePages = computed(() => {
    const pages: (number | string)[] = []
    const curr = page

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (curr > 3) pages.push('...')

      const start = Math.max(2, curr - 1)
      const end = Math.min(totalPages - 1, curr + 1)
      for (let i = start; i <= end; i++) pages.push(i)

      if (curr < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  })
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <div class="pagination__info">
      {{ t('pagination.showing', { from, to, total }) }}
    </div>

    <div class="pagination__controls">
      <button
        class="pagination__btn pagination__btn--nav"
        :disabled="page <= 1"
        :aria-label="t('pagination.prev')"
        @click="emit('page-change', page - 1)">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path
            d="M9 3L5 7l4 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>

      <template v-for="(p, idx) in visiblePages" :key="idx">
        <span v-if="p === '...'" class="pagination__ellipsis">…</span>
        <button
          v-else
          class="pagination__btn"
          :class="{ 'pagination__btn--active': p === page }"
          @click="emit('page-change', p as number)">
          {{ p }}
        </button>
      </template>

      <button
        class="pagination__btn pagination__btn--nav"
        :disabled="page >= totalPages"
        :aria-label="t('pagination.next')"
        @click="emit('page-change', page + 1)">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) 0;
  }

  .pagination__info {
    font-size: 0.8125rem;
    color: var(--c-text-muted);
    white-space: nowrap;
  }

  .pagination__controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pagination__btn {
    min-width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--c-text-secondary);
    transition: all var(--duration) var(--ease);
  }

  .pagination__btn:hover:not(:disabled) {
    background: var(--c-surface-alt);
    border-color: var(--c-border);
  }

  .pagination__btn--active {
    background: var(--c-accent) !important;
    color: #fff !important;
    border-color: var(--c-accent) !important;
    font-weight: 700;
  }

  .pagination__btn--nav {
    border: 1px solid var(--c-border);
    background: var(--c-surface);
  }

  .pagination__btn--nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .pagination__ellipsis {
    width: 34px;
    text-align: center;
    color: var(--c-text-muted);
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    .pagination {
      flex-direction: column;
      gap: var(--space-sm);
    }
  }

  @media (max-width: 360px) {
    .pagination__btn {
      min-width: 30px;
      height: 30px;
      font-size: 0.75rem;
    }
    .pagination__info {
      font-size: 0.75rem;
    }
  }

  @media (min-width: 1280px) {
    .pagination__btn {
      min-width: 38px;
      height: 38px;
    }
  }
</style>
