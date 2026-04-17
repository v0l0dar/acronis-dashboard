<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { sanitizeSearchQuery } from '../utils/security'

  const { t } = useI18n()
  const emit = defineEmits<{
    search: [query: string]
  }>()

  const { modelValue = '' } = defineProps<{
    modelValue?: string
  }>()

  const localQuery = ref<string>(modelValue)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => modelValue,
    (val) => {
      localQuery.value = val
    }
  )

  onUnmounted(() => {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
  })

  function onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value
    localQuery.value = raw
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      emit('search', sanitizeSearchQuery(raw) as string)
    }, 300)
  }

  function onClear(): void {
    localQuery.value = ''
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    emit('search', '')
  }
</script>

<template>
  <div class="search-bar">
    <label :for="'search-input'" class="sr-only">{{ t('search.label') }}</label>
    <div class="search-bar__wrapper">
      <svg
        class="search-bar__icon"
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
</style>
