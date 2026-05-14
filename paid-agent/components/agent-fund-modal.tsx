'use client'

import { useState, useEffect } from 'react'
import { Wallet, Copy, Check, ExternalLink, X, Loader2, ArrowRight } from 'lucide-react'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { parseUnits, erc20Abi } from 'viem'
import { config } from '@/lib/wagmi'
import { USDC_ADDRESS } from '@/lib/contracts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AgentFundModalProps {
  onClose: () => void
  onSuccess: () => void
}

const TRANSFER_PRESETS = [10, 20, 50]

export function AgentFundModal({ onClose, onSuccess }: AgentFundModalProps) {
  const { address: userAddress } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [agentAddress, setAgentAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [amount, setAmount] = useState('10')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'transferring' | 'done'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agent-address')
      .then((r) => r.json())
      .then((d) => {
        if (d.address) setAgentAddress(d.address)
      })
      .catch(console.error)
  }, [])

  const handleCopy = async () => {
    if (!agentAddress) return
    await navigator.clipboard.writeText(agentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTransfer = async () => {
    if (!userAddress || !agentAddress) return

    setLoading(true)
    setError(null)
    setStep('transferring')

    try {
      const amountInBaseUnits = parseUnits(amount, 6)

      // Step 1: Transfer USDC to agent wallet
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [agentAddress as `0x${string}`, amountInBaseUnits],
      })

      setTxHash(hash)
      await waitForTransactionReceipt(config, { hash })

      // Step 2: Trigger agent to deposit into gateway
      console.log('[Fund] Transfer complete, triggering gateway deposit...')
      const depositRes = await fetch('/api/agent-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      })

      if (!depositRes.ok) {
        const errData = (await depositRes.json().catch(() => ({}))) as { error?: string }
        console.warn('[Fund] Gateway deposit failed:', errData.error)
        // Don't fail - money is in agent wallet, will auto-deposit on next payment
      }

      setStep('done')
      setLoading(false)
      onSuccess()
    } catch (err) {
      console.error('[Agent Fund Error]', err)
      const message = err instanceof Error ? err.message : 'Transfer failed'
      setError(message)
      setLoading(false)
      setStep('idle')
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <Card
        className='w-full max-w-md glass-2 border-indigo-500/20'
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center'>
                <Wallet className='h-5 w-5 text-indigo-400' />
              </div>
              <div>
                <h2 className='text-lg font-semibold text-slate-100'>Fund Agent</h2>
                <p className='text-xs text-slate-500'>
                  Transfer USDC to agent's wallet (auto-deposits to Gateway)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-slate-500 hover:text-slate-300 rounded-lg p-1 hover:bg-white/5'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {step === 'done' ? (
            <div className='space-y-4'>
              <div className='rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4'>
                <div className='flex items-center gap-2 text-emerald-400 font-medium mb-2'>
                  <Check className='h-4 w-4' />
                  Transfer complete!
                </div>
                <p className='text-xs text-slate-400'>
                  Agent will auto-deposit to Gateway for nanopayments
                </p>
                {txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2'
                  >
                    View transaction <ExternalLink className='h-3 w-3' />
                  </a>
                )}
              </div>
              <Button variant='secondary' size='md' className='w-full' onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className='space-y-4 mb-5'>
                <div>
                  <p className='text-xs text-slate-500 mb-2'>Agent address</p>
                  <div className='glass rounded-xl px-3 py-2.5 border border-white/10 flex items-center gap-2'>
                    <p className='flex-1 text-sm text-slate-300 font-mono break-all'>
                      {agentAddress || 'Loading...'}
                    </p>
                    {agentAddress && (
                      <>
                        <button
                          onClick={handleCopy}
                          className='text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-white/5'
                        >
                          {copied ? (
                            <Check className='h-4 w-4 text-emerald-400' />
                          ) : (
                            <Copy className='h-4 w-4' />
                          )}
                        </button>
                        <a
                          href={`https://testnet.arcscan.app/address/${agentAddress}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-white/5'
                        >
                          <ExternalLink className='h-4 w-4' />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className='text-xs text-slate-500 mb-2'>Transfer amount</p>
                  <div className='flex gap-2 mb-3'>
                    {TRANSFER_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        disabled={loading}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          amount === preset.toString()
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-slate-200'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {preset} USDC
                      </button>
                    ))}
                  </div>

                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400'>
                      $
                    </span>
                    <input
                      type='number'
                      min='0.000001'
                      step='1'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={loading}
                      className='w-full rounded-xl bg-white/5 border border-white/10 text-slate-100 pl-7 pr-16 py-3 text-sm outline-none hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50'
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium'>
                      USDC
                    </span>
                  </div>
                </div>

                {loading && (
                  <div className='rounded-xl bg-white/5 border border-white/10 p-3'>
                    <div className='flex items-center gap-2 text-xs text-slate-400'>
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      Transferring USDC to agent wallet...
                    </div>
                  </div>
                )}

                {error && (
                  <p className='text-xs text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3'>
                    {error}
                  </p>
                )}
              </div>

              <div className='flex gap-3'>
                <Button variant='secondary' size='md' className='flex-1' onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant='default'
                  size='md'
                  className='flex-1 bg-indigo-600 hover:bg-indigo-500'
                  loading={loading}
                  onClick={handleTransfer}
                  disabled={!agentAddress || !amount || parseFloat(amount) <= 0}
                >
                  <ArrowRight className='h-4 w-4' />
                  Transfer {amount} USDC
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
