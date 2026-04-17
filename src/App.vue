<script setup lang="ts">
  import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-main {
    flex: 1;
    max-width: 1360px;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-xl);
  }

  @media (max-width: 768px) {
    .app-main {
      padding: var(--space-md);
    }
  }

  @media (max-width: 360px) {
    .app-main {
      padding: var(--space-sm);
    }
  }

  @media (min-width: 1280px) {
    .app-main {
      padding: var(--space-xl) var(--space-2xl);
    }
  }
</style>
