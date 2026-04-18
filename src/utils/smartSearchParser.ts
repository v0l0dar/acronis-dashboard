import type { DealFilters } from '../types'

export interface SmartSearchResult {
  isStructured: boolean
  filters: Partial<DealFilters>
  residualQuery: string
  hint: string
}

const STATUS_MAP: Readonly<Record<string, string>> = {
  approved: 'Approved',
  rejected: 'Rejected',
  denied: 'Rejected',
  open: 'Open',
  pending: 'Open',
}

// Supports "10k", "10K", "10,000", "10000", "10.5k"
function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').toLowerCase()
  const kMatch = normalized.match(/^(\d+(?:\.\d+)?)k$/)
  if (kMatch) return parseFloat(kMatch[1]) * 1000
  const val = parseFloat(normalized)
  return isNaN(val) ? null : val
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function resolveRelativeDate(
  expr: string
): { dateFrom?: string; dateTo?: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const normalized = expr.toLowerCase().trim()

  if (normalized === 'today') {
    return { dateFrom: toISODate(today), dateTo: toISODate(today) }
  }

  if (normalized === 'this week') {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return { dateFrom: toISODate(start) }
  }

  if (normalized === 'last week') {
    const startOfThis = new Date(today)
    startOfThis.setDate(today.getDate() - today.getDay())
    const start = new Date(startOfThis)
    start.setDate(startOfThis.getDate() - 7)
    const end = new Date(startOfThis)
    end.setDate(startOfThis.getDate() - 1)
    return { dateFrom: toISODate(start), dateTo: toISODate(end) }
  }

  if (normalized === 'this month') {
    return { dateFrom: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)) }
  }

  if (normalized === 'last month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { dateFrom: toISODate(start), dateTo: toISODate(end) }
  }

  if (normalized === 'this year') {
    return { dateFrom: toISODate(new Date(today.getFullYear(), 0, 1)) }
  }

  if (normalized === 'last year') {
    const start = new Date(today.getFullYear() - 1, 0, 1)
    const end = new Date(today.getFullYear() - 1, 11, 31)
    return { dateFrom: toISODate(start), dateTo: toISODate(end) }
  }

  const nDays = normalized.match(/^(?:last|past)\s+(\d+)\s+days?$/)
  if (nDays) {
    const n = parseInt(nDays[1], 10)
    const start = new Date(today)
    start.setDate(today.getDate() - n + 1)
    return { dateFrom: toISODate(start) }
  }

  const nWeeks = normalized.match(/^(?:last|past)\s+(\d+)\s+weeks?$/)
  if (nWeeks) {
    const n = parseInt(nWeeks[1], 10)
    const start = new Date(today)
    start.setDate(today.getDate() - n * 7)
    return { dateFrom: toISODate(start) }
  }

  const nMonths = normalized.match(/^(?:last|past)\s+(\d+)\s+months?$/)
  if (nMonths) {
    const n = parseInt(nMonths[1], 10)
    const start = new Date(
      today.getFullYear(),
      today.getMonth() - n,
      today.getDate()
    )
    return { dateFrom: toISODate(start) }
  }

  return null
}

// Ordered longest-first to prevent partial matches (e.g. "last month" before "last")
const DATE_EXPRESSION_SOURCES: readonly string[] = [
  'last\\s+\\d+\\s+months?',
  'past\\s+\\d+\\s+months?',
  'last\\s+\\d+\\s+weeks?',
  'past\\s+\\d+\\s+weeks?',
  'last\\s+\\d+\\s+days?',
  'past\\s+\\d+\\s+days?',
  'last\\s+month',
  'this\\s+month',
  'last\\s+week',
  'this\\s+week',
  'last\\s+year',
  'this\\s+year',
  'today',
]

function buildHint(filters: Partial<DealFilters>): string {
  const parts: string[] = []

  if (filters.statuses && filters.statuses.length > 0) {
    parts.push(filters.statuses.join(', '))
  }

  if (filters.amountMin != null && filters.amountMax != null) {
    parts.push(
      `$${filters.amountMin.toLocaleString()}–$${filters.amountMax.toLocaleString()}`
    )
  } else if (filters.amountMin != null) {
    parts.push(`>${filters.amountMin >= 1000 ? `$${(filters.amountMin / 1000).toFixed(0)}k` : `$${filters.amountMin}`}`)
  } else if (filters.amountMax != null) {
    parts.push(`<${filters.amountMax >= 1000 ? `$${(filters.amountMax / 1000).toFixed(0)}k` : `$${filters.amountMax}`}`)
  }

  if (filters.dateFrom && filters.dateTo) {
    parts.push(`${filters.dateFrom} – ${filters.dateTo}`)
  } else if (filters.dateFrom) {
    parts.push(`from ${filters.dateFrom}`)
  }

  return parts.join(' · ')
}

export function parseSmartSearch(input: string): SmartSearchResult {
  const filters: Partial<DealFilters> = {}
  let text = input.trim()

  if (!text) {
    return { isStructured: false, filters: {}, residualQuery: '', hint: '' }
  }

  let matched = false

  // ── Status keywords ───────────────────────────────────────────────────────
  const statusPattern = /\b(approved|rejected|denied|open|pending)\b/gi
  const statusMatches = [...text.matchAll(statusPattern)]
  if (statusMatches.length > 0) {
    filters.statuses = [
      ...new Set(statusMatches.map((m) => STATUS_MAP[m[1].toLowerCase()])),
    ]
    text = text.replace(statusPattern, '')
    matched = true
  }

  // ── Amount: between X and Y ───────────────────────────────────────────────
  const betweenPattern =
    /\bbetween\s+(\d[\d,]*(?:\.\d+)?k?)\s+and\s+(\d[\d,]*(?:\.\d+)?k?)\b/i
  const betweenMatch = text.match(betweenPattern)
  if (betweenMatch) {
    const min = parseAmount(betweenMatch[1])
    const max = parseAmount(betweenMatch[2])
    if (min !== null) { filters.amountMin = min; matched = true }
    if (max !== null) { filters.amountMax = max; matched = true }
    text = text.replace(betweenPattern, '')
  }

  // ── Amount: above / over / more than / greater than / exceeding ───────────
  const abovePattern =
    /\b(?:above|over|more\s+than|greater\s+than|exceeding)\s+(\d[\d,]*(?:\.\d+)?k?)\b/i
  const aboveMatch = text.match(abovePattern)
  if (aboveMatch) {
    const val = parseAmount(aboveMatch[1])
    if (val !== null) { filters.amountMin = val; matched = true }
    text = text.replace(abovePattern, '')
  }

  // ── Amount: below / under / less than / lower than ────────────────────────
  const belowPattern =
    /\b(?:below|under|less\s+than|lower\s+than)\s+(\d[\d,]*(?:\.\d+)?k?)\b/i
  const belowMatch = text.match(belowPattern)
  if (belowMatch) {
    const val = parseAmount(belowMatch[1])
    if (val !== null) { filters.amountMax = val; matched = true }
    text = text.replace(belowPattern, '')
  }

  // ── Date expressions ──────────────────────────────────────────────────────
  for (const src of DATE_EXPRESSION_SOURCES) {
    const datePattern = new RegExp(`\\b(?:${src})\\b`, 'i')
    const dateMatch = text.match(datePattern)
    if (dateMatch) {
      const resolved = resolveRelativeDate(dateMatch[0])
      if (resolved) {
        if (resolved.dateFrom) filters.dateFrom = resolved.dateFrom
        if (resolved.dateTo) filters.dateTo = resolved.dateTo
        text = text.replace(datePattern, '')
        matched = true
        break
      }
    }
  }

  // ── Strip structural noise words from leftover text ───────────────────────
  const residualQuery = text
    .replace(/\b(deals?|for|in|the|from|with|of|a|an)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    isStructured: matched,
    filters,
    residualQuery,
    hint: matched ? buildHint(filters) : '',
  }
}
