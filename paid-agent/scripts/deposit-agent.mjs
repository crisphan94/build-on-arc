/**
 * Deposit USDC into GatewayWallet for the AI agent.
 * Run: node scripts/deposit-agent.mjs <amount_usdc>
 * Example: node scripts/deposit-agent.mjs 10
 */
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = join(__dir, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim())),
)

const PRIVATE_KEY = env.AGENT_PRIVATE_KEY
if (!PRIVATE_KEY) {
  console.error('AGENT_PRIVATE_KEY not found in .env.local')
  process.exit(1)
}

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
}

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'
const GATEWAY_WALLET = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'

const GATEWAY_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
  },
]

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
]

const amountUSDC = parseFloat(process.argv[2] ?? '5')
if (isNaN(amountUSDC) || amountUSDC <= 0) {
  console.error('Usage: node scripts/deposit-agent.mjs <amount_usdc>')
  process.exit(1)
}

const pk = (PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`)
const account = privateKeyToAccount(pk)

console.log('Agent address:', account.address)
console.log('Depositing:', amountUSDC, 'USDC into GatewayWallet...')

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() })
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() })

const amountBaseUnits = parseUnits(amountUSDC.toString(), 6)

// Check EOA balance
const balance = await publicClient.readContract({
  address: USDC_ADDRESS,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [account.address],
})
console.log('EOA USDC balance:', Number(balance) / 1e6, 'USDC')

if (balance < amountBaseUnits) {
  console.error(`Insufficient balance. Need ${amountUSDC} USDC but have ${Number(balance) / 1e6} USDC`)
  console.error('   Get test USDC from: https://faucet.circle.com (select Arc Testnet)')
  process.exit(1)
}

// Approve
console.log('Step 1: Approving USDC...')
const approveTx = await walletClient.writeContract({
  address: USDC_ADDRESS,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [GATEWAY_WALLET, amountBaseUnits],
})
await publicClient.waitForTransactionReceipt({ hash: approveTx })
console.log('Approved:', approveTx)

// Deposit
console.log('Step 2: Depositing into GatewayWallet...')
const depositTx = await walletClient.writeContract({
  address: GATEWAY_WALLET,
  abi: GATEWAY_ABI,
  functionName: 'deposit',
  args: [USDC_ADDRESS, amountBaseUnits],
})
await publicClient.waitForTransactionReceipt({ hash: depositTx })
console.log('Deposited:', depositTx)
console.log('')
console.log('Done! Agent can now spend up to', amountUSDC, 'USDC via Circle Gateway.')
