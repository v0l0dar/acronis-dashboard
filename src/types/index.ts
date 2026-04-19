export type DealStatus = 'Open' | 'Approved' | 'Rejected'

export interface Deal {
  dealId: string
  dealName: string
  accountName: string
  status: DealStatus
  amount: number
  createdDate: string
  updatedDate: string
  assignedTo: string
  description: string
  contactEmail: string
  contactName: string
  notes: string
}

export interface DealFilters {
  statuses: DealStatus[]
  amountMin: number | null
  amountMax: number | null
  dateFrom: string
  dateTo: string
  accountName: string
  dealName: string
}

export interface DealsPage {
  deals: Deal[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface RoleFilter {
  role: string
  partnerId: string
}
