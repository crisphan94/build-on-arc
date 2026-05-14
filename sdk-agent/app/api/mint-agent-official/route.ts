export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createArcWallet, registerAgentIdentity } from '@/lib/circle-developer-wallet'

export async function POST(request: NextRequest) {
  try {
    const { metadataURI } = await request.json()

    if (!metadataURI) {
      return NextResponse.json({ error: 'Missing metadataURI' }, { status: 400 })
    }

    const walletSetId = process.env.CIRCLE_WALLET_SET_ID!
    if (!walletSetId) {
      return NextResponse.json({ error: 'CIRCLE_WALLET_SET_ID not configured' }, { status: 500 })
    }

    console.log('Step 1: Creating Smart Contract Wallet on Arc Testnet...')
    const wallet = await createArcWallet(walletSetId)
    console.log(`Wallet created: ${wallet.address}`)

    console.log('Step 2: Registering Agent Identity...')
    const txHash = await registerAgentIdentity(wallet.address, metadataURI)
    console.log(`Registered: ${txHash}`)

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      walletId: wallet.id,
      txHash,
      arcscanUrl: `https://testnet.arcscan.app/tx/${txHash}`,
      message: 'AI Agent registered successfully!',
    })
  } catch (error: unknown) {
    console.error('Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to register agent',
      },
      { status: 500 },
    )
  }
}
