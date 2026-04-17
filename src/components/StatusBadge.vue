<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const { status } = defineProps<{
    status: string
  }>()
</script>

<template>
  <span class="status-badge" :class="`status-badge--${status.toLowerCase()}`">
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
