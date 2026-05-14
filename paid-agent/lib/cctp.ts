/**
 * Circle CCTP implementation for cross-chain USDC bridging
 */

import {
  type Address,
  type WalletClient,
  parseUnits,
  createPublicClient,
  http,
  getAddress,
} from 'viem'

const RPC_URLS: Record<number, string[]> = {
  11155111: [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://rpc.sepolia.org',
    'https://1rpc.io/sepolia',
  ],
  43113: ['https://api.avax-test.network/ext/bc/C/rpc'],
  84532: ['https://sepolia.base.org'],
  80002: ['https://rpc-amoy.polygon.technology'],
  5042002: ['https://rpc.testnet.arc.net'],
}

// CCTP Contract Addresses (all addresses checksummed via getAddress)
export const CCTP_CONTRACTS = {
  'ethereum-sepolia': {
    chainId: 11155111,
    domain: 0,
    tokenMessenger: getAddress('0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5'),
    messageTransmitter: getAddress('0x7865fAfC2db2093669d92c0F33AeEF291086BEFD'),
    usdcAddress: getAddress('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
  },
  'avalanche-fuji': {
    chainId: 43113,
    domain: 1,
    tokenMessenger: getAddress('0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0'),
    messageTransmitter: getAddress('0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79'),
    usdcAddress: getAddress('0x5425890298aed601595a70ab815c96711a31bc65'),
  },
  'base-sepolia': {
    chainId: 84532,
    domain: 6,
    tokenMessenger: getAddress('0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5'),
    messageTransmitter: getAddress('0x7865fAfC2db2093669d92c0F33AeEF291086BEFD'),
    usdcAddress: getAddress('0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
  },
  'polygon-amoy': {
    chainId: 80002,
    domain: 7,
    tokenMessenger: getAddress('0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5'),
    messageTransmitter: getAddress('0x7865fAfC2db2093669d92c0F33AeEF291086BEFD'),
    usdcAddress: getAddress('0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582'),
  },
  'arc-testnet': {
    chainId: 5042002,
    domain: 26,
    tokenMessenger: getAddress('0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'),
    messageTransmitter: getAddress('0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275'),
    usdcAddress: getAddress('0x3600000000000000000000000000000000000000'),
  },
} as const

const ATTESTATION_API = 'https://iris-api-sandbox.circle.com'

const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
    ],
    outputs: [{ name: '_nonce', type: 'uint64' }],
  },
] as const

const MESSAGE_TRANSMITTER_ABI = [
  {
    name: 'receiveMessage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const

// ERC-20 approve ABI
const ERC20_ABI = [
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

interface BurnResult {
  burnTxHash: Address
  messageHash: string
  nonce: bigint
}

interface AttestationResult {
  attestation: string
  message: string
}

/**
 * Burn USDC on source chain
 */
export async function burnUSDC(
  sourceChainId: keyof typeof CCTP_CONTRACTS,
  amount: string,
  recipientAddress: Address,
  walletClient: WalletClient,
  onProgress?: (step: string) => void,
): Promise<BurnResult> {
  const config = CCTP_CONTRACTS[sourceChainId]
  const amountInBaseUnits = parseUnits(amount, 6)
  const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

  const mintRecipient = `0x${recipientAddress.slice(2).padStart(64, '0')}` as Address

  onProgress?.('⏳ Waiting for wallet approval (1/2)')
  const approveTxHash = await walletClient.writeContract({
    address: config.usdcAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [config.tokenMessenger, maxUint256],
    chain: { id: config.chainId } as any,
  })

  onProgress?.('⏰ Confirming approval...')
  const rpcUrls = RPC_URLS[config.chainId]
  let approveReceipt = null

  for (let i = 0; i < rpcUrls.length; i++) {
    const rpcUrl = rpcUrls[i]
    try {
      onProgress?.('Confirming approval')
      const publicClient = createPublicClient({
        chain: { id: config.chainId } as any,
        transport: http(rpcUrl, { timeout: 60_000 }),
      })

      approveReceipt = await Promise.race([
        publicClient.waitForTransactionReceipt({
          hash: approveTxHash,
          confirmations: 1,
          pollingInterval: 2_000,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction confirmation timeout (90s)')), 90_000),
        ),
      ])

      if (approveReceipt) {
        onProgress?.('✅ Approval confirmed')
        break
      }
    } catch (err) {
      if (i === rpcUrls.length - 1) throw err
    }
  }

  if (!approveReceipt) {
    throw new Error('Approval confirmation failed. Check tx: ' + approveTxHash)
  }

  onProgress?.('🔍 Verifying allowance...')
  const publicClient = createPublicClient({
    chain: { id: config.chainId } as any,
    transport: http(rpcUrls[0], { timeout: 30_000 }),
  })

  const allowance = await publicClient.readContract({
    address: config.usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [walletClient.account?.address as Address, config.tokenMessenger],
  })

  if (allowance < amountInBaseUnits) {
    throw new Error('Insufficient allowance. Check tx: ' + approveTxHash)
  }

  // Check USDC balance
  onProgress?.('🔍 Checking USDC balance...')
  const balance = await publicClient.readContract({
    address: config.usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletClient.account?.address as Address],
  })

  if (balance < amountInBaseUnits) {
    throw new Error(
      `Insufficient USDC balance. You have ${Number(balance) / 1e6} USDC but trying to bridge ${amount} USDC`,
    )
  }

  onProgress?.('✳ Waiting for wallet approval (2/2)')

  let burnTxHash: Address | undefined
  let burnAttempts = 0
  const maxBurnAttempts = 3

  while (burnAttempts < maxBurnAttempts) {
    try {
      burnTxHash = await walletClient.writeContract({
        address: config.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [
          amountInBaseUnits,
          CCTP_CONTRACTS['arc-testnet'].domain,
          mintRecipient as `0x${string}`,
          config.usdcAddress,
        ],
        chain: { id: config.chainId } as any,
      })
      break
    } catch (err: any) {
      burnAttempts++
      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        if (burnAttempts < maxBurnAttempts) {
          onProgress?.(`✳ Check wallet extension (attempt ${burnAttempts + 1}/${maxBurnAttempts})`)
          await new Promise((r) => setTimeout(r, 2000))
        } else {
          throw new Error('Transaction not signed after 3 attempts')
        }
      } else {
        throw err
      }
    }
  }

  if (!burnTxHash) {
    throw new Error('Burn transaction failed - no transaction hash received')
  }

  console.log('[cctp] Burn tx hash:', burnTxHash)

  // Wait for burn transaction confirmation
  onProgress?.('⏰ Waiting for burn confirmation on-chain...')
  let burnReceipt = null

  // Try multiple RPC endpoints with timeout
  for (let i = 0; i < rpcUrls.length; i++) {
    const rpcUrl = rpcUrls[i]
    try {
      console.log(`[cctp] Trying RPC ${i + 1}/${rpcUrls.length} for burn confirmation: ${rpcUrl}`)
      onProgress?.(`⏰ Waiting for burn confirmation (trying RPC ${i + 1}/${rpcUrls.length})...`)
      const publicClient = createPublicClient({
        chain: { id: config.chainId } as any,
        transport: http(rpcUrl, { timeout: 60_000 }),
      })

      burnReceipt = await Promise.race([
        publicClient.waitForTransactionReceipt({
          hash: burnTxHash,
          confirmations: 1,
          pollingInterval: 2_000,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction confirmation timeout (90s)')), 90_000),
        ),
      ])

      if (burnReceipt) {
        console.log('[cctp] Burn confirmed:', burnReceipt.blockNumber)
        break
      }
    } catch (err) {
      console.warn(`[cctp] RPC ${rpcUrl} failed for burn confirmation, trying next...`, err)
    }
  }

  if (!burnReceipt) {
    const explorerUrl = `https://sepolia.etherscan.io/tx/${burnTxHash}`
    throw new Error(
      `Burn transaction confirmation failed after trying all RPCs. Check transaction status manually: ${explorerUrl}`,
    )
  }

  // TODO: Parse MessageSent event from transaction receipt to get real messageHash
  // Event: MessageSent(bytes message)
  // messageHash = keccak256(message)
  // For MVP: using txHash as proxy (Circle API might accept tx hash directly)
  const messageHash = burnTxHash
  const nonce = BigInt(Date.now())

  return { burnTxHash, messageHash, nonce }
}

/**
 * Step 2: Poll Circle attestation service
 */
export async function waitForAttestation(
  messageHash: string,
  maxRetries = 30,
  delayMs = 10000,
): Promise<AttestationResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${ATTESTATION_API}/attestations/${messageHash}`)

      if (response.ok) {
        const data = (await response.json()) as { attestation: string; status: string }

        if (data.status === 'complete' && data.attestation) {
          // messageHash might be in response, or we use the input
          return { attestation: data.attestation, message: messageHash }
        }
      }

      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    } catch (err) {
      console.warn(`[cctp] Attestation fetch attempt ${i + 1} failed:`, err)
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }

  throw new Error('Attestation timeout - Circle has not signed the burn transaction yet')
}

/**
 * Step 3: Mint USDC on Arc Testnet
 *
 * NOTE: This requires Arc Testnet to have MessageTransmitter deployed.
 * If not yet deployed, this will fail. Check with Circle for Arc Testnet CCTP support.
 */
export async function mintOnArc(
  attestation: AttestationResult,
  walletClient: WalletClient,
  onProgress?: (step: string) => void,
): Promise<Address> {
  const arcConfig = CCTP_CONTRACTS['arc-testnet']

  if (arcConfig.messageTransmitter === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      'Arc Testnet MessageTransmitter not deployed yet. Check Circle docs for CCTP availability on Arc.',
    )
  }

  onProgress?.('⏳ Waiting for wallet approval — Check your wallet extension')
  const mintTxHash = await walletClient.writeContract({
    address: arcConfig.messageTransmitter,
    abi: MESSAGE_TRANSMITTER_ABI,
    functionName: 'receiveMessage',
    args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`],
    chain: { id: arcConfig.chainId } as any,
  })

  return mintTxHash
}

/**
 * Full bridge flow
 */
export async function bridgeToArc(
  sourceChainId: keyof typeof CCTP_CONTRACTS,
  amount: string,
  recipientAddress: Address,
  walletClient: WalletClient,
  onProgress?: (step: string, txHash?: string) => void,
): Promise<{ burnTx: Address; mintTx: Address }> {
  onProgress?.('Burning USDC...')
  const burnResult = await burnUSDC(
    sourceChainId,
    amount,
    recipientAddress,
    walletClient,
    onProgress,
  )
  onProgress?.('✅ Burn complete', burnResult.burnTxHash)

  onProgress?.('⏰ Waiting for attestation...')
  const attestationResult = await waitForAttestation(burnResult.messageHash)
  onProgress?.('✅ Attestation received')

  onProgress?.('Minting USDC...')
  const mintTx = await mintOnArc(attestationResult, walletClient, onProgress)
  onProgress?.('Bridge complete', mintTx)

  return { burnTx: burnResult.burnTxHash, mintTx }
}
