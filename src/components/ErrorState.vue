<script setup>
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  defineProps({
    message: { type: String, default: '' }
  })

  defineEmits(['retry'])
</script>

<template>
  <div class="error-state">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="var(--c-rejected)"
        stroke-width="2" />
      <path
        d="M20 14v8"
        stroke="var(--c-rejected)"
        stroke-width="2"
        stroke-linecap="round" />
      <circle cx="20" cy="26" r="1.5" fill="var(--c-rejected)" />
    </svg>
    <p class="error-state__msg">{{ message || t('errors.fetchFailed') }}</p>
    <button class="error-state__retry" @click="$emit('retry')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M1.5 7a5.5 5.5 0 019.37-3.9M12.5 7a5.5 5.5 0 01-9.37 3.9"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round" />
        <path
          d="M11 1v3h-3M3 13v-3h3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
      {{ t('errors.retry') }}
    </button>
  </div>
</template>

<style scoped>
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-2xl);
    text-align: center;
    background: var(--c-surface);
    border: 1px solid var(--c-rejected-bg);
    border-radius: var(--radius-md);
  }

  .error-state__msg {
    font-size: 0.9375rem;
    color: var(--c-text-secondary);
    max-width: 360px;
  }

  .error-state__retry {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    background: var(--c-accent);
    color: #fff;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 600;
    transition: background var(--duration) var(--ease);
  }

  .error-state__retry:hover {
    background: var(--c-accent-hover);
  }
</style>
