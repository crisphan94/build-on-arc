#!/usr/bin/env node
/**
 * Create Circle Wallet Set via API
 */

const crypto = require('crypto')

function generateUUID() {
  return crypto.randomUUID()
}

async function createWalletSet() {
  const apiKey = process.argv[2] || process.env.CIRCLE_API_KEY
  
  if (!apiKey) {
    console.error('Usage: node scripts/create-wallet-set.cjs <API_KEY>')
    process.exit(1)
  }

  console.log('🔧 Creating Circle Wallet Set...\n')

  // Entity Secret Ciphertext (newly encrypted)
  const entitySecretCiphertext = 'QioCDwdsl0mLJweZuB+qm37lpBl4U52s7HIoMft7PBXLe/GwYEN6dtEvSLp3/BjAl5J+G1SJmgk+BNHArHEf7XG5lll04et1ViFWVMmeJFxnrPV9xLmo7CQqQb/f2ZS2uR4+62+l6fz9CctXZk7/gfTlQaRe6AoYJgk9mR6lW0jiGqh64wOkGzQ6+kZ2PRCjRqdqqhiWEI+a8LRj/yHEVkZgFFfLcvCgRl4mmvVOcOpY1eZ4slnVg6CQ8WP2BQFY52nCeuLxHp/iJeMLj/YZ/xFM2wiXiy5nVBwhycv+RzAhpNQV2dPQrvGo24dVWH9ehqbQbas9CSHH8ohexExlhucY36idpFvmTKB9w6wTGC524DD5ui4qQ7twk/JOQbRq9FCl3wbaXFovo/TKhuDyEd32+h5yXKjPN6R99AklbAwnLEvryUDp8gOu8KTCtAev/yYsFNcQiXoDANKYJclp5paIfAs5/7cJDsDRTStI7NCFZzVqDcl9plBW3LTXwEQ++PKMkMVuPlNiwczsVT3TffT/hi5UITFfW0SZYgqIfGNTFdDOv+6+c+5xQQMRTkayhkXRDYtrzs3eReZc4u+Zznbuqu3BEPwyG7usf1Cza2Dz/w7vF6dVo4HYL2BG86K0h5z/gROL5mNLWtqEExtxpeHk2ZABSUi8cCXiVLH4j4A='
  
  // Generate UUID for idempotency key
  const idempotencyKey = generateUUID()

  try {
    const response = await fetch(
      'https://api.circle.com/v1/w3s/developer/walletSets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Arc AI Agents',
          idempotencyKey,
          entitySecretCiphertext,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ API Error: ${response.status}`)
      console.error(error)
      process.exit(1)
    }

    const data = await response.json()
    console.log('✅ Wallet Set Created!\n')
    console.log('📋 Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.data && data.data.walletSet && data.data.walletSet.id) {
      const walletSetId = data.data.walletSet.id
      console.log('\n✅ WALLET SET ID:')
      console.log(walletSetId)
      console.log('\n📝 Update .env.local:')
      console.log(`CIRCLE_WALLET_SET_ID=${walletSetId}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createWalletSet()
