'use client'

import { useState } from 'react'
import {
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { cn } from '@/lib/utils'
import { bridgeToArc, SUPPORTED_CHAINS } from '@/lib/cctp-bridge-kit'
import type { Address } from 'viem'

// Get block explorer URL for chain
function getExplorerUrl(chainId: number): string {
  // Use Bridge Kit chain definitions for accurate explorer URLs
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.chainId === chainId)
  if (chain && 'explorerUrl' in chain) {
    // explorerUrl already contains '/tx/{hash}' pattern, return base URL
    return chain.explorerUrl.split('/tx/')[0]
  }

  // Fallback mapping
  const explorers: Record<number, string> = {
    11155111: 'https://sepolia.etherscan.io',
    43113: 'https://testnet.snowtrace.io',
    84532: 'https://sepolia.basescan.org',
    80002: 'https://amoy.polygonscan.com',
    5042002: 'https://testnet.arcscan.app',
  }
  return explorers[chainId] || 'https://etherscan.io'
}

// Supported source chains for CCTP → Arc Testnet bridging
const SOURCE_CHAINS = [
  {
    id: 'avalanche-fuji' as const,
    name: 'Avalanche Fuji',
    chainId: SUPPORTED_CHAINS['avalanche-fuji'].chainId,
  },
  {
    id: 'base-sepolia' as const,
    name: 'Base Sepolia',
    chainId: SUPPORTED_CHAINS['base-sepolia'].chainId,
  },
  {
    id: 'polygon-amoy' as const,
    name: 'Polygon Amoy',
    chainId: SUPPORTED_CHAINS['polygon-amoy'].chainId,
  },
]

interface CctpBridgeCardProps {
  onBridgeSuccess?: () => void
}

interface BridgeStep {
  name: 'approve' | 'burn' | 'attestation' | 'mint'
  status: 'pending' | 'processing' | 'success' | 'error'
  txHash?: string
  chainId?: number
}

export function CctpBridgeCard({ onBridgeSuccess }: CctpBridgeCardProps) {
  const { address, chain: currentChain } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const [sourceChain, setSourceChain] = useState(SOURCE_CHAINS[0])
  const [amount, setAmount] = useState('10')
  const [step, setStep] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [bridgeSteps, setBridgeSteps] = useState<BridgeStep[]>([])
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleBridge = async () => {
    if (!address || !walletClient) {
      setError('Please connect your wallet first')
      setStep('error')
      return
    }

    setStep('loading')
    setError(null)
    setBridgeSteps([
      { name: 'approve', status: 'pending' },
      { name: 'burn', status: 'pending' },
      { name: 'attestation', status: 'pending' },
      { name: 'mint', status: 'pending' },
    ])
    setCurrentMessage('')

    const updateStepStatus = (
      stepName: BridgeStep['name'],
      status: BridgeStep['status'],
      txHash?: string,
      chainId?: number,
    ) => {
      setBridgeSteps((prev) =>
        prev.map((s) => (s.name === stepName ? { ...s, status, txHash, chainId } : s)),
      )
    }

    try {
      // Step 0: Check if user is on correct source chain, switch if needed
      const targetChainId = SUPPORTED_CHAINS[sourceChain.id].chainId
      if (currentChain?.id !== targetChainId) {
        setCurrentMessage(`Switching to ${sourceChain.name}...`)
        try {
          await switchChainAsync?.({ chainId: targetChainId })
          setCurrentMessage(`Switched to ${sourceChain.name} — waiting for wallet sync...`)
          // Wait for wallet client to update to new chain
          await new Promise((r) => setTimeout(r, 2000))
        } catch (switchErr) {
          if (switchErr instanceof Error && switchErr.message.includes('User rejected')) {
            throw new Error(
              'Chain switch cancelled. Please switch to the correct network manually.',
            )
          }
          throw new Error(
            `Failed to switch to ${sourceChain.name}. Please switch manually in your wallet.`,
          )
        }
      }

      setCurrentMessage('Preparing bridge transaction...')

      const result = await bridgeToArc(
        sourceChain.id,
        amount,
        address as Address,
        walletClient as any,
        async (progressMsg, hash) => {
          setCurrentMessage(progressMsg)

          // Update approve step
          if (progressMsg.includes('Approval complete')) {
            updateStepStatus('approve', 'success', hash, targetChainId)
          } else if (progressMsg.includes('Approving')) {
            updateStepStatus('approve', 'processing')
          }

          // Update burn step
          if (progressMsg.includes('Burn complete')) {
            updateStepStatus('burn', 'success', hash, targetChainId)

            // Auto-switch to Arc Testnet for mint (Bridge Kit needs wallet on destination chain)
            try {
              setCurrentMessage('Switching to Arc Testnet for mint...')
              await switchChainAsync?.({ chainId: 5042002 }) // Arc Testnet
              await new Promise((r) => setTimeout(r, 2000)) // Wait for wallet sync
              setCurrentMessage('Switched to Arc Testnet — waiting for attestation...')
            } catch (switchErr) {
              console.error('[Chain Switch Error]', switchErr)
              // Don't throw - let Bridge Kit handle mint error if switch failed
            }
          } else if (progressMsg.includes('Burning')) {
            updateStepStatus('burn', 'processing')
          }

          // Update attestation step
          if (progressMsg.includes('attestation')) {
            updateStepStatus('attestation', 'processing')
          }

          // Update mint step (when mint starts, attestation is complete)
          if (progressMsg.includes('Mint complete')) {
            updateStepStatus('attestation', 'success') // Mark attestation done
            updateStepStatus('mint', 'success', hash, 5042002)
          } else if (progressMsg.includes('Minting')) {
            updateStepStatus('attestation', 'success') // Mark attestation done before minting
            updateStepStatus('mint', 'processing')
          }
        },
      )

      // Final update - ensure mint step has tx hash
      updateStepStatus('mint', 'success', result.mintTx, 5042002)
      setStep('done')

      // Auto-refresh wallet balance after successful bridge
      onBridgeSuccess?.()
    } catch (err) {
      console.error('[cctp-bridge] Full error object:', err)
      const message = err instanceof Error ? err.message : 'Bridge failed'
      setError(
        message.includes('User rejected') || message.includes('User denied')
          ? 'User rejected the request.'
          : message,
      )
      setStep('error')
    }
  }

  return (
    <div className='glass rounded-2xl p-6 space-y-5'>
      <div className='flex items-center gap-3'>
        <div className='h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center'>
          <ArrowLeftRight className='h-4 w-4 text-violet-400' />
        </div>
        <div>
          <h3 className='text-sm font-semibold text-slate-100'>Bridge to Arc Testnet</h3>
          <p className='text-xs text-slate-500'>Cross-chain USDC via Circle CCTP</p>
        </div>
      </div>

      <div>
        <p className='text-xs text-slate-500 mb-2'>Source chain</p>
        <div className='grid grid-cols-2 gap-2'>
          {SOURCE_CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => setSourceChain(chain)}
              disabled={step === 'loading'}
              className={cn(
                'px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50',
                sourceChain.id === chain.id
                  ? 'bg-violet-600/15 border-violet-500/40 text-slate-200'
                  : 'bg-white/4 border-white/8 text-slate-400 hover:border-white/20',
              )}
            >
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {address && currentChain && (
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-xs border',
            currentChain.id === sourceChain.chainId
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          )}
        >
          {currentChain.id === sourceChain.chainId ? (
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-3.5 w-3.5' />
              <span>Ready to bridge from {currentChain.name}</span>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-3.5 w-3.5' />
              <span>Switch to {sourceChain.name}</span>
            </div>
          )}
        </div>
      )}

      <div className='flex items-center gap-3'>
        <div className='flex-1'>
          <p className='text-xs text-slate-500 mb-1'>Amount</p>
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
          </div>
        </div>
      </div>

      {step === 'idle' && (
        <button
          onClick={handleBridge}
          disabled={!address || !walletClient}
          className='w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium cursor-pointer transition-colors'
        >
          <ArrowLeftRight className='h-4 w-4' />
          {address ? `Bridge ${amount} USDC` : 'Connect Wallet'}
        </button>
      )}

      {step === 'loading' && (
        <div className='space-y-3'>
          <div className='rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3'>
            <div className='flex items-center gap-2 text-sm font-medium text-violet-400'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Processing
            </div>

            <div className='space-y-2'>
              {bridgeSteps.map((bridgeStep) => {
                const stepLabels = {
                  approve: 'Approve',
                  burn: 'Burn',
                  attestation: 'Attestation',
                  mint: 'Mint',
                }

                const StepIcon = () => {
                  if (bridgeStep.status === 'success')
                    return <CheckCircle2 className='h-3.5 w-3.5 text-emerald-400 shrink-0' />
                  if (bridgeStep.status === 'processing')
                    return <Loader2 className='h-3.5 w-3.5 animate-spin text-violet-400 shrink-0' />
                  if (bridgeStep.status === 'error')
                    return <AlertCircle className='h-3.5 w-3.5 text-red-400 shrink-0' />
                  return (
                    <div className='h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0' />
                  )
                }

                return (
                  <div key={bridgeStep.name} className='flex items-start gap-2'>
                    <StepIcon />
                    <div className='flex-1 min-w-0'>
                      <div
                        className={cn(
                          'text-xs',
                          bridgeStep.status === 'success'
                            ? 'text-emerald-400'
                            : bridgeStep.status === 'processing'
                              ? 'text-violet-400'
                              : bridgeStep.status === 'error'
                                ? 'text-red-400'
                                : 'text-slate-500',
                        )}
                      >
                        {stepLabels[bridgeStep.name]}
                      </div>
                      {bridgeStep.txHash && bridgeStep.chainId && (
                        <a
                          href={`${getExplorerUrl(bridgeStep.chainId)}/tx/${bridgeStep.txHash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-[10px] text-slate-400 hover:text-slate-200 font-mono break-all flex items-center gap-1 mt-0.5 group'
                        >
                          <span className='truncate'>{bridgeStep.txHash.slice(0, 20)}...</span>
                          <ExternalLink className='h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity' />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {currentMessage && (
              <div className='text-xs text-slate-400 pt-2 border-t border-white/5'>
                {currentMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className='rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-3'>
          <div className='flex items-center gap-2 text-sm font-medium text-emerald-400'>
            <CheckCircle2 className='h-4 w-4' />
            Complete
          </div>

          <div className='space-y-2'>
            {bridgeSteps
              .filter((s) => s.status === 'success' && s.txHash)
              .map((bridgeStep) => {
                const stepLabels = {
                  approve: 'Approve',
                  burn: 'Burn',
                  attestation: 'Attestation',
                  mint: 'Mint',
                }

                return (
                  <div key={bridgeStep.name}>
                    <p className='text-[10px] text-slate-500 mb-0.5'>
                      {stepLabels[bridgeStep.name]}
                    </p>
                    <a
                      href={`${getExplorerUrl(bridgeStep.chainId!)}/tx/${bridgeStep.txHash}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-[10px] text-violet-400 hover:text-violet-300 font-mono break-all flex items-center gap-1 group'
                    >
                      <span>{bridgeStep.txHash}</span>
                      <ExternalLink className='h-3 w-3 shrink-0' />
                    </a>
                  </div>
                )
              })}
          </div>

          <button
            onClick={() => {
              setStep('idle')
              setBridgeSteps([])
              setCurrentMessage('')
            }}
            className='text-xs text-slate-400 hover:text-slate-200 cursor-pointer mt-1'
          >
            Bridge again
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className='rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 space-y-2'>
          <div className='flex items-center gap-2 text-red-400 text-sm font-medium'>
            <AlertCircle className='h-4 w-4' />
            Failed
          </div>
          {error && <p className='text-[11px] text-red-300/80'>{error}</p>}
          <button
            onClick={() => {
              setStep('idle')
              setError(null)
              setBridgeSteps([])
              setCurrentMessage('')
            }}
            className='text-xs text-slate-400 hover:text-slate-200 cursor-pointer mt-1'
          >
            Retry
          </button>
        </div>
      )}

      <p className='text-[10px] text-slate-600 text-center'>
        Powered by Circle CCTP · Trustless burn-and-mint · No wrapped tokens
      </p>
    </div>
  )
}
