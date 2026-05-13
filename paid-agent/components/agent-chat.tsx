'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bot,
  Send,
  DollarSign,
  Zap,
  RotateCcw,
  Wallet,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentChat } from '@/hooks/useAgentChat'
import { AgentMessage } from '@/components/agent-message'

const SUGGESTED_TASKS = [
  'What is the weather like in Da Nang City today?',
  'Which token is pumping the hardest today?',
  'Give me a full BTC market analysis with sentiment',
  'Analyze the current crypto market and summarize key trends',
]

const BUDGET_PRESETS = [1, 3, 5, 10]

// ── Setup screen ──────────────────────────────────────────────────────────────

interface BudgetSetupProps {
  onStart: (budget: number) => void
}

function BudgetSetup({ onStart }: BudgetSetupProps) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [balanceError, setBalanceError] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState(3)
  const [customBudget, setCustomBudget] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  useEffect(() => {
    fetch('/api/agent-balance')
      .then((r) => r.json())
      .then((d: { usdc?: number; error?: string }) => {
        if (d.usdc !== undefined) setWalletBalance(d.usdc)
        else setBalanceError(true)
      })
      .catch(() => setBalanceError(true))
  }, [])

  const effectiveBudget = isCustom ? parseFloat(customBudget) || 0 : selectedBudget
  const isAffordable = walletBalance === null || effectiveBudget <= walletBalance
  const canStart = effectiveBudget > 0 && isAffordable

  return (
    <div className='flex flex-col items-center gap-8 py-8 px-4 max-w-md mx-auto'>
      {/* Icon */}
      <div className='h-20 w-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center'>
        <Bot className='h-10 w-10 text-indigo-400' />
      </div>

      {/* Headline */}
      <div className='text-center'>
        <h2 className='text-xl font-semibold text-slate-100 mb-2'>Set session budget</h2>
        <p className='text-slate-400 text-sm leading-relaxed'>
          The agent pays for each API call autonomously via Circle Gateway Nanopayments. Set a
          spending limit for this session.
        </p>
      </div>

      {/* Wallet balance badge */}
      <div className='w-full glass rounded-xl px-4 py-3 flex items-center gap-3'>
        <Wallet className='h-5 w-5 text-slate-500 shrink-0' />
        <div className='flex-1'>
          <p className='text-xs text-slate-500 mb-0.5'>Available in GatewayWallet</p>
          {walletBalance === null && !balanceError ? (
            <div className='flex items-center gap-2'>
              <Loader2 className='h-3.5 w-3.5 animate-spin text-slate-500' />
              <span className='text-sm text-slate-500'>Fetching balance…</span>
            </div>
          ) : balanceError ? (
            <div className='flex items-center gap-1.5 text-amber-400 text-sm'>
              <AlertCircle className='h-3.5 w-3.5' />
              Could not fetch balance
            </div>
          ) : (
            <p className='text-base font-semibold text-slate-100'>
              {walletBalance!.toFixed(2)} USDC
            </p>
          )}
        </div>
      </div>

      {/* Budget presets */}
      <div className='w-full'>
        <p className='text-xs text-slate-500 mb-3 uppercase tracking-wider'>Session limit</p>
        <div className='grid grid-cols-4 gap-2 mb-3'>
          {BUDGET_PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setSelectedBudget(amt)
                setIsCustom(false)
              }}
              className={cn(
                'py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all',
                !isCustom && selectedBudget === amt
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white/4 border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200',
              )}
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div
          onClick={() => setIsCustom(true)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 border cursor-text transition-all',
            isCustom
              ? 'bg-indigo-600/10 border-indigo-500/50'
              : 'bg-white/4 border-white/8 hover:border-white/20',
          )}
        >
          <DollarSign className='h-4 w-4 text-slate-500' />
          <input
            type='number'
            min={1}
            max={100}
            placeholder='Custom amount'
            value={customBudget}
            onChange={(e) => {
              setCustomBudget(e.target.value)
              setIsCustom(true)
            }}
            className='flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none'
          />
          <span className='text-xs text-slate-500'>USDC</span>
        </div>

        {!isAffordable && (
          <p className='text-xs text-red-400 mt-2 flex items-center gap-1.5'>
            <AlertCircle className='h-3.5 w-3.5' />
            Budget exceeds available GatewayWallet balance ({walletBalance!.toFixed(2)} USDC)
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        disabled={!canStart}
        onClick={() => onStart(effectiveBudget)}
        className='w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium cursor-pointer transition-colors'
      >
        Start Agent
        <ChevronRight className='h-4 w-4' />
      </button>

      <p className='text-xs text-slate-600 text-center flex items-center gap-1.5'>
        <Zap className='h-3 w-3 text-emerald-600' />
        Each API call deducts $1 USDC · Zero gas · EIP-3009 signed
      </p>
    </div>
  )
}

// ── Chat view ─────────────────────────────────────────────────────────────────

interface ChatViewProps {
  budget: number
  onReset: () => void
}

// ── localStorage balance tracking (Circle settles async, on-chain lags) ───────
const BALANCE_KEY = 'arc-agent-balance-state'

interface StoredBalanceState {
  pendingSpent: number // USDC spent but not yet settled on-chain
  lastOnChain: number | null // last raw on-chain value seen
}

function loadStoredBalance(): StoredBalanceState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(BALANCE_KEY) ?? '{}',
    ) as Partial<StoredBalanceState>
    return { pendingSpent: parsed.pendingSpent ?? 0, lastOnChain: parsed.lastOnChain ?? null }
  } catch {
    return { pendingSpent: 0, lastOnChain: null }
  }
}
function saveStoredBalance(s: StoredBalanceState) {
  try {
    localStorage.setItem(BALANCE_KEY, JSON.stringify(s))
  } catch {}
}

function ChatView({ budget, onReset }: ChatViewProps) {
  const [localInput, setLocalInput] = useState('')
  // displayBalance = onChainBalance - pendingSpent (adjusted for unconfirmed payments)
  const [displayBalance, setDisplayBalance] = useState<number | null>(null)
  const pendingSpentRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, error, sendMessage, reset } = useAgentChat({ budget })

  // Fetch on-chain balance and reconcile with locally-tracked pending spend.
  // Circle settles in batches so availableBalance lags; we subtract pending locally.
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-balance')
      const d = (await res.json()) as { usdc?: number }
      if (d.usdc === undefined) return

      const onChain = d.usdc
      const stored = loadStoredBalance()
      let pending = stored.pendingSpent

      // Detect on-chain settlement: balance dropped → Circle settled some payments
      if (stored.lastOnChain !== null && onChain < stored.lastOnChain) {
        const settled = stored.lastOnChain - onChain
        pending = Math.max(0, pending - settled)
      }

      pendingSpentRef.current = pending
      saveStoredBalance({ pendingSpent: pending, lastOnChain: onChain })
      setDisplayBalance(Math.max(0, onChain - pending))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Re-fetch after agent finishes responding
  useEffect(() => {
    if (!isLoading) fetchBalance()
  }, [isLoading, fetchBalance])

  // Auto-scroll to bottom whenever messages update or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Session spent = number of completed tool calls this session
  const sessionSpent = messages.reduce((sum, m) => {
    if (m.role !== 'assistant') return sum
    return sum + (m.toolCalls?.filter((t) => t.state !== 'pending').length ?? 0)
  }, 0)

  // Sync sessionSpent → localStorage pending so balance persists across reloads
  const prevSessionSpentRef = useRef(0)
  useEffect(() => {
    const delta = sessionSpent - prevSessionSpentRef.current
    if (delta <= 0) return
    prevSessionSpentRef.current = sessionSpent
    const stored = loadStoredBalance()
    const newPending = stored.pendingSpent + delta
    pendingSpentRef.current = newPending
    saveStoredBalance({ pendingSpent: newPending, lastOnChain: stored.lastOnChain })
    setDisplayBalance((prev) => (prev !== null ? Math.max(0, prev - delta) : null))
  }, [sessionSpent])

  const budgetPct = budget > 0 ? Math.max(0, ((budget - sessionSpent) / budget) * 100) : 0
  const budgetExhausted = sessionSpent >= budget

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!localInput.trim() || isLoading || budgetExhausted) return
    sendMessage(localInput)
    setLocalInput('')
  }

  const handleReset = () => {
    reset()
    onReset()
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Stats bar */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          {/* Real on-chain wallet balance (minus locally-tracked pending spend) */}
          <div>
            <p className='text-xs text-slate-500'>Wallet balance</p>
            {displayBalance === null ? (
              <div className='flex items-center gap-1.5'>
                <Loader2 className='h-3.5 w-3.5 animate-spin text-slate-600' />
                <span className='text-sm text-slate-500'>…</span>
              </div>
            ) : (
              <p className='text-base font-bold text-slate-100'>
                {displayBalance.toFixed(2)}
                <span className='text-xs font-normal text-slate-500 ml-1'>USDC</span>
              </p>
            )}
          </div>
          <div className='h-8 w-px bg-white/8' />
          {/* Session limit */}
          <div>
            <p className='text-xs text-slate-500'>Session limit</p>
            <p
              className={cn(
                'text-base font-bold',
                budgetExhausted ? 'text-red-400' : 'text-slate-400',
              )}
            >
              {sessionSpent}
              <span className='text-xs font-normal text-slate-500 ml-0.5'>/ {budget} calls</span>
            </p>
          </div>
        </div>

        {/* Budget progress bar inline */}
        <div className='flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden max-w-48'>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              budgetPct > 50 ? 'bg-emerald-500' : budgetPct > 20 ? 'bg-amber-500' : 'bg-red-500',
            )}
            style={{ width: `${budgetPct}%` }}
          />
        </div>

        <button
          onClick={handleReset}
          className='flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors'
          title='Reset and change budget'
        >
          <RotateCcw className='h-3.5 w-3.5' />
          Reset
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className='rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400'>
          {error}
        </div>
      )}

      {/* Chat messages */}
      <div className='glass rounded-2xl min-h-100 max-h-150 overflow-y-auto p-4 flex flex-col gap-4'>
        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center flex-1 py-16 gap-4'>
            <div className='h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center'>
              <Bot className='h-8 w-8 text-indigo-400' />
            </div>
            <div className='text-center'>
              <p className='text-slate-300 font-medium'>AgentPay is ready</p>
              <p className='text-slate-500 text-sm mt-1'>
                Ask me to research, analyze, or fetch data. I&apos;ll autonomously pay for each API
                call.
              </p>
            </div>
            <div className='flex flex-wrap gap-2 justify-center mt-2'>
              {SUGGESTED_TASKS.map((task) => (
                <button
                  key={task}
                  onClick={() => setLocalInput(task)}
                  className='text-xs px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] cursor-pointer transition-colors text-left'
                >
                  {task}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <AgentMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className='flex items-center gap-2 text-slate-500 text-sm'>
            <div className='flex gap-1'>
              <span className='h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]' />
              <span className='h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]' />
              <span className='h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]' />
            </div>
            Agent is working…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className='flex gap-2'>
        <input
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder='Ask the agent to research, analyze, translate…'
          disabled={isLoading || budgetExhausted}
          className='flex-1 glass rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none border border-transparent focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed'
        />
        <button
          type='submit'
          disabled={isLoading || !localInput.trim() || budgetExhausted}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium cursor-pointer transition-colors'
        >
          <Send className='h-4 w-4' />
        </button>
      </form>

      <p className='text-xs text-slate-600 text-center flex items-center justify-center gap-1.5'>
        <Zap className='h-3 w-3 text-emerald-600' />
        Each API call deducts $1 USDC from the agent wallet via Circle Gateway Nanopayments · Zero
        gas
      </p>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AgentChat() {
  const [budget, setBudget] = useState<number | null>(null)

  if (budget === null) {
    return <BudgetSetup onStart={(b) => setBudget(b)} />
  }

  return <ChatView budget={budget} onReset={() => setBudget(null)} />
}
