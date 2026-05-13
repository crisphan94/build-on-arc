'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Zap, Shield, DollarSign, Globe } from 'lucide-react'
import { Header } from '@/components/header'
import { BalanceCard } from '@/components/balance-card'
import { ServicesGrid, type PaymentRecord } from '@/components/services-grid'
import { ActivityFeed } from '@/components/activity-feed'
import { HowItWorks } from '@/components/how-it-works'
import { PaymentTicker } from '@/components/payment-ticker'
import { CctpBridgeCard } from '@/components/cctp-bridge-card'
import { Badge } from '@/components/ui/badge'

const STATS = [
  { label: 'Service fee', value: '$1.00', sub: 'per API call' },
  { label: 'Gas fee', value: '$0.00', sub: 'Gasless' },
  { label: 'Settlement', value: 'Batched', sub: 'Circle Gateway' },
  { label: 'Network', value: 'Arc', sub: 'Testnet · Chain 5042002' },
]

const FEATURES = [
  {
    icon: DollarSign,
    title: 'Sub-cent payments',
    description:
      'Send as little as $0.000001 USDC per call. Traditional on-chain payments make this impossible — Gateway makes it trivial.',
    color: 'text-[#5b9fd6]',
    bg: 'bg-[#2775ca]/10 border-[#2775ca]/20',
  },
  {
    icon: Zap,
    title: 'Zero gas fees',
    description:
      'Buyers sign EIP-3009 authorizations offchain. No per-transaction gas. The only on-chain step is the initial deposit.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Shield,
    title: 'x402 protocol',
    description:
      'Standard HTTP 402 Payment Required flow. Any API can become a paid service. Sellers integrate in minutes with the Circle SDK.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Globe,
    title: 'Crosschain liquidity',
    description:
      'Deposit on any supported chain. Withdraw to any chain. Sellers receive USDC regardless of which chain buyers deposited on.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
]

const STORAGE_KEY = 'paid-agent:payments'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  // Load payments from localStorage only after mount (avoids SSR mismatch)
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPayments(JSON.parse(raw) as PaymentRecord[])
    } catch {
      // ignore
    }
  }, [])

  // Ref to BalanceCard's refetch — populated via onRefetchReady callback
  const refetchBalanceRef = useRef<(() => void) | null>(null)

  // Persist payments to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
    } catch {
      // quota exceeded — ignore
    }
  }, [payments])

  const handlePaymentSuccess = useCallback((record: PaymentRecord) => {
    setPayments((prev) => [...prev, record])
    // Refresh gateway balance so the deducted amount shows immediately
    refetchBalanceRef.current?.()
  }, [])

  return (
    <div className='min-h-screen bg-dots'>
      <Header />
      <PaymentTicker />

      <main className='container mx-auto px-4 sm:px-6 py-8 max-w-6xl'>
        {/* Hero */}
        <section className='text-center mb-12'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            <Badge variant='indigo' className='text-xs px-3 py-1'>
              Circle Gateway · Nanopayments
            </Badge>
            <Badge variant='default' className='text-xs px-3 py-1'>
              Arc Testnet
            </Badge>
          </div>

          <h1 className='text-4xl sm:text-5xl font-bold text-slate-100 font-space mb-4 leading-tight'>
            Micropayments for the <span className='gradient-text'>Agentic Economy</span>
          </h1>

          <p className='text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed'>
            Pay <strong className='text-[#5b9fd6]'>$1 USDC</strong> per API call, zero gas. Circle
            Gateway batches off-chain payments into a single on-chain settlement — making
            pay-per-call APIs economically viable.
          </p>

          {/* Stats row */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8'>
            {STATS.map(({ label, value, sub }) => (
              <div key={label} className='glass rounded-2xl p-4 text-center hover:bg-white/[0.04]'>
                <p className='text-xl font-bold text-slate-100 font-space'>{value}</p>
                <p className='text-xs text-slate-400 mt-0.5'>{label}</p>
                <p className='text-[10px] text-slate-600 mt-0.5'>{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA — only render after mount to avoid SSR/client mismatch */}
          {mounted && !isConnected && (
            <div className='flex flex-col items-center gap-3'>
              <ConnectButton label='Connect Wallet to Start' />
              <p className='text-xs text-slate-500'>
                MetaMask or WalletConnect · Arc Testnet (Chain 5042002)
              </p>
            </div>
          )}
        </section>

        {/* Features */}
        <section className='mb-12'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className='glass rounded-2xl p-6 hover:bg-white/[0.04] group'>
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border ${bg} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <h3 className='text-sm font-semibold text-slate-100 mb-1'>{title}</h3>
                <p className='text-xs text-slate-400 leading-relaxed'>{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Connected Dashboard */}
        {mounted && isConnected && address ? (
          <div className='space-y-6'>
            <BalanceCard
              address={address as `0x${string}`}
              onRefetchReady={(fn) => {
                refetchBalanceRef.current = fn
              }}
            />
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2'>
                <ServicesGrid onPaymentSuccess={handlePaymentSuccess} />
              </div>
              <div>
                <CctpBridgeCard />
              </div>
            </div>
            <ActivityFeed payments={payments} />
          </div>
        ) : null}

        <HowItWorks />
      </main>
    </div>
  )
}
