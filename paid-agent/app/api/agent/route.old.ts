import Groq from 'groq-sdk'
import { agentPay } from '@/lib/agent-pay'
import { getCircleWalletAddress, isCircleWalletConfigured } from '@/lib/circle-wallet'

export const runtime = 'nodejs'
export const maxDuration = 120

const COST_PER_CALL = 1_000_000 // 1 USDC in micro-USDC (6 decimals)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })

const SYSTEM_PROMPT = `You are AgentPay — an AI agent that calls paid tools to answer questions.

WORKFLOW:
1. User asks a question
2. You call the appropriate tool with parameters extracted from their question
3. You get data back from the tool
4. You answer their question using that data
5. End with: "💳 $X USDC spent"

RULES:
- Always call a tool first, never answer from memory
- Always provide parameters when calling tools
- Extract parameters from the exact words in the user's message

EXAMPLES:
User: "What's the price of Bitcoin?"
You call: market_data with symbol="BTC"

User: "Weather in Tokyo?"
You call: weather with location="Tokyo"

User: "Analyze this text: I love it"
You call: sentiment with text="I love it"`

export async function POST(req: Request) {
  console.log('[agent] ========== NEW REQUEST ==========')
  const { messages, budget = 5 } = (await req.json()) as {
    messages: { role: string; content: string }[]
    budget?: number
  }
  console.log('[agent] Messages:', messages.length, 'Budget:', budget)

  let agentAddress: string
  try {
    agentAddress = await getCircleWalletAddress()
    console.log('[agent] Agent address:', agentAddress)
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Agent wallet not configured (set AGENT_PRIVATE_KEY or CIRCLE_WALLET_ID)',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const signingMethod = isCircleWalletConfigured() ? 'Circle Wallets API' : 'EIP-3009 raw key'
  const budgetBaseUnits = Math.floor(budget * 1_000_000)
  let spentBaseUnits = 0
  const baseUrl = new URL(req.url).origin

  function budgetExhausted() {
    return spentBaseUnits + COST_PER_CALL > budgetBaseUnits
  }

  async function callService(
    serviceId: string,
    params?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    console.log(`[agent] callService START: ${serviceId}`, params)
    if (budgetExhausted()) {
      console.log('[agent] Budget exhausted!')
      return { error: 'Budget exhausted. Cannot make more API calls.' }
    }
    try {
      console.log(`[agent] Calling agentPay for ${serviceId}...`)
      const result = await agentPay(serviceId, baseUrl, params)
      spentBaseUnits += COST_PER_CALL
      console.log(`[agent] callService SUCCESS: ${serviceId}, spent: $${result.formattedAmount}`)
      return {
        ...result.data,
        _payment: { paid: `$${result.formattedAmount} USDC`, payer: agentAddress },
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Payment failed'
      console.error(`[agent] ${serviceId} payment error:`, errMsg)
      return { error: `Service call failed: ${errMsg}` }
    }
  }

  const tools = {
    market_data: tool({
      description: 'Get cryptocurrency prices. When user asks about crypto prices, coin values, or market trends, use this tool.',
      parameters: z.object({
        symbol: z
          .string()
          .optional()
          .describe(
            'Coin symbols like BTC, ETH, SOL. For "What is Bitcoin price?" use "BTC". For "BTC and ETH prices" use "BTC,ETH".',
          ),
      }),
      execute: async (args) => {
        try {
          console.log('[agent] market_data execute called with args:', args)
          const symbol = args?.symbol
          if (!symbol || symbol.trim() === '' || symbol === 'undefined') {
            return {
              error: 'Missing coin symbol. Please specify which coins to check (e.g. BTC, ETH, TON)',
            }
          }
          return callService('market-data', { coins: symbol.trim() })
        } catch (err) {
          console.error('[agent] market_data execute error:', err)
          return { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    }),

    weather: tool({
      description: 'Get weather forecast. When user asks about weather or temperature in a city, use this tool.',
      parameters: z.object({
        location: z
          .string()
          .optional()
          .describe(
            'City name. For "Weather in Tokyo" use "Tokyo". For "Hanoi weather" use "Hanoi".',
          ),
      }),
      execute: async (args) => {
        try {
          console.log('[agent] weather execute called with args:', args)
          const location = args?.location
          if (!location || location.trim() === '') {
            return {
              error: 'Missing location. Please specify which city (e.g. Tokyo, Da Nang, New York)',
            }
          }
          return callService('weather', { location })
        } catch (err) {
          console.error('[agent] weather execute error:', err)
          return { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    }),

    ai_text: tool({
      description:
        'Generate AI-powered explanations and analysis on general knowledge topics including technology, science, history, and business concepts. Do not use this for cryptocurrency questions - use market_data instead.',
      parameters: z.object({
        topic: z
          .string()
          .describe(
            'The topic to explain or analyze. Extract from the user question what they want to know about.',
          ),
      }),
      execute: async (args) => {
        try {
          console.log('[agent] ai_text execute called with args:', args)
          const topic = args?.topic
          if (!topic || topic.trim() === '') {
            return { error: 'Missing topic. Please specify what to explain.' }
          }
          return callService('ai-text', { topic })
        } catch (err) {
          console.error('[agent] ai_text execute error:', err)
          return { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    }),

    translate: tool({
      description:
        'Translate text from one language to another. Use this when the user asks to translate, convert, or interpret text into a different language.',
      parameters: z.object({
        text: z
          .string()
          .describe('The text to translate. Extract the source text from the user message.'),
        targetLanguage: z
          .string()
          .describe(
            'The target language to translate into. Extract from the user question (e.g., "Vietnamese", "English", "French", "Spanish", "Japanese", "Chinese").',
          ),
      }),
      execute: async (args) => {
        try {
          console.log('[agent] translate execute called with args:', args)
          const text = args?.text
          const targetLanguage = args?.targetLanguage
          if (!text || text.trim() === '' || !targetLanguage || targetLanguage.trim() === '') {
            return { error: 'Missing text or target language. Specify both text and language.' }
          }
          return callService('translate', { text, targetLanguage })
        } catch (err) {
          console.error('[agent] translate execute error:', err)
          return { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    }),

    code_review: tool({
      description:
        'Analyze code quality, identify bugs, security vulnerabilities, and suggest improvements. Use this when the user provides code and asks for review, analysis, or security check.',
      parameters: z.object({
        code: z
          .string()
          .describe('The code snippet to review. Extract the code from the user message.'),
      }),
      execute: async (args) => {
        try {
          console.log('[agent] code_review execute called with args:', args)
          const code = args?.code
          if (!code) return { error: 'Missing code snippet to review.' }
          return callService('code-review', { code })
        } catch (err) {
          console.error('[agent] code_review execute error:', err)
          return { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    }),

    sentiment: tool({
      description: 'Analyze sentiment of text. When user asks to analyze emotion, tone, or feeling of text, use this tool.',
      parameters: z.object({
        text: z
          .string()
          .optional()
          .describe('The text to analyze. For "Analyze: I love it" use "I love it".'),
      }),
      execute: async (args) => {
        try {
          console.log('[agent] sentiment execute called with args:', args)
          const text = args?.text
          if (!text) return { error: 'Missing text to analyze sentiment.' }
          return callService('sentiment', { text })
        } catch (err) {
          console.error('[agent] sentiment execute error:', err)
          return { error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    }),
  }

  console.log('[agent] Starting streamText with Google Gemini...')
  const result = streamText({
    model: google('gemini-1.5-flash'),
    system: `${SYSTEM_PROMPT}\n\nBudget: $${budget} USDC. Agent: ${agentAddress}.`,
    messages: (messages ?? []) as Parameters<typeof streamText>[0]['messages'],
    tools,
    maxSteps: 8,
    maxTokens: 4096,
    temperature: 0.5,
    onError: ({ error }) => console.error('[agent] streamText error:', error),
  })
  console.log('[agent] streamText initialized, starting stream...')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      console.log('[agent] Stream started')
      const send = (obj: Record<string, unknown>) => {
        console.log('[agent] Sending to client:', obj.type)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        let stepCount = 0
        console.log('[agent] Starting fullStream iteration...')
        for await (const chunk of result.fullStream) {
          console.log(`[agent] Received chunk type: ${chunk.type}`)
          
          if (chunk.type === 'tool-call' || chunk.type === 'text-delta') {
            stepCount++
            console.log(`[agent] Step ${stepCount}`)
          }
          
          if (chunk.type === 'text-delta') {
            send({ type: 'text-delta', delta: chunk.text })
          } else if (chunk.type === 'tool-call') {
            const c = chunk as { type: 'tool-call'; toolCallId: string; toolName: string }
            console.log(`[agent] Tool call: ${c.toolName}, ID: ${c.toolCallId}`)
            send({ type: 'tool-start', toolCallId: c.toolCallId, toolName: c.toolName })
          } else if (chunk.type === 'tool-error') {
            const e = chunk as { type: 'tool-error'; toolCallId: string; toolName: string; error: unknown }
            console.error(`[agent] Tool error: ${e.toolName}, error:`, e.error)
            send({
              type: 'tool-done',
              toolCallId: e.toolCallId,
              toolName: e.toolName,
              output: { error: e.error instanceof Error ? e.error.message : String(e.error) },
            })
          } else if (chunk.type === 'tool-result') {
            const r = chunk as {
              type: 'tool-result'
              toolCallId: string
              toolName: string
              output: unknown
            }
            console.log(`[agent] Tool result: ${r.toolName}, output:`, JSON.stringify(r.output).slice(0, 100))
            send({
              type: 'tool-done',
              toolCallId: r.toolCallId,
              toolName: r.toolName,
              output: r.output,
            })
          } else if (chunk.type === 'finish') {
            console.log('[agent] Stream finished!')
            send({ type: 'done' })
          } else if (chunk.type === 'error') {
            const e = chunk as { type: 'error'; error: unknown }
            console.error('[agent] Stream error:', e.error)
            send({
              type: 'error',
              errorText: e.error instanceof Error ? e.error.message : String(e.error),
            })
          }
        }
        console.log('[agent] fullStream iteration complete')
      } catch (err) {
        console.error('[agent] Stream catch error:', err)
        send({ type: 'error', errorText: err instanceof Error ? err.message : 'Stream error' })
      } finally {
        console.log('[agent] Stream finally block - closing')
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
