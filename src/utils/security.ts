export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return ''

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return ''

  return query
    .trim()
    .slice(0, 200)
    .replace(/\s+/g, ' ')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
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
