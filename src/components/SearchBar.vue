<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { sanitizeSearchQuery } from '../utils/security'
  import { parseSmartSearch } from '../utils/smartSearchParser'
  import type { SmartSearchResult } from '../utils/smartSearchParser'

  const { t } = useI18n()
  const emit = defineEmits<{
    search: [query: string]
    'smart-search': [result: SmartSearchResult]
  }>()

  const { modelValue = '' } = defineProps<{
    modelValue?: string
  }>()

  const localQuery = ref<string>(modelValue)
  const smartResult = ref<SmartSearchResult | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => modelValue,
    (val) => {
      localQuery.value = val
      if (!val) smartResult.value = null
    }
  )

  onUnmounted(() => {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
  })

  function onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value
    localQuery.value = raw

    const parsed = parseSmartSearch(raw)
    smartResult.value = parsed.isStructured ? parsed : null

    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (parsed.isStructured) {
        emit('smart-search', parsed)
      } else {
        smartResult.value = null
        emit('search', sanitizeSearchQuery(raw) as string)
      }
    }, 300)
  }

  function onClear(): void {
    const wasSmartActive = smartResult.value?.isStructured === true
    localQuery.value = ''
    smartResult.value = null
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (wasSmartActive) {
      emit('smart-search', { isStructured: false, filters: {}, residualQuery: '', hint: '' })
    } else {
      emit('search', '')
    }
  }
</script>

<template>
  <div class="search-bar">
    <label :for="'search-input'" class="sr-only">{{ t('search.label') }}</label>
    <div class="search-bar__wrapper">
      <svg
        class="search-bar__icon"
        :class="{ 'search-bar__icon--active': smartResult }"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none">
        <circle
          cx="7.5"
          cy="7.5"
          r="5.5"
          stroke="currentColor"
          stroke-width="1.5" />
        <path
          d="M12 12l4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round" />
      </svg>
      <input
        id="search-input"
        class="search-bar__input"
        :class="{ 'search-bar__input--smart': smartResult }"
        type="text"
        :placeholder="t('search.placeholder')"
        :value="localQuery"
        autocomplete="off"
        spellcheck="false"
        @input="onInput" />
      <button
        v-if="localQuery"
        class="search-bar__clear"
        :aria-label="t('filters.clearAll')"
        @click="onClear">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M4 4l6 6M10 4l-6 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round" />
        </svg>
      </button>
    </div>
    <transition name="smart-hint">
      <div v-if="smartResult" class="search-bar__hint">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M6 1l1.2 3.6H11L8.4 6.8l.9 3.6L6 8.4l-3.3 2 .9-3.6L1 4.6h3.8L6 1z"
            fill="currentColor" />
        </svg>
        <span>Smart filters: {{ smartResult.hint }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  .search-bar {
    width: 100%;
  }

  .search-bar__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-bar__icon {
    position: absolute;
    left: 14px;
    color: var(--c-text-muted);
    pointer-events: none;
    transition: color var(--duration) var(--ease);
  }

  .search-bar__icon--active {
    color: var(--c-accent);
  }

  .search-bar__input {
    width: 100%;
    padding: 11px 40px 11px 42px;
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    background: var(--c-surface);
    color: var(--c-text);
    font-size: 0.875rem;
    transition: all var(--duration) var(--ease);
    outline: none;
  }

  .search-bar__input::placeholder {
    color: var(--c-text-muted);
  }

  .search-bar__input:focus {
    border-color: var(--c-accent);
    box-shadow: var(--shadow-focus);
  }

  .search-bar__input--smart {
    border-color: var(--c-accent);
    box-shadow: var(--shadow-focus);
  }

  .search-bar__clear {
    position: absolute;
    right: 10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--c-text-muted);
    transition: all var(--duration) var(--ease);
  }

  .search-bar__clear:hover {
    background: var(--c-surface-alt);
    color: var(--c-text);
  }

  .search-bar__hint {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 6px;
    padding: 4px 10px;
    background: color-mix(in srgb, var(--c-accent) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--c-accent) 30%, transparent);
    border-radius: var(--radius-sm, 6px);
    color: var(--c-accent);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .smart-hint-enter-active,
  .smart-hint-leave-active {
    transition: opacity 0.2s var(--ease), transform 0.2s var(--ease);
  }

  .smart-hint-enter-from,
  .smart-hint-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
