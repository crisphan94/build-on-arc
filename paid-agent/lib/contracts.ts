// Arc Testnet contract addresses for Circle Gateway
export const ARC_TESTNET_CHAIN_ID = 5042002

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
export const GATEWAY_WALLET_ADDRESS = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const

export const GATEWAY_API_TESTNET = 'https://gateway-api-testnet.circle.com'

export const GATEWAY_BATCHING_NAME = 'GatewayWalletBatched'
export const GATEWAY_BATCHING_VERSION = '1'

// maxTimeoutSeconds in the payment requirements.
// Must be >= Circle's minValiditySeconds (604800 = 7 days) for Arc Testnet.
// Circle rejects if maxTimeoutSeconds < their minValiditySeconds.
export const GATEWAY_MAX_TIMEOUT_SECONDS = 7 * 24 * 60 * 60 // 604800 seconds

// Validity window signed into EIP-3009 authorization.
// Must be MUCH larger than GATEWAY_MAX_TIMEOUT_SECONDS so that even after
// the full client→server→Circle round-trip, validBefore - now >> maxTimeoutSeconds.
// Circle SDK uses 7 days; we use 30 days to eliminate any timing edge case.
export const GATEWAY_AUTH_VALIDITY_SECONDS = 30 * 24 * 60 * 60 // 2592000 seconds

export const GATEWAY_WALLET_ABI = [
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
  {
    name: 'availableBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'depositor', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    // Step 1 of trustless withdraw: locks amount, starts 7-day delay
    name: 'initiateWithdrawal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    // Step 2: callable after 7-day delay to complete withdrawal
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    name: 'withdrawableBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'depositor', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
