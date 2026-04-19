import type { Deal } from '../types'

export function deduplicateDeals(deals: Deal[]): Deal[] {
  if (!Array.isArray(deals)) return []

  const dealMap = new Map<string, Deal>()

  for (const deal of deals) {
    if (!deal || typeof deal.dealId !== 'string') continue

    const existing = dealMap.get(deal.dealId)

    if (!existing) {
      dealMap.set(deal.dealId, deal)
    } else {
      const existingDate = new Date(existing.updatedDate).getTime()
      const newDate = new Date(deal.updatedDate).getTime()
      // Keep the incoming deal if its date is valid and either the existing
      // date is invalid or the incoming date is strictly newer.
      if (!isNaN(newDate) && (isNaN(existingDate) || newDate > existingDate)) {
        dealMap.set(deal.dealId, deal)
      }
    }
  }

  return Array.from(dealMap.values())
}

export function mergeAndDeduplicate(
  existingDeals: Deal[],
  newDeals: Deal[]
): Deal[] {
  return deduplicateDeals([...existingDeals, ...newDeals])
}
