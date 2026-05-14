'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Wallet,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { shortAddress } from '@/lib/utils'
import { useGatewayBalance } from '@/hooks/useGatewayBalance'
import { useGatewayDeposit } from '@/hooks/useGatewayDeposit'
import { useGatewayWithdraw } from '@/hooks/useGatewayWithdraw'

interface BalanceCardProps {
  address: `0x${string}`
  /** Called once with a function the parent can call to trigger a balance refresh */
  onRefetchReady?: (refetch: () => void) => void
}

export function BalanceCard({ address, onRefetchReady }: BalanceCardProps) {
  const { walletBalance, gatewayBalance, refetch } = useGatewayBalance(address)
  const [refreshing, setRefreshing] = useState(false)
  const [depositModal, setDepositModal] = useState(false)
  const [withdrawModal, setWithdrawModal] = useState(false)

  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    if (!onRefetchReady) return

    const refetchWithSchedule = () => {
      setRefreshing(true)
      const t1 = setTimeout(() => {
        refetchRef.current()
      }, 2_000)
      const t2 = setTimeout(() => {
        refetchRef.current()
      }, 5_000)
      const t3 = setTimeout(() => {
        refetchRef.current()
        setRefreshing(false)
      }, 12_000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }

    onRefetchReady(refetchWithSchedule)
  }, [onRefetchReady])

  const handleRefresh = async () => {
    setRefreshing(true)
    refetch()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {/* Gateway Balance */}
        <Card className='relative overflow-hidden glow-usdc hover:border-[#2775ca]/40'>
          <CardContent className='p-5'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-2 text-[#5b9fd6]'>
                <Building2 className='h-4 w-4' />
                <span className='text-xs font-medium uppercase tracking-wide'>
                  Your Gateway Balance
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className='text-slate-500 hover:text-slate-300 cursor-pointer rounded-lg p-1 hover:bg-white/[0.05]'
                aria-label='Refresh balance'
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className='mb-1'>
              <span className='text-3xl font-bold text-slate-100 font-space'>
                {gatewayBalance !== null ? parseFloat(gatewayBalance).toFixed(2) : '—'}
              </span>
              <span className='ml-2 text-sm text-[#5b9fd6] font-medium'>USDC</span>
            </div>
            <p className='text-xs text-slate-500 mb-4'>
              {gatewayBalance !== null ? 'For manual service payments' : 'Loading…'}
            </p>
            <div className='flex gap-2'>
              <Button
                variant='usdc'
                size='sm'
                className='flex-1'
                onClick={() => setDepositModal(true)}
              >
                <ArrowDownToLine className='h-3.5 w-3.5' />
                Deposit
              </Button>
              <Button
                variant='secondary'
                size='sm'
                className='flex-1'
                onClick={() => setWithdrawModal(true)}
              >
                <ArrowUpFromLine className='h-3.5 w-3.5' />
                Withdraw
              </Button>
            </div>
          </CardContent>
          <div className='absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#2775ca]/10 blur-2xl pointer-events-none' />
        </Card>

        {/* Wallet Balance */}
        <Card className='relative overflow-hidden hover:border-white/[0.15]'>
          <CardContent className='p-5'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-2 text-slate-400'>
                <Wallet className='h-4 w-4' />
                <span className='text-xs font-medium uppercase tracking-wide'>Wallet Balance</span>
              </div>
              <button
                onClick={handleRefresh}
                className='text-slate-500 hover:text-slate-300 cursor-pointer rounded-lg p-1 hover:bg-white/5'
                aria-label='Refresh balance'
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className='mb-1'>
              <span className='text-3xl font-bold text-slate-100 font-space'>
                {walletBalance !== null ? parseFloat(walletBalance).toFixed(2) : '—'}
              </span>
              <span className='ml-2 text-sm text-slate-400 font-medium'>USDC</span>
            </div>
            <p className='text-xs text-slate-500 mb-4'>{shortAddress(address)}</p>
            <div className='rounded-xl bg-white/4 border border-white/6 p-3'>
              <p className='text-xs text-slate-500 leading-relaxed'>
                Deposit to Gateway for manual service payments. Agent uses separate wallet.
              </p>
            </div>
          </CardContent>
          <div className='absolute -top-8 -left-8 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none' />
        </Card>
      </div>

      {depositModal && (
        <DepositModal
          address={address}
          onClose={() => setDepositModal(false)}
          onSuccess={handleRefresh}
        />
      )}
      {withdrawModal && (
        <WithdrawModal
          gatewayBalance={gatewayBalance ?? '0'}
          onClose={() => setWithdrawModal(false)}
          onSuccess={handleRefresh}
        />
      )}
    </>
  )
}

function DepositModal({
  address,
  onClose,
  onSuccess,
}: {
  address: `0x${string}`
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'done'>('idle')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const { deposit } = useGatewayDeposit()

  const handleDeposit = async () => {
    setLoading(true)
    setError('')
    try {
      setStep('approving')
      const result = await deposit(amount)
      setStep('depositing')
      setTxHash(result.depositTxHash)
      setStep('done')
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deposit failed'
      setError(message.includes('User rejected') ? 'Transaction rejected in wallet.' : message)
      setStep('idle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      aria-labelledby='deposit-title'
    >
      <Card className='w-full max-w-sm glass-2 glow-usdc'>
        <CardContent className='p-6'>
          <h2 id='deposit-title' className='text-lg font-semibold text-slate-100 font-space mb-1'>
            Deposit to Gateway
          </h2>
          <p className='text-sm text-slate-400 mb-5'>
            Two on-chain transactions: approve USDC spend, then deposit. All subsequent payments are
            gasless.
          </p>

          {step === 'done' ? (
            <div className='space-y-3 mb-4'>
              <div className='rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4'>
                <p className='text-sm text-emerald-400 font-medium mb-1'>Deposit confirmed!</p>
                <p className='text-xs text-slate-400 break-all'>{txHash}</p>
                {txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-xs text-[#5b9fd6] hover:text-[#7ab3e0] mt-2'
                  >
                    View on ArcScan <ExternalLink className='h-3 w-3' />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className='mb-4'>
                <label
                  className='block text-sm font-medium text-slate-300 mb-1.5'
                  htmlFor='deposit-amount'
                >
                  Amount (USDC)
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400'>
                    $
                  </span>
                  <input
                    id='deposit-amount'
                    type='number'
                    min='0.000001'
                    step='0.1'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className='w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-100 pl-7 pr-16 py-3 text-sm outline-none hover:border-white/[0.2] focus:border-[#2775ca] focus:ring-2 focus:ring-[#2775ca]/20 disabled:opacity-50'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium'>
                    USDC
                  </span>
                </div>
              </div>

              {loading && (
                <div className='rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 mb-4'>
                  <p className='text-xs text-slate-400'>
                    {step === 'approving' && '⏳ Step 1/2: Approving USDC spend in your wallet…'}
                    {step === 'depositing' && '⏳ Step 2/2: Depositing USDC to Gateway…'}
                  </p>
                </div>
              )}

              {error && (
                <p className='text-xs text-red-400 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3'>
                  {error}
                </p>
              )}
            </>
          )}

          <div className='flex gap-3'>
            <Button variant='secondary' size='md' className='flex-1' onClick={onClose}>
              {step === 'done' ? 'Close' : 'Cancel'}
            </Button>
            {step !== 'done' && (
              <Button
                variant='usdc'
                size='md'
                className='flex-1'
                loading={loading}
                onClick={handleDeposit}
              >
                Deposit {amount} USDC
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WithdrawModal({
  gatewayBalance,
  onClose,
  onSuccess,
}: {
  gatewayBalance: string
  onClose: () => void
  onSuccess: () => void
}) {
  const maxAmount = parseFloat(gatewayBalance).toFixed(6)
  const [amount, setAmount] = useState(maxAmount)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'pending' | 'done'>('idle')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const { initiateWithdraw } = useGatewayWithdraw()

  const handleWithdraw = async () => {
    setLoading(true)
    setError('')
    setStep('pending')
    try {
      const hash = await initiateWithdraw(amount)
      setTxHash(hash)
      setStep('done')
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Withdraw failed'
      setError(message.includes('User rejected') ? 'Transaction rejected in wallet.' : message)
      setStep('idle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      aria-labelledby='withdraw-title'
    >
      <Card className='w-full max-w-sm glass-2'>
        <CardContent className='p-6'>
          <h2 id='withdraw-title' className='text-lg font-semibold text-slate-100 font-space mb-1'>
            Withdraw from Gateway
          </h2>
          <p className='text-sm text-slate-400 mb-1'>
            Initiates a trustless on-chain withdrawal. A 7-day delay is enforced by the Gateway
            contract before funds are released to your wallet.
          </p>
          <p className='text-xs text-slate-500 mb-5'>
            Available: <span className='text-slate-300'>{maxAmount} USDC</span>
          </p>

          {step === 'done' ? (
            <div className='rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-4'>
              <p className='text-sm text-emerald-400 font-medium mb-1'>Withdrawal initiated!</p>
              <p className='text-xs text-slate-400 mb-2'>
                Your {amount} USDC withdrawal is pending. After the 7-day on-chain delay, funds will
                be sent to your wallet automatically.
              </p>
              {txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 text-xs text-[#5b9fd6] hover:text-[#7ab3e0]'
                >
                  View on ArcScan <ExternalLink className='h-3 w-3' />
                </a>
              )}
            </div>
          ) : (
            <>
              <div className='mb-4'>
                <label
                  className='block text-sm font-medium text-slate-300 mb-1.5'
                  htmlFor='withdraw-amount'
                >
                  Amount (USDC)
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400'>
                    $
                  </span>
                  <input
                    id='withdraw-amount'
                    type='number'
                    min='0.000001'
                    max={maxAmount}
                    step='0.1'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className='w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-100 pl-7 pr-16 py-3 text-sm outline-none hover:border-white/[0.2] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium'>
                    USDC
                  </span>
                </div>
                <button
                  type='button'
                  className='text-xs text-slate-500 hover:text-slate-300 mt-1 cursor-pointer'
                  onClick={() => setAmount(maxAmount)}
                >
                  Max: {maxAmount} USDC
                </button>
              </div>

              {error && (
                <p className='text-xs text-red-400 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3'>
                  {error}
                </p>
              )}
            </>
          )}

          <div className='flex gap-3'>
            <Button variant='secondary' size='md' className='flex-1' onClick={onClose}>
              {step === 'done' ? 'Close' : 'Cancel'}
            </Button>
            {step !== 'done' && (
              <Button
                variant='primary'
                size='md'
                className='flex-1'
                loading={loading}
                onClick={handleWithdraw}
              >
                Initiate Withdrawal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
