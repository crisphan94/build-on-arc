/**
 * Circle CCTP Bridge Kit integration for cross-chain USDC bridging
 * Using official @circle-fin/bridge-kit SDK as recommended by hackathon requirements
 */

import {
  BridgeKit,
  type BridgeResult,
  ArcTestnet,
  EthereumSepolia,
  AvalancheFuji,
  BaseSepolia,
  PolygonAmoy,
} from '@circle-fin/bridge-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { EIP1193Provider } from 'viem'

// Chain configurations for Bridge Kit
export const SUPPORTED_CHAINS = {
  'ethereum-sepolia': EthereumSepolia,
  'avalanche-fuji': AvalancheFuji,
  'base-sepolia': BaseSepolia,
  'polygon-amoy': PolygonAmoy,
  'arc-testnet': ArcTestnet,
} as const

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS

/**
 * Initialize Bridge Kit instance with default CCTP V2 provider
 */
function createBridgeKit() {
  return new BridgeKit()
}

/**
 * Bridge USDC from source chain to Arc Testnet using Circle Bridge Kit
 */
export async function bridgeToArc(
  sourceChainId: SupportedChainId,
  amount: string,
  recipientAddress: `0x${string}`,
  walletProvider: EIP1193Provider,
  onProgress?: (step: string, txHash?: string) => void,
): Promise<{ burnTx: string; mintTx: string }> {
  onProgress?.('Initializing Bridge Kit...')

  const bridgeKit = createBridgeKit()
  const sourceChain = SUPPORTED_CHAINS[sourceChainId]
  const destinationChain = SUPPORTED_CHAINS['arc-testnet']

  if (!walletProvider) {
    throw new Error('No wallet provider found')
  }

  onProgress?.('Creating adapter...')

  const adapter = await createViemAdapterFromProvider({
    provider: walletProvider,
  })

  bridgeKit.on('approve', (event) => {
    console.log('[Bridge Kit] Approve event:', event)
    onProgress?.('Approval complete', event.values.txHash as string)
  })

  bridgeKit.on('burn', (event) => {
    console.log('[Bridge Kit] Burn event:', event)
    onProgress?.('Burn complete on source chain', event.values.txHash as string)
  })

  bridgeKit.on('fetchAttestation', (event) => {
    console.log('[Bridge Kit] Attestation event:', event)
    onProgress?.('Waiting for Circle attestation...', undefined)
  })

  bridgeKit.on('mint', (event) => {
    console.log('[Bridge Kit] Mint event:', event)
    onProgress?.('Mint complete!', event.values.txHash as string)
  })

  onProgress?.('Executing bridge transfer...')

  try {
    const result: BridgeResult = await bridgeKit.bridge({
      from: {
        adapter,
        chain: sourceChain,
      },
      to: {
        adapter,
        chain: destinationChain,
        recipientAddress,
      },
      amount,
      token: 'USDC',
      config: {
        transferSpeed: 'FAST',
        batchTransactions: false,
      },
    })

    console.log('[Bridge Kit] Full result:', result)

    // Parse transaction hashes from steps array
    const burnStep = result.steps.find((step) => step.name.toLowerCase() === 'burn')
    const mintStep = result.steps.find((step) => step.name.toLowerCase() === 'mint')

    console.log('[Bridge Kit] Burn step:', burnStep)
    console.log('[Bridge Kit] Mint step:', mintStep)

    const burnTx = burnStep?.txHash || ''
    const mintTx = mintStep?.txHash || ''
    const mintState = mintStep?.state
    const mintError = mintStep?.errorMessage

    // Check if bridge completed successfully - must check mintStep.state!
    if (result.state === 'success' && burnTx && mintTx && mintState === 'success') {
      onProgress?.('Bridge complete! USDC minted on Arc Testnet', mintTx)
      return { burnTx, mintTx }
    }

    // Handle mint timeout error (Arc Testnet RPC slow)
    if (mintState === 'error' && mintError?.includes('Timed out')) {
      throw new Error(
        `Arc Testnet RPC timeout. Transaction submitted but confirmation is slow. Check tx manually: https://testnet.arcscan.app/tx/${mintTx}\n\nYour USDC may still arrive - Arc Testnet blocks are slow to mine. Wait 5-10 minutes and refresh balance.`,
      )
    }

    // Handle other mint errors
    if (mintState === 'error') {
      throw new Error(
        `Mint failed: ${mintError || 'Unknown error'}. Burn tx: ${burnTx}. Check attestation status.`,
      )
    }

    // Handle partial success (burn succeeded but mint pending/no tx yet)
    if (burnTx && !mintTx) {
      const currentMintState = mintStep?.state || 'pending'

      onProgress?.(`Burn complete, waiting for mint... (${currentMintState})`, burnTx)

      // If mint is still pending (common for CCTP - takes 15-20 min)
      if (currentMintState === 'pending') {
        throw new Error(
          'Bridge in progress. Burn successful, but Circle attestation is still pending (takes 15-20 minutes). Your USDC will arrive on Arc Testnet automatically.',
        )
      }

      // If mint failed with error
      throw new Error(
        `Burn succeeded but mint ${currentMintState}. ${mintError || 'Please contact support with burn tx: ' + burnTx}`,
      )
    }

    // Handle complete failure
    if (!burnTx) {
      throw new Error(
        `Bridge failed at ${result.steps.find((s) => s.state === 'error')?.name || 'unknown'} step`,
      )
    }

    return { burnTx, mintTx }
  } catch (error: any) {
    console.error('[Bridge Kit Error]', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      fullError: error,
    })

    const errorMsg = error?.message || String(error)
    const errorCode = error?.code

    // Handle user cancellation (MetaMask/OKX use code 4001, others use text patterns)
    if (
      errorCode === 4001 ||
      errorCode === 'ACTION_REJECTED' ||
      errorMsg.toLowerCase().includes('user rejected') ||
      errorMsg.toLowerCase().includes('user denied') ||
      errorMsg.toLowerCase().includes('cancelled') ||
      errorMsg.toLowerCase().includes('canceled') ||
      errorMsg.toLowerCase().includes('rejected by user')
    ) {
      throw new Error('Transaction cancelled by user')
    }

    if (errorMsg.includes('insufficient')) {
      throw new Error('Insufficient USDC balance')
    }

    if (errorMsg.includes('domain') || errorMsg.includes('not supported')) {
      throw new Error(
        `Bridge route not available. Try getting USDC directly from Circle Faucet: https://faucet.circle.com/ (select Arc Testnet)`,
      )
    }

    // Re-throw with original error
    throw new Error(`Bridge failed: ${errorMsg}`)
  }
}

// Export chain configs for component use
export { SUPPORTED_CHAINS as CCTP_CONTRACTS }
