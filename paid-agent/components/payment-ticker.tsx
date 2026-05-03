'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { shortAddress } from '@/lib/utils'

interface GlobalPaymentEntry {
  id: string
  service: string
  payer: string
  formattedAmount: string
  timestamp: number
}

const POLL_INTERVAL = 15_000 // 15 seconds

export function PaymentTicker() {
  const [payments, setPayments] = useState<GlobalPaymentEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const fetchPayments = async () => {
      try {
        const res = await fetch('/api/payments')
        if (res.ok) {
          const data = (await res.json()) as GlobalPaymentEntry[]
          setPayments(data)
        }
      } catch {
        // silently ignore network errors
      }
    }

    fetchPayments()
    const timer = setInterval(fetchPayments, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  if (!mounted || payments.length === 0) return null

  const items = payments.map(
    (p) => `${shortAddress(p.payer)} paid $${p.formattedAmount} for ${p.service}`,
  )

  // Repeat 4x so the strip is always wider than viewport → seamless loop
  const repeated = [...items, ...items, ...items, ...items]
  const duration = Math.max(20, items.length * 12)

  return (
    <div className='w-full overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-2'>
      <div
        className='flex items-center whitespace-nowrap'
        style={{
          animation: `marquee ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {repeated.map((text, i) => (
          <span key={i} className='inline-flex items-center gap-2 px-6 text-xs text-slate-400'>
            <CheckCircle2 className='h-3 w-3 text-emerald-400 shrink-0' />
            <span>{text}</span>
            <span className='text-slate-700 select-none'>·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
