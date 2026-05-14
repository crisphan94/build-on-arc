'use client'

import { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  Languages,
  Code2,
  BarChart3,
  CloudSun,
  ArrowRight,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SERVICES } from '@/lib/services'
import { useGatewayPay } from '@/hooks/useGatewayPay'
import type { PayResult } from '@/hooks/useGatewayPay'

export interface PaymentRecord {
  id: string
  service: string
  payer: string
  transaction: string
  amount: string
  formattedAmount: string
  timestamp: number
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  'market-data': TrendingUp,
  weather: CloudSun,
  'ai-text': Sparkles,
  translate: Languages,
  'code-review': Code2,
  sentiment: BarChart3,
}

interface ServicesGridProps {
  onPaymentSuccess?: (record: PaymentRecord) => void
}

export function ServicesGrid({ onPaymentSuccess }: ServicesGridProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const service = SERVICES.find((s) => s.id === selectedService)

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {SERVICES.map((svc) => {
          const Icon = SERVICE_ICONS[svc.id] ?? Sparkles
          return (
            <button
              key={svc.id}
              className='glass rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/[0.15] flex flex-col gap-2 group cursor-pointer text-left'
              onClick={() => setSelectedService(svc.id)}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20'>
                    <Icon className='h-4 w-4 text-indigo-400' />
                  </div>
                  <span className='text-xs font-medium text-slate-400 uppercase tracking-wide'>
                    {svc.category}
                  </span>
                </div>
                <ArrowRight className='h-4 w-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all' />
              </div>
              <div>
                <p className='text-sm font-semibold text-slate-100'>{svc.name}</p>
                <p className='text-xs text-slate-500 mt-0.5 leading-relaxed'>{svc.description}</p>
              </div>
              <div className='flex items-center justify-between mt-auto pt-1'>
                <span className='text-xs text-slate-500'>Per API call</span>
                <span className='text-sm font-bold text-[#5b9fd6] font-space'>
                  {svc.priceDisplay} USDC
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {selectedService && service && (
        <PaymentModal
          service={service}
          onClose={() => setSelectedService(null)}
          onSuccess={(record) => {
            // Don't close here — let the modal show the success state first.
            // Modal closes when user clicks "Done" (which calls onClose).
            onPaymentSuccess?.(record)
          }}
        />
      )}
    </>
  )
}

interface PaymentModalProps {
  service: (typeof SERVICES)[number]
  onClose: () => void
  onSuccess: (record: PaymentRecord) => void
}

type ModalState = 'idle' | 'signing' | 'settling' | 'success' | 'error'

function PaymentModal({ service, onClose, onSuccess }: PaymentModalProps) {
  const [state, setState] = useState<ModalState>('idle')
  const [result, setResult] = useState<PayResult | null>(null)
  const [error, setError] = useState('')
  const { pay } = useGatewayPay()

  const handlePay = async () => {
    setState('signing')
    try {
      // onSigned callback fires immediately after the wallet signs (before settlement)
      // so the modal transitions from 'signing' → 'settling' at the right moment
      const finalResult = await pay(service.id, () => setState('settling'))
      setResult(finalResult)
      setState('success')

      onSuccess({
        id: crypto.randomUUID(),
        service: service.name,
        payer: finalResult.payer,
        transaction: finalResult.transaction,
        amount: finalResult.amount,
        formattedAmount: finalResult.formattedAmount,
        timestamp: Date.now(),
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(
        message.includes('User rejected') || message.includes('User denied')
          ? 'User rejected the request.'
          : message,
      )
      setState('error')
    }
  }

  const address = result?.payer ?? ''

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
    >
      <Card className='w-full max-w-md glass-2'>
        <CardContent className='p-6'>
          {/* Header */}
          <div className='flex items-center justify-between mb-5'>
            <div>
              <p className='text-xs text-slate-500 uppercase tracking-wide mb-0.5'>
                Pay for service
              </p>
              <h2 className='text-base font-semibold text-slate-100 font-space'>{service.name}</h2>
            </div>
            {state !== 'signing' && state !== 'settling' && (
              <button
                onClick={onClose}
                className='text-slate-500 hover:text-slate-300 cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.05]'
                aria-label='Close'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>

          {state === 'idle' && (
            <>
              <div className='rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 mb-5'>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-slate-400'>Service fee</span>
                  <span className='text-slate-100 font-medium font-space'>
                    {service.priceDisplay} USDC
                  </span>
                </div>
                <div className='flex justify-between text-sm mb-3'>
                  <span className='text-slate-400'>Gas fee</span>
                  <span className='text-emerald-400 font-medium'>$0.00 (gasless)</span>
                </div>
                <div className='border-t border-white/[0.07] pt-3'>
                  <p className='text-xs text-slate-500 leading-relaxed'>
                    You will sign an EIP-3009 authorization in your wallet. No ETH needed — Circle
                    Gateway handles the settlement.
                  </p>
                </div>
              </div>
              <Button variant='usdc' size='md' className='w-full' onClick={handlePay}>
                Pay {service.priceDisplay} USDC
              </Button>
            </>
          )}

          {state === 'signing' && (
            <div className='flex flex-col items-center gap-3 py-6'>
              <div className='h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin' />
              <p className='text-sm text-slate-300 font-medium'>Sign in your wallet</p>
              <p className='text-xs text-slate-500 text-center'>
                Check MetaMask or WalletConnect — sign the EIP-712 authorization
              </p>
            </div>
          )}

          {state === 'settling' && (
            <div className='flex flex-col items-center gap-3 py-6'>
              <div className='h-10 w-10 rounded-full border-2 border-[#2775ca] border-t-transparent animate-spin' />
              <p className='text-sm text-slate-300 font-medium'>Settling with Circle…</p>
              <p className='text-xs text-slate-500 text-center'>
                Circle Gateway is processing your payment authorization
              </p>
            </div>
          )}

          {state === 'success' && result && (
            <>
              {/* Receipt header */}
              <div className='flex flex-col items-center gap-2 mb-4'>
                <div className='flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30'>
                  <CheckCircle2 className='h-6 w-6 text-emerald-400' />
                </div>
                <h2 className='font-semibold text-slate-100 font-space'>Payment Confirmed</h2>
              </div>

              {/* Payment receipt */}
              <div className='rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 mb-4 space-y-2.5'>
                <p className='text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-3'>
                  Payment Receipt
                </p>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-400'>Service</span>
                  <span className='text-slate-100 font-medium'>{service.name}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-400'>Amount</span>
                  <span className='text-emerald-400 font-medium font-mono'>
                    {service.priceDisplay} USDC
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-400'>Gas fee</span>
                  <span className='text-emerald-400 font-medium'>$0.00 (gasless)</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-400'>Paid by</span>
                  <span className='text-slate-300 font-mono text-xs'>
                    {address.slice(0, 8)}…{address.slice(-6)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-400'>Settlement</span>
                  <span className='text-slate-400 flex items-center gap-1 text-xs'>
                    <Clock className='h-3 w-3' />
                    Pending next Circle batch
                  </span>
                </div>
                {result.transaction && (
                  <div className='pt-2 border-t border-white/[0.07]'>
                    <p className='text-[10px] text-slate-600 mb-1'>Circle Receipt ID</p>
                    <p className='text-[10px] text-slate-500 font-mono break-all'>
                      {result.transaction}
                    </p>
                  </div>
                )}
              </div>

              {/* API Response */}
              <div className='rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 mb-5'>
                <p className='text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium'>
                  API Response
                </p>
                <pre className='text-xs text-slate-300 overflow-auto max-h-48 leading-relaxed whitespace-pre-wrap'>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              <Button variant='secondary' size='md' className='w-full' onClick={onClose}>
                Done
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className='rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-5'>
                <p className='text-sm text-red-400 font-medium mb-1'>Payment Failed</p>
                <p className='text-xs text-slate-400 break-all'>{error}</p>
              </div>
              <div className='flex gap-3'>
                <Button variant='secondary' size='md' className='flex-1' onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant='usdc'
                  size='md'
                  className='flex-1'
                  onClick={() => {
                    setState('idle')
                    setError('')
                  }}
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
