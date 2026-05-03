#!/usr/bin/env node
/**
 * Debug Circle API Public Key
 */

async function debugPublicKey() {
  const apiKey = process.argv[2] || process.env.CIRCLE_API_KEY
  
  if (!apiKey) {
    console.error('Usage: node scripts/debug-circle.cjs <API_KEY>')
    process.exit(1)
  }

  try {
    const response = await fetch(
      'https://api.circle.com/v1/w3s/config/entity/publicKey',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error(`API Error: ${response.status}`)
      console.error(error)
      process.exit(1)
    }

    const data = await response.json()
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.data && data.data.publicKey) {
      console.log('\n🔑 Public Key (base64):')
      console.log(data.data.publicKey)
      
      console.log('\n🔓 Decoded Public Key:')
      const decoded = Buffer.from(data.data.publicKey, 'base64').toString('utf-8')
      console.log(decoded)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

debugPublicKey()
