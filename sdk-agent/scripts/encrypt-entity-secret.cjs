#!/usr/bin/env node
/**
 * Encrypt Entity Secret for Circle SDK
 */

const crypto = require('crypto')

async function encryptEntitySecret() {
  const apiKey = process.argv[2] || process.env.CIRCLE_API_KEY
  const entitySecret = process.argv[3] || '039beb019132ddd58144c302ffd1a7485d2851d11cad2c4d91fa18b8f741f9f4'
  
  if (!apiKey) {
    console.error('Usage: node scripts/encrypt-entity-secret.cjs <API_KEY> [ENTITY_SECRET]')
    process.exit(1)
  }

  console.log('Encrypting Entity Secret...\n')
  console.log(`Entity Secret: ${entitySecret}\n`)

  try {
    // Get public key from Circle
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
    const publicKeyPEM = data.data.publicKey
    
    console.log('Public Key received\n')

    // Encrypt entity secret
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPEM,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(entitySecret, 'hex')
    )

    const ciphertext = encrypted.toString('base64')
    
    console.log('Encryption successful!\n')
    console.log('Ciphertext:')
    console.log(ciphertext)
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

encryptEntitySecret()
