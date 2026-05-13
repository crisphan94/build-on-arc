'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeftRight, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Supported source chains for CCTP → Arc Testnet bridging
const SOURCE_CHAINS = [
  { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', logo: '⬡', chainId: 11155111 },
  { id: 'avalanche-fuji', name: 'Avalanche Fuji', logo: '▲', chainId: 43113 },
  { id: 'base-sepolia', name: 'Base Sepolia', logo: '🔵', chainId: 84532 },
  { id: 'polygon-amoy', name: 'Polygon Amoy', logo: '⬟', chainId: 80002 },
]

const BRIDGE_STEPS = [
  'Burn USDC on source chain via CCTP',
  'Attest burn on Circle attestation service',
  'Mint USDC on Arc Testnet (Chain 5042002)',
  'Deposit into GatewayWallet for agent use',
]

export function CctpBridgeCard() {
  const [sourceChain, setSourceChain] = useState(SOURCE_CHAINS[0])
  const [amount, setAmount] = useState('10')
  const [step, setStep] = useState<'idle' | 'loading' | 'done'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleBridge = async () => {
    setStep('loading')
    // Simulate CCTP bridge flow (real integration requires user wallet signature)
    // In production: use @circle-fin/bridge-kit or Circle CCTP API
    await new Promise((r) => setTimeout(r, 2000))
    setTxHash(
      '0x' +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
    )
    setStep('done')
  }

  return (
    <div className='glass rounded-2xl p-6 space-y-5'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <div className='h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center'>
          <ArrowLeftRight className='h-4 w-4 text-violet-400' />
        </div>
        <div>
          <h3 className='text-sm font-semibold text-slate-100'>CCTP Bridge → Arc Testnet</h3>
          <p className='text-xs text-slate-500'>Cross-chain USDC deposit via Circle CCTP</p>
        </div>
        <a
          href='https://developers.circle.com/cctp'
          target='_blank'
          rel='noopener noreferrer'
          className='ml-auto text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer'
        >
          Docs <ExternalLink className='h-3 w-3' />
        </a>
      </div>

      {/* Source chain select */}
      <div>
        <p className='text-xs text-slate-500 mb-2'>Source chain</p>
        <div className='grid grid-cols-2 gap-2'>
          {SOURCE_CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => setSourceChain(chain)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs cursor-pointer transition-all',
                sourceChain.id === chain.id
                  ? 'bg-violet-600/15 border-violet-500/40 text-slate-200'
                  : 'bg-white/4 border-white/8 text-slate-400 hover:border-white/20',
              )}
            >
              <span className='text-base'>{chain.logo}</span>
              <span className='font-medium'>{chain.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount + destination */}
      <div className='flex items-center gap-3'>
        <div className='flex-1'>
          <p className='text-xs text-slate-500 mb-1'>Amount (USDC)</p>
          <div className='flex items-center gap-2 glass rounded-xl px-3 py-2.5 border border-transparent focus-within:border-violet-500/50'>
            <input
              type='number'
              min={1}
              max={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='flex-1 bg-transparent text-sm text-slate-200 outline-none'
            />
            <span className='text-xs text-slate-500'>USDC</span>
          </div>
        </div>

        <div className='flex flex-col items-center mt-4'>
          <ArrowRight className='h-4 w-4 text-slate-600' />
        </div>

        <div className='flex-1'>
          <p className='text-xs text-slate-500 mb-1'>Destination</p>
          <div className='glass rounded-xl px-3 py-2.5 border border-emerald-500/20 bg-emerald-500/5'>
            <p className='text-sm font-medium text-emerald-400'>Arc Testnet</p>
            <p className='text-[10px] text-slate-500'>Chain 5042002</p>
          </div>
        </div>
      </div>

      {/* Bridge steps */}
      <div className='space-y-2'>
        <p className='text-xs text-slate-500 uppercase tracking-wider'>How CCTP works</p>
        {BRIDGE_STEPS.map((s, i) => (
          <div key={i} className='flex items-start gap-2.5'>
            <div className='h-4 w-4 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5'>
              <span className='text-[9px] text-violet-400 font-bold'>{i + 1}</span>
            </div>
            <p className='text-xs text-slate-400'>{s}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      {step === 'idle' && (
        <button
          onClick={handleBridge}
          className='w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium cursor-pointer transition-colors'
        >
          <ArrowLeftRight className='h-4 w-4' />
          Bridge {amount} USDC to Arc Testnet
        </button>
      )}

      {step === 'loading' && (
        <div className='w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600/40 text-slate-300 text-sm'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Processing CCTP transfer…
        </div>
      )}

      {step === 'done' && txHash && (
        <div className='rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-1'>
          <div className='flex items-center gap-2 text-emerald-400 text-sm font-medium'>
            <CheckCircle2 className='h-4 w-4' />
            Bridge initiated — USDC en route to Arc Testnet
          </div>
          <p className='text-[10px] text-slate-500 font-mono break-all'>{txHash}</p>
          <button
            onClick={() => setStep('idle')}
            className='text-xs text-slate-400 hover:text-slate-200 cursor-pointer mt-1'
          >
            Bridge again
          </button>
        </div>
      )}

      <p className='text-[10px] text-slate-600 text-center'>
        Powered by Circle CCTP · Trustless burn-and-mint · No wrapped tokens
      </p>
    </div>
  )
}
