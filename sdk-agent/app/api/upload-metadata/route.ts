export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json()

    // Upload metadata JSON to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.PINATA_API_KEY!,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY!,
      },
      body: JSON.stringify(metadata),
    })

    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.text()
      console.error('Pinata metadata upload error:', errorData)
      throw new Error(`Pinata metadata upload failed: ${pinataResponse.statusText}`)
    }

    const pinataData = await pinataResponse.json()
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`

    return NextResponse.json({
      success: true,
      ipfsUrl,
      ipfsHash: pinataData.IpfsHash,
    })
  } catch (error: unknown) {
    console.error('Metadata upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
