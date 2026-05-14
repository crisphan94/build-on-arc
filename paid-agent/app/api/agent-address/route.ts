import { NextResponse } from 'next/server'
import { getAgentAddress } from '@/lib/agent-wallet'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const address = getAgentAddress()
    return NextResponse.json({ address })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
