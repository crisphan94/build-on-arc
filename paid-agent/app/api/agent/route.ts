import Groq from 'groq-sdk'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'groq-sdk/resources/chat/completions'
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

RULES:
- Always call a tool first, never answer from memory
- Always provide parameters when calling tools
- Extract parameters from the exact words in the user's message

EXAMPLES:
User: "What's the price of Bitcoin?"
You call: market_data with symbol="BTC"

User: "Weather in Tokyo?"
You call: weather with location="Tokyo"

User: "What are the top 3 coins by market cap?"
You call: market_data with top=3

User: "Analyze this text: I love it"
You call: sentiment with text="I love it"`

// Define tools in OpenAI format (Groq compatible)
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'market_data',
      description:
        'Get cryptocurrency prices and market cap data. Use this when user asks about crypto prices, coin values, market cap, or trending coins.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description:
              'Coin symbols like BTC, ETH, SOL. For "What is Bitcoin price?" use "BTC". For "BTC and ETH prices" use "BTC,ETH". Leave empty if using top parameter.',
          },
          top: {
            type: 'number',
            description:
              'Get top N coins by market cap. For "top 3 coins" use 3. For "top 10 coins by market cap" use 10. Do not use with symbol.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'weather',
      description:
        'Get weather forecast. When user asks about weather or temperature in a city, use this tool.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description:
              'City name. For "Weather in Tokyo" use "Tokyo". For "Hanoi weather" use "Hanoi".',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ai_text',
      description:
        'Generate AI-powered explanations and analysis on general knowledge topics including technology, science, history, and business concepts. Do not use this for cryptocurrency questions - use market_data instead.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description:
              'The topic to explain or analyze. Extract from the user question what they want to know about.',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'translate',
      description:
        'Translate text from one language to another. Use this when the user asks to translate, convert, or interpret text into a different language.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to translate. Extract the source text from the user message.',
          },
          targetLanguage: {
            type: 'string',
            description:
              'The target language to translate into. Extract from the user question (e.g., "Vietnamese", "English", "French", "Spanish", "Japanese", "Chinese").',
          },
        },
        required: ['text', 'targetLanguage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'code_review',
      description:
        'Analyze code quality, identify bugs, security vulnerabilities, and suggest improvements. Use this when the user provides code and asks for review, analysis, or security check.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code snippet to review. Extract the code from the user message.',
          },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sentiment',
      description:
        'Analyze sentiment of text. When user asks to analyze emotion, tone, or feeling of text, use this tool.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to analyze. For "Analyze: I love it" use "I love it".',
          },
        },
        required: ['text'],
      },
    },
  },
]

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

  // Tool execution handler
  async function executeTool(toolName: string, argsJson: string): Promise<Record<string, unknown>> {
    console.log(`[agent] Executing tool: ${toolName}`, argsJson)
    const args = JSON.parse(argsJson)

    switch (toolName) {
      case 'market_data': {
        const symbol = args.symbol
        const top = args.top
        if (!symbol && !top) {
          return {
            error:
              'Missing coin symbol or top parameter. Specify coins (e.g. BTC, ETH) or top (e.g. 3 for top 3 by market cap)',
          }
        }
        const params: Record<string, string> = {}
        if (top) params.top = String(top)
        if (symbol) params.coins = symbol.trim()
        return callService('market-data', params)
      }
      case 'weather': {
        const location = args.location
        if (!location)
          return {
            error: 'Missing location. Please specify which city (e.g. Tokyo, Da Nang, New York)',
          }
        return callService('weather', { location })
      }
      case 'ai_text': {
        const topic = args.topic
        if (!topic) return { error: 'Missing topic. Please specify what to explain.' }
        return callService('ai-text', { topic })
      }
      case 'translate': {
        const { text, targetLanguage } = args
        if (!text || !targetLanguage)
          return { error: 'Missing text or target language. Specify both text and language.' }
        return callService('translate', { text, targetLanguage })
      }
      case 'code_review': {
        const code = args.code
        if (!code) return { error: 'Missing code snippet to review.' }
        return callService('code-review', { code })
      }
      case 'sentiment': {
        const text = args.text
        if (!text) return { error: 'Missing text to analyze sentiment.' }
        return callService('sentiment', { text })
      }
      default:
        return { error: `Unknown tool: ${toolName}` }
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        const conversationMessages: ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\nBudget: $${budget} USDC. Agent: ${agentAddress}.`,
          },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ]

        let iteration = 0
        const maxIterations = 5

        while (iteration < maxIterations) {
          iteration++
          console.log(`[agent] === Iteration ${iteration} ===`)

          // Call Groq API
          let completion
          try {
            completion = await groq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              messages: conversationMessages,
              tools,
              tool_choice: iteration === 1 ? 'required' : 'auto', // Force tool call on first iteration
              temperature: 0.5,
              max_tokens: 4096,
            })
          } catch (err: unknown) {
            // Handle rate limit errors
            if (
              err &&
              typeof err === 'object' &&
              ('status' in err || 'error' in err) &&
              ((err as { status?: number }).status === 429 ||
                (err as { error?: { code?: string } }).error?.code === 'rate_limit_exceeded')
            ) {
              const errorData = (err as { error?: { error?: { message?: string } } }).error?.error
              const message = errorData?.message ?? 'Rate limit exceeded'
              console.error('[agent] Rate limit hit:', message)
              send({
                type: 'error',
                error: 'Groq API credits have been used up for today. Please come back tomorrow 🙂',
              })
              break
            }
            // Other errors
            const errMsg = err instanceof Error ? err.message : 'Groq API error'
            console.error('[agent] Groq API error:', errMsg)
            send({ type: 'error', error: `AI service error: ${errMsg}` })
            break
          }

          const message = completion.choices[0]?.message
          if (!message) {
            send({ type: 'error', error: 'No response from Groq' })
            break
          }

          console.log('[agent] Response:', {
            role: message.role,
            hasContent: !!message.content,
            toolCalls: message.tool_calls?.length ?? 0,
          })

          // Add assistant message to conversation
          conversationMessages.push(message)

          // If there are tool calls, execute them
          if (message.tool_calls && message.tool_calls.length > 0) {
            let hasToolError = false
            for (const toolCall of message.tool_calls) {
              const toolName = toolCall.function.name
              const toolArgs = toolCall.function.arguments

              console.log(`[agent] Tool call: ${toolName}`, toolArgs)
              send({ type: 'tool-start', toolCallId: toolCall.id, toolName })

              // Execute tool
              const toolResult = await executeTool(toolName, toolArgs)
              console.log(`[agent] Tool result:`, toolResult)

              // Check if tool returned error
              if (toolResult && typeof toolResult === 'object' && 'error' in toolResult) {
                hasToolError = true
                console.error('[agent] Tool execution failed, stopping...')
              }

              // Add tool result to conversation
              conversationMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
              })

              send({ type: 'tool-done', toolCallId: toolCall.id, toolName, output: toolResult })
            }

            // If tool failed, ask LLM for final error response then stop
            if (hasToolError) {
              console.log('[agent] Getting error response from LLM...')
              try {
                const errorCompletion = await groq.chat.completions.create({
                  model: 'llama-3.3-70b-versatile',
                  messages: conversationMessages,
                  temperature: 0.5,
                  max_tokens: 500,
                })

                const errorMessage = errorCompletion.choices[0]?.message
                if (errorMessage?.content) {
                  const words = errorMessage.content.split(' ')
                  for (const word of words) {
                    send({ type: 'text-delta', delta: word + ' ' })
                    await new Promise((resolve) => setTimeout(resolve, 20))
                  }
                }

                send({
                  type: 'finish',
                  finishReason: 'tool_error',
                  usage: errorCompletion.usage,
                  totalSpent: (spentBaseUnits / 1_000_000).toFixed(2),
                })
              } catch (err: unknown) {
                // If rate limit hit while getting error response, just send simple error
                if (
                  err &&
                  typeof err === 'object' &&
                  ('status' in err || 'error' in err) &&
                  ((err as { status?: number }).status === 429 ||
                    (err as { error?: { code?: string } }).error?.code === 'rate_limit_exceeded')
                ) {
                  send({
                    type: 'error',
                    error: 'Groq API credits have been used up for today. Please come back tomorrow 🙂',
                  })
                } else {
                  const errMsg = err instanceof Error ? err.message : 'Unknown error'
                  send({ type: 'error', error: errMsg })
                }
              }
              break
            }

            // Continue to next iteration to get final response
            continue
          }

          // If no tool calls, stream the final text response
          if (message.content) {
            // Send text as deltas
            const words = message.content.split(' ')
            for (const word of words) {
              send({ type: 'text-delta', delta: word + ' ' })
              // Small delay for streaming effect
              await new Promise((resolve) => setTimeout(resolve, 20))
            }
          }

          // Done
          send({
            type: 'finish',
            finishReason: completion.choices[0]?.finish_reason ?? 'stop',
            usage: completion.usage,
            totalSpent: (spentBaseUnits / 1_000_000).toFixed(2),
          })
          break
        }

        if (iteration >= maxIterations) {
          send({ type: 'error', error: 'Max iterations reached' })
        }

        controller.close()
      } catch (error) {
        console.error('[agent] Stream error:', error)
        send({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
