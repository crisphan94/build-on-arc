import { NextResponse } from 'next/server'
import { parseUnits } from 'viem'
import { ensureGatewayBalance } from '@/lib/gateway-deposit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { amount } = (await req.json()) as { amount: number }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    console.log('[agent-deposit] Depositing', amount, 'USDC to gateway...')

    const amountBaseUnits = parseUnits(amount.toString(), 6)

    // Force deposit by ensuring we have at least current + new amount
    // This will trigger deposit of the new amount
    const currentBalance = await ensureGatewayBalance(BigInt(0))
    const targetBalance = currentBalance + amountBaseUnits
    const newBalance = await ensureGatewayBalance(targetBalance)

    const balanceUsdc = Number(newBalance) / 1_000_000
    console.log('[agent-deposit] Success! New gateway balance:', balanceUsdc)

    return NextResponse.json({
      success: true,
      gatewayBalance: balanceUsdc,
      deposited: amount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[agent-deposit] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
