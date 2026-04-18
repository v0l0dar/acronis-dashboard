# Acronis Dashboard – Deal Management Dashboard

A production-style frontend feature built with **Vue.js 3**, featuring a comprehensive deal management dashboard with search, filtering, pagination, i18n, RBAC simulation, and real-time polling.

---

## Setup Instructions

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Requirements:** Node.js 18+ and npm 9+.

---

## Architecture Explanation

### Project Structure

```
src/
├── api/              # API service layer & mock data generator
│   ├── dealService.js    # Simulated REST API with caching, errors, pagination
│   └── mockData.js       # Deterministic deal data generator
├── assets/           # Global CSS (design tokens, reset, animations)
├── components/       # Reusable UI components
│   ├── AppHeader.vue     # Top bar with language & role switchers
│   ├── SearchBar.vue     # Debounced global search input
│   ├── FilterPanel.vue   # Collapsible multi-filter panel
│   ├── DealTable.vue     # Responsive table/card deal list
│   ├── PaginationBar.vue # Page navigation with ellipsis logic
│   ├── StatusBadge.vue   # Status indicator pill
│   └── ErrorState.vue    # Error display with retry action
├── i18n/             # Internationalization
│   ├── index.js          # vue-i18n setup
│   └── locales/          # en.json, ja.json, de.json, es.json
├── router/           # Vue Router config with route guards
├── stores/           # Pinia state management
│   └── dealStore.js      # Central deal state, actions, polling
├── utils/            # Shared utilities
│   ├── cache.js          # In-memory TTL cache
│   ├── deduplication.js  # O(n) Map-based deduplication
│   └── security.js       # XSS sanitization, RBAC, safe logging
├── views/            # Route-level view components
│   ├── DashboardView.vue # Deal list page
│   └── DealDetailView.vue# Single deal detail page
├── App.vue           # Root component with layout shell
└── main.js           # Application entry point
```

### Key Architectural Decisions

- **Composition API throughout** – all components use `<script setup>` for cleaner, more type-friendly code
- **Pinia for state** – lightweight, TypeScript-native store; single `dealStore` handles all deal-related state
- **Service layer pattern** – `dealService.js` abstracts data fetching, making it trivial to swap mock data for a real API
- **Component responsibility** – each component has a single, well-defined purpose; views compose components

---

## Pagination Decision

**Chosen approach: Pagination** (not infinite scroll).

**Rationale:**

- **Predictable navigation** – users can jump to specific pages, bookmark positions, and share page links
- **Better for data management** – deal lists are typically scanned, filtered, and acted on; pagination makes "where am I" obvious
- **Performance** – bounded DOM size regardless of dataset size; no memory accumulation from scrolling
- **Simpler state management** – page number is a clean, serializable piece of state
- **Enterprise UX convention** – Acronis Dashboards and CRM systems universally use pagination; users expect it

Infinite scroll would be more suitable for feed-style content (social media, news), not structured business data.

---

## Responsive Design Approach

Three breakpoints are supported:

| Breakpoint | Width   | Adaptation                                               |
| ---------- | ------- | -------------------------------------------------------- |
| Mobile     | ~360px  | Card layout for deals, stacked filters, reduced spacing  |
| Tablet     | ~768px  | Card layout, simplified header, full filter panel        |
| Desktop    | ~1280px | Full table layout, side-by-side filters, complete header |

**Implementation details:**

- The `DealTable` component renders **both** a `<table>` (desktop) and card list (mobile), toggled via CSS `display` rules — no JS re-rendering needed
- CSS custom properties (`--space-*`) scale down at smaller breakpoints
- Font size reduces from 15px (desktop) to 14px (tablet)
- Filters collapse to single-column grid on mobile
- Pagination stacks vertically on narrow screens
- The header hides the subtitle and language label text on mobile, keeping only flags/icons

---

## i18n Strategy

**Library:** `vue-i18n` v9 (Composition API mode, `legacy: false`).

**Supported languages:** English, Japanese (日本語), German (Deutsch), Spanish (Español).

**Approach:**

1. All user-visible text is externalized into JSON locale files under `src/i18n/locales/`
2. No hardcoded strings in templates — every label uses `t('key')`
3. Message interpolation for dynamic values: `t('deals.totalDeals', { count: 42 })`
4. Date and currency formatting use `Intl.DateTimeFormat` and `Intl.NumberFormat` with the active locale, ensuring culturally correct formats
5. A language switcher dropdown in the header allows runtime switching
6. The selected locale is reactive — all components re-render instantly

**Adding a new language:** Create a new JSON file in `locales/`, import it in `i18n/index.js`, and add an entry to the language list in `AppHeader.vue`.

---

## Security Considerations

### Top 5 Frontend Security Risks & Mitigations

**1. Cross-Site Scripting (XSS)**

- Primary defence is Vue's template engine, which auto-escapes all bound values by default — `v-html` is never used with user-controlled data
- `sanitizeSearchQuery()` normalises whitespace and enforces length limits for data hygiene; HTML escaping is intentionally left to Vue so that legitimate special characters (e.g. `&`, `<`) are not corrupted before string comparison
- `isValidDealId()` validates URL route parameters against a strict pattern, preventing malformed IDs from reaching the API layer

**2. Dependency Vulnerabilities**

- Minimal dependency footprint (Vue, Pinia, Vue Router, vue-i18n)
- No unnecessary third-party UI libraries that expand attack surface
- Regular `npm audit` recommended in CI/CD pipeline

**3. Sensitive Data Leakage**

- `safeLog()` is integrated into the service layer (`dealService.ts`) and store error handlers (`dealStore.ts`), actively redacting fields like `contactEmail`, `token`, and `password` before any console output
- Production mode suppresses all debug logging entirely (`import.meta.env.PROD` guard inside `safeLog`)
- No sensitive data stored in localStorage or sessionStorage

**4. Improper Error Handling**

- API errors show user-friendly messages, never raw stack traces
- `ErrorState` component provides retry without exposing internals
- Simulated HTTP 500 and timeout scenarios are handled gracefully

**5. Token Storage / Auth Issues**

- Authentication is not implemented — no tokens are issued, stored, or transmitted; there is nothing to steal from the browser
- RBAC simulation is frontend-only for UX demonstration; comments explicitly note that real enforcement must happen server-side

### Additional Security Measures

- Input length limits on all text fields (200 chars search, 100 chars filters)
- Numeric inputs validated and bounded via `sanitizeNumericInput()`
- Route parameter validation prevents navigation to malformed deal IDs

---

## Caching Strategy

**What is cached:**

- Deal list responses (keyed by page + search + filters)
- Individual deal detail responses

**Where caching is applied:**

- In-memory `CacheStore` instances in `src/utils/cache.js`
- List cache: 60-second TTL
- Detail cache: 5-minute TTL

**Cache invalidation:**

- Automatic expiry via TTL
- Polling updates invalidate all list caches and affected detail caches
- Role changes clear all caches entirely

**Trade-offs:**

- Simple and predictable; no stale data beyond TTL window
- Memory-only — does not persist across page reloads (intentional for security)
- Could be enhanced with ETag/If-Modified-Since for real API integration

---

## Real-Time Updates

**Approach:** Polling every 30 seconds.

**Why polling over WebSocket:**

- Simpler to implement and debug; no connection management
- Appropriate for deal management where sub-second updates aren't critical
- Works reliably behind corporate proxies and firewalls
- For a real system with high-frequency updates, WebSocket with a fallback to polling would be preferred

**Implementation:**

- `pollUpdates()` in `dealService.js` simulates occasional deal changes
- Updates are merged into the current deal list using `mergeAndDeduplicate()`
- Polling starts on dashboard mount, stops on unmount

---

## Deduplication Approach

Duplicate records may appear from API issues, pagination overlaps, or data refresh. The deduplication strategy:

1. Uses `dealId` as the unique identifier
2. Processes records in O(n) time using a `Map`
3. When duplicates are found, keeps the record with the most recent `updatedDate`
4. Applied at three points: after API fetch, during pagination merging, and on data refresh/polling

The mock data generator intentionally injects ~10 duplicates with older `updatedDate` values to verify the strategy works correctly.

---

## AI Usage Disclosure

This project was developed with AI assistance (Claude) for:

- Accelerating boilerplate code generation
- Generating locale translation strings
- Structuring documentation

All architectural decisions, component design, security strategies, and implementation logic were directed and reviewed by the developer.
