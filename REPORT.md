# Feature Development Report

## Planned vs Actual Time Spent

| #   | Task                                                  | Planned    | Actual   | Delta     | Notes                                             |
| --- | ----------------------------------------------------- | ---------- | -------- | --------- | ------------------------------------------------- |
| 1   | Vite + Vue 3 project scaffolding                      | 0.5h       | 0.25h    | -0.25h    | Template generation faster than expected          |
| 2   | TypeScript config & path aliases                      | 0.5h       | 0.5h     | 0h        | Straightforward tsconfig setup                    |
| 3   | Pinia store skeleton & router setup                   | 1h         | 0.75h    | -0.25h    | Composition API store is concise                  |
| 4   | ESLint + Prettier configuration                       | 0.5h       | 0.5h     | 0h        | Flat config format took a moment to learn         |
| 5   | Mock data generator (150 deals, seeded)               | 1.5h       | 1.25h    | -0.25h    | Deterministic seeding simplified debugging        |
| 6   | `injectDuplicates` helper for test data               | 0.5h       | 0.5h     | 0h        | Required for deduplication smoke testing          |
| 7   | `fetchDeals` — pagination + search + filters          | 2h         | 2h       | 0h        | Filter combinations needed careful ordering       |
| 8   | `fetchDealById` — single record fetch                 | 0.5h       | 0.5h     | 0h        | Cache key per ID, null for invalid IDs            |
| 9   | `pollUpdates` — simulated real-time updates           | 1h         | 0.75h    | -0.25h    | Random mutation logic was simple                  |
| 10  | In-memory LRU cache utility                           | 1h         | 1h       | 0h        | TTL + LRU eviction for list & detail caches       |
| 11  | `DashboardView` — layout & table shell                | 1.5h       | 1.5h     | 0h        | CSS Grid layout for sidebar + main                |
| 12  | `DealTable` — desktop table + mobile cards            | 2.5h       | 3h       | +0.5h     | Dual-render approach required extra CSS work      |
| 13  | `DealDetailView` — detail page                        | 1.5h       | 1.5h     | 0h        | Two-column layout, back navigation                |
| 14  | `StatusBadge` component                               | 0.5h       | 0.25h    | -0.25h    | Simple pill component                             |
| 15  | `PaginationBar` component                             | 1h         | 1h       | 0h        | Page window calculation took iteration            |
| 16  | `AppHeader` — role switcher + i18n toggle             | 1.25h      | 1.25h    | 0h        | Dropdown interactions needed polish               |
| 17  | `SearchBar` — debounce + XSS sanitization             | 1h         | 0.75h    | -0.25h    | `perfect-debounce` made this straightforward      |
| 18  | `FilterPanel` — multi-type filters                    | 1.75h      | 2.25h    | +0.5h     | Numeric + date + status combined state was tricky |
| 19  | `ErrorState` component                                | 0.5h       | 0.5h     | 0h        | Reusable across list and detail views             |
| 20  | `deduplicateDeals` — Map-based O(n) dedup             | 0.75h      | 0.5h     | -0.25h    | Clean algorithm, well-tested mentally             |
| 21  | `mergeAndDeduplicate` for poll merging                | 0.5h       | 0.5h     | 0h        | Thin wrapper over `deduplicateDeals`              |
| 22  | Store: dedup on `loadDealDetail` (sync to list)       | 0.25h      | 0.25h    | 0h        | Prevents stale entries after detail fetch         |
| 23  | Responsive breakpoints & mobile layout                | 2h         | 2.5h     | +0.5h     | Card layout fine-tuning on small screens          |
| 24  | CSS custom properties & design tokens                 | 1h         | 1h       | 0h        | Earthy palette + DM Sans / JetBrains Mono         |
| 25  | Accessibility: ARIA labels & focus states             | 1h         | 1h       | 0h        | Keyboard navigation for table + filter panel      |
| 26  | vue-i18n setup & locale switching                     | 1h         | 1h       | 0h        | Composition API mode, runtime-only bundle         |
| 27  | EN / DE / ES / JA translation files                   | 2.5h       | 2.25h    | -0.25h    | Japanese date format required `Intl` override     |
| 28  | `Intl.DateTimeFormat` / `NumberFormat` per locale     | 0.75h      | 0.75h    | 0h        | Locale-aware currency + date formatting           |
| 29  | `security.js` — input sanitization & RBAC utils       | 1.25h      | 1h       | -0.25h    | Modular helpers reused across service layer       |
| 30  | Role-based data filtering (Admin / Manager / Partner) | 1h         | 1h       | 0h        | Client-side only; flagged as known limitation     |
| 31  | README.md — setup, architecture, decisions            | 2h         | 2h       | 0h        | Written alongside implementation                  |
| 32  | DECISIONS.md + ESTIMATION.md                          | 1h         | 1h       | 0h        | Structured rationale for key trade-offs           |
| 33  | REPORT.md — this document                             | 0.75h      | 0.75h    | 0h        | Filled in retrospectively                         |
| 34  | Manual QA — golden path + edge cases                  | 1h         | 1h       | 0h        | Filter combos, pagination edges, locale switch    |
|     | **Total**                                             | **~42.5h** | **~41h** | **-1.5h** | Slightly under estimate; no major surprises       |

---

## Challenges Encountered

### 1. Dual Rendering for Responsive Tables

The decision to render both a `<table>` and a card list (toggled by CSS) introduced some template duplication. The alternative — a single adaptive component — would have required more complex JS logic. CSS-only toggling was chosen for performance and simplicity.

### 2. Filter State Synchronization

The filter panel maintains local state (for controlled inputs) that syncs with the Pinia store. Managing the two-way flow — especially for numeric inputs that could be empty or null — required careful handling with watchers and type guards.

### 3. Deduplication Timing

Determining _when_ to apply deduplication (at the service layer, during merge, and on poll) was an architectural decision. Applying it at all three points is redundant but defensive — ensuring no path can produce duplicates in the UI.

### 4. i18n for Date/Currency

Using `Intl.DateTimeFormat` and `Intl.NumberFormat` with the active locale ensures culturally correct formatting, but the output varies significantly across locales (e.g., Japanese year format, German comma-as-decimal). Visual testing in each language was important.

---

## Design Decisions Made

### Visual Design

- **Warm industrial aesthetic** with an earthy palette (`#f5f3f0` background, `#d45a1e` accent) rather than the typical cold blue/purple SaaS look
- **DM Sans** typeface for a friendly yet professional feel; JetBrains Mono for data values
- **Status colors** are semantically distinct: teal (Open), blue (Approved), red (Rejected) — colorblind-safe contrast ratios

### Technical Design

- **Pagination over infinite scroll** — more appropriate for enterprise data management (see README for full rationale)
- **Polling over WebSocket** — simpler, sufficient for this update frequency, works behind proxies
- **In-memory cache over localStorage** — avoids security concerns with persistent storage while still reducing redundant API calls
- **No external UI framework** — hand-crafted components demonstrate CSS proficiency and keep bundle size minimal (~70KB gzipped)

---

## What I Would Improve With One More Day

1. **Unit tests** — Add Vitest tests for `deduplication.js`, `security.js`, `cache.js`, and key component behaviors (search debounce, filter combination, pagination edge cases)
2. **E2E tests** — Cypress or Playwright tests for the full user flow: search → filter → paginate → view detail → go back
3. **Accessibility audit** — While basic keyboard navigation and ARIA labels are in place, a full audit with axe-core would catch edge cases
4. **Optional AI feature** — Implement a rule-based "smart tagging" system that automatically labels deals as "High Value" (>$100k), "Stale" (>90 days old, still Open), or "Recently Created" (<7 days)
5. **Dark mode** — The CSS custom property system is already set up for this; adding a theme toggle would be relatively quick
6. **Transition animations** — Add staggered row entrance animations on the deal table for a more polished feel

---

## Known Limitations / Technical Debt

- **No unit/integration tests** — The project lacks automated test coverage; this is the highest-priority tech debt item
- **Mock data only** — The service layer simulates an API; switching to a real backend would require adding proper HTTP client setup (axios/fetch), auth headers, and error mapping
- **RBAC is cosmetic** — The role switcher filters data client-side; a real implementation must enforce permissions server-side
- **No URL state for filters** — Search and filter state is not persisted in the URL query string; refreshing the page resets them. Adding `vue-router` query param sync would fix this
- **Translation quality** — Japanese, German, and Spanish translations are functional but should be reviewed by native speakers for production use
- **No virtualization** — For datasets >1000 records, the table rendering could benefit from virtual scrolling (e.g., `vue-virtual-scroller`); pagination mitigates this for now
- **Polling efficiency** — The current polling approach refetches regardless of visibility; adding `document.visibilityState` checks would reduce unnecessary requests when the tab is backgrounded
