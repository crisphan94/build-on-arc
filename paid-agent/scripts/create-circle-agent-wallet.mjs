#!/usr/bin/env node
/**
 * Setup Circle Developer-Controlled Wallet for AgentPay agent.
 *
 * Usage:
 *   node scripts/create-circle-agent-wallet.mjs
 *
 * Prerequisites:
 *   - CIRCLE_API_KEY in .env.local
 *   - CIRCLE_ENTITY_SECRET in .env.local (generate at console.circle.com)
 *
 * After running, add the output CIRCLE_WALLET_ID to .env.local
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
const env = {}
for (const line of envLines) {
  const [k, ...vs] = line.split('=')
  if (k && !k.startsWith('#')) env[k.trim()] = vs.join('=').trim()
}

const CIRCLE_API_KEY = env['CIRCLE_API_KEY']
const CIRCLE_ENTITY_SECRET = env['CIRCLE_ENTITY_SECRET']

if (!CIRCLE_API_KEY) {
  console.error('CIRCLE_API_KEY not found in .env.local')
  process.exit(1)
}
if (!CIRCLE_ENTITY_SECRET) {
  console.error('CIRCLE_ENTITY_SECRET not found in .env.local')
  console.error('   Generate at: https://console.circle.com → Developer → Entity Secret')
  process.exit(1)
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: CIRCLE_API_KEY,
  entitySecret: CIRCLE_ENTITY_SECRET,
})

console.log('Creating Circle Developer-Controlled Wallet for AgentPay...')

try {
  // Step 1: Create wallet set
  const walletSetRes = await client.createWalletSet({
    name: 'AgentPay Agent Wallet Set',
  })
  const walletSetId = walletSetRes.data?.walletSet?.id
  if (!walletSetId) throw new Error('Failed to create wallet set')
  console.log(`Wallet set created: ${walletSetId}`)

  // Step 2: Create wallet on ARC-TESTNET
  const walletRes = await client.createWallets({
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId,
    accountType: 'EOA',
  })

  const wallet = walletRes.data?.wallets?.[0]
  if (!wallet) throw new Error('Failed to create wallet')

  console.log('\nCircle Agent Wallet created!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Wallet ID:  ${wallet.id}`)
  console.log(`   Address:    ${wallet.address}`)
  console.log(`   Blockchain: ARC-TESTNET`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nAdd to .env.local:')
  console.log(`   CIRCLE_WALLET_ID=${wallet.id}`)
  console.log(`   CIRCLE_WALLET_ADDRESS=${wallet.address}`)
  console.log('\nThen fund this wallet with USDC on Arc Testnet:')
  console.log(`   https://faucet.circle.com → network: Arc Testnet → address: ${wallet.address}`)
  console.log('\nThen deposit into GatewayWallet:')
  console.log(`   node scripts/deposit-agent.mjs 10`)
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
}
