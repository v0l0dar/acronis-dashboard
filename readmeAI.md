# Smart Search — AI-Inspired Feature

## What problem it solves

Users of a deal management dashboard typically need to combine multiple filters — status, amount range, and date range — to narrow down results. Doing this through three separate filter controls is friction-heavy: it requires clicking into a panel, adjusting individual inputs, and mentally mapping each control to the desired outcome. Users often know _exactly_ what they want ("show me rejected deals above $50k last month") but have no direct way to express that intent in a single action. Smart Search bridges this gap by letting users type a natural-language phrase and having the system automatically populate the correct filters.

## Why it improves UX

- **Single-gesture filtering** — a complex three-dimensional filter is applied from one search bar keystroke sequence, with no panel interaction required.
- **Immediate visual feedback** — an animated hint badge appears below the input confirming which filters were recognized (e.g. `Rejected · >$50k · from 2026-03-01 – 2026-03-31`), so users understand what the system inferred.
- **Progressive enhancement** — if no structured pattern is found the query falls back to plain-text search; the feature never degrades the experience.
- **Reversible** — clearing the search field resets all smart-applied filters atomically, leaving manually configured filter-panel values intact for the next manual session.
- **Low learning curve** — the vocabulary is intentionally narrow and obvious (`approved`, `above`, `last month`) so the feature works on the first try without documentation.

## Implementation approach

Smart Search is implemented as a **pure, rule-based regex parser** (`src/utils/smartSearchParser.ts`) with no external API calls and no machine-learning model.

### Why rule-based / regex instead of ML

The dataset is small (≈150 deals), the filter vocabulary is fixed (3 statuses, numeric amounts, ~14 relative date expressions), and the deployment environment is a static frontend with no server-side inference budget. Under these conditions:

- An ML model would be orders of magnitude more complex to maintain, requires a runtime or API call, introduces latency and cost, and provides zero additional accuracy for a bounded vocabulary.
- A regex parser is deterministic, testable, zero-latency, runs entirely in-browser, and has a complete failure mode (falls back to plain-text search) that is trivially easy to reason about.
- Rule-based NLU is a well-established architecture for slot-filling over small, domain-specific vocabularies — it is not a compromise, it is the correct tool for the problem size.

### How it works

1. **Status extraction** — `/\b(approved|rejected|denied|open|pending)\b/gi` matches one or more status keywords and maps them to canonical values (`denied → Rejected`, `pending → Open`).
2. **Amount extraction** — three patterns handle `above / over / more than`, `below / under / less than`, and `between X and Y`. Both plain numbers and `k`-suffixed shorthands (`10k → 10000`) are supported.
3. **Date math** — a library of named expressions (`last month`, `this week`, `last 30 days`, …) is matched and resolved to concrete ISO date strings using calendar arithmetic at parse time. The longest patterns are tested first to prevent partial matches.
4. **Residual query** — after stripping all recognized tokens and structural noise words (`deals`, `for`, `in`, …), any remaining text becomes the plain-text search query passed to the server.
5. **Hint generation** — a human-readable summary of extracted filters is composed and surfaced in the UI as a labelled badge.

The parser runs on every debounced keystroke (300 ms) inside `SearchBar.vue`. When a structured result is detected the component emits a `smart-search` event carrying the parsed filters and residual query; `DashboardView.vue` applies both atomically via the Pinia store. If no pattern is matched, the regular `search` event is emitted instead.

## Limitations

- **Rigid phrase structure** — patterns must match the exact vocabulary. Synonyms not in the map (`completed`, `won`, `closed`) are silently ignored. Extending coverage requires adding entries to the regex and status/synonym maps.
- **Single date expression per query** — only the first matching date expression is extracted; compound date ranges like `"between January and March"` are not supported.
- **No negation** — phrases like `"not approved"` or `"excluding open deals"` will incorrectly extract the positive status keyword.
- **No amount units other than USD** — there is no currency or unit disambiguation.
- **English only** — all keyword matching is hardcoded to English; i18n query parsing would require parallel pattern sets for each locale.
- **Smart filters replace, not refine** — firing a smart search resets the status, amount, and date filter dimensions to whatever was parsed. Any prior manual filter-panel values for those dimensions are overwritten.
