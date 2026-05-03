import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format USDC amount (6 decimals) to human-readable string */
export function formatUSDC(amount: bigint | number | string, decimals = 6): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  const value = n / Math.pow(10, decimals)
  if (value === 0) return '0.00'
  if (value < 0.000001) return '<$0.000001'
  if (value < 0.01) return value.toFixed(6)
  if (value < 1) return value.toFixed(4)
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Format wallet address to short form */
export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Format timestamp to relative time */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

/** Parse price string like "$0.001" to USDC base units */
export function priceToBaseUnits(price: string): string {
  const num = parseFloat(price.replace('$', ''))
  return Math.round(num * 1_000_000).toString()
}
