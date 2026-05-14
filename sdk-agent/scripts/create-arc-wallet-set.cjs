#!/usr/bin/env node
/**
 * Create new Wallet Set with Arc Testnet support
 */

const CIRCLE_API_KEY = 'TEST_API_KEY:41778caccd7b43a015dda2a31f30135f:f180936bd1190384aad2df295cf10e8c'

async function createWalletSet() {
  try {
    const response = await fetch(
      'https://api.circle.com/v1/w3s/config/entity/walletSets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Arc Testnet Wallet Set',
          blockchains: ['ARC-TESTNET'],
        }),
      }
    )

    if (!response.ok) {
      console.error(`API Error: ${response.status}`)
      const text = await response.text()
      console.error(text)
      return
    }

    const data = await response.json()
    console.log('Wallet Set Created!')
    console.log(JSON.stringify(data, null, 2))
    console.log('\nAdd to .env.local:')
    console.log(`CIRCLE_WALLET_SET_ID=${data.data.walletSet.id}`)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

createWalletSet()
