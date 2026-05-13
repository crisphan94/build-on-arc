/**
 * Circle Developer-Controlled Wallets integration.
 * Replaces raw AGENT_PRIVATE_KEY with Circle-managed secure key storage.
 *
 * Circle Wallets API docs: https://developers.circle.com/wallets
 *
 * Setup:
 *   1. Create wallet set: node scripts/create-circle-agent-wallet.mjs
 *   2. Add CIRCLE_WALLET_ID to .env.local
 *   3. The agent signs EIP-3009 via Circle's API — private key never exposed
 *
 * Fallback: if CIRCLE_WALLET_ID is not set, falls back to AGENT_PRIVATE_KEY
 * (raw key approach — not recommended for production).
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { hashTypedData } from 'viem'
import type { AgentSignatureResult } from '@/lib/agent-wallet'
import {
  ARC_TESTNET_CHAIN_ID,
  GATEWAY_BATCHING_NAME,
  GATEWAY_BATCHING_VERSION,
  GATEWAY_AUTH_VALIDITY_SECONDS,
} from '@/lib/contracts'

// ── Circle client (lazily instantiated) ──────────────────────────────────────

let _circleClient: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null

function getCircleClient() {
  if (!_circleClient) {
    _circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY ?? '',
      entitySecret: process.env.CIRCLE_ENTITY_SECRET ?? '',
    })
  }
  return _circleClient
}

// ── EIP-712 typed data for EIP-3009 ─────────────────────────────────────────

function buildTypedData(params: {
  from: string
  to: string
  value: bigint
  validAfter: bigint
  validBefore: bigint
  nonce: string
  verifyingContract: string
}) {
  // Circle API expects EIP-712 typed data with domainSeparator as a 0x-prefixed hex hash
  const domain = {
    name: GATEWAY_BATCHING_NAME,
    version: GATEWAY_BATCHING_VERSION,
    chainId: ARC_TESTNET_CHAIN_ID,
    verifyingContract: params.verifyingContract as `0x${string}`,
  }

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  }

  const message = {
    from: params.from as `0x${string}`,
    to: params.to as `0x${string}`,
    value: params.value,
    validAfter: params.validAfter,
    validBefore: params.validBefore,
    nonce: params.nonce as `0x${string}`,
  }

  // Pre-compute the EIP-712 hash — Circle API accepts the full hash directly
  const hash = hashTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message })

  return { domain, types, primaryType: 'TransferWithAuthorization' as const, message, hash }
}

// ── Main: sign via Circle Wallets API ────────────────────────────────────────

export async function signWithCircleWallet(params: {
  to: `0x${string}`
  value: bigint
  verifyingContract: `0x${string}`
}): Promise<AgentSignatureResult & { signingMethod: 'circle-wallet' | 'raw-key' }> {
  const walletId = process.env.CIRCLE_WALLET_ID

  // Use Circle Wallets API when configured
  if (walletId && process.env.CIRCLE_ENTITY_SECRET) {
    try {
      const client = getCircleClient()

      // Get wallet address from Circle
      const walletRes = await client.getWallet({ id: walletId })
      const walletAddress = walletRes.data?.wallet?.address as `0x${string}`
      if (!walletAddress) throw new Error('Circle wallet address not found')

      const now = Math.floor(Date.now() / 1000)
      const validAfter = BigInt(now - 600)
      const validBefore = BigInt(now + GATEWAY_AUTH_VALIDITY_SECONDS)

      const nonceBytes = crypto.getRandomValues(new Uint8Array(32))
      const nonce = `0x${Array.from(nonceBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}` as `0x${string}`

      const typedData = buildTypedData({
        from: walletAddress,
        to: params.to,
        value: params.value,
        validAfter,
        validBefore,
        nonce,
        verifyingContract: params.verifyingContract,
      })

      // Sign via Circle API — private key stays in Circle's HSM
      // Circle expects: domainSeparator (hex hash), primaryType, types (without EIP712Domain), message
      const circleSignPayload = {
        domainSeparator: typedData.hash, // pre-computed EIP-712 hash
        primaryType: typedData.primaryType,
        types: typedData.types,
        message: {
          from: typedData.message.from,
          to: typedData.message.to,
          value: typedData.message.value.toString(),
          validAfter: typedData.message.validAfter.toString(),
          validBefore: typedData.message.validBefore.toString(),
          nonce: typedData.message.nonce,
        },
      }
      const signRes = await client.signTypedData({
        walletId,
        data: circleSignPayload as unknown as Parameters<typeof client.signTypedData>[0]['data'],
      })

      const signature = signRes.data?.signature as `0x${string}`
      if (!signature) throw new Error('Circle signing returned no signature')

      return {
        signature,
        authorization: {
          from: walletAddress,
          to: params.to,
          value: params.value.toString(),
          validAfter: (now - 600).toString(),
          validBefore: (now + GATEWAY_AUTH_VALIDITY_SECONDS).toString(),
          nonce,
        },
        signingMethod: 'circle-wallet',
      }
    } catch (err) {
      console.warn('[circle-wallet] Circle signing failed, falling back to AGENT_PRIVATE_KEY:', err)
    }
  }

  // Fallback: raw private key (AGENT_PRIVATE_KEY in env)
  const { signAgentPayment } = await import('@/lib/agent-wallet')
  const result = await signAgentPayment(params)
  return { ...result, signingMethod: 'raw-key' }
}

// ── Circle Wallet address (for balance checks etc.) ──────────────────────────

export async function getCircleWalletAddress(): Promise<`0x${string}`> {
  const walletId = process.env.CIRCLE_WALLET_ID
  if (walletId && process.env.CIRCLE_ENTITY_SECRET) {
    try {
      const client = getCircleClient()
      const res = await client.getWallet({ id: walletId })
      const addr = res.data?.wallet?.address as `0x${string}` | undefined
      if (addr) return addr
    } catch (err) {
      console.warn('[circle-wallet] Circle API failed, falling back to AGENT_PRIVATE_KEY:', err)
    }
  }
  // fallback: raw private key
  const { getAgentAddress } = await import('@/lib/agent-wallet')
  return getAgentAddress()
}

export function isCircleWalletConfigured(): boolean {
  return !!(process.env.CIRCLE_WALLET_ID && process.env.CIRCLE_ENTITY_SECRET)
}
