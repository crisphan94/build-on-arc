#!/usr/bin/env node
/**
 * Direct test of Circle SDK with Arc Testnet
 */

import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets'

const CIRCLE_API_KEY = 'TEST_API_KEY:41778caccd7b43a015dda2a31f30135f:f180936bd1190384aad2df295cf10e8c'
const CIRCLE_ENTITY_SECRET = '039beb019132ddd58144c302ffd1a7485d2851d11cad2c4d91fa18b8f741f9f4'
const CIRCLE_WALLET_SET_ID = 'f10599a2-7046-5259-8d4b-e43ebb2dd19c'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: CIRCLE_API_KEY,
  entitySecret: CIRCLE_ENTITY_SECRET,
})

async function testArcWallet() {
  const userId = `test-arc-${Date.now()}`
  
  console.log('1️⃣ Creating Circle user...')
  try {
    await circleClient.createUser({ userId })
    console.log('✅ User created:', userId)
  } catch (error) {
    console.log('⚠️  User creation error:', error.message)
  }

  console.log('\n2️⃣ Getting user token...')
  const tokenResponse = await circleClient.createUserToken({ userId })
  const { userToken } = tokenResponse.data
  console.log('✅ Token acquired')

  console.log('\n3️⃣ Creating wallet on POLYGON-AMOY (fallback)...')
  try {
    const walletResponse = await circleClient.createWallet({
      userToken,
      blockchains: ['POLYGON-AMOY'], // Test with supported testnet
      accountType: 'SCA',
      walletSetId: CIRCLE_WALLET_SET_ID,
      idempotencyKey: `test-${Date.now()}`,
    })
    
    console.log('✅ SUCCESS! Wallet:', walletResponse.data.wallet)
  } catch (error) {
    console.error('❌ CREATE WALLET ERROR:')
    console.error('Message:', error.message)
    console.error('Response:', error.response?.data || error)
  }
}

testArcWallet().catch(console.error)
