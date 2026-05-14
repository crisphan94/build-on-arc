import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import {
  ARC_TESTNET_CHAIN_ID,
  GATEWAY_BATCHING_NAME,
  GATEWAY_BATCHING_VERSION,
  GATEWAY_AUTH_VALIDITY_SECONDS,
} from '@/lib/contracts'

const arcTestnet = {
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
} as const

export function getAgentAccount() {
  const pk = process.env.AGENT_PRIVATE_KEY
  if (!pk) throw new Error('AGENT_PRIVATE_KEY not set')
  const normalized = (pk.startsWith('0x') ? pk : `0x${pk}`) as `0x${string}`
  return privateKeyToAccount(normalized)
}

export function getAgentAddress(): `0x${string}` {
  return getAgentAccount().address
}

export interface AgentSignatureResult {
  signature: `0x${string}`
  authorization: {
    from: `0x${string}`
    to: `0x${string}`
    value: string
    validAfter: string
    validBefore: string
    nonce: `0x${string}`
  }
}

export async function signAgentPayment(params: {
  to: `0x${string}`
  value: bigint
  verifyingContract: `0x${string}`
}): Promise<AgentSignatureResult> {
  const account = getAgentAccount()
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() })

  const now = Math.floor(Date.now() / 1000)
  const validAfter = BigInt(now - 600)
  const validBefore = BigInt(now + GATEWAY_AUTH_VALIDITY_SECONDS)

  const nonceBytes = crypto.getRandomValues(new Uint8Array(32))
  const nonce = `0x${Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`

  const signature = await walletClient.signTypedData({
    domain: {
      name: GATEWAY_BATCHING_NAME,
      version: GATEWAY_BATCHING_VERSION,
      chainId: ARC_TESTNET_CHAIN_ID,
      verifyingContract: params.verifyingContract,
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
      from: account.address,
      to: params.to,
      value: params.value,
      validAfter,
      validBefore,
      nonce,
    },
  })

  return {
    signature,
    authorization: {
      from: account.address,
      to: params.to,
      value: params.value.toString(),
      validAfter: (now - 600).toString(),
      validBefore: (now + GATEWAY_AUTH_VALIDITY_SECONDS).toString(),
      nonce,
    },
  }
}
