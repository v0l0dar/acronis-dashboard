# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server (Vite)
npm run build         # Production build
npm run preview       # Preview production build

npm run test          # Run tests once (Vitest)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format src/**
npm run format:check  # Prettier check without writing
npm run type-check    # vue-tsc type check (no emit)
```

To run a single test file: `npx vitest run src/path/to/file.test.ts`

## Architecture

Vue 3 (Composition API / `<script setup>`) + Pinia + Vue Router + vue-i18n, built with Vite. TypeScript strict mode is on (`noUnusedLocals`, `noUnusedParameters`).

**Data flow:**

```
View (views/)  →  Pinia Store (dealStore)  →  Service (dealService)  →  Mock Data + Cache
```

- `dealService.ts` is the single point of API access; it handles pagination, filtering, search, and TTL caching. Swapping to a real API means changing only this file.
- `dealStore.ts` is the sole Pinia store; it owns all deal state, computed filters, and polling logic (30 s interval, paused when tab is hidden).
- Views sync their filter/search/page state to URL query params.

**Key utilities in `src/utils/`:**
- `cache.ts` — `CacheStore` class with TTL: 60 s for list results, 5 min for detail records.
- `deduplication.ts` — O(n) Map-based dedup keyed on `dealId`, keeping the entry with the newest `updatedDate`.
- `security.ts` — Input sanitization (`sanitizeInput`, `sanitizeSearchQuery`), RBAC helpers (`filterDealsByRole`), and `safeLog` (strips sensitive fields before logging).
- `dealFilters.ts` — Single source of truth for the per-deal filter predicate (`matchesDealFilters`); shared by `dealService` and `dealStore` so filtering logic never drifts between the two.
- `smartSearchParser.ts` — Parses natural-language search strings (e.g. `"status:approved amount>10k"`) into structured `DealFilters`, returning a `SmartSearchResult` with resolved filters and any residual free-text query.

**Responsive layout:** 768 px breakpoint. `DealTable` renders both a `<table>` and a card list, toggling visibility via CSS; `useIsMobile` composable provides a reactive flag when JS-driven behavior is needed.

**i18n:** 4 locales (EN, JA, DE, ES) under `src/i18n/locales/`. All locales are bundled at build time (no lazy loading). The runtime-only vue-i18n build is aliased in `vite.config.js`.

## Code Style

- Prettier: no semicolons, single quotes, no trailing commas, 80-char print width.
- ESLint v9 flat config; multi-word component names are **not** required (exception added).
- HTML self-closing tags are enforced in `.vue` files.
