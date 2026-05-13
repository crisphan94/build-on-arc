import { createGroq } from '@ai-sdk/groq'
import { streamText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { agentPay } from '@/lib/agent-pay'
import { getCircleWalletAddress, isCircleWalletConfigured } from '@/lib/circle-wallet'

export const runtime = 'nodejs'
export const maxDuration = 120

const COST_PER_CALL = 1_000_000 // 1 USDC in base units

// ── Agent system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AgentPay — an AI agent that answers every question by calling a paid tool. You never answer from internal knowledge.

Rules:
- Call a tool for EVERY user question, no exceptions.
- Budget: each tool call costs $1 USDC. Stop if budget runs out.
- After getting tool result, summarize the finding clearly.
- End each response with a payment summary (tools called, total spent).

Tool selection:
- market_data → crypto prices (any coin: BTC, ETH, TON, SOL, OP, BNB, etc.) — MUST pass symbol= e.g. symbol="TON"
- weather → weather for any city
- ai_text → general questions, advice, explanations, analysis
- translate → translation requests
- code_review → code analysis
- sentiment → tone/feeling analysis`

export async function POST(req: Request) {
  const { messages, budget = 5 } = (await req.json()) as {
    messages: { role: string; content: string }[]
    budget?: number
  }

  // Check agent wallet is configured
  let agentAddress: string
  try {
    agentAddress = await getCircleWalletAddress()
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Agent wallet not configured (set AGENT_PRIVATE_KEY or CIRCLE_WALLET_ID)',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const signingMethod = isCircleWalletConfigured() ? 'Circle Wallets API' : 'EIP-3009 raw key'

  const budgetBaseUnits = Math.floor(budget * 1_000_000)
  let spentBaseUnits = 0

  const baseUrl = new URL(req.url).origin

  // ── Extract coin symbols from free-text as fallback ────────────────────
  function extractSymbolFromMessages(): string | null {
    const text = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    // Try known symbols first (case-insensitive)
    const known = text.match(
      /\b(BTC|ETH|TON|SOL|BNB|OP|MATIC|AVAX|ADA|DOT|LINK|UNI|AAVE|SHIB|DOGE|XRP|LTC|BCH|ATOM|NEAR|APT|ARB|SUI|WLD|RNDR|INJ|TIA|SEI|JTO|PEPE|WIF|BONK|FLOKI|ORDI)\b/gi,
    )
    if (known?.length) return [...new Set(known.map((s) => s.toUpperCase()))].join(',')
    // Fallback: any ALLCAPS word 2-6 chars that looks like a ticker
    const ticker = text.match(/\b[A-Z]{2,6}\b/g)
    if (ticker?.length) return ticker[0]
    return null
  }

  // ── Tool definitions ─────────────────────────────────────────────────────
  const tools = {
    market_data: tool({
      description:
        'Get live cryptocurrency price from CoinGecko. Costs $1 USDC. Works for ANY coin: TON, BTC, ETH, SOL, OP, BNB, etc.',
      parameters: z.object({
        symbol: z
          .string()
          .describe(
            'The coin symbol(s) to look up. Single: "TON". Multiple: "BTC,ETH,SOL". Use EXACTLY what the user asked for.',
          ),
      }),
      execute: async ({ symbol }) => {
        // If LLM failed to pass symbol, extract it from the latest user message
        const resolvedSymbol =
          !symbol || symbol.trim() === '' || symbol === 'undefined'
            ? extractSymbolFromMessages()
            : symbol.trim()

        console.log('[market_data] symbol param:', symbol, '→ resolved:', resolvedSymbol)

        if (!resolvedSymbol) {
          return {
            error:
              'Could not determine which coin to look up. Please specify a coin symbol like TON, BTC, or ETH.',
          }
        }
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('market-data', baseUrl, { coins: resolvedSymbol })
          spentBaseUnits += COST_PER_CALL
          return {
            ...result.data,
            _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
          }
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed' }
        }
      },
    }),

    weather: tool({
      description: 'Get weather forecast for any city or location. Costs $1 USDC.',
      parameters: z.object({
        location: z.string().describe('City or location name, e.g. "Tokyo", "London", "New York"'),
      }),
      execute: async ({ location }) => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('weather', baseUrl, { location })
          spentBaseUnits += COST_PER_CALL
          return {
            ...result.data,
            _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
          }
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed' }
        }
      },
    }),

    ai_text: tool({
      description: 'Generate AI analysis or summary text on a topic. Costs $1 USDC.',
      parameters: z.object({
        topic: z.string().describe('Topic to analyze or generate text about'),
      }),
      execute: async ({ topic }) => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('ai-text', baseUrl, { topic })
          spentBaseUnits += COST_PER_CALL
          return {
            ...result.data,
            _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
          }
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed' }
        }
      },
    }),

    translate: tool({
      description: 'Translate text to another language. Costs $1 USDC.',
      parameters: z.object({
        text: z.string().describe('Text to translate'),
        targetLanguage: z.string().describe('Target language'),
      }),
      execute: async ({ text, targetLanguage }) => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('translate', baseUrl, { text, targetLanguage })
          spentBaseUnits += COST_PER_CALL
          return {
            ...result.data,
            _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
          }
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed' }
        }
      },
    }),

    code_review: tool({
      description: 'Perform AI code quality and security review. Costs $1 USDC.',
      parameters: z.object({
        code: z.string().describe('Code snippet to review'),
      }),
      execute: async ({ code }) => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('code-review', baseUrl, { code })
          spentBaseUnits += COST_PER_CALL
          return {
            ...result.data,
            _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
          }
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed' }
        }
      },
    }),

    sentiment: tool({
      description: 'Analyze sentiment of text (positive/negative/neutral). Costs $1 USDC.',
      parameters: z.object({
        text: z.string().describe('Text to analyze'),
      }),
      execute: async ({ text }) => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('sentiment', baseUrl, { text })
          spentBaseUnits += COST_PER_CALL
          return {
            ...result.data,
            _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
          }
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed' }
        }
      },
    }),
  }

  // ── Stream response ──────────────────────────────────────────────────────
  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY ?? '',
  })

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `${SYSTEM_PROMPT}\n\nBudget: $${budget} USDC remaining. Agent wallet: ${agentAddress}. Signing: ${signingMethod}.`,
    messages: (messages ?? []) as Parameters<typeof streamText>[0]['messages'],
    tools,
    temperature: 0,
    stopWhen: stepCountIs(10),
    onError: ({ error }) => {
      console.error('[agent] streamText error:', error)
    },
  })

  // Manual SSE — we control the exact format the client hook expects
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        for await (const chunk of result.fullStream) {
          if (chunk.type === 'text-delta') {
            send({ type: 'text-delta', delta: chunk.text })
          } else if (chunk.type === 'tool-call') {
            const c = chunk as { type: 'tool-call'; toolCallId: string; toolName: string }
            send({ type: 'tool-start', toolCallId: c.toolCallId, toolName: c.toolName })
          } else if (chunk.type === 'tool-result') {
            const r = chunk as {
              type: 'tool-result'
              toolCallId: string
              toolName: string
              output: unknown
            }
            send({
              type: 'tool-done',
              toolCallId: r.toolCallId,
              toolName: r.toolName,
              output: r.output,
            })
          } else if (chunk.type === 'finish') {
            send({ type: 'done' })
          } else if (chunk.type === 'error') {
            const e = chunk as { type: 'error'; error: unknown }
            send({
              type: 'error',
              errorText: e.error instanceof Error ? e.error.message : String(e.error),
            })
          }
        }
      } catch (err) {
        send({ type: 'error', errorText: err instanceof Error ? err.message : 'Stream error' })
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
