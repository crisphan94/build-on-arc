import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json()

    if (!metadata || !metadata.name) {
      return NextResponse.json({ error: 'Invalid metadata provided' }, { status: 400 })
    }

    // Check if Pinata credentials are configured
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_SECRET_KEY

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json(
        { error: 'Pinata API keys not configured. Please add them to .env.local' },
        { status: 500 },
      )
    }

    // Upload metadata JSON to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata.json`,
        },
      }),
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      console.error('Pinata metadata upload error:', errorText)
      return NextResponse.json(
        { error: 'Failed to upload metadata to IPFS', details: errorText },
        { status: 500 },
      )
    }

    const pinataData = await pinataResponse.json()
    const ipfsHash = pinataData.IpfsHash

    return NextResponse.json({
      success: true,
      ipfsHash,
      ipfsUrl: `ipfs://${ipfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    })
  } catch (error) {
    console.error('Metadata upload error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
