import type { Deal, DealFilters } from '../types'

/**
 * Single source of truth for the per-deal filter predicate.
 * Used by both the API service (server-side simulation) and the store
 * (optimistic polling updates) so the two never drift apart.
 */
export function matchesDealFilters(
  deal: Deal,
  search: string,
  filters: Partial<DealFilters>
): boolean {
  if (search) {
    const q = search.toLowerCase().trim().replace(/\s+/g, ' ')
    if (
      !deal.dealName.toLowerCase().includes(q) &&
      !deal.accountName.toLowerCase().includes(q) &&
      !deal.status.toLowerCase().includes(q) &&
      !deal.dealId.toLowerCase().includes(q)
    ) {
      return false
    }
  }

  if (filters.statuses && filters.statuses.length > 0) {
    const s = filters.statuses.map((x) => x.toLowerCase())
    if (!s.includes(deal.status.toLowerCase())) return false
  }

  if (filters.amountMin != null && deal.amount < filters.amountMin) return false
  if (filters.amountMax != null && deal.amount > filters.amountMax) return false

  if (
    filters.dateFrom &&
    new Date(deal.createdDate).getTime() < new Date(filters.dateFrom).getTime()
  ) {
    return false
  }
  if (
    filters.dateTo &&
    new Date(deal.createdDate).getTime() > new Date(filters.dateTo).getTime()
  ) {
    return false
  }

  if (
    filters.accountName &&
    !deal.accountName
      .toLowerCase()
      .includes(filters.accountName.toLowerCase().trim())
  ) {
    return false
  }

  if (
    filters.dealName &&
    !deal.dealName.toLowerCase().includes(filters.dealName.toLowerCase().trim())
  ) {
    return false
  }

  return true
}
