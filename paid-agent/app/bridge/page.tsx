'use client'

import { Header } from '@/components/header'
import { CctpBridgeCard } from '@/components/cctp-bridge-card'

export default function BridgePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
      <Header />
      <main className='container mx-auto px-4 py-8 max-w-2xl'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-100 mb-2'>CCTP Bridge</h1>
          <p className='text-sm text-slate-400'>
            Cross-chain USDC transfer to Arc Testnet via Circle CCTP
          </p>
        </div>
        <CctpBridgeCard />
      </main>
    </div>
  )
}
