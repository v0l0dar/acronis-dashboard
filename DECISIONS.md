# Architecture & Decision Document

## 1. Architecture Choice

### Selected: Feature-based Modular Architecture with Service Layer

The application follows a **layered architecture** within a feature-based structure:

```
Views → Components → Stores → Services → Data
```

**Why this approach:**

- **Separation of concerns** — Each layer has a clear responsibility. Views compose components. Components render UI and emit events. Stores manage state and coordinate side effects. Services handle data access and transformation.
- **Testability** — The service layer (`dealService.js`) and utility modules (`deduplication.js`, `security.js`, `cache.js`) are pure functions with no framework dependencies. They can be unit tested without Vue's test utilities.
- **Swappability** — The mock service layer has the same interface a real API client would have. Transitioning to a real backend requires changing only the service layer — no component or store changes needed.
- **Scalability** — New features (e.g., a "Partners" section) can follow the same pattern: add a service, store, and view without touching existing code.

**Alternatives considered:**

- **Monolithic store** — All logic in Pinia. Rejected because it conflates data access with state management and makes testing harder.
- **Composables-only** (no Pinia) — Using `useDeals()` composables. Viable for smaller apps, but Pinia provides better DevTools support, SSR compatibility, and cross-component state sharing.

---

## 2. State Management Choice

### Selected: Pinia (single `dealStore`)

**Why Pinia:**

- **Official recommendation** — Pinia is the official state management for Vue 3, replacing Vuex
- **Composition API native** — Integrates seamlessly with `<script setup>` and `ref`/`computed`
- **Minimal boilerplate** — No mutations, no action types, no module namespacing. A store is just a function that returns reactive state and methods
- **DevTools integration** — Full Vue DevTools support for state inspection and time-travel debugging
- **Type-safe** — Works naturally with TypeScript (important for growing codebases)

**Why a single store:**

The deal management feature is cohesive — list state, detail state, search, filters, pagination, and RBAC all interact closely. Splitting into multiple stores (e.g., `searchStore`, `filterStore`) would create artificial boundaries and require cross-store coordination.

If the app grew to include Partners, Reports, and Settings, each would get its own store — keeping feature boundaries clean.

---

## 3. Scalability Approach

### How this solution would scale:

**More data (10k+ deals):**

- The pagination architecture inherently handles this — only one page of data is in memory at a time
- Server-side filtering/search would replace client-side logic (the service layer interface stays identical)
- Virtual scrolling (`vue-virtual-scroller`) could be added for very long filtered results
- The caching layer would adopt cache-aside with ETag/If-Modified-Since for efficient revalidation

**More users (concurrent access):**

- Replace polling with WebSocket for real-time updates (the `mergeAndDeduplicate` function already handles incoming updates correctly)
- Add optimistic UI updates for deal status changes
- Implement conflict resolution (last-write-wins or user notification)

**More features (additional modules):**

- Each feature gets its own store, service, and route module
- Shared components (SearchBar, FilterPanel, Pagination) are already generic and reusable
- A design token system (CSS custom properties) ensures visual consistency across new features
- i18n locale files can be split per-feature using vue-i18n's lazy loading

**More complexity (workflows, approvals):**

- State machine patterns for deal lifecycle (Open → Under Review → Approved/Rejected)
- WebSocket channels per deal for real-time collaboration
- Audit log service for tracking changes

---

## 4. Bottlenecks and Risks

### Current Bottlenecks

| Bottleneck                       | Impact                                                                          | Severity | Mitigation Path                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| **Client-side filtering**        | With 10k+ records, filtering all data on every keystroke could lag              | Medium   | Move filtering to server; debounce already mitigates for current scale                                                |
| **Full dataset in mock service** | The mock stores all 150+ deals in memory; a real API would paginate server-side | Low      | Service layer abstraction makes server-side pagination a drop-in                                                      |
| **Polling frequency**            | 30s polling creates unnecessary requests when user is idle/tab is hidden        | Low      | Add `visibilitychange` listener to pause polling; use WebSocket for critical updates                                  |
| **No request deduplication**     | Rapid filter changes can trigger multiple concurrent API calls                  | Medium   | Add request cancellation (AbortController) or a queue with latest-only semantics                                      |
| **CSS-only responsive toggle**   | Both table and card HTML are rendered, only one is visible                      | Low      | Acceptable trade-off for simplicity; conditional rendering via `v-if` + media query composable would reduce DOM nodes |

### Technical Risks

| Risk                                      | Probability | Impact   | Mitigation                                                                          |
| ----------------------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------- |
| **State desync between cache and store**  | Low         | High     | Cache TTL is short (60s); polling invalidates caches; role changes clear everything |
| **XSS via unsanitized filter values**     | Very Low    | Critical | All inputs pass through sanitization; Vue templates auto-escape; no `v-html` usage  |
| **Stale data after network reconnection** | Medium      | Medium   | Polling auto-recovers; adding a "connection restored" refresh would be ideal        |
| **i18n key mismatches**                   | Low         | Low      | Using typed keys and fallback locale (`en`) ensures graceful degradation            |
| **Browser back/forward state loss**       | Medium      | Low      | Filter/search state is not in the URL; adding query param sync would preserve it    |

### Performance Considerations

- **Bundle size:** ~70KB gzipped (Vue + Pinia + Router + i18n) — well within acceptable range
- **First paint:** No heavy computation blocks rendering; mock data generates lazily
- **Re-render efficiency:** Computed properties in the store prevent unnecessary component updates; `v-for` uses stable `:key` attributes (dealId)
- **Memory:** Paginated data keeps only 15 records in the active list; polling merges efficiently via Map-based deduplication
