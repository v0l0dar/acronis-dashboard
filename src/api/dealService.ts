import type { Deal, DealsPage, DealFilters, RoleFilter } from '../types'
import { generateDeals, injectDuplicates } from './mockData'
import { listCache, detailCache } from '../utils/cache'
import { deduplicateDeals } from '../utils/deduplication'
import { filterDealsByRole, isValidDealId } from '../utils/security'

let _allDeals = injectDuplicates(generateDeals(150, 42), 10)

const ERROR_RATE = 0.05
const LATENCY_MIN = 200
const LATENCY_MAX = 800

function simulateLatency(signal?: AbortSignal | null): Promise<void> {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

function sortedStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return JSON.stringify(obj)
  }
  const sorted = Object.keys(obj as object).sort().reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = (obj as Record<string, unknown>)[key]
    return acc
  }, {})
  return JSON.stringify(sorted)
}

interface ApiError extends Error {
  status: number
}

function maybeThrowError(): void {
  if (Math.random() < ERROR_RATE) {
    const error = new Error('Internal Server Error') as ApiError
    error.status = 500
    throw error
  }
}

interface FetchDealsParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: Partial<DealFilters>
  roleFilter?: RoleFilter | null
  signal?: AbortSignal | null
}

export async function fetchDeals({
  page = 1,
  pageSize = 15,
  search = '',
  filters = {},
  roleFilter = null,
  signal = null
}: FetchDealsParams = {}): Promise<DealsPage> {
  const roleKey = roleFilter ? `${roleFilter.role}:${roleFilter.partnerId}` : 'all'
  const cacheKey = `deals:${page}:${pageSize}:${search}:${sortedStringify(filters)}:${roleKey}`
  const cached = listCache.get(cacheKey) as DealsPage | null
  if (cached) return cached

  await simulateLatency(signal)
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  maybeThrowError()

  let deals = deduplicateDeals([..._allDeals])

  if (search) {
    const q = search.toLowerCase().trim().replace(/\s+/g, ' ')
    deals = deals.filter(d =>
      d.dealName.toLowerCase().includes(q) ||
      d.accountName.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.dealId.toLowerCase().includes(q)
    )
  }

  if (filters.statuses && filters.statuses.length > 0) {
    const s = filters.statuses.map(x => x.toLowerCase())
    deals = deals.filter(d => s.includes(d.status.toLowerCase()))
  }

  if (filters.amountMin != null) {
    deals = deals.filter(d => d.amount >= (filters.amountMin as number))
  }
  if (filters.amountMax != null) {
    deals = deals.filter(d => d.amount <= (filters.amountMax as number))
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()
    deals = deals.filter(d => new Date(d.createdDate).getTime() >= from)
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime()
    deals = deals.filter(d => new Date(d.createdDate).getTime() <= to)
  }

  if (filters.accountName) {
    const an = filters.accountName.toLowerCase().trim()
    deals = deals.filter(d => d.accountName.toLowerCase().includes(an))
  }

  if (filters.dealName) {
    const dn = filters.dealName.toLowerCase().trim()
    deals = deals.filter(d => d.dealName.toLowerCase().includes(dn))
  }

  if (roleFilter) {
    deals = filterDealsByRole(deals, roleFilter.role, roleFilter.partnerId)
  }

  deals.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())

  const total = deals.length
  const start = (page - 1) * pageSize
  const paged = deals.slice(start, start + pageSize)

  const result: DealsPage = { deals: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }

  listCache.set(cacheKey, result)
  return result
}

export async function fetchDealById(dealId: string): Promise<Deal | null> {
  if (!isValidDealId(dealId)) return null

  const cached = detailCache.get(`deal:${dealId}`) as Deal | null
  if (cached) return cached

  await simulateLatency()
  maybeThrowError()

  const deals = deduplicateDeals([..._allDeals])
  const deal = deals.find(d => d.dealId === dealId) ?? null

  if (deal) {
    detailCache.set(`deal:${dealId}`, deal)
  }
  return deal
}

export async function pollUpdates(_since: string): Promise<Deal[]> {
  await simulateLatency()

  if (Math.random() < 0.2) {
    const idx = Math.floor(Math.random() * _allDeals.length)
    const deal: Deal = { ..._allDeals[idx] }
    deal.updatedDate = new Date().toISOString()

    if (Math.random() > 0.5) {
      const statuses = ['Open', 'Approved', 'Rejected']
      deal.status = statuses[Math.floor(Math.random() * statuses.length)]
    } else {
      deal.amount = Math.round((deal.amount * (0.9 + Math.random() * 0.2)) * 100) / 100
    }

    _allDeals[idx] = deal

    listCache.clear()
    detailCache.invalidate(`deal:${deal.dealId}`)

    return [deal]
  }

  return []
}

export function clearAllCaches(): void {
  listCache.clear()
  detailCache.clear()
}
