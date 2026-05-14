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

  let settleResult
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verifyResult = await facilitator.verify(paymentPayload as any, requirements as any)
    if (!verifyResult.isValid) {
      return NextResponse.json(
        { error: `Payment invalid: ${verifyResult.invalidReason}` },
        { status: 402 },
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settleResult = await facilitator.settle(paymentPayload as any, requirements as any)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Settlement error: ${message}` }, { status: 402 })
  }

  if (!settleResult.success) {
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

async function groqGenerate(prompt: string): Promise<string | null> {
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
      // Known common mappings for fast lookup (no extra API call needed)
      const SYMBOL_TO_ID: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        USDC: 'usd-coin',
        USDT: 'tether',
        BNB: 'binancecoin',
        SOL: 'solana',
        ADA: 'cardano',
        XRP: 'ripple',
        DOGE: 'dogecoin',
        DOT: 'polkadot',
        MATIC: 'matic-network',
        POL: 'matic-network',
        AVAX: 'avalanche-2',
        LINK: 'chainlink',
        UNI: 'uniswap',
        ATOM: 'cosmos',
        LTC: 'litecoin',
        BCH: 'bitcoin-cash',
        NEAR: 'near',
        APT: 'aptos',
        ARB: 'arbitrum',
        OP: 'optimism',
        TRX: 'tron',
        SHIB: 'shiba-inu',
        PEPE: 'pepe',
        TON: 'the-open-network',
        SUI: 'sui',
        SEI: 'sei-network',
        INJ: 'injective-protocol',
        HBAR: 'hedera-hashgraph',
        ICP: 'internet-computer',
        FIL: 'filecoin',
        VET: 'vechain',
        ALGO: 'algorand',
        XLM: 'stellar',
        SAND: 'the-sandbox',
        MANA: 'decentraland',
        AXS: 'axie-infinity',
        CRO: 'crypto-com-chain',
        FTM: 'fantom',
        EGLD: 'elrond-erd-2',
        THETA: 'theta-token',
        FLOW: 'flow',
        RUNE: 'thorchain',
        BLUR: 'blur',
        MKR: 'maker',
        COMP: 'compound-governance-token',
        AAVE: 'aave',
        SNX: 'havven',
        CRV: 'curve-dao-token',
        LDO: 'lido-dao',
        RPL: 'rocket-pool',
        GMX: 'gmx',
        PENDLE: 'pendle',
        WIF: 'dogwifcoin',
        BONK: 'bonk',
        FLOKI: 'floki',
        BRETT: 'brett',
        MOG: 'mog-coin',
      }

      // Dynamically resolve unknown symbols via CoinGecko search API
      async function resolveSymbol(sym: string): Promise<string | null> {
        if (SYMBOL_TO_ID[sym]) return SYMBOL_TO_ID[sym]
        try {
          const searchRes = await fetch(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(sym)}`,
          )
          const searchData = (await searchRes.json()) as {
            coins?: { id: string; symbol: string; market_cap_rank: number | null }[]
          }
          // Find exact symbol match, prefer higher market cap rank (lower number = bigger)
          const matches = (searchData.coins ?? []).filter((c) => c.symbol.toUpperCase() === sym)
          if (matches.length === 0) return null
          // Sort by market_cap_rank ascending (null last)
          matches.sort((a, b) => {
            if (a.market_cap_rank === null) return 1
            if (b.market_cap_rank === null) return -1
            return a.market_cap_rank - b.market_cap_rank
          })
          return matches[0].id
        } catch {
          return null
        }
      }

      // Parse requested coins from query param, fallback to defaults
      const topParam = q.get('top')
      const coinParam = q.get('coins') ?? ''

      // Handle "top N coins by market cap"
      if (topParam) {
        const topN = parseInt(topParam, 10)
        if (isNaN(topN) || topN < 1 || topN > 100) {
          return { error: 'Invalid top parameter. Must be between 1 and 100.' }
        }

        try {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${topN}&page=1&sparkline=false`,
            { next: { revalidate: 60 } },
          )
          const markets = (await res.json()) as Array<{
            id: string
            symbol: string
            name: string
            current_price: number
            price_change_percentage_24h: number
            market_cap: number
            market_cap_rank: number
          }>

          const prices: Record<string, unknown> = {}
          for (const coin of markets) {
            prices[coin.symbol.toUpperCase()] = {
              name: coin.name,
              price: coin.current_price,
              change24h: parseFloat((coin.price_change_percentage_24h ?? 0).toFixed(2)),
              marketCap: coin.market_cap,
              rank: coin.market_cap_rank,
            }
          }

          return { ...prices, source: 'CoinGecko', timestamp: Date.now(), topN }
        } catch {
          return { error: 'Failed to fetch top coins from CoinGecko' }
        }
      }

      // Handle specific coin symbols
      const requestedSymbols = coinParam
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s && s !== 'UNDEFINED' && s.length > 0)

      if (requestedSymbols.length === 0) {
        return { error: 'No coin symbols provided. Pass ?coins=BTC or ?coins=TON,SOL' }
      }

      // Resolve all symbols (parallel for unknowns)
      const resolved: Record<string, string | null> = {}
      await Promise.all(
        requestedSymbols.map(async (sym) => {
          resolved[sym] = await resolveSymbol(sym)
        }),
      )

      const idsToFetch = [...new Set(Object.values(resolved).filter(Boolean) as string[])]

      // Fallback if nothing resolved
      if (idsToFetch.length === 0) {
        return {
          error: `Could not find any of the requested symbols: ${requestedSymbols.join(', ')}`,
        }
      }

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd&include_24hr_change=true`,
          { next: { revalidate: 60 } },
        )
        const gecko = (await res.json()) as Record<string, Record<string, number>>

        // Build result keyed by ticker symbol
        const prices: Record<string, unknown> = {}
        for (const sym of requestedSymbols) {
          const id = resolved[sym]
          if (!id) {
            prices[sym] = { error: `Symbol "${sym}" not found on CoinGecko` }
          } else if (gecko[id]) {
            prices[sym] = {
              price: gecko[id].usd,
              change24h: parseFloat((gecko[id].usd_24h_change ?? 0).toFixed(2)),
            }
          } else {
            prices[sym] = { error: 'Price data unavailable' }
          }
        }

        return { ...prices, source: 'CoinGecko', timestamp: Date.now() }
      } catch {
        return { error: 'Failed to fetch market data from CoinGecko' }
      }
    }

    case 'weather': {
      const locationQuery = q.get('location') ?? 'Ho Chi Minh City'
      try {
        // Step 1: geocode the location name → lat/lng
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=1&language=en&format=json`,
        )
        const geoData = (await geoRes.json()) as {
          results?: {
            name: string
            country: string
            latitude: number
            longitude: number
            timezone: string
          }[]
        }
        const place = geoData.results?.[0]
        if (!place) {
          return { error: `Location "${locationQuery}" not found. Try a major city name.` }
        }

        // Step 2: fetch weather with actual coordinates
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(place.timezone)}&forecast_days=3`,
        )
        const weather = (await weatherRes.json()) as {
          current: { temperature_2m: number; relative_humidity_2m: number; weather_code: number }
          daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] }
        }
        return {
          location: `${place.name}, ${place.country}`,
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
      const text = await groqGenerate(
        `Write a concise, insightful paragraph (3-5 sentences) analyzing: ${topic}. Be factual and informative.`,
      )
      if (!text) return { error: 'Groq rate limit exceeded. Retry in a moment.' }
      return {
        text,
        topic,
        tokens: text.split(' ').length,
        model: 'llama-3.1-8b-instant',
        timestamp: Date.now(),
      }
    }

    case 'translate': {
      const text = q.get('text') ?? 'Hello, world!'
      const targetLanguage = q.get('targetLanguage') ?? 'Vietnamese'
      const translated = await groqGenerate(
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
      const raw = await groqGenerate(
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
      const raw = await groqGenerate(
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
