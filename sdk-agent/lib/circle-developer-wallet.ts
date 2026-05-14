import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'

// Circle Developer-Controlled Wallets Client
// Backend controls all wallets - simpler than user-controlled
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
})

export interface CreateWalletResult {
  address: string
  id: string
  blockchain: string
}

/**
 * Create Smart Contract Wallet on Arc Testnet
 * Developer-controlled = backend manages keys
 */
export async function createArcWallet(walletSetId: string): Promise<CreateWalletResult> {
  try {
    const response = await circleClient.createWallets({
      blockchains: ['ARC-TESTNET'],
      count: 1,
      walletSetId,
      accountType: 'SCA', // Smart Contract Account (ERC-4337)
    })

    const wallet = response.data?.wallets?.[0]
    if (!wallet) {
      throw new Error('No wallet created')
    }

    return {
      address: wallet.address!,
      id: wallet.id!,
      blockchain: 'ARC-TESTNET',
    }
  } catch (error: unknown) {
    console.error('Create Arc wallet error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create wallet')
  }
}

/**
 * Register AI Agent identity to Arc's AgentIdentity contract
 * Contract: 0x8004A818BFB912233c491871b3d84c89A494BD9e
 */
export async function registerAgentIdentity(
  walletAddress: string,
  metadataURI: string,
): Promise<string> {
  const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'

  try {
    // Execute register(string) on AgentIdentity contract
    const registerTx = await circleClient.createContractExecutionTransaction({
      walletAddress,
      blockchain: 'ARC-TESTNET',
      contractAddress: IDENTITY_REGISTRY,
      abiFunctionSignature: 'register(string)',
      abiParameters: [metadataURI],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    })

    const txId = registerTx.data?.id!

    // Poll for completion
    let txHash: string | undefined
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000))

      const { data } = await circleClient.getTransaction({ id: txId })

      if (data?.transaction?.state === 'COMPLETE') {
        txHash = data.transaction.txHash
        break
      }

      if (data?.transaction?.state === 'FAILED') {
        throw new Error('Registration transaction failed')
      }
    }

    if (!txHash) {
      throw new Error('Transaction timeout')
    }

    return txHash
  } catch (error: unknown) {
    console.error('Register agent error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to register agent')
  }
}

/**
 * Create wallet set for organizing wallets
 */
export async function createWalletSet(name: string): Promise<string> {
  try {
    const response = await circleClient.createWalletSet({ name })
    const walletSetId = response.data?.walletSet?.id

    if (!walletSetId) {
      throw new Error('No wallet set ID returned')
    }

    return walletSetId
  } catch (error: unknown) {
    console.error('Create wallet set error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create wallet set')
  }
}

export { circleClient }
