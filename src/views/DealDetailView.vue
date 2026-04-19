<script setup lang="ts">
  import { onMounted, watch, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useDealStore } from '../stores/dealStore'
  import { useFormatter } from '../composables/useFormatter'
  import { isValidEmail } from '../utils/security'
  import StatusBadge from '../components/StatusBadge.vue'
  import ErrorState from '../components/ErrorState.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const store = useDealStore()

  const { formatAmount, formatDate: _formatDate } = useFormatter()

  const dealId = computed<string>(() => {
    const id = route.params.id
    return Array.isArray(id) ? id[0] : id
  })

  onMounted(() => {
    store.loadDealDetail(dealId.value)
  })

  watch(dealId, (newId) => {
    if (newId) store.loadDealDetail(newId)
  })

  function goBack(): void {
    if (window.history.state?.back) {
      router.back()
    } else {
      router.push({ name: 'dashboard' })
    }
  }

  function formatDate(iso: string): string {
    return _formatDate(iso, {
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const contactEmailHref = computed<string | null>(() => {
    const email = store.currentDeal?.contactEmail
    return isValidEmail(email) ? `mailto:${email}` : null
  })
</script>

<template>
  <div class="detail">
    <button class="detail__back" @click="goBack">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M10 3L5 8l5 5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
      {{ t('nav.back') }}
    </button>

    <!-- Loading -->
    <div v-if="store.detailLoading" class="detail__skeleton">
      <div class="skeleton skeleton--title" />
      <div class="skeleton skeleton--subtitle" />
      <div class="detail__skeleton-grid">
        <div v-for="n in 6" :key="n" class="skeleton skeleton--field" />
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="store.detailNotFound" class="empty-state" role="status">
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
      <p class="empty-state__title">{{ t('deals.notFound') }}</p>
      <p class="empty-state__hint">{{ t('deals.notFoundHint') }}</p>
      <button class="empty-state__back" @click="goBack">
        {{ t('nav.back') }}
      </button>
    </div>

    <!-- Server error -->
    <ErrorState
      v-else-if="store.detailError"
      :message="
        store.detailError === 'timeout'
          ? t('errors.timeout')
          : t('errors.detailFailed')
      "
      @retry="store.loadDealDetail(dealId)" />

    <!-- Content -->
    <template v-else-if="store.currentDeal">
      <div class="detail__header">
        <div>
          <h1 class="detail__title">{{ store.currentDeal.dealName }}</h1>
          <p class="detail__id">{{ store.currentDeal.dealId }}</p>
        </div>
        <StatusBadge :status="store.currentDeal.status" />
      </div>

      <div class="detail__card">
        <div class="detail__grid">
          <div class="detail__field">
            <span class="detail__label">{{ t('deals.accountName') }}</span>
            <span class="detail__value">{{
              store.currentDeal.accountName
            }}</span>
          </div>

          <div class="detail__field">
            <span class="detail__label">{{ t('deals.amount') }}</span>
            <span class="detail__value detail__value--mono">
              {{ formatAmount(store.currentDeal.amount) }}
            </span>
          </div>

          <div class="detail__field">
            <span class="detail__label">{{ t('deals.createdDate') }}</span>
            <span class="detail__value">{{
              formatDate(store.currentDeal.createdDate)
            }}</span>
          </div>

          <div class="detail__field">
            <span class="detail__label">{{ t('deals.updatedDate') }}</span>
            <span class="detail__value">{{
              formatDate(store.currentDeal.updatedDate)
            }}</span>
          </div>

          <div class="detail__field">
            <span class="detail__label">{{ t('deals.contact') }}</span>
            <span class="detail__value">{{
              store.currentDeal.contactName
            }}</span>
          </div>

          <div class="detail__field">
            <span class="detail__label">{{ t('deals.contactEmail') }}</span>
            <a
              v-if="contactEmailHref"
              class="detail__value detail__value--link"
              :href="contactEmailHref">
              {{ store.currentDeal.contactEmail }}
            </a>
            <span v-else class="detail__value">
              {{ store.currentDeal.contactEmail }}
            </span>
          </div>

          <div class="detail__field">
            <span class="detail__label">{{ t('deals.assignedTo') }}</span>
            <span class="detail__value">{{
              store.currentDeal.assignedTo
            }}</span>
          </div>
        </div>

        <div v-if="store.currentDeal.description" class="detail__section">
          <span class="detail__label">{{ t('deals.description') }}</span>
          <p class="detail__text">{{ store.currentDeal.description }}</p>
        </div>

        <div v-if="store.currentDeal.notes" class="detail__section">
          <span class="detail__label">{{ t('deals.notes') }}</span>
          <p class="detail__text">{{ store.currentDeal.notes }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .detail {
    animation: fadeIn 0.35s var(--ease);
  }

  .detail__back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--c-text-secondary);
    padding: 6px 12px 6px 8px;
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-lg);
    transition: all var(--duration) var(--ease);
  }

  .detail__back:hover {
    color: var(--c-accent);
    background: var(--c-accent-light);
  }

  .detail__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .detail__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.3;
  }

  .detail__id {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--c-text-muted);
    margin-top: 4px;
  }

  .detail__card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
  }

  .detail__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
  }

  .detail__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail__label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--c-text-muted);
  }

  .detail__value {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--c-text);
  }

  .detail__value--link {
    color: var(--c-accent);
    text-decoration: none;
    transition: color var(--duration) var(--ease);
  }

  .detail__value--link:hover {
    color: var(--c-accent-hover);
    text-decoration: underline;
  }

  .detail__value--mono {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 1.125rem;
  }

  .detail__section {
    padding-top: var(--space-lg);
    border-top: 1px solid var(--c-border);
    margin-top: var(--space-lg);
  }

  .detail__text {
    font-size: 0.9375rem;
    color: var(--c-text-secondary);
    margin-top: 6px;
    line-height: 1.7;
  }

  /* Empty / Not-found state */
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
    gap: var(--space-xs);
  }

  .empty-state__title {
    font-weight: 600;
    margin-top: var(--space-md);
    color: var(--c-text);
  }

  .empty-state__hint {
    font-size: 0.8125rem;
    color: var(--c-text-muted);
  }

  .empty-state__back {
    margin-top: var(--space-md);
    padding: 8px 20px;
    background: var(--c-accent);
    color: #fff;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 600;
    transition: background var(--duration) var(--ease);
  }

  .empty-state__back:hover {
    background: var(--c-accent-hover);
  }

  /* Skeleton */
  .detail__skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .skeleton {
    background: var(--c-surface-alt);
    border-radius: 6px;
    animation: pulse 1.5s infinite;
  }

  .skeleton--title {
    height: 28px;
    width: 320px;
    max-width: 100%;
  }

  .skeleton--subtitle {
    height: 16px;
    width: 140px;
  }

  .detail__skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-md);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
  }

  .skeleton--field {
    height: 40px;
  }

  @media (max-width: 768px) {
    .detail__card {
      padding: var(--space-md);
    }
    .detail__grid {
      grid-template-columns: 1fr;
      gap: var(--space-md);
    }
    .detail__title {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 360px) {
    .detail__card {
      padding: var(--space-sm);
    }
    .detail__title {
      font-size: 1.125rem;
    }
    .detail__back {
      margin-bottom: var(--space-md);
    }
    .detail__skeleton-grid {
      padding: var(--space-md);
    }
  }

  @media (min-width: 1280px) {
    .detail__title {
      font-size: 1.75rem;
    }
    .detail__grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
