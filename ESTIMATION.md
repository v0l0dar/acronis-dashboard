# Estimation Plan

## Estimation Method

Estimates were derived using a combination of **analogous estimation** (based on experience with similar Vue.js dashboards) and **bottom-up decomposition** (breaking features into implementable units). Each task was estimated independently, then aggregated. A confidence level reflects uncertainty: High (±10%), Medium (±25%), Low (±40%).

---

## Work Breakdown Structure (WBS)

### 1. Project Setup & Architecture

| Task                                 | Estimated Time | Confidence | Dependencies |
| ------------------------------------ | -------------- | ---------- | ------------ |
| Vite + Vue 3 scaffolding             | 0.25h          | High       | None         |
| Project structure (folders, aliases) | 0.05h          | High       | Setup        |
| Router configuration                 | 0.05h          | High       | Setup        |
| Pinia store setup                    | 0.05h          | High       | Setup        |
| Design tokens & global CSS           | 0.1h           | High       | None         |

### 2. API & Data Layer

| Task                                      | Estimated Time | Confidence | Dependencies  |
| ----------------------------------------- | -------------- | ---------- | ------------- |
| Mock data generator                       | 0.25h          | High       | None          |
| Deal service (fetch, pagination, filters) | 0.5h           | Medium     | Mock data     |
| Caching layer                             | 0.1h           | Medium     | Service layer |
| Polling mechanism                         | 0.1h           | Medium     | Service layer |
| Error simulation (500, timeout)           | 0.05h          | High       | Service layer |

### 3. UI Development

| Task                            | Estimated Time | Confidence | Dependencies   |
| ------------------------------- | -------------- | ---------- | -------------- |
| AppHeader (branding, dropdowns) | 0.25h          | Medium     | Router, i18n   |
| SearchBar (debounced)           | 0.25h          | High       | Store          |
| FilterPanel (all filter types)  | 0.5h           | Medium     | Store          |
| DealTable (desktop + mobile)    | 0.75h          | Medium     | Store          |
| PaginationBar                   | 0.25h          | High       | Store          |
| StatusBadge                     | 0.1h           | High       | i18n           |
| ErrorState with retry           | 0.1h           | High       | None           |
| DashboardView (composition)     | 0.15h          | Medium     | All components |
| DealDetailView                  | 0.15h          | Medium     | Store, Router  |

### 4. Search Implementation

| Task                            | Estimated Time | Confidence | Dependencies  |
| ------------------------------- | -------------- | ---------- | ------------- |
| Global search across all fields | 0.25h          | High       | Service layer |
| Case-insensitive + trim logic   | 0.05h          | High       | Search        |
| Debounce (300ms)                | 0.1h           | High       | SearchBar     |
| Search + filter combination     | 0.1h           | Medium     | Both systems  |

### 5. Filtering

| Task                         | Estimated Time | Confidence | Dependencies |
| ---------------------------- | -------------- | ---------- | ------------ |
| Status multi-select          | 0.1h           | High       | FilterPanel  |
| Amount range filter          | 0.1h           | High       | FilterPanel  |
| Date range filter            | 0.1h           | Medium     | FilterPanel  |
| Text contains filters        | 0.1h           | High       | FilterPanel  |
| Combined filters + clear all | 0.05h          | Medium     | All filters  |
| Active filter indicators     | 0.05h          | High       | FilterPanel  |

### 6. Deduplication Logic

| Task                               | Estimated Time | Confidence | Dependencies  |
| ---------------------------------- | -------------- | ---------- | ------------- |
| Deduplication utility              | 0.1h           | High       | None          |
| Integration at fetch/merge/refresh | 0.1h           | Medium     | Service layer |
| Duplicate injection for testing    | 0.05h          | High       | Mock data     |

### 7. Responsive Design

| Task                       | Estimated Time | Confidence | Dependencies   |
| -------------------------- | -------------- | ---------- | -------------- |
| Mobile card layout         | 0.25h          | Medium     | DealTable      |
| Tablet adjustments         | 0.1h           | Medium     | All components |
| Filter panel responsive    | 0.1h           | Medium     | FilterPanel    |
| Header responsive          | 0.1h           | Medium     | AppHeader      |
| Testing across breakpoints | 0.2h           | Medium     | All            |

### 8. Internationalization

| Task                                      | Estimated Time | Confidence | Dependencies |
| ----------------------------------------- | -------------- | ---------- | ------------ |
| vue-i18n setup                            | 0.1h           | High       | None         |
| English locale (base)                     | 0.15h          | High       | None         |
| Japanese locale                           | 0.2h           | Medium     | English base |
| German locale                             | 0.2h           | Medium     | English base |
| Spanish locale                            | 0.2h           | Medium     | English base |
| Language switcher UI                      | 0.1h           | Medium     | AppHeader    |
| Locale-aware formatting (dates, currency) | 0.05h          | Medium     | i18n         |

### 9. Security Review

| Task                         | Estimated Time | Confidence | Dependencies |
| ---------------------------- | -------------- | ---------- | ------------ |
| Input sanitization utilities | 0.15h          | High       | None         |
| RBAC simulation              | 0.15h          | Medium     | Store        |
| Safe logging utility         | 0.1h           | High       | None         |
| Route guard validation       | 0.05h          | High       | Router       |
| Security documentation       | 0.05h          | High       | All          |

### 10. Testing

| Task                                | Estimated Time | Confidence | Dependencies   |
| ----------------------------------- | -------------- | ---------- | -------------- |
| Manual QA — golden path (all views) | 0.5h           | High       | All features   |
| Responsive breakpoint testing       | 0.25h          | Medium     | All components |

### 11. Documentation

| Task          | Estimated Time | Confidence | Dependencies     |
| ------------- | -------------- | ---------- | ---------------- |
| README.md     | 0.25h          | Medium     | All features     |
| ESTIMATION.md | 0.25h          | High       | Planning         |
| REPORT.md     | 0.15h          | Medium     | After completion |
| DECISIONS.md  | 0.1h           | Medium     | Architecture     |

---

## Summary

| Category                     | Estimated Total | Actual Total |
| ---------------------------- | --------------- | ------------ |
| Project Setup & Architecture | 0.5h            | ~1h          |
| API & Data Layer             | 1h              | ~2.5h        |
| UI Development               | 2.5h            | ~5h          |
| Search Implementation        | 0.5h            | ~1h          |
| Filtering                    | 0.5h            | ~1h          |
| Deduplication Logic          | 0.25h           | ~0.5h        |
| Responsive Design            | 0.75h           | ~2h          |
| Internationalization         | 1h              | ~1.5h        |
| Security Review              | 0.5h            | ~1h          |
| Testing                      | 0.75h           | ~1h          |
| Documentation                | 0.75h           | ~1.5h        |
| **Grand Total**              | **~9h**         | **~18h**     |

The initial estimate of ~9h proved optimistic. The project took **18 hours** in total — roughly **2× the original estimate**. The main sources of overrun were UI development (responsive layout edge cases, mobile card layout polish), the API/data layer (caching and polling complexity), and iterative debugging across components.

---

## Assumptions

- API contract is stable (mock data provides consistent schema)
- Authentication/authorization is not required (RBAC is simulated)
- Design flexibility is allowed (no strict Figma/design spec to follow)
- No backend work required (mock service layer is sufficient)
- Browser support targets modern evergreen browsers (Chrome, Firefox, Safari, Edge)

---

## Risks

| Risk                                 | Likelihood | Impact | Mitigation                                                                                                                    |
| ------------------------------------ | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| i18n translation accuracy            | Medium     | Low    | Use professional review for production; mark as "best-effort" for assignment                                                  |
| Responsive edge cases                | Medium     | Medium | Test at exact breakpoints; use CSS custom properties for flexibility                                                          |
| Filter combination edge cases        | Low        | Medium | Thorough testing of filter intersections; defensive null checks                                                               |
| Mock API diverges from real patterns | Low        | Low    | Service layer abstraction makes real API integration straightforward                                                          |
| Optional AI feature (smart tagging)  | Medium     | Medium | Was time-boxed to 2h; **deferred** — core features consumed available time; moved to "What I Would Improve With One More Day" |
