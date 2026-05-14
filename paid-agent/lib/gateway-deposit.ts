import { createWalletClient, createPublicClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
  ARC_TESTNET_CHAIN_ID,
  USDC_ADDRESS,
  GATEWAY_WALLET_ADDRESS,
  GATEWAY_WALLET_ABI,
} from '@/lib/contracts'
import { getAgentAddress } from '@/lib/agent-wallet'

const arcTestnet = {
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
} as const

const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/**
 * Auto-deposit agent wallet balance into Gateway if needed
 * @param requiredAmount Amount needed in micro-USDC (e.g., 1000000 = 1 USDC)
 * @returns Gateway balance after deposit (in micro-USDC)
 */
export async function ensureGatewayBalance(requiredAmount: bigint): Promise<bigint> {
  const privateKey = process.env.AGENT_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('AGENT_PRIVATE_KEY required for auto-deposit')
  }

  // Normalize private key (same as agent-wallet.ts)
  const normalized = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`
  const account = privateKeyToAccount(normalized)
  const agentAddress = getAgentAddress()

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
  })

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  })

  console.log('[deposit] Checking gateway balance...')

  // Check current gateway balance
  const gatewayBalance = (await publicClient.readContract({
    address: GATEWAY_WALLET_ADDRESS,
    abi: GATEWAY_WALLET_ABI,
    functionName: 'availableBalance',
    args: [USDC_ADDRESS, agentAddress],
  })) as bigint

  console.log(
    '[deposit] Gateway balance:',
    gatewayBalance.toString(),
    'Required:',
    requiredAmount.toString(),
  )

  if (gatewayBalance >= requiredAmount) {
    console.log('[deposit] Sufficient gateway balance')
    return gatewayBalance
  }

  const needed = requiredAmount - gatewayBalance
  console.log('[deposit] Need to deposit:', needed.toString())

  // Check wallet balance
  const walletBalance = (await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [agentAddress],
  })) as bigint

  if (walletBalance < needed) {
    throw new Error(
      `Insufficient agent wallet balance. Need ${Number(needed) / 1_000_000} USDC, have ${Number(walletBalance) / 1_000_000} USDC`,
    )
  }

  // Check allowance
  const allowance = (await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [agentAddress, GATEWAY_WALLET_ADDRESS],
  })) as bigint

  console.log('[deposit] Current allowance:', allowance.toString())

  // Approve if needed
  if (allowance < needed) {
    console.log('[deposit] Approving USDC...')
    const approveTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [GATEWAY_WALLET_ADDRESS, needed],
    })
    console.log('[deposit] Approve tx:', approveTx)

    // Wait for approval
    await publicClient.waitForTransactionReceipt({ hash: approveTx })
    console.log('[deposit] Approved!')
  }

  // Deposit
  console.log('[deposit] Depositing into gateway...')
  const depositTx = await walletClient.writeContract({
    address: GATEWAY_WALLET_ADDRESS,
    abi: GATEWAY_WALLET_ABI,
    functionName: 'deposit',
    args: [USDC_ADDRESS, needed],
  })
  console.log('[deposit] Deposit tx:', depositTx)

  // Wait for deposit
  await publicClient.waitForTransactionReceipt({ hash: depositTx })
  console.log('[deposit] Deposit complete!')

  // Return new balance
  const newBalance = (await publicClient.readContract({
    address: GATEWAY_WALLET_ADDRESS,
    abi: GATEWAY_WALLET_ABI,
    functionName: 'availableBalance',
    args: [USDC_ADDRESS, agentAddress],
  })) as bigint

  console.log('[deposit] New gateway balance:', newBalance.toString())

  return newBalance
}
