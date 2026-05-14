import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import {
  USDC_ADDRESS,
  ARC_TESTNET_CHAIN_ID,
  GATEWAY_WALLET_ADDRESS,
  GATEWAY_WALLET_ABI,
} from '@/lib/contracts'
import { getAgentAddress } from '@/lib/agent-wallet'

export const runtime = 'nodejs'

const arcTestnet = {
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
} as const

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

export async function GET() {
  try {
    const agentAddress = getAgentAddress()

    // Read gateway balance
    const raw = (await publicClient.readContract({
      address: GATEWAY_WALLET_ADDRESS,
      abi: GATEWAY_WALLET_ABI,
      functionName: 'availableBalance',
      args: [USDC_ADDRESS, agentAddress],
    })) as bigint

    const usdc = Number(raw) / 1_000_000

    return NextResponse.json({
      address: agentAddress,
      gatewayBalance: usdc,
      raw: raw.toString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
