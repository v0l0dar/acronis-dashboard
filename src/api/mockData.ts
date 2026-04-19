import type { Deal } from '../types'

const ACCOUNT_NAMES = [
  'Acme Corporation', 'GlobalTech Solutions', 'Pinnacle Systems',
  'NovaStar Inc.', 'BlueSky Partners', 'TerraFirma Holdings',
  'Quantum Dynamics', 'Apex Industries', 'Meridian Group',
  'Zenith Technologies', 'Atlas Digital', 'Horizon Labs',
  'Vanguard Enterprises', 'Ironclad Security', 'Summit Analytics',
  'Catalyst Innovations', 'Prism Software', 'Titan Networks',
  'Eclipse Data', 'Nexus Cloud', 'CoreBridge Solutions',
  'Silverline Consulting', 'Redwood Partners', 'Orbit Systems',
  'FusionPoint Inc.'
]

const DEAL_PREFIXES = [
  'Enterprise License', 'Cloud Migration', 'Security Suite',
  'Data Platform', 'Annual Subscription', 'Managed Services',
  'Infrastructure Upgrade', 'Compliance Package', 'Support Contract',
  'Training Program', 'API Integration', 'Backup Solution',
  'Disaster Recovery', 'DevOps Pipeline', 'Analytics Dashboard'
]

const STATUSES = ['Open', 'Approved', 'Rejected']

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateDeal(index: number, rand: () => number): Deal {
  const accountName = ACCOUNT_NAMES[Math.floor(rand() * ACCOUNT_NAMES.length)]
  const prefix = DEAL_PREFIXES[Math.floor(rand() * DEAL_PREFIXES.length)]
  const status = STATUSES[Math.floor(rand() * STATUSES.length)]
  const amount = Math.round((rand() * 195000 + 5000) * 100) / 100

  const daysAgo = Math.floor(rand() * 365)
  const created = new Date(Date.now() - daysAgo * 86400000)

  const daysSinceCreated = Math.floor(rand() * daysAgo)
  const updated = new Date(created.getTime() + daysSinceCreated * 86400000)

  const partnerIds = ['partner-1', 'partner-2', 'partner-3']
  const assignedTo = partnerIds[Math.floor(rand() * partnerIds.length)]

  const firstNames = ['John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller']

  return {
    dealId: `DEAL-${String(index + 1).padStart(4, '0')}`,
    dealName: `${prefix} – ${accountName.split(' ')[0]}`,
    accountName,
    status,
    amount,
    createdDate: created.toISOString(),
    updatedDate: updated.toISOString(),
    assignedTo,
    description: `${prefix} deal for ${accountName}. Estimated value: $${amount.toLocaleString()}.`,
    contactEmail: `contact@${accountName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    contactName: `${firstNames[Math.floor(rand() * firstNames.length)]} ${lastNames[Math.floor(rand() * lastNames.length)]}`,
    notes: rand() > 0.5 ? 'Follow up required next week.' : ''
  }
}

export function generateDeals(count = 150, seed = 42): Deal[] {
  const rand = seededRandom(seed)
  return Array.from({ length: count }, (_, i) => generateDeal(i, rand))
}

export function injectDuplicates(deals: Deal[], dupeCount = 8, seed = 99): Deal[] {
  const rand = seededRandom(seed)
  const dupes: Deal[] = []
  for (let i = 0; i < dupeCount; i++) {
    const original = deals[Math.floor(rand() * deals.length)]
    dupes.push({
      ...original,
      updatedDate: new Date(
        new Date(original.updatedDate).getTime() - 86400000
      ).toISOString()
    })
  }
  return [...deals, ...dupes]
}
