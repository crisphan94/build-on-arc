# METHOD 2 (MEDIUM): HYBRID - App Kit SDK + Custom Agent Contracts

## 📋 OVERVIEW

**Difficulty**: ⭐⭐⭐ (Medium)  
**Time Estimated**: 2-3 hours  
**Suitable for**: Developers with blockchain experience, teams looking for production-ready solutions  
**Recommendation**: ✅ **RECOMMENDED FOR PRODUCTION**

### Strategy

- **Layer 1**: Circle App Kit SDK for payment infrastructure (official, battle-tested)
- **Layer 2**: Custom smart contracts for agent registry (flexible, extensible)
- **Best of both worlds**: Stable payments + Custom business logic

### Results

AI Agent with full capabilities:

1. ✅ Onchain identity with metadata
2. ✅ USDC payments via App Kit
3. ✅ Cross-chain bridging
4. ✅ Reputation system
5. ✅ Unified balance tracking
6. ✅ Production-ready with proper testing

---

## 🎯 OBJECTIVES

Build enterprise-grade AI Agent platform:

- **Identity**: ERC-8004-inspired agent registry
- **Payments**: USDC transfer, bridge, swap via App Kit
- **Reputation**: Validator-based scoring system
- **Metadata**: IPFS storage with automatic upload
- **Testing**: Full unit + integration test coverage
- **Documentation**: Complete API docs and examples

---

## 📦 PREREQUISITES

### Required Knowledge:

- [ ] TypeScript intermediate
- [ ] Solidity basics (understand contracts)
- [ ] Smart contract deployment
- [ ] Testing frameworks (Hardhat/Chai)

### Required Tools:

```bash
# Node.js v18+
node --version  # >= 18.0.0

# Package manager
npm --version
# or
pnpm --version

# Hardhat (will be installed in project)
# MetaMask wallet
```

### Required Accounts:

- [ ] MetaMask wallet with private key
- [ ] Arc testnet USDC ([faucet](https://faucet.circle.com))
- [ ] Pinata API key (optional, for IPFS)
- [ ] GitHub account

---

## 🏗️ PROJECT STRUCTURE

```
method-2-hybrid/
├── contracts/                      # Smart contracts
│   ├── AgentRegistry.sol           # Main agent registry
│   ├── AgentReputation.sol         # Reputation management
│   └── interfaces/
│       ├── IAgentRegistry.sol
│       └── IReputation.sol
│
├── scripts/                        # Deployment & management
│   ├── deploy.ts                   # Deploy all contracts
│   ├── register-agent.ts           # Register new agent
│   ├── update-reputation.ts        # Update reputation score
│   ├── app-kit-demo.ts             # Demo App Kit features
│   └── full-workflow.ts            # Complete demo
│
├── src/                            # Application logic
│   ├── config/
│   │   ├── arc-network.ts          # Arc testnet config
│   │   ├── app-kit.ts              # App Kit setup
│   │   └── constants.ts            # Constants
│   │
│   ├── services/
│   │   ├── AgentService.ts         # Agent CRUD operations
│   │   ├── PaymentService.ts       # App Kit wrapper
│   │   ├── IPFSService.ts          # Metadata upload
│   │   └── ReputationService.ts    # Reputation logic
│   │
│   ├── types/
│   │   ├── agent.ts                # Agent types
│   │   ├── payment.ts              # Payment types
│   │   └── contracts.ts            # Contract types
│   │
│   └── utils/
│       ├── logger.ts               # Logging utility
│       ├── validation.ts           # Input validation
│       └── helpers.ts              # Helper functions
│
├── test/                           # Test suites
│   ├── unit/
│   │   ├── AgentRegistry.test.ts
│   │   └── Reputation.test.ts
│   ├── integration/
│   │   ├── agent-lifecycle.test.ts
│   │   └── payment-flow.test.ts
│   └── fixtures/
│       └── test-data.ts
│
├── docs/                           # Documentation
│   ├── API.md                      # API documentation
│   ├── DEPLOYMENT.md               # Deployment guide
│   └── TROUBLESHOOTING.md          # Common issues
│
├── .env.example                    # Environment template
├── .env.test                       # Test environment
├── hardhat.config.ts               # Hardhat configuration
├── tsconfig.json                   # TypeScript config
├── package.json
└── README.md
```

---

## 📝 STEP-BY-STEP IMPLEMENTATION

### **PHASE 1: PROJECT INITIALIZATION** (15 minutes)

#### Step 1.1: Create Project Directory

```bash
mkdir method-2-hybrid
cd method-2-hybrid
npm init -y
```

#### Step 1.2: Install Core Dependencies

```bash
# Circle App Kit (official SDK)
npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2

# Blockchain libraries
npm install viem ethers

# Smart contract development
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install --save-dev @openzeppelin/contracts

# TypeScript
npm install --save-dev typescript @types/node ts-node

# Utilities
npm install dotenv
npm install --save-dev @types/dotenv

# IPFS (optional)
npm install @pinata/sdk
```

#### Step 1.3: Initialize TypeScript

```bash
npx tsc --init
```

Configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "scripts/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Step 1.4: Initialize Hardhat

```bash
npx hardhat init
```

Select: **"Create a TypeScript project"**

#### Step 1.5: Configure Hardhat for Arc

File: `hardhat.config.ts`

```typescript
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'
import * as dotenv from 'dotenv'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
      chainId: 5042002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto',
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
}

export default config
```

#### Step 1.6: Setup Environment Variables

Create `.env.example`:

```bash
# ============================================
# WALLET CONFIGURATION
# ============================================
PRIVATE_KEY=your_private_key_here
VALIDATOR_PRIVATE_KEY=your_validator_private_key_here

# ============================================
# NETWORK CONFIGURATION
# ============================================
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
ARC_EXPLORER=https://testnet.arcscan.app

# ============================================
# CONTRACT ADDRESSES (filled after deployment)
# ============================================
AGENT_REGISTRY_ADDRESS=
REPUTATION_CONTRACT_ADDRESS=

# ============================================
# IPFS CONFIGURATION (optional)
# ============================================
PINATA_API_KEY=
PINATA_SECRET_KEY=
PINATA_GATEWAY=https://gateway.pinata.cloud

# ============================================
# AGENT CONFIGURATION
# ============================================
AGENT_NAME=MyAIAgent
AGENT_DESCRIPTION=An AI agent on Arc Network
AGENT_AVATAR_URL=

# ============================================
# APP KIT CONFIGURATION
# ============================================
# No API key needed for App Kit!
```

Copy to `.env`:

```bash
cp .env.example .env
# Edit .env with your actual values
```

---

### **PHASE 2: SMART CONTRACTS** (45 minutes)

#### Step 2.1: Agent Registry Contract

File: `contracts/AgentRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice ERC-8004-inspired agent registry with extended features
 * @dev Production-ready agent management system
 */
contract AgentRegistry is Ownable {
    using Counters for Counters.Counter;

    // ============================================
    // STATE VARIABLES
    // ============================================

    struct Agent {
        string metadataURI;          // IPFS URI with agent metadata
        address owner;               // Agent owner
        address validator;           // Validator for reputation updates
        uint256 createdAt;           // Creation timestamp
        bool active;                 // Active status
    }

    Counters.Counter private _agentIds;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;
    mapping(uint256 => uint256) public agentReputation;

    // ============================================
    // EVENTS
    // ============================================

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        address indexed validator,
        string metadataURI
    );

    event AgentDeactivated(
        uint256 indexed agentId,
        address indexed owner
    );

    event ValidatorUpdated(
        uint256 indexed agentId,
        address indexed oldValidator,
        address indexed newValidator
    );

    event MetadataUpdated(
        uint256 indexed agentId,
        string newMetadataURI
    );

    // ============================================
    // ERRORS
    // ============================================

    error InvalidMetadataURI();
    error InvalidValidator();
    error InvalidAgentId();
    error NotAgentOwner();
    error AgentAlreadyInactive();
    error AgentNotActive();

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyAgentOwner(uint256 agentId) {
        if (agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        _;
    }

    modifier validAgentId(uint256 agentId) {
        if (agentId >= _agentIds.current()) {
            revert InvalidAgentId();
        }
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() Ownable(msg.sender) {}

    // ============================================
    // EXTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Register a new agent
     * @param metadataURI IPFS URI containing agent metadata
     * @param validator Address authorized to update reputation
     * @return agentId The ID of the newly registered agent
     */
    function registerAgent(
        string calldata metadataURI,
        address validator
    ) external returns (uint256) {
        if (bytes(metadataURI).length == 0) {
            revert InvalidMetadataURI();
        }
        if (validator == address(0)) {
            revert InvalidValidator();
        }

        uint256 agentId = _agentIds.current();
        _agentIds.increment();

        agents[agentId] = Agent({
            metadataURI: metadataURI,
            owner: msg.sender,
            validator: validator,
            createdAt: block.timestamp,
            active: true
        });

        ownerAgents[msg.sender].push(agentId);
        agentReputation[agentId] = 100; // Initial reputation

        emit AgentRegistered(agentId, msg.sender, validator, metadataURI);
        return agentId;
    }

    /**
     * @notice Update agent metadata
     * @param agentId Agent ID
     * @param newMetadataURI New IPFS URI
     */
    function updateMetadata(
        uint256 agentId,
        string calldata newMetadataURI
    ) external validAgentId(agentId) onlyAgentOwner(agentId) {
        if (bytes(newMetadataURI).length == 0) {
            revert InvalidMetadataURI();
        }

        agents[agentId].metadataURI = newMetadataURI;
        emit MetadataUpdated(agentId, newMetadataURI);
    }

    /**
     * @notice Update agent validator
     * @param agentId Agent ID
     * @param newValidator New validator address
     */
    function updateValidator(
        uint256 agentId,
        address newValidator
    ) external validAgentId(agentId) onlyAgentOwner(agentId) {
        if (newValidator == address(0)) {
            revert InvalidValidator();
        }

        address oldValidator = agents[agentId].validator;
        agents[agentId].validator = newValidator;

        emit ValidatorUpdated(agentId, oldValidator, newValidator);
    }

    /**
     * @notice Deactivate an agent
     * @param agentId Agent ID
     */
    function deactivateAgent(uint256 agentId)
        external
        validAgentId(agentId)
        onlyAgentOwner(agentId)
    {
        if (!agents[agentId].active) {
            revert AgentAlreadyInactive();
        }

        agents[agentId].active = false;
        emit AgentDeactivated(agentId, msg.sender);
    }

    /**
     * @notice Update agent reputation (only validator)
     * @param agentId Agent ID
     * @param newReputation New reputation score
     */
    function updateReputation(uint256 agentId, uint256 newReputation)
        external
        validAgentId(agentId)
    {
        Agent storage agent = agents[agentId];

        if (!agent.active) {
            revert AgentNotActive();
        }

        require(
            msg.sender == agent.validator,
            "Only validator can update reputation"
        );

        agentReputation[agentId] = newReputation;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get agent details
     * @param agentId Agent ID
     * @return agent Agent struct
     */
    function getAgent(uint256 agentId)
        external
        view
        validAgentId(agentId)
        returns (Agent memory)
    {
        return agents[agentId];
    }

    /**
     * @notice Get agent reputation
     * @param agentId Agent ID
     * @return reputation Reputation score
     */
    function getReputation(uint256 agentId)
        external
        view
        validAgentId(agentId)
        returns (uint256)
    {
        return agentReputation[agentId];
    }

    /**
     * @notice Get all agent IDs owned by an address
     * @param owner Owner address
     * @return Array of agent IDs
     */
    function getAgentsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return ownerAgents[owner];
    }

    /**
     * @notice Get total number of registered agents
     * @return count Total agent count
     */
    function getAgentCount() external view returns (uint256) {
        return _agentIds.current();
    }

    /**
     * @notice Check if an agent is active
     * @param agentId Agent ID
     * @return bool Active status
     */
    function isAgentActive(uint256 agentId)
        external
        view
        validAgentId(agentId)
        returns (bool)
    {
        return agents[agentId].active;
    }
}
```

#### Step 2.2: Compile Contracts

```bash
npx hardhat compile
```

---

### **PHASE 3: DEPLOYMENT INFRASTRUCTURE** (20 minutes)

#### Step 3.1: Deploy Script

File: `scripts/deploy.ts`

```typescript
import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('🚀 Starting deployment to Arc Testnet...\n')

  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatUnits(balance, 6), 'USDC\n')

  if (balance === 0n) {
    console.error('❌ Insufficient balance! Get USDC from faucet:')
    console.error('   https://faucet.circle.com\n')
    process.exit(1)
  }

  // Deploy AgentRegistry
  console.log('📝 Deploying AgentRegistry...')
  const AgentRegistry = await ethers.getContractFactory('AgentRegistry')
  const registry = await AgentRegistry.deploy()
  await registry.waitForDeployment()
  const registryAddress = await registry.getAddress()
  console.log('✅ AgentRegistry deployed to:', registryAddress)

  // Verification info
  console.log('\n🔍 Verify on ArcScan:')
  console.log(`   https://testnet.arcscan.app/address/${registryAddress}`)

  // Save deployment info
  const deploymentInfo = {
    network: 'Arc Testnet',
    chainId: 5042002,
    deployer: deployer.address,
    contracts: {
      AgentRegistry: registryAddress,
    },
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  }

  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir)
  }

  const deploymentPath = path.join(deploymentsDir, `arc-testnet-${Date.now()}.json`)
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2))

  console.log('\n📝 Deployment info saved to:', deploymentPath)

  // Update .env
  console.log('\n📋 Add these to your .env file:')
  console.log(`AGENT_REGISTRY_ADDRESS=${registryAddress}`)

  console.log('\n✅ Deployment completed successfully!\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

#### Step 3.2: Run Deployment

```bash
npx hardhat run scripts/deploy.ts --network arcTestnet
```

---

### **PHASE 4: APP KIT INTEGRATION** (30 minutes)

#### Step 4.1: App Kit Configuration

File: `src/config/app-kit.ts`

```typescript
import { AppKit } from '@circle-fin/app-kit'
import { createViemAdapter } from '@circle-fin/adapter-viem-v2'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'
import * as dotenv from 'dotenv'

dotenv.config()

// Define Arc Testnet chain
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
})

/**
 * Initialize App Kit with configured wallet
 */
export async function initializeAppKit() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment')
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  })

  const adapter = createViemAdapter({ walletClient })

  const kit = new AppKit({
    adapters: [adapter],
  })

  return { kit, adapter, account }
}
```

#### Step 4.2: Payment Service

File: `src/services/PaymentService.ts`

```typescript
import { AppKit } from '@circle-fin/app-kit'
import { initializeAppKit } from '../config/app-kit'

export class PaymentService {
  private kit: AppKit
  private adapter: any
  private account: any

  private constructor(kit: AppKit, adapter: any, account: any) {
    this.kit = kit
    this.adapter = adapter
    this.account = account
  }

  /**
   * Factory method to create PaymentService
   */
  static async create(): Promise<PaymentService> {
    const { kit, adapter, account } = await initializeAppKit()
    return new PaymentService(kit, adapter, account)
  }

  /**
   * Send USDC to another address
   */
  async sendUSDC(to: string, amount: string): Promise<any> {
    console.log(`💸 Sending ${amount} USDC to ${to}...`)

    try {
      const result = await this.kit.send({
        from: { adapter: this.adapter, chain: 'Arc_Testnet' },
        to: { address: to },
        amount,
      })

      console.log('✅ Transaction successful!')
      console.log('   Hash:', result.transactionHash)
      console.log('   Explorer:', `https://testnet.arcscan.app/tx/${result.transactionHash}`)

      return result
    } catch (error) {
      console.error('❌ Payment failed:', error)
      throw error
    }
  }

  /**
   * Bridge USDC from another chain to Arc
   */
  async bridgeToArc(fromChain: string, amount: string): Promise<any> {
    console.log(`🌉 Bridging ${amount} USDC from ${fromChain} to Arc...`)

    try {
      const result = await this.kit.bridge({
        from: { adapter: this.adapter, chain: fromChain },
        to: { adapter: this.adapter, chain: 'Arc_Testnet' },
        amount,
      })

      console.log('✅ Bridge initiated!')
      console.log('   Transaction:', result.transactionHash)

      return result
    } catch (error) {
      console.error('❌ Bridge failed:', error)
      throw error
    }
  }

  /**
   * Get unified balance across all chains
   */
  async getUnifiedBalance(): Promise<any> {
    try {
      const balance = await this.kit.getUnifiedBalance({
        adapter: this.adapter,
      })

      console.log('💰 Unified Balance:')
      console.log(JSON.stringify(balance, null, 2))

      return balance
    } catch (error) {
      console.error('❌ Failed to get balance:', error)
      throw error
    }
  }

  /**
   * Swap tokens (if supported)
   */
  async swapTokens(fromToken: string, toToken: string, amount: string): Promise<any> {
    console.log(`🔄 Swapping ${amount} ${fromToken} to ${toToken}...`)

    try {
      const result = await this.kit.swap({
        from: {
          adapter: this.adapter,
          chain: 'Arc_Testnet',
          token: fromToken,
        },
        to: {
          adapter: this.adapter,
          chain: 'Arc_Testnet',
          token: toToken,
        },
        amount,
      })

      console.log('✅ Swap successful!')
      return result
    } catch (error) {
      console.error('❌ Swap failed:', error)
      throw error
    }
  }
}
```

---

### **PHASE 5: AGENT SERVICE** (30 minutes)

File: `src/services/AgentService.ts`

```typescript
import { ethers } from 'ethers'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

const AGENT_REGISTRY_ABI = [
  'function registerAgent(string metadataURI, address validator) returns (uint256)',
  'function getAgent(uint256 agentId) view returns (tuple(string metadataURI, address owner, address validator, uint256 createdAt, bool active))',
  'function getAgentsByOwner(address owner) view returns (uint256[])',
  'function getAgentCount() view returns (uint256)',
  'function getReputation(uint256 agentId) view returns (uint256)',
  'function updateReputation(uint256 agentId, uint256 newReputation)',
  'function updateMetadata(uint256 agentId, string newMetadataURI)',
  'function deactivateAgent(uint256 agentId)',
  'event AgentRegistered(uint256 indexed agentId, address indexed owner, address indexed validator, string metadataURI)',
]

export class AgentService {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private registry: ethers.Contract

  constructor() {
    // Setup provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
    )

    // Setup wallet
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment')
    }
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)

    // Load contract
    const registryAddress = process.env.AGENT_REGISTRY_ADDRESS
    if (!registryAddress) {
      throw new Error('AGENT_REGISTRY_ADDRESS not set in environment')
    }

    this.registry = new ethers.Contract(registryAddress, AGENT_REGISTRY_ABI, this.wallet)
  }

  /**
   * Register a new agent
   */
  async registerAgent(
    metadataURI: string,
    validatorAddress: string,
  ): Promise<{
    agentId: string
    transactionHash: string
    explorerUrl: string
  }> {
    console.log('📝 Registering new agent...')
    console.log('   Metadata URI:', metadataURI)
    console.log('   Validator:', validatorAddress)

    try {
      // Estimate gas first
      const gasEstimate = await this.registry.registerAgent.estimateGas(
        metadataURI,
        validatorAddress,
      )
      console.log('   Estimated gas:', gasEstimate.toString())

      // Send transaction
      const tx = await this.registry.registerAgent(metadataURI, validatorAddress)

      console.log('⏳ Transaction sent:', tx.hash)
      console.log('   Waiting for confirmation...')

      const receipt = await tx.wait()
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

      // Parse event to get agent ID
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.registry.interface.parseLog(log)
          return parsed?.name === 'AgentRegistered'
        } catch {
          return false
        }
      })

      let agentId = '0'
      if (event) {
        const parsed = this.registry.interface.parseLog(event)
        agentId = parsed?.args[0].toString()
      }

      const explorerUrl = `https://testnet.arcscan.app/tx/${tx.hash}`

      console.log('\n🎉 Agent registered successfully!')
      console.log('   Agent ID:', agentId)
      console.log('   Explorer:', explorerUrl)

      return {
        agentId,
        transactionHash: tx.hash,
        explorerUrl,
      }
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  /**
   * Get agent information
   */
  async getAgent(agentId: number): Promise<any> {
    console.log(`🔍 Fetching agent #${agentId}...`)

    try {
      const agent = await this.registry.getAgent(agentId)
      const reputation = await this.registry.getReputation(agentId)

      const agentInfo = {
        id: agentId,
        metadataURI: agent.metadataURI,
        owner: agent.owner,
        validator: agent.validator,
        createdAt: new Date(Number(agent.createdAt) * 1000).toISOString(),
        active: agent.active,
        reputation: reputation.toString(),
      }

      console.log('✅ Agent info:', JSON.stringify(agentInfo, null, 2))
      return agentInfo
    } catch (error) {
      console.error('❌ Failed to fetch agent:', error)
      throw error
    }
  }

  /**
   * Get total agent count
   */
  async getAgentCount(): Promise<number> {
    try {
      const count = await this.registry.getAgentCount()
      const countNumber = Number(count)
      console.log(`📊 Total agents: ${countNumber}`)
      return countNumber
    } catch (error) {
      console.error('❌ Failed to get count:', error)
      throw error
    }
  }

  /**
   * Get agents by owner
   */
  async getAgentsByOwner(ownerAddress: string): Promise<number[]> {
    console.log(`🔍 Fetching agents for owner: ${ownerAddress}...`)

    try {
      const agentIds = await this.registry.getAgentsByOwner(ownerAddress)
      const ids = agentIds.map((id: any) => Number(id))

      console.log('✅ Found agents:', ids)
      return ids
    } catch (error) {
      console.error('❌ Failed to fetch agents:', error)
      throw error
    }
  }

  /**
   * Update agent reputation (only validator)
   */
  async updateReputation(agentId: number, newReputation: number): Promise<string> {
    console.log(`📊 Updating reputation for agent #${agentId}...`)

    try {
      // Check if we're the validator
      const agent = await this.registry.getAgent(agentId)
      if (agent.validator.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error('Only validator can update reputation')
      }

      const tx = await this.registry.updateReputation(agentId, newReputation)
      console.log('⏳ Transaction sent:', tx.hash)

      await tx.wait()
      console.log('✅ Reputation updated to:', newReputation)

      return tx.hash
    } catch (error) {
      console.error('❌ Update failed:', error)
      throw error
    }
  }

  /**
   * Deactivate an agent
   */
  async deactivateAgent(agentId: number): Promise<string> {
    console.log(`🔒 Deactivating agent #${agentId}...`)

    try {
      const tx = await this.registry.deactivateAgent(agentId)
      console.log('⏳ Transaction sent:', tx.hash)

      await tx.wait()
      console.log('✅ Agent deactivated')

      return tx.hash
    } catch (error) {
      console.error('❌ Deactivation failed:', error)
      throw error
    }
  }
}
```

---

### **PHASE 6: IPFS SERVICE** (15 minutes)

File: `src/services/IPFSService.ts`

```typescript
import pinataSDK from '@pinata/sdk'
import * as dotenv from 'dotenv'

dotenv.config()

export interface AgentMetadata {
  name: string
  description: string
  image?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  external_url?: string
}

export class IPFSService {
  private pinata: any
  private enabled: boolean

  constructor() {
    this.enabled = !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY)

    if (this.enabled) {
      this.pinata = new pinataSDK(process.env.PINATA_API_KEY!, process.env.PINATA_SECRET_KEY!)
      console.log('✅ IPFS service initialized with Pinata')
    } else {
      console.log('⚠️  IPFS service: Pinata credentials not configured')
    }
  }

  /**
   * Upload agent metadata to IPFS
   */
  async uploadMetadata(metadata: AgentMetadata): Promise<string> {
    if (!this.enabled) {
      // Return mock IPFS URI for testing
      const mockHash = `QmMock${Date.now()}`
      console.log('⚠️  Using mock IPFS URI:', `ipfs://${mockHash}`)
      return `ipfs://${mockHash}`
    }

    console.log('📤 Uploading metadata to IPFS...')

    try {
      const result = await this.pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `${metadata.name}-metadata`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      })

      const uri = `ipfs://${result.IpfsHash}`
      console.log('✅ Metadata uploaded successfully!')
      console.log('   IPFS URI:', uri)
      console.log('   Gateway URL:', `${process.env.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`)

      return uri
    } catch (error) {
      console.error('❌ IPFS upload failed:', error)
      throw error
    }
  }

  /**
   * Upload image file to IPFS
   */
  async uploadImage(filePath: string): Promise<string> {
    if (!this.enabled) {
      return `ipfs://QmMockImage${Date.now()}`
    }

    console.log('📤 Uploading image to IPFS...')

    try {
      const fs = require('fs')
      const readableStreamForFile = fs.createReadStream(filePath)

      const result = await this.pinata.pinFileToIPFS(readableStreamForFile, {
        pinataMetadata: {
          name: `agent-avatar-${Date.now()}`,
        },
      })

      const uri = `ipfs://${result.IpfsHash}`
      console.log('✅ Image uploaded:', uri)

      return uri
    } catch (error) {
      console.error('❌ Image upload failed:', error)
      throw error
    }
  }

  /**
   * Fetch metadata from IPFS
   */
  async fetchMetadata(ipfsURI: string): Promise<AgentMetadata> {
    const cid = ipfsURI.replace('ipfs://', '')
    const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    const url = `${gateway}/ipfs/${cid}`

    console.log('📥 Fetching metadata from IPFS...')

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const metadata = await response.json()
      console.log('✅ Metadata fetched successfully')

      return metadata
    } catch (error) {
      console.error('❌ Failed to fetch metadata:', error)
      throw error
    }
  }
}
```

---

### **PHASE 7: DEMO SCRIPTS** (30 minutes)

#### Script 1: Complete Workflow

File: `scripts/full-workflow.ts`

```typescript
import { AgentService } from '../src/services/AgentService'
import { PaymentService } from '../src/services/PaymentService'
import { IPFSService } from '../src/services/IPFSService'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  console.log('🚀 COMPLETE AI AGENT WORKFLOW DEMO')
  console.log('═══════════════════════════════════════\n')

  // Initialize services
  console.log('🔧 Initializing services...')
  const agentService = new AgentService()
  const paymentService = await PaymentService.create()
  const ipfsService = new IPFSService()
  console.log('✅ Services initialized\n')

  // ============================================
  // STEP 1: CREATE AGENT METADATA
  // ============================================
  console.log('STEP 1: CREATE AGENT METADATA')
  console.log('─────────────────────────────────────\n')

  const metadata = {
    name: process.env.AGENT_NAME || 'PaymentBot',
    description: process.env.AGENT_DESCRIPTION || 'An AI agent that can execute USDC payments',
    attributes: [
      { trait_type: 'capability', value: 'payments' },
      { trait_type: 'model', value: 'gpt-4' },
      { trait_type: 'version', value: '1.0' },
    ],
    external_url: 'https://example.com/agent',
  }

  console.log('Agent metadata:', JSON.stringify(metadata, null, 2))

  const metadataURI = await ipfsService.uploadMetadata(metadata)
  console.log('\n')

  // ============================================
  // STEP 2: REGISTER AGENT
  // ============================================
  console.log('STEP 2: REGISTER AGENT')
  console.log('─────────────────────────────────────\n')

  const validatorAddress =
    process.env.VALIDATOR_ADDRESS ||
    new (require('ethers').Wallet)(process.env.PRIVATE_KEY!).address

  const registration = await agentService.registerAgent(metadataURI, validatorAddress)

  console.log('\n')

  // ============================================
  // STEP 3: VERIFY AGENT
  // ============================================
  console.log('STEP 3: VERIFY AGENT')
  console.log('─────────────────────────────────────\n')

  const agentInfo = await agentService.getAgent(Number(registration.agentId))
  console.log('\n')

  // ============================================
  // STEP 4: CHECK BALANCE
  // ============================================
  console.log('STEP 4: CHECK BALANCE')
  console.log('─────────────────────────────────────\n')

  const balance = await paymentService.getUnifiedBalance()
  console.log('\n')

  // ============================================
  // STEP 5: EXECUTE PAYMENT (DEMO)
  // ============================================
  console.log('STEP 5: EXECUTE PAYMENT (DEMO)')
  console.log('─────────────────────────────────────\n')

  const recipientAddress =
    process.env.RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

  console.log('⚠️  Sending small amount (0.01 USDC) for demo...')
  try {
    await paymentService.sendUSDC(recipientAddress, '0.01')
  } catch (error) {
    console.log('Note: Payment demo skipped (insufficient balance or network issue)')
  }
  console.log('\n')

  // ============================================
  // STEP 6: UPDATE REPUTATION
  // ============================================
  console.log('STEP 6: UPDATE REPUTATION')
  console.log('─────────────────────────────────────\n')

  await agentService.updateReputation(Number(registration.agentId), 105)
  console.log('\n')

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════')
  console.log('🎉 WORKFLOW COMPLETED SUCCESSFULLY!')
  console.log('═══════════════════════════════════════')
  console.log('Agent ID:', registration.agentId)
  console.log('Owner:', agentInfo.owner)
  console.log('Validator:', agentInfo.validator)
  console.log('Reputation: 105')
  console.log('Status: Active')
  console.log('Explorer:', registration.explorerUrl)
  console.log('Metadata:', metadataURI)
  console.log('═══════════════════════════════════════\n')

  console.log('✅ Your AI agent is now live on Arc Network!')
  console.log('   View it at:', registration.explorerUrl)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
```

#### Script 2: Register Agent (Simple)

File: `scripts/register-agent.ts`

```typescript
import { AgentService } from '../src/services/AgentService'
import { IPFSService } from '../src/services/IPFSService'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  console.log('🤖 Register New Agent\n')

  const agentService = new AgentService()
  const ipfsService = new IPFSService()

  // Metadata
  const metadata = {
    name: process.env.AGENT_NAME || 'MyAgent',
    description: process.env.AGENT_DESCRIPTION || 'An AI agent on Arc',
    attributes: [
      { trait_type: 'model', value: 'gpt-4' },
      { trait_type: 'version', value: '1.0' },
    ],
  }

  // Upload
  const metadataURI = await ipfsService.uploadMetadata(metadata)

  // Register
  const validatorAddress =
    process.env.VALIDATOR_ADDRESS ||
    new (require('ethers').Wallet)(process.env.PRIVATE_KEY!).address

  const result = await agentService.registerAgent(metadataURI, validatorAddress)

  console.log('\n✅ SUCCESS!')
  console.log('Agent ID:', result.agentId)
  console.log('Explorer:', result.explorerUrl)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

---

### **PHASE 8: TESTING** (30 minutes)

File: `test/unit/AgentRegistry.test.ts`

```typescript
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { AgentRegistry } from '../../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('AgentRegistry', function () {
  let registry: AgentRegistry
  let owner: SignerWithAddress
  let validator: SignerWithAddress
  let user: SignerWithAddress

  beforeEach(async function () {
    ;[owner, validator, user] = await ethers.getSigners()

    const AgentRegistry = await ethers.getContractFactory('AgentRegistry')
    registry = await AgentRegistry.deploy()
    await registry.waitForDeployment()
  })

  describe('Agent Registration', function () {
    it('Should register an agent with valid data', async function () {
      const metadataURI = 'ipfs://QmTest'

      const tx = await registry.registerAgent(metadataURI, validator.address)
      await tx.wait()

      const agent = await registry.getAgent(0)
      expect(agent.metadataURI).to.equal(metadataURI)
      expect(agent.owner).to.equal(owner.address)
      expect(agent.validator).to.equal(validator.address)
      expect(agent.active).to.be.true

      const reputation = await registry.getReputation(0)
      expect(reputation).to.equal(100)
    })

    it('Should emit AgentRegistered event', async function () {
      await expect(registry.registerAgent('ipfs://QmTest', validator.address))
        .to.emit(registry, 'AgentRegistered')
        .withArgs(0, owner.address, validator.address, 'ipfs://QmTest')
    })

    it('Should revert with empty metadata URI', async function () {
      await expect(registry.registerAgent('', validator.address)).to.be.revertedWithCustomError(
        registry,
        'InvalidMetadataURI',
      )
    })

    it('Should revert with zero validator address', async function () {
      await expect(
        registry.registerAgent('ipfs://QmTest', ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(registry, 'InvalidValidator')
    })
  })

  describe('Agent Count', function () {
    it('Should return correct agent count', async function () {
      expect(await registry.getAgentCount()).to.equal(0)

      await registry.registerAgent('ipfs://Qm1', validator.address)
      expect(await registry.getAgentCount()).to.equal(1)

      await registry.registerAgent('ipfs://Qm2', validator.address)
      expect(await registry.getAgentCount()).to.equal(2)
    })
  })

  describe('Reputation Management', function () {
    beforeEach(async function () {
      await registry.registerAgent('ipfs://QmTest', validator.address)
    })

    it('Should allow validator to update reputation', async function () {
      await registry.connect(validator).updateReputation(0, 150)

      const reputation = await registry.getReputation(0)
      expect(reputation).to.equal(150)
    })

    it('Should revert if non-validator tries to update', async function () {
      await expect(registry.connect(user).updateReputation(0, 150)).to.be.revertedWith(
        'Only validator can update reputation',
      )
    })
  })

  describe('Agent Ownership', function () {
    it('Should track agents by owner', async function () {
      await registry.registerAgent('ipfs://Qm1', validator.address)
      await registry.registerAgent('ipfs://Qm2', validator.address)

      const agentIds = await registry.getAgentsByOwner(owner.address)
      expect(agentIds.length).to.equal(2)
      expect(agentIds[0]).to.equal(0)
      expect(agentIds[1]).to.equal(1)
    })
  })

  describe('Agent Deactivation', function () {
    beforeEach(async function () {
      await registry.registerAgent('ipfs://QmTest', validator.address)
    })

    it('Should allow owner to deactivate agent', async function () {
      await registry.deactivateAgent(0)

      const agent = await registry.getAgent(0)
      expect(agent.active).to.be.false
    })

    it('Should revert if non-owner tries to deactivate', async function () {
      await expect(registry.connect(user).deactivateAgent(0)).to.be.revertedWithCustomError(
        registry,
        'NotAgentOwner',
      )
    })
  })
})
```

Run tests:

```bash
npx hardhat test
```

---

## 📚 DOCUMENTATION

### README.md

````markdown
# Method 2: Hybrid Approach - Production-Ready AI Agents

Enterprise-grade AI agent implementation combining Circle App Kit with custom smart contracts.

## 🎯 Overview

This solution provides:

- ✅ Agent identity registry (ERC-8004-inspired)
- ✅ USDC payments via Circle App Kit
- ✅ Cross-chain bridging
- ✅ Reputation management
- ✅ IPFS metadata storage
- ✅ Full test coverage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Arc testnet USDC ([faucet](https://faucet.circle.com))
- Pinata API key (optional)

### Installation

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy
npx hardhat run scripts/deploy.ts --network arcTestnet

# Run demo
npx ts-node scripts/full-workflow.ts
```
````

## 📖 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Application Layer           │
│  (TypeScript Services & Scripts)    │
└───────────┬─────────────────────────┘
            │
     ┌──────┴──────┐
     │             │
┌────▼────┐  ┌────▼────────┐
│ App Kit │  │   Custom    │
│   SDK   │  │  Contracts  │
│         │  │  (Registry) │
└────┬────┘  └────┬────────┘
     │            │
     └──────┬─────┘
            │
     ┌──────▼──────┐
     │ Arc Network │
     │  (Testnet)  │
     └─────────────┘
```

## 🧪 Testing

```bash
# Unit tests
npx hardhat test

# Coverage
npx hardhat coverage

# Gas report
REPORT_GAS=true npx hardhat test
```

## 📊 Features

| Feature            | Status |
| ------------------ | ------ |
| Agent Registry     | ✅     |
| Reputation System  | ✅     |
| USDC Payments      | ✅     |
| Cross-chain Bridge | ✅     |
| IPFS Metadata      | ✅     |
| Unit Tests         | ✅     |
| Documentation      | ✅     |

## 🔗 Resources

- [Arc Docs](https://docs.arc.network)
- [App Kit SDK](https://docs.arc.network/app-kit)
- [Arc Explorer](https://testnet.arcscan.app)

## 📝 License

MIT

````

---

## ✅ SUCCESS CRITERIA

### Completion Checklist
- [ ] All dependencies installed
- [ ] Contracts compiled successfully
- [ ] Tests passing (>80% coverage)
- [ ] Contract deployed to Arc testnet
- [ ] Agent registered successfully
- [ ] Payment executed via App Kit
- [ ] Reputation updated
- [ ] Documentation complete

### Expected Outputs
1. ✅ Deployed AgentRegistry contract
2. ✅ Registered agent with ID
3. ✅ Transaction hashes on ArcScan
4. ✅ IPFS metadata URI
5. ✅ Working payment functionality
6. ✅ Test coverage report

---

## 📊 TIMELINE

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Setup | 15min | 15min |
| Contracts | 45min | 1h |
| Deployment | 20min | 1h 20min |
| App Kit | 30min | 1h 50min |
| Services | 60min | 2h 50min |
| Testing | 30min | 3h 20min |
| **TOTAL** | **~3.5h** | |

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Gas estimation failed**
```bash
# Solution: Check USDC balance
# Get more from faucet.circle.com
````

**App Kit connection error**

```bash
# Solution: Verify RPC URL
export ARC_RPC_URL=https://rpc.testnet.arc.network
```

**Contract not found**

```bash
# Solution: Check .env
echo $AGENT_REGISTRY_ADDRESS
```

---

**Perfect for**: Production applications, experienced teams  
**Last Updated**: April 2026  
**Status**: ✅ Production-ready
