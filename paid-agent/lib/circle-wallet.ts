/**
 * Circle Developer-Controlled Wallets signing for EIP-3009 authorization.
 *
 * KNOWN LIMITATION (Arc Testnet):
 * Circle's signTypedData API returns "API parameter invalid" for Arc Testnet (chain 5042002).
 * Likely cause: Arc Testnet chain ID not yet whitelisted by Circle HSM backend.
 * Fallback: Uses raw AGENT_PRIVATE_KEY signing via viem (see agent-wallet.ts).
 *
 * When Circle adds Arc Testnet support → this will automatically use HSM signing.
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

function buildEip712TypedData(params: {
  from: string
  to: string
  value: bigint
  validAfter: bigint
  validBefore: bigint
  nonce: string
  verifyingContract: string
}) {
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
  const hash = hashTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message })
  return { domain, types, primaryType: 'TransferWithAuthorization' as const, message, hash }
}

export async function signWithCircleWallet(params: {
  to: `0x${string}`
  value: bigint
  verifyingContract: `0x${string}`
}): Promise<AgentSignatureResult & { signingMethod: 'circle-wallet' | 'raw-key' }> {
  const walletId = process.env.CIRCLE_WALLET_ID

  if (walletId && process.env.CIRCLE_ENTITY_SECRET) {
    try {
      const client = getCircleClient()
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

      const typedData = buildEip712TypedData({
        from: walletAddress,
        to: params.to,
        value: params.value,
        validAfter,
        validBefore,
        nonce,
        verifyingContract: params.verifyingContract,
      })

      // Circle API: domainSeparator must be the pre-computed EIP-712 hash (hex string)
      const signRes = await client.signTypedData({
        walletId,
        data: {
          domainSeparator: typedData.hash,
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
        } as unknown as Parameters<typeof client.signTypedData>[0]['data'],
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
      // Circle HSM signing fails on Arc Testnet with "API parameter invalid".
      // Known issue: Arc chain 5042002 likely not whitelisted by Circle yet.
      // Fallback to raw key signing works identically for EIP-3009 authorization.
      const errMsg = err instanceof Error ? err.message : String(err)
      if (!errMsg.includes('API parameter invalid')) {
        console.warn('[circle-wallet] Circle HSM signing failed, using fallback:', errMsg)
      }
      // Silent fallback for known Arc Testnet issue
    }
  }

  // Fallback: Raw private key signing via viem (same EIP-712 output, no HSM)
  const { signAgentPayment } = await import('@/lib/agent-wallet')
  const result = await signAgentPayment(params)
  return { ...result, signingMethod: 'raw-key' }
}

export async function getCircleWalletAddress(): Promise<`0x${string}`> {
  const walletId = process.env.CIRCLE_WALLET_ID
  if (walletId && process.env.CIRCLE_ENTITY_SECRET) {
    try {
      const client = getCircleClient()
      const res = await client.getWallet({ id: walletId })
      const addr = res.data?.wallet?.address as `0x${string}` | undefined
      if (addr) return addr
    } catch (err) {
      console.warn('[circle-wallet] getWallet failed, falling back to raw key:', err)
    }
  }
  const { getAgentAddress } = await import('@/lib/agent-wallet')
  return getAgentAddress()
}

export function isCircleWalletConfigured(): boolean {
  return !!(process.env.CIRCLE_WALLET_ID && process.env.CIRCLE_ENTITY_SECRET)
}
