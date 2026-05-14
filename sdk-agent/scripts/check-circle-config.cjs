#!/usr/bin/env node
/**
 * Check Circle API supported blockchains
 */

const CIRCLE_API_KEY = 'TEST_API_KEY:41778caccd7b43a015dda2a31f30135f:f180936bd1190384aad2df295cf10e8c'

async function checkSupportedBlockchains() {
  try {
    // Get wallet set info
    const walletSetId = 'f10599a2-7046-5259-8d4b-e43ebb2dd19c'
    const response = await fetch(
      `https://api.circle.com/v1/w3s/config/entity/walletSets/${walletSetId}`,
      {
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error(`API Error: ${response.status}`)
      const text = await response.text()
      console.error(text)
      return
    }

    const data = await response.json()
    console.log('Wallet Set Config:')
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkSupportedBlockchains()
