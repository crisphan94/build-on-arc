'use client'

import { Bot, User, CheckCircle2, Loader2, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/useAgentChat'

interface AgentMessageProps {
  message: ChatMessage
}

const SERVICE_LABELS: Record<string, string> = {
  market_data: 'Market Data',
  weather: 'Weather',
  ai_text: 'AI Text',
  translate: 'Translation',
  code_review: 'Code Review',
  sentiment: 'Sentiment Analysis',
}

export function AgentMessage({ message }: AgentMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className='flex items-start gap-3 justify-end'>
        <div className='max-w-[80%] glass-2 rounded-2xl rounded-tr-sm px-4 py-3'>
          <p className='text-sm text-slate-200'>{message.content}</p>
        </div>
        <div className='h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0'>
          <User className='h-4 w-4 text-slate-300' />
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-start gap-3'>
      <div className='h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0'>
        <Bot className='h-4 w-4 text-indigo-400' />
      </div>
      <div className='flex flex-col gap-2 max-w-[85%]'>
        {/* Tool call cards */}
        {(message.toolCalls ?? []).map((tc, i) => (
          <ToolCallCard key={i} toolName={tc.toolName} state={tc.state} result={tc.result} />
        ))}

        {/* Text content */}
        {message.content && (
          <div className='glass rounded-2xl rounded-tl-sm px-4 py-3'>
            <p className='text-sm text-slate-200 whitespace-pre-wrap leading-relaxed'>
              {message.content}
            </p>
            {/* Show total spent if any tools completed */}
            {(() => {
              const completedCount = (message.toolCalls ?? []).filter(
                (tc) => tc.state === 'done',
              ).length
              if (completedCount > 0) {
                return (
                  <p className='text-xs text-emerald-500 font-mono mt-2 pt-2 border-t border-white/5'>
                    💳 Total ${completedCount}.00 USDC spent
                  </p>
                )
              }
              return null
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tool call card ────────────────────────────────────────────────────────────

function ToolCallCard({
  toolName,
  state,
  result,
}: {
  toolName: string
  state: 'pending' | 'done' | 'error'
  result?: Record<string, unknown>
}) {
  const label = SERVICE_LABELS[toolName] ?? toolName
  const isError = state === 'error'
  const isComplete = state === 'done'

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 flex items-start gap-3',
        isError
          ? 'bg-red-500/5 border-red-500/20'
          : isComplete
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-indigo-500/5 border-indigo-500/20',
      )}
    >
      <div className='mt-0.5 shrink-0'>
        {state === 'pending' ? (
          <Loader2 className='h-3.5 w-3.5 text-indigo-400 animate-spin' />
        ) : isError ? (
          <DollarSign className='h-3.5 w-3.5 text-red-400' />
        ) : (
          <CheckCircle2 className='h-3.5 w-3.5 text-emerald-400' />
        )}
      </div>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium text-slate-300'>{label} API</span>
          {state === 'pending' && (
            <span className='text-xs text-indigo-400'>Paying & fetching...</span>
          )}
        </div>

        {isError && result && (
          <p className='text-xs text-red-400 mt-0.5'>
            {String((result as { error: unknown }).error)}
          </p>
        )}

        {isComplete && result && <ResultSummary toolName={toolName} result={result} />}
      </div>
    </div>
  )
}

// ── Result summary ────────────────────────────────────────────────────────────

function ResultSummary({
  toolName,
  result,
}: {
  toolName: string
  result: Record<string, unknown>
}) {
  if (toolName === 'market_data') {
    const prices = result.prices as
      | Record<string, { usd: number; usd_24h_change: number }>
      | undefined
    if (prices) {
      return (
        <div className='flex gap-3 mt-1 flex-wrap'>
          {Object.entries(prices).map(([coin, data]) => (
            <span key={coin} className='text-xs text-slate-400'>
              <span className='font-mono text-slate-300'>{coin.toUpperCase()}</span> $
              {data.usd?.toLocaleString()}{' '}
              <span className={data.usd_24h_change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {data.usd_24h_change?.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      )
    }
  }

  if (toolName === 'sentiment') {
    return (
      <p className='text-xs text-slate-400 mt-0.5'>
        Sentiment:{' '}
        <span className='text-slate-300'>{String(result.sentiment ?? result.label ?? '—')}</span>
        {result.score != null && ` (${(Number(result.score) * 100).toFixed(0)}%)`}
      </p>
    )
  }

  const preview = Object.values(result).find(
    (v) => typeof v === 'string' && v.length > 0 && !v.startsWith('0x'),
  )
  if (preview) {
    return (
      <p className='text-xs text-slate-400 mt-0.5 truncate'>
        {String(preview).slice(0, 80)}
        {String(preview).length > 80 ? '…' : ''}
      </p>
    )
  }

  return null
}
