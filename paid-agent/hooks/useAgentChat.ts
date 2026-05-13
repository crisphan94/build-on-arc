'use client'

import { useState, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCallInfo[]
}

export interface ToolCallInfo {
  toolName: string
  state: 'pending' | 'done' | 'error'
  result?: Record<string, unknown>
}

interface UseAgentChatOptions {
  budget: number
}

// Custom SSE format emitted by /api/agent (using result.fullStream)
type StreamChunk =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-start'; toolCallId: string; toolName: string }
  | { type: 'tool-done'; toolCallId: string; toolName: string; output: unknown }
  | { type: 'done' }
  | { type: 'error'; errorText: string }

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgentChat({ budget }: UseAgentChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const applyChunk = useCallback((chunk: StreamChunk, assistantId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== assistantId) return m

        if (chunk.type === 'text-delta') {
          return { ...m, content: m.content + chunk.delta }
        }

        if (chunk.type === 'tool-start') {
          if (m.toolCalls?.find((t) => t.toolName === chunk.toolName && t.state === 'pending')) {
            return m
          }
          return {
            ...m,
            toolCalls: [
              ...(m.toolCalls ?? []),
              { toolName: chunk.toolName, state: 'pending' as const },
            ],
          }
        }

        if (chunk.type === 'tool-done') {
          const output = (chunk.output ?? {}) as Record<string, unknown>
          return {
            ...m,
            toolCalls: (m.toolCalls ?? []).map((t) =>
              t.toolName === chunk.toolName && t.state === 'pending'
                ? {
                    ...t,
                    state: (typeof output === 'object' && output !== null && 'error' in output
                      ? 'error'
                      : 'done') as 'done' | 'error',
                    result: output,
                  }
                : t,
            ),
          }
        }

        if (chunk.type === 'error') {
          setError(chunk.errorText)
        }

        return m
      }),
    )
    // setMessages and setError are stable React dispatch functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', toolCalls: [] },
      ])

      abortRef.current = new AbortController()

      try {
        const snapshot = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: snapshot, budget }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Server error ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue
            try {
              applyChunk(JSON.parse(data) as StreamChunk, assistantId)
            } catch {
              // skip unparseable lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, budget, isLoading, applyChunk],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  return { messages, isLoading, error, sendMessage, reset, stop }
}
