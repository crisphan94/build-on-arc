import { createGroq } from '@ai-sdk/groq'
import { streamText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { agentPay } from '@/lib/agent-pay'
import { getCircleWalletAddress, isCircleWalletConfigured } from '@/lib/circle-wallet'

export const runtime = 'nodejs'
export const maxDuration = 120

const COST_PER_CALL = 1_000_000 // 1 USDC in base units

// ── Agent system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AgentPay, an autonomous AI research agent that pays for real data APIs using USDC nanopayments on Arc Testnet.

You have access to 6 paid API tools. Each call costs $1 USDC from the user's budget.
Always check if budget allows before calling a tool. If budget is exhausted, stop and explain.

Available tools:
- market_data: Live crypto prices (BTC, ETH, USDC) and 24h change
- weather: Weather forecast for a location
- ai_text: AI-generated text/analysis on a topic
- translate: Translate text to another language
- code_review: Code quality and security analysis
- sentiment: Sentiment analysis of text

When you call a tool, briefly narrate what you're doing and why. After each tool result, summarize the key finding before proceeding.
At the end, provide a complete synthesized answer. Always show a payment summary at the end.`

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

  // ── Tool definitions ─────────────────────────────────────────────────────
  const tools = {
    market_data: tool({
      description: 'Get live cryptocurrency market prices and 24h change. Costs $1 USDC.',
      parameters: z.object({}),
      execute: async () => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('market-data', baseUrl)
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
      description: 'Get weather forecast for a location. Costs $1 USDC.',
      parameters: z.object({
        location: z.string().describe('City or location name'),
      }),
      execute: async () => {
        if (spentBaseUnits + COST_PER_CALL > budgetBaseUnits) {
          return { error: 'Budget exhausted. Cannot make more API calls.' }
        }
        try {
          const result = await agentPay('weather', baseUrl)
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
    system: `${SYSTEM_PROMPT}\n\nCurrent budget: $${budget} USDC (${budget} API calls max). Agent wallet: ${agentAddress}. Signing method: ${signingMethod}.`,
    messages: messages as Parameters<typeof streamText>[0]['messages'],
    tools,
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
              result: unknown
            }
            send({
              type: 'tool-done',
              toolCallId: r.toolCallId,
              toolName: r.toolName,
              output: r.result,
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
