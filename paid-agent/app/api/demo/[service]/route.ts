import { NextRequest, NextResponse } from 'next/server'
import { BatchFacilitatorClient } from '@circle-fin/x402-batching/server'
import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { SERVICES } from '@/lib/services'
import { addGlobalPayment } from '@/lib/global-payments'
import {
  USDC_ADDRESS,
  GATEWAY_WALLET_ADDRESS,
  GATEWAY_API_TESTNET,
  GATEWAY_BATCHING_NAME,
  GATEWAY_BATCHING_VERSION,
  GATEWAY_MAX_TIMEOUT_SECONDS,
  ARC_TESTNET_CHAIN_ID,
} from '@/lib/contracts'

export const runtime = 'nodejs'

const facilitator = new BatchFacilitatorClient({ url: GATEWAY_API_TESTNET })

function buildPaymentRequired(serviceId: string, url: string) {
  const service = SERVICES.find((s) => s.id === serviceId)!
  const amountInBaseUnits = Math.round(parseFloat(service.price) * 1_000_000).toString()
  const sellerAddress = process.env.SELLER_ADDRESS!

  return {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact',
        network: `eip155:${ARC_TESTNET_CHAIN_ID}`,
        asset: USDC_ADDRESS,
        amount: amountInBaseUnits,
        payTo: sellerAddress,
        maxTimeoutSeconds: GATEWAY_MAX_TIMEOUT_SECONDS,
        extra: {
          name: GATEWAY_BATCHING_NAME,
          version: GATEWAY_BATCHING_VERSION,
          verifyingContract: GATEWAY_WALLET_ADDRESS,
        },
      },
    ],
    resource: {
      url,
      description: service.name,
      mimeType: 'application/json',
    },
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  const { service: serviceId } = await params
  const service = SERVICES.find((s) => s.id === serviceId)

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const sellerAddress = process.env.SELLER_ADDRESS
  if (!sellerAddress) {
    return NextResponse.json({ error: 'SELLER_ADDRESS not configured on server' }, { status: 503 })
  }

  const paymentSignature = req.headers.get('Payment-Signature')

  if (!paymentSignature) {
    // No payment — return 402 with payment requirements in both body and header
    const paymentRequired = buildPaymentRequired(serviceId, req.url)
    const encodedHeader = Buffer.from(JSON.stringify(paymentRequired)).toString('base64')

    return new NextResponse(
      JSON.stringify({ error: 'Payment Required', x402Version: 2, paymentRequired }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'PAYMENT-REQUIRED': encodedHeader,
          'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE',
        },
      },
    )
  }

  // Payment signature present — settle with Circle Gateway
  let paymentPayload: Record<string, unknown>
  try {
    paymentPayload = JSON.parse(Buffer.from(paymentSignature, 'base64').toString('utf-8'))
  } catch {
    return NextResponse.json({ error: 'Invalid Payment-Signature encoding' }, { status: 400 })
  }

  const requirements = buildPaymentRequired(serviceId, req.url).accepts[0]

  // Debug: log what we're sending to Circle
  const authObj = (
    paymentPayload as Record<string, unknown> & {
      payload?: { authorization?: Record<string, unknown> }
    }
  ).payload?.authorization
  const now = Math.floor(Date.now() / 1000)
  console.log('[settle] requirements.maxTimeoutSeconds:', requirements.maxTimeoutSeconds)
  console.log('[settle] authorization:', JSON.stringify(authObj, null, 2))
  if (authObj?.validBefore) {
    const validBefore = parseInt(authObj.validBefore as string)
    console.log(
      '[settle] validBefore - now =',
      validBefore - now,
      'seconds (',
      ((validBefore - now) / 86400).toFixed(1),
      'days)',
    )
  }

  let settleResult
  try {
    // Verify first — gives a clearer invalidReason than settle alone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verifyResult = await facilitator.verify(paymentPayload as any, requirements as any)
    console.log('[verify] result:', JSON.stringify(verifyResult))
    if (!verifyResult.isValid) {
      console.error('[verify] INVALID:', verifyResult.invalidReason)
      return NextResponse.json(
        { error: `Payment invalid: ${verifyResult.invalidReason}` },
        { status: 402 },
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settleResult = await facilitator.settle(paymentPayload as any, requirements as any)
    console.log('[settle] result:', JSON.stringify(settleResult))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[settle] exception:', message)
    return NextResponse.json({ error: `Settlement error: ${message}` }, { status: 402 })
  }

  if (!settleResult.success) {
    console.error('[settle] FAILED:', settleResult.errorReason)
    return NextResponse.json(
      { error: `Payment settlement failed: ${settleResult.errorReason}` },
      { status: 402 },
    )
  }

  // Record in global ticker store (all wallets, all users)
  const payerAddress =
    (paymentPayload as { payload?: { authorization?: { from?: string } } }).payload?.authorization
      ?.from ??
    settleResult.payer ??
    'unknown'
  const amountDisplay = (parseInt(requirements.amount) / 1_000_000).toFixed(2)
  addGlobalPayment({
    service: service.name,
    payer: payerAddress,
    formattedAmount: amountDisplay,
  })

  // Payment settled — return real service data
  const data = await fetchServiceData(serviceId, req)

  const paymentResponse = Buffer.from(
    JSON.stringify({
      success: true,
      payer: settleResult.payer,
      transaction: settleResult.transaction,
      network: settleResult.network,
    }),
  ).toString('base64')

  return NextResponse.json(data, {
    headers: {
      'PAYMENT-RESPONSE': paymentResponse,
      'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE',
    },
  })
}

// Shared Groq client — returns null on quota error instead of throwing
async function geminiGenerate(prompt: string): Promise<string | null> {
  try {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? '' })
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      prompt,
    })
    return text
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('quota') || msg.includes('rate_limit') || msg.includes('429')) {
      console.warn('[groq] quota exceeded:', msg.slice(0, 120))
      return null
    }
    throw err
  }
}

async function fetchServiceData(
  serviceId: string,
  req: NextRequest,
): Promise<Record<string, unknown>> {
  const q = req.nextUrl.searchParams

  switch (serviceId) {
    case 'market-data': {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin&vs_currencies=usd&include_24hr_change=true',
          { next: { revalidate: 60 } },
        )
        const gecko = (await res.json()) as Record<string, Record<string, number>>
        return {
          BTC: {
            price: gecko.bitcoin?.usd,
            change24h: parseFloat((gecko.bitcoin?.usd_24h_change ?? 0).toFixed(2)),
          },
          ETH: {
            price: gecko.ethereum?.usd,
            change24h: parseFloat((gecko.ethereum?.usd_24h_change ?? 0).toFixed(2)),
          },
          USDC: { price: gecko['usd-coin']?.usd ?? 1.0, change24h: 0 },
          source: 'CoinGecko',
          timestamp: Date.now(),
        }
      } catch {
        return { error: 'Failed to fetch market data from CoinGecko' }
      }
    }

    case 'weather': {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Ho_Chi_Minh&forecast_days=3',
        )
        const weather = (await res.json()) as {
          current: { temperature_2m: number; relative_humidity_2m: number; weather_code: number }
          daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] }
        }
        return {
          location: 'Ho Chi Minh City',
          current: {
            temp: weather.current?.temperature_2m,
            humidity: weather.current?.relative_humidity_2m,
            condition: interpretWeatherCode(weather.current?.weather_code),
          },
          forecast: (weather.daily?.time ?? []).map((date, i) => ({
            date,
            high: weather.daily.temperature_2m_max[i],
            low: weather.daily.temperature_2m_min[i],
          })),
          source: 'Open-Meteo',
          timestamp: Date.now(),
        }
      } catch {
        return { error: 'Failed to fetch weather data from Open-Meteo' }
      }
    }

    case 'ai-text': {
      const topic = q.get('topic') ?? 'Arc Network and Circle Gateway nanopayments'
      const text = await geminiGenerate(
        `Write a concise, insightful paragraph (3-5 sentences) analyzing: ${topic}. Be factual and informative.`,
      )
      if (!text) return { error: 'Groq rate limit exceeded. Retry in a moment.' }
      return {
        text,
        topic,
        tokens: text.split(' ').length,
        model: 'gemini-2.0-flash-lite',
        timestamp: Date.now(),
      }
    }

    case 'translate': {
      const text = q.get('text') ?? 'Hello, world!'
      const targetLanguage = q.get('targetLanguage') ?? 'Vietnamese'
      const translated = await geminiGenerate(
        `Translate the following text to ${targetLanguage}. Reply with ONLY the translated text, nothing else.\n\nText: ${text}`,
      )
      if (!translated) return { error: 'Groq rate limit exceeded. Retry in a moment.' }
      return {
        original: text,
        translated: translated.trim(),
        from: 'auto',
        to: targetLanguage,
        characters: text.length,
        timestamp: Date.now(),
      }
    }

    case 'code-review': {
      const code = q.get('code') ?? '// no code provided'
      const raw = await geminiGenerate(
        `Review this code for quality, bugs, and security issues. Respond in JSON with fields: score (0-100), severity ("none"|"low"|"medium"|"high"), issues (number), suggestions (array of strings, max 3).\n\nCode:\n${code}`,
      )
      if (!raw) return { error: 'Groq rate limit exceeded. Retry in a moment.' }
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as {
          score: number
          severity: string
          issues: number
          suggestions: string[]
        }
        return { ...parsed, linesAnalyzed: code.split('\n').length, timestamp: Date.now() }
      } catch {
        return { error: 'Failed to parse code review response' }
      }
    }

    case 'sentiment': {
      const text = q.get('text') ?? 'No text provided'
      const raw = await geminiGenerate(
        `Analyze the sentiment of this text. Respond in JSON with fields: label ("positive"|"negative"|"neutral"), score (0.0-1.0), reason (one sentence explanation).\n\nText: ${text}`,
      )
      if (!raw) return { error: 'Groq rate limit exceeded. Retry in a moment.' }
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as {
          label: string
          score: number
          reason: string
        }
        return { ...parsed, input: text, timestamp: Date.now() }
      } catch {
        return { error: 'Failed to parse sentiment response' }
      }
    }

    default:
      return { error: 'Unknown service' }
  }
}

function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}
