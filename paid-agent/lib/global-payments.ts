/**
 * In-memory global payment log — shared across all API requests in the same
 * Node.js process. Resets on server restart (fine for demo).
 */

export interface GlobalPaymentEntry {
  id: string
  service: string
  payer: string
  formattedAmount: string
  timestamp: number
}

const MAX_ENTRIES = 100

// Module-level singleton — survives across requests in the same process
const entries: GlobalPaymentEntry[] = []

export function addGlobalPayment(entry: Omit<GlobalPaymentEntry, 'id' | 'timestamp'>): void {
  entries.unshift({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
}

export function getGlobalPayments(limit = 50): GlobalPaymentEntry[] {
  return entries.slice(0, limit)
}
