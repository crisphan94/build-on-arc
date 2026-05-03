'use client'

import { useSignTypedData, useAccount } from 'wagmi'
import {
  ARC_TESTNET_CHAIN_ID,
  GATEWAY_BATCHING_NAME,
  GATEWAY_BATCHING_VERSION,
  GATEWAY_AUTH_VALIDITY_SECONDS,
} from '@/lib/contracts'

interface PaymentOption {
  scheme: string
  network: string
  asset: string
  amount: string
  payTo: string
  maxTimeoutSeconds: number
  extra?: {
    name?: string
    version?: string
    verifyingContract?: string
    [key: string]: unknown
  }
}

interface PaymentRequired {
  x402Version: number
  accepts: PaymentOption[]
  resource: {
    url: string
    description: string
    mimeType: string
  }
}

export interface PayResult {
  data: Record<string, unknown>
  payer: string
  transaction: string
  amount: string
  formattedAmount: string
}

export function useGatewayPay() {
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const pay = async (serviceId: string, onSigned?: () => void): Promise<PayResult> => {
    if (!address) throw new Error('Wallet not connected')

    const serviceUrl = `/api/demo/${serviceId}`

    // Step 1: Initial request to trigger 402
    const initResponse = await fetch(serviceUrl)

    if (initResponse.ok) {
      // Endpoint returned without payment (e.g., price is $0)
      const data = await initResponse.json()
      return { data, payer: address, transaction: '', amount: '0', formattedAmount: '0' }
    }

    if (initResponse.status !== 402) {
      throw new Error(`Unexpected response: ${initResponse.status}`)
    }

    // Read payment requirements from body (primary) or header (fallback)
    const body402 = (await initResponse.json().catch(() => null)) as {
      paymentRequired?: PaymentRequired
    } | null

    let paymentRequired: PaymentRequired | null = body402?.paymentRequired ?? null

    if (!paymentRequired) {
      // Fallback: try the PAYMENT-REQUIRED header
      const paymentRequiredHeader =
        initResponse.headers.get('PAYMENT-REQUIRED') ?? initResponse.headers.get('payment-required')
      if (!paymentRequiredHeader) {
        throw new Error(
          'Missing payment requirements in 402 response (no body.paymentRequired or PAYMENT-REQUIRED header)',
        )
      }
      paymentRequired = JSON.parse(atob(paymentRequiredHeader)) as PaymentRequired
    }

    // Step 2: Find the GatewayWalletBatched option for Arc Testnet
    const batchingOption = paymentRequired!.accepts.find(
      (opt) =>
        opt.network === `eip155:${ARC_TESTNET_CHAIN_ID}` &&
        opt.extra?.name === GATEWAY_BATCHING_NAME &&
        opt.extra?.version === GATEWAY_BATCHING_VERSION &&
        typeof opt.extra?.verifyingContract === 'string',
    )

    if (!batchingOption) {
      throw new Error('No Circle Gateway batching option available for Arc Testnet')
    }

    const verifyingContract = batchingOption.extra!.verifyingContract as `0x${string}`

    // Step 3: Build EIP-3009 TransferWithAuthorization
    const now = Math.floor(Date.now() / 1000)
    // Use 30-day validity window — must be >> maxTimeoutSeconds (3 days) advertised
    // by the server, so validBefore - now_at_circle is always well above Circle's minimum
    // regardless of client→server→Circle round-trip latency.
    const validitySeconds = GATEWAY_AUTH_VALIDITY_SECONDS

    const nonceBytes = crypto.getRandomValues(new Uint8Array(32))
    const nonce = `0x${Array.from(nonceBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}` as `0x${string}`

    const validAfter = BigInt(now - 600) // 10 min grace
    const validBefore = BigInt(now + validitySeconds)
    const value = BigInt(batchingOption.amount)

    // Step 4: Sign via connected wallet (MetaMask/WalletConnect)
    const signature = await signTypedDataAsync({
      domain: {
        name: GATEWAY_BATCHING_NAME,
        version: GATEWAY_BATCHING_VERSION,
        chainId: ARC_TESTNET_CHAIN_ID,
        verifyingContract,
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from: address,
        to: batchingOption.payTo as `0x${string}`,
        value,
        validAfter,
        validBefore,
        nonce,
      },
    })

    // Notify caller that signing is complete — used to transition UI to 'settling' state
    onSigned?.()

    // Step 5: Build Payment-Signature header (base64 JSON, matching GatewayClient format)
    const paymentPayload = {
      x402Version: paymentRequired!.x402Version ?? 2,
      payload: {
        authorization: {
          from: address,
          to: batchingOption.payTo,
          value: batchingOption.amount,
          validAfter: (now - 600).toString(),
          validBefore: (now + validitySeconds).toString(),
          nonce,
        },
        signature,
      },
      resource: paymentRequired!.resource,
      accepted: batchingOption,
    }

    const paymentHeader = btoa(JSON.stringify(paymentPayload))

    // Step 6: Retry with Payment-Signature
    const paidResponse = await fetch(serviceUrl, {
      headers: { 'Payment-Signature': paymentHeader },
    })

    if (!paidResponse.ok) {
      const errData = await paidResponse.json().catch(() => ({}))
      throw new Error(
        (errData as { error?: string }).error || `Payment failed: ${paidResponse.status}`,
      )
    }

    const data = await paidResponse.json()

    // Parse payment settlement info from response header
    let transaction = ''
    let payer = address
    const paymentResponseHeader = paidResponse.headers.get('PAYMENT-RESPONSE')
    if (paymentResponseHeader) {
      const settleInfo = JSON.parse(atob(paymentResponseHeader)) as {
        payer?: string
        transaction?: string
      }
      transaction = settleInfo.transaction ?? ''
      payer = (settleInfo.payer ?? address) as `0x${string}`
    }

    const amountInUsdc = (parseInt(batchingOption.amount) / 1_000_000).toFixed(2)

    return {
      data: data as Record<string, unknown>,
      payer: payer as `0x${string}`,
      transaction,
      amount: batchingOption.amount,
      formattedAmount: amountInUsdc,
    }
  }

  return { pay }
}
