import type { DealStatus } from '../types'

export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return ''
  // Strip null bytes only. HTML escaping is Vue's responsibility at render time.
  return input.replace(/\0/g, '').trim().slice(0, 1000)
}

export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return ''
  // Only normalise whitespace and enforce length. Vue auto-escapes output;
  // stripping patterns like "data:" or "on*=" here corrupts legitimate search terms.
  return query.trim().slice(0, 200).replace(/\s+/g, ' ')
}

export function sanitizeNumericInput(
  value: unknown,
  min = 0,
  max = 999999999
): number | null {
  const num = Number(value)
  if (isNaN(num)) return null
  return Math.max(min, Math.min(max, num))
}

const SENSITIVE_FIELDS = new Set([
  'contactEmail',
  'token',
  'password',
  'apiKey',
  'secret'
])
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function safeLog(label: string, data: unknown): void {
  if (import.meta.env.PROD) return

  if (typeof data === 'object' && data !== null) {
    // Object.create(null) avoids inheriting Object.prototype — prevents pollution via logged output
    const safe = Object.create(null)
    for (const key of Object.keys(data as object)) {
      if (DANGEROUS_KEYS.has(key)) continue
      safe[key] = SENSITIVE_FIELDS.has(key)
        ? '[REDACTED]'
        : (data as Record<string, unknown>)[key]
    }
    console.log(`[${label}]`, safe)
  } else {
    console.log(`[${label}]`, data)
  }
}

export const VALID_DEAL_STATUSES: readonly DealStatus[] = [
  'Open',
  'Approved',
  'Rejected'
]

export function isValidDealStatus(value: string): value is DealStatus {
  return (VALID_DEAL_STATUSES as readonly string[]).includes(value)
}

export const ROLES = {
  ADMIN: 'admin',
  PARTNER: 'partner'
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export function filterDealsByRole<T extends { assignedTo: string }>(
  deals: T[],
  role: string,
  partnerId = 'partner-1'
): T[] {
  if (role === ROLES.ADMIN) return deals
  if (role === ROLES.PARTNER)
    return deals.filter((d) => d.assignedTo === partnerId)
  return []
}

export function isValidDealId(id: unknown): id is string {
  return typeof id === 'string' && /^DEAL-\d{4,6}$/.test(id)
}

export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false
  // RFC 5321 practical limit is 254 chars; reject anything longer
  if (value.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
