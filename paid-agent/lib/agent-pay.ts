/**
 * Server-side payment execution for AI agent.
 * Mirrors useGatewayPay.ts but runs entirely on the server — no browser, no wagmi.
 */
import { getCircleWalletAddress, signWithCircleWallet } from '@/lib/circle-wallet'
import { addGlobalPayment } from '@/lib/global-payments'
import {
  ARC_TESTNET_CHAIN_ID,
  GATEWAY_BATCHING_NAME,
  GATEWAY_BATCHING_VERSION,
} from '@/lib/contracts'

export interface AgentPayResult {
  data: Record<string, unknown>
  payer: string
  amount: string
  formattedAmount: string
  service: string
}

interface PaymentOption {
  scheme: string
  network: string
  asset: string
  amount: string
  payTo: string
  maxTimeoutSeconds: number
  extra?: { name?: string; version?: string; verifyingContract?: string }
}

interface PaymentRequired {
  x402Version: number
  accepts: PaymentOption[]
  resource: { url: string; description: string; mimeType: string }
}

export async function agentPay(
  serviceId: string,
  baseUrl: string,
  params?: Record<string, string>,
): Promise<AgentPayResult> {
  const url = new URL(`${baseUrl}/api/demo/${serviceId}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  const serviceUrl = url.toString()
  const agentAddress = await getCircleWalletAddress()

  // Step 1: Trigger 402
  const initRes = await fetch(serviceUrl)

  if (initRes.ok) {
    const data = (await initRes.json()) as Record<string, unknown>
    return { data, payer: agentAddress, amount: '0', formattedAmount: '0', service: serviceId }
  }

  if (initRes.status !== 402) {
    throw new Error(`Unexpected status ${initRes.status} from ${serviceUrl}`)
  }

  // Step 2: Parse payment requirements
  const body402 = (await initRes.json().catch(() => null)) as {
    paymentRequired?: PaymentRequired
  } | null

  let paymentRequired: PaymentRequired | null = body402?.paymentRequired ?? null

  if (!paymentRequired) {
    const header =
      initRes.headers.get('PAYMENT-REQUIRED') ?? initRes.headers.get('payment-required')
    if (!header) throw new Error('Missing payment requirements in 402 response')
    paymentRequired = JSON.parse(Buffer.from(header, 'base64').toString('utf-8')) as PaymentRequired
  }

  // Step 3: Find GatewayWalletBatched option for Arc Testnet
  const option = paymentRequired.accepts.find(
    (opt) =>
      opt.network === `eip155:${ARC_TESTNET_CHAIN_ID}` &&
      opt.extra?.name === GATEWAY_BATCHING_NAME &&
      opt.extra?.version === GATEWAY_BATCHING_VERSION &&
      typeof opt.extra?.verifyingContract === 'string',
  )

  if (!option) throw new Error('No GatewayWalletBatched option for Arc Testnet')

  const verifyingContract = option.extra!.verifyingContract as `0x${string}`

  // Step 4: Sign EIP-3009 via Circle Wallets API (or fallback to raw key)
  const { signature, authorization } = await signWithCircleWallet({
    to: option.payTo as `0x${string}`,
    value: BigInt(option.amount),
    verifyingContract,
  })

  // Step 5: Build Payment-Signature header
  const paymentPayload = {
    x402Version: paymentRequired.x402Version ?? 2,
    payload: { authorization, signature },
    resource: paymentRequired.resource,
    accepted: option,
  }
  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

  // Step 6: Fetch service data — demo route handles verify + settle with Circle
  const paidRes = await fetch(serviceUrl, {
    headers: { 'Payment-Signature': paymentHeader },
  })

  if (!paidRes.ok) {
    const err = (await paidRes.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Service returned ${paidRes.status}`)
  }

  const data = (await paidRes.json()) as Record<string, unknown>
  const formattedAmount = (parseInt(option.amount) / 1_000_000).toFixed(2)

  // Record in global ticker (agent already paid — demo route records from seller side too, that's ok)
  addGlobalPayment({ service: serviceId, payer: agentAddress, formattedAmount })

  return {
    data,
    payer: agentAddress,
    amount: option.amount,
    formattedAmount,
    service: serviceId,
  }
}
