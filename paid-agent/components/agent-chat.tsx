'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bot, Send, Zap, RotateCcw, Loader2, Plus, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentChat } from '@/hooks/useAgentChat'
import { AgentMessage } from '@/components/agent-message'
import { AgentFundModal } from '@/components/agent-fund-modal'

const SUGGESTED_TASKS = [
  'What is the current BTC price?',
  'What are the top 3 coins by market cap?',
]

const DEFAULT_BUDGET = 10

interface ChatViewProps {
  budget: number
}

const BALANCE_KEY = 'arc-gateway-balance-state'

interface StoredBalanceState {
  pendingSpent: number
  lastOnChain: number | null
}

function loadStoredBalance(): StoredBalanceState {
  try {
    const oldKey = 'arc-agent-balance-state'
    if (localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey)
    }

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

function ChatView({ budget }: ChatViewProps) {
  const [localInput, setLocalInput] = useState('')
  const [displayBalance, setDisplayBalance] = useState<number | null>(null)
  const [showFundModal, setShowFundModal] = useState(false)
  const pendingSpentRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, error, sendMessage, reset } = useAgentChat({ budget })

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-gateway-balance')
      const d = (await res.json()) as { gatewayBalance?: number; address?: string; error?: string }
      if (d.error || d.gatewayBalance === undefined) return

      const gatewayBalance = d.gatewayBalance
      const stored = loadStoredBalance()
      let pending = stored.pendingSpent
      if (stored.lastOnChain !== null && gatewayBalance < stored.lastOnChain) {
        const settled = stored.lastOnChain - gatewayBalance
        pending = Math.max(0, pending - settled)
      }

      pendingSpentRef.current = pending
      saveStoredBalance({ pendingSpent: pending, lastOnChain: gatewayBalance })
      const finalBalance = Math.max(0, gatewayBalance - pending)
      setDisplayBalance(finalBalance)
    } catch (err) {
      console.error('[balance] Fetch error:', err)
    }
  }, [])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    if (!isLoading) fetchBalance()
  }, [isLoading, fetchBalance])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])
  const sessionSpent = messages.reduce((sum, m) => {
    if (m.role !== 'assistant') return sum
    return sum + (m.toolCalls?.filter((t) => t.state !== 'pending').length ?? 0)
  }, 0)
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
  }

  const handleFundSuccess = () => {
    fetchBalance()
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Stats bar */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div>
            <p className='text-xs text-slate-500'>Gateway Balance</p>
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

          <button
            onClick={() => setShowFundModal(true)}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 text-xs font-medium cursor-pointer transition-colors'
          >
            <Plus className='h-3.5 w-3.5' />
            Fund
          </button>

          <div className='h-8 w-px bg-white/8' />
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

        <div className='flex items-center gap-3'>
          <div className='flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden w-32'>
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
            title='Reset session'
          >
            <RotateCcw className='h-3.5 w-3.5' />
            Reset
          </button>
        </div>
      </div>

      {showFundModal && (
        <AgentFundModal onClose={() => setShowFundModal(false)} onSuccess={handleFundSuccess} />
      )}

      {error && (
        <div className='rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3'>
          <p className='text-sm text-red-200 leading-relaxed'>{error}</p>
        </div>
      )}

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
        Each API call deducts $1 USDC from gateway balance via Circle Gateway Nanopayments · Zero
        gas
      </p>
    </div>
  )
}

export function AgentChat() {
  return <ChatView budget={DEFAULT_BUDGET} />
}
