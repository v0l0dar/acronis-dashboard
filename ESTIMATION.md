# Estimation Plan

## Estimation Method

Estimates were derived using a combination of **analogous estimation** (based on experience with similar Vue.js dashboards) and **bottom-up decomposition** (breaking features into implementable units). Each task was estimated independently, then aggregated. A confidence level reflects uncertainty: High (±10%), Medium (±25%), Low (±40%).

---

## Work Breakdown Structure (WBS)

### 1. Project Setup & Architecture

| Task                                 | Estimated Time | Confidence | Dependencies |
| ------------------------------------ | -------------- | ---------- | ------------ |
| Vite + Vue 3 scaffolding             | 0.5h           | High       | None         |
| Project structure (folders, aliases) | 0.5h           | High       | Setup        |
| Router configuration                 | 0.5h           | High       | Setup        |
| Pinia store setup                    | 0.5h           | High       | Setup        |
| Design tokens & global CSS           | 1.5h           | Medium     | None         |

### 2. API & Data Layer

| Task                                      | Estimated Time | Confidence | Dependencies  |
| ----------------------------------------- | -------------- | ---------- | ------------- |
| Mock data generator                       | 1h             | High       | None          |
| Deal service (fetch, pagination, filters) | 2h             | Medium     | Mock data     |
| Caching layer                             | 1h             | Medium     | Service layer |
| Polling mechanism                         | 1h             | Medium     | Service layer |
| Error simulation (500, timeout)           | 0.5h           | High       | Service layer |

### 3. UI Development

| Task                            | Estimated Time | Confidence | Dependencies   |
| ------------------------------- | -------------- | ---------- | -------------- |
| AppHeader (branding, dropdowns) | 1.5h           | Medium     | Router, i18n   |
| SearchBar (debounced)           | 1h             | High       | Store          |
| FilterPanel (all filter types)  | 3h             | Medium     | Store          |
| DealTable (desktop + mobile)    | 3h             | Medium     | Store          |
| PaginationBar                   | 1h             | High       | Store          |
| StatusBadge                     | 0.25h          | High       | i18n           |
| ErrorState with retry           | 0.5h           | High       | None           |
| DashboardView (composition)     | 1h             | Medium     | All components |
| DealDetailView                  | 1.5h           | Medium     | Store, Router  |

### 4. Search Implementation

| Task                            | Estimated Time | Confidence | Dependencies  |
| ------------------------------- | -------------- | ---------- | ------------- |
| Global search across all fields | 1h             | High       | Service layer |
| Case-insensitive + trim logic   | 0.25h          | High       | Search        |
| Debounce (300ms)                | 0.25h          | High       | SearchBar     |
| Search + filter combination     | 0.5h           | Medium     | Both systems  |

### 5. Filtering

| Task                         | Estimated Time | Confidence | Dependencies |
| ---------------------------- | -------------- | ---------- | ------------ |
| Status multi-select          | 0.5h           | High       | FilterPanel  |
| Amount range filter          | 0.5h           | High       | FilterPanel  |
| Date range filter            | 0.5h           | Medium     | FilterPanel  |
| Text contains filters        | 0.5h           | High       | FilterPanel  |
| Combined filters + clear all | 0.5h           | Medium     | All filters  |
| Active filter indicators     | 0.25h          | High       | FilterPanel  |

### 6. Deduplication Logic

| Task                               | Estimated Time | Confidence | Dependencies  |
| ---------------------------------- | -------------- | ---------- | ------------- |
| Deduplication utility              | 0.5h           | High       | None          |
| Integration at fetch/merge/refresh | 0.5h           | Medium     | Service layer |
| Duplicate injection for testing    | 0.25h          | High       | Mock data     |

### 7. Responsive Design

| Task                       | Estimated Time | Confidence | Dependencies   |
| -------------------------- | -------------- | ---------- | -------------- |
| Mobile card layout         | 1.5h           | Medium     | DealTable      |
| Tablet adjustments         | 0.5h           | Medium     | All components |
| Filter panel responsive    | 0.5h           | Medium     | FilterPanel    |
| Header responsive          | 0.5h           | Medium     | AppHeader      |
| Testing across breakpoints | 1h             | Medium     | All            |

### 8. Internationalization

| Task                                      | Estimated Time | Confidence | Dependencies |
| ----------------------------------------- | -------------- | ---------- | ------------ |
| vue-i18n setup                            | 0.5h           | High       | None         |
| English locale (base)                     | 0.5h           | High       | None         |
| Japanese locale                           | 0.75h          | Medium     | English base |
| German locale                             | 0.75h          | Medium     | English base |
| Spanish locale                            | 0.75h          | Medium     | English base |
| Language switcher UI                      | 0.5h           | Medium     | AppHeader    |
| Locale-aware formatting (dates, currency) | 0.5h           | Medium     | i18n         |

### 9. Security Review

| Task                         | Estimated Time | Confidence | Dependencies |
| ---------------------------- | -------------- | ---------- | ------------ |
| Input sanitization utilities | 0.75h          | High       | None         |
| RBAC simulation              | 0.5h           | Medium     | Store        |
| Safe logging utility         | 0.25h          | High       | None         |
| Route guard validation       | 0.25h          | High       | Router       |
| Security documentation       | 0.5h           | High       | All          |

### 10. Documentation

| Task          | Estimated Time | Confidence | Dependencies     |
| ------------- | -------------- | ---------- | ---------------- |
| README.md     | 1.5h           | Medium     | All features     |
| ESTIMATION.md | 1h             | High       | Planning         |
| REPORT.md     | 1h             | Medium     | After completion |
| DECISIONS.md  | 0.75h          | Medium     | Architecture     |

---

## Summary

| Category                     | Estimated Total |
| ---------------------------- | --------------- |
| Project Setup & Architecture | 3.5h            |
| API & Data Layer             | 5.5h            |
| UI Development               | 12.75h          |
| Search Implementation        | 2h              |
| Filtering                    | 2.75h           |
| Deduplication Logic          | 1.25h           |
| Responsive Design            | 4h              |
| Internationalization         | 4.25h           |
| Security Review              | 2.25h           |
| Documentation                | 4.25h           |
| **Grand Total**              | **~42.5h**      |

With a realistic 6-8h/day work schedule, this fits within the **2-3 day** window (2.5 days at 8h/day or 3 days at ~6h focused work).

---

## Assumptions

- API contract is stable (mock data provides consistent schema)
- Authentication/authorization is not required (RBAC is simulated)
- Design flexibility is allowed (no strict Figma/design spec to follow)
- No backend work required (mock service layer is sufficient)
- Browser support targets modern evergreen browsers (Chrome, Firefox, Safari, Edge)

---

## Risks

| Risk                                 | Likelihood | Impact | Mitigation                                                                   |
| ------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------------- |
| i18n translation accuracy            | Medium     | Low    | Use professional review for production; mark as "best-effort" for assignment |
| Responsive edge cases                | Medium     | Medium | Test at exact breakpoints; use CSS custom properties for flexibility         |
| Filter combination edge cases        | Low        | Medium | Thorough testing of filter intersections; defensive null checks              |
| Mock API diverges from real patterns | Low        | Low    | Service layer abstraction makes real API integration straightforward         |
| Scope creep on optional AI features  | Medium     | Medium | Time-box to 2h maximum; skip if core features not complete                   |
