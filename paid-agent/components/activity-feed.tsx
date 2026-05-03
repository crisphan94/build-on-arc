'use client'

import { useState } from 'react'
import { Activity, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { PaymentRecord } from '@/components/services-grid'
import { shortAddress } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ActivityRow({ record }: { record: PaymentRecord }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='rounded-xl hover:bg-white/[0.03]'>
      <button
        className='w-full flex items-center gap-3 px-3 py-2.5 cursor-pointer text-left'
        onClick={() => setExpanded((v) => !v)}
      >
        <CheckCircle2 className='h-4 w-4 text-emerald-400 flex-shrink-0' />
        <div className='flex-1 min-w-0'>
          <p className='text-sm text-slate-200 truncate'>{record.service}</p>
          <p className='text-xs text-slate-500'>
            {shortAddress(record.payer)} · {timeAgo(record.timestamp)}
          </p>
        </div>
        <span className='text-sm font-medium text-slate-100 mr-1'>${record.formattedAmount}</span>
        {expanded ? (
          <ChevronUp className='h-3.5 w-3.5 text-slate-600 flex-shrink-0' />
        ) : (
          <ChevronDown className='h-3.5 w-3.5 text-slate-600 flex-shrink-0' />
        )}
      </button>

      {expanded && (
        <div className='px-3 pb-3 space-y-1.5 text-xs border-t border-white/[0.05] pt-2 mt-0.5'>
          <div className='flex justify-between'>
            <span className='text-slate-500'>Amount</span>
            <span className='text-emerald-400 font-mono'>${record.formattedAmount} USDC</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-slate-500'>Paid by</span>
            <span className='text-slate-400 font-mono'>{shortAddress(record.payer)}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-slate-500'>Time</span>
            <span className='text-slate-400'>{new Date(record.timestamp).toLocaleString()}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-slate-500'>Gas</span>
            <span className='text-emerald-400'>$0.00 (gasless)</span>
          </div>
          {record.transaction && (
            <div className='pt-1 border-t border-white/[0.05]'>
              <p className='text-slate-600 mb-0.5'>Circle Receipt ID</p>
              <p className='text-slate-500 font-mono break-all'>{record.transaction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ActivityFeed({ payments }: { payments: PaymentRecord[] }) {
  const recent = [...payments].reverse().slice(0, 20)

  return (
    <Card>
      <CardContent className='p-5'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Activity className='h-4 w-4 text-slate-400' />
            <span className='text-sm font-medium text-slate-300'>Recent Activity</span>
          </div>
          <span className='text-xs text-slate-600'>Persisted locally</span>
        </div>

        {recent.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-sm text-slate-500'>No payments yet</p>
            <p className='text-xs text-slate-600 mt-1'>
              Pay for an API service to see activity here
            </p>
          </div>
        ) : (
          <div className='space-y-0.5'>
            {recent.map((record) => (
              <ActivityRow key={record.id} record={record} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
