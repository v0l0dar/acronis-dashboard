<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useDealStore } from '../stores/dealStore'
  import { ROLES } from '../utils/security'
  import { ref, onMounted, onUnmounted } from 'vue'

  const { t, locale } = useI18n()
  const store = useDealStore()
  const langOpen = ref<boolean>(false)
  const roleOpen = ref<boolean>(false)

  interface Language {
    code: string
    label: string
    flag: string
  }

  const languages: Language[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
  ]

  function setLanguage(code: string): void {
    locale.value = code
    langOpen.value = false
  }

  function setRole(role: string): void {
    store.setRole(role)
    roleOpen.value = false
  }

  function toggleRoleDropdown(): void {
    roleOpen.value = !roleOpen.value
    langOpen.value = false
  }

  function toggleLangDropdown(): void {
    langOpen.value = !langOpen.value
    roleOpen.value = false
  }

  function handleClickOutside(): void {
    langOpen.value = false
    roleOpen.value = false
  }

  onMounted(() => document.addEventListener('click', handleClickOutside))
  onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <router-link to="/" class="header__brand">
        <div class="header__logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="var(--c-accent)" />
            <path
              d="M8 10h12M8 14h8M8 18h10"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round" />
          </svg>
        </div>
        <div class="header__title-group">
          <span class="header__title">{{ t('app.title') }}</span>
          <span class="header__subtitle">{{ t('app.subtitle') }}</span>
        </div>
      </router-link>

      <div class="header__actions">
        <!-- Role Switcher -->
        <div class="dropdown" :class="{ 'dropdown--open': roleOpen }">
          <button
            class="dropdown__trigger"
            :class="{
              'dropdown__trigger--partner': store.currentRole === ROLES.PARTNER
            }"
            :aria-label="t('roles.label')"
            @click.stop="toggleRoleDropdown">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="5"
                r="3"
                stroke="currentColor"
                stroke-width="1.5" />
              <path
                d="M2 14c0-3 2.5-5 6-5s6 2 6 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round" />
            </svg>
            <span class="dropdown__label">{{
              store.currentRole === ROLES.ADMIN
                ? t('roles.admin')
                : t('roles.partner')
            }}</span>
            <svg
              class="dropdown__chevron"
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
          <div v-if="roleOpen" class="dropdown__menu" @click.stop>
            <button
              class="dropdown__item"
              :class="{
                'dropdown__item--active': store.currentRole === ROLES.ADMIN
              }"
              @click="setRole(ROLES.ADMIN)">
              <span>{{ t('roles.admin') }}</span>
              <span class="dropdown__hint">{{ t('roles.adminHint') }}</span>
            </button>
            <button
              class="dropdown__item"
              :class="{
                'dropdown__item--active': store.currentRole === ROLES.PARTNER
              }"
              @click="setRole(ROLES.PARTNER)">
              <span>{{ t('roles.partner') }}</span>
              <span class="dropdown__hint">{{ t('roles.partnerHint') }}</span>
            </button>
          </div>
        </div>

        <!-- Language Switcher -->
        <div class="dropdown" :class="{ 'dropdown--open': langOpen }">
          <button
            class="dropdown__trigger"
            :aria-label="t('language.label')"
            :aria-expanded="langOpen"
            aria-haspopup="listbox"
            @click.stop="toggleLangDropdown">
            <span class="dropdown__flag" aria-hidden="true">{{
              languages.find((l) => l.code === locale)?.flag
            }}</span>
            <span class="dropdown__label hide-mobile">{{
              languages.find((l) => l.code === locale)?.label
            }}</span>
            <svg
              class="dropdown__chevron"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden="true">
              <path
                d="M3 5l3 3 3-3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
          <div
            v-if="langOpen"
            class="dropdown__menu"
            role="listbox"
            :aria-label="t('language.label')"
            @click.stop>
            <button
              v-for="lang in languages"
              :key="lang.code"
              class="dropdown__item"
              :class="{ 'dropdown__item--active': locale === lang.code }"
              role="option"
              :aria-selected="locale === lang.code"
              @click="setLanguage(lang.code)">
              <span class="dropdown__flag" aria-hidden="true">{{
                lang.flag
              }}</span>
              <span>{{ lang.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
  .header {
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header__inner {
    max-width: 1360px;
    margin: 0 auto;
    padding: 0 var(--space-xl);
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header__brand {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .header__title-group {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .header__title {
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: -0.02em;
  }

  .header__subtitle {
    font-size: 0.75rem;
    color: var(--c-text-muted);
    font-weight: 400;
  }

  .header__actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  /* Dropdown */
  .dropdown {
    position: relative;
  }

  .dropdown__trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--c-border);
    color: var(--c-text);
    font-size: 0.8125rem;
    font-weight: 500;
    transition: all var(--duration) var(--ease);
    background: var(--c-surface);
  }

  .dropdown__trigger:hover {
    border-color: var(--c-border-strong);
    background: var(--c-surface-alt);
  }

  .dropdown__trigger--partner {
    border-color: var(--c-accent);
    color: var(--c-accent);
    background: var(--c-accent-subtle);
  }

  .dropdown__chevron {
    transition: transform var(--duration) var(--ease);
  }

  .dropdown--open .dropdown__chevron {
    transform: rotate(180deg);
  }

  .dropdown__flag {
    font-size: 1rem;
    line-height: 1;
  }

  .dropdown__label {
    white-space: nowrap;
  }

  .dropdown__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    min-width: 180px;
    padding: var(--space-xs);
    z-index: 200;
    animation: fadeIn 0.15s var(--ease);
  }

  .dropdown__item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    color: var(--c-text);
    text-align: left;
    transition: background var(--duration) var(--ease);
    flex-wrap: wrap;
  }

  .dropdown__item:hover {
    background: var(--c-surface-alt);
  }

  .dropdown__item--active {
    background: var(--c-accent-light);
    color: var(--c-accent);
    font-weight: 600;
  }

  .dropdown__hint {
    width: 100%;
    font-size: 0.7rem;
    color: var(--c-text-muted);
    font-weight: 400;
  }

  @media (max-width: 768px) {
    .header__inner {
      padding: 0 var(--space-md);
    }
    .hide-mobile {
      display: none;
    }
    .header__subtitle {
      display: none;
    }
  }
</style>
