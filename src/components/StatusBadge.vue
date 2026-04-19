<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { DealStatus } from '../types'

  const { t } = useI18n()

  const { status } = defineProps<{
    status: DealStatus
  }>()

  const KNOWN_STATUSES = new Set<DealStatus>(['Open', 'Approved', 'Rejected'])

  const badgeClass = computed(() =>
    KNOWN_STATUSES.has(status) ? `status-badge--${status.toLowerCase()}` : null
  )
</script>

<template>
  <span class="status-badge" :class="badgeClass">
    {{ t(`status.${status}`) }}
  </span>
</template>

<style scoped>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .status-badge--open {
    background: var(--c-open-bg);
    color: var(--c-open);
  }

  .status-badge--approved {
    background: var(--c-approved-bg);
    color: var(--c-approved);
  }

  .status-badge--rejected {
    background: var(--c-rejected-bg);
    color: var(--c-rejected);
  }
</style>
