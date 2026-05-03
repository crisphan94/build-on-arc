#!/usr/bin/env node
/**
 * Circle SDK Setup Script
 * Run: node scripts/circle-setup.js
 */

const crypto = require('crypto')

// Step 1: Generate Entity Secret
function generateEntitySecret() {
  const secret = crypto.randomBytes(32).toString('hex')
  return secret
}

// Step 2: Get Entity Public Key from Circle
async function getEntityPublicKey(apiKey) {
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
    throw new Error(`Failed to get public key: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.data.publicKey
}

// Step 3: Encrypt Entity Secret
function encryptEntitySecret(entitySecret, publicKeyPEM) {
  // Public key is already in PEM format (-----BEGIN PUBLIC KEY-----)
  // No need to decode base64
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPEM,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(entitySecret, 'hex')
  )

  return encrypted.toString('base64')
}

// Step 4: Register Entity Secret Ciphertext
async function registerEntitySecretCiphertext(apiKey, ciphertext) {
  const response = await fetch(
    'https://api.circle.com/v1/w3s/config/entity/entitySecretCiphertext',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entitySecretCiphertext: ciphertext,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to register: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data
}

// Main Setup Flow
async function setupCircleSDK() {
  console.log('🔧 Circle SDK Setup\n')

  // Get API key from environment or argument
  const apiKey = process.env.CIRCLE_API_KEY || process.argv[2]
  
  if (!apiKey || apiKey === 'your_circle_api_key_here') {
    console.error('❌ Error: CIRCLE_API_KEY not provided')
    console.log('\nUsage:')
    console.log('  node scripts/circle-setup.js <YOUR_API_KEY>')
    console.log('Or set CIRCLE_API_KEY in .env.local and run:')
    console.log('  node scripts/circle-setup.js')
    process.exit(1)
  }

  try {
    // Step 1: Generate Entity Secret
    console.log('1️⃣ Generating Entity Secret...')
    const entitySecret = generateEntitySecret()
    console.log(`✅ Entity Secret: ${entitySecret}`)
    console.log('⚠️  SAVE THIS SECURELY! You will need it in .env.local\n')

    // Step 2: Get Public Key
    console.log('2️⃣ Getting Entity Public Key from Circle...')
    const publicKey = await getEntityPublicKey(apiKey)
    console.log('✅ Public Key received\n')

    // Step 3: Encrypt
    console.log('3️⃣ Encrypting Entity Secret...')
    const ciphertext = encryptEntitySecret(entitySecret, publicKey)
    console.log(`✅ Ciphertext: ${ciphertext}\n`)

    // Step 4: Register
    console.log('4️⃣ Registering Entity Secret Ciphertext with Circle...')
    const result = await registerEntitySecretCiphertext(apiKey, ciphertext)
    console.log('✅ Registration successful!')
    console.log(JSON.stringify(result, null, 2))

    // Final Instructions
    console.log('\n✅ SETUP COMPLETE!\n')
    console.log('📝 Update your .env.local:')
    console.log(`CIRCLE_ENTITY_SECRET=${entitySecret}`)
    console.log('\n🎯 Next: Create a Wallet Set at https://console.circle.com/wallets/user/wallet-sets')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup
setupCircleSDK()
