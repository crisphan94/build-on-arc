/**
 * SimpleAgentRegistry Contract ABI and Configuration
 * This file contains the contract ABI and address configuration
 */

/**
 * Contract ABI for SimpleAgentRegistry
 * Generated from contracts/SimpleAgentRegistry.sol
 */
export const AGENT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'createAgent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'avatarURI', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getAgent',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'avatarURI', type: 'string' },
          { name: 'owner', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getAgentCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getAgentsByOwner',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'deactivateAgent',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'agents',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'avatarURI', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'ownerToAgents',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'AgentCreated',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AgentDeactivated',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const

/**
 * Get contract address from environment
 * Will be populated after contract deployment
 */
export const getAgentRegistryAddress = (): `0x${string}` => {
  const address = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS
  if (!address) {
    throw new Error(
      'NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set in environment. Please deploy the contract first.',
    )
  }
  return address as `0x${string}`
}

/**
 * Agent type matching the contract struct
 */
export type Agent = {
  name: string
  description: string
  avatarURI: string
  owner: `0x${string}`
  createdAt: bigint
  active: boolean
}
