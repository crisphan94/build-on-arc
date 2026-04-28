# METHOD 1 (EASY): FRONTEND-FIRST - Web App with Minimal Smart Contract

## 📋 OVERVIEW

**Difficulty**: ⭐⭐ (Easy - Beginner Friendly)  
**Time**: 2-3 hours  
**Best for**: Frontend developers, blockchain beginners  
**Recommended**: ✅ **BEST FOR BEGINNERS** - Learn fast, see results immediately

### Strategy

- **Frontend Heavy**: Focus on UI/UX with Next.js
- **Minimal Smart Contract**: Just 1 simple contract (~100 lines)
- **No Complex SDK**: Use wagmi + RainbowKit (easy to learn)
- **Quick Results**: Deploy to Vercel in 1 click

### Results

A complete web app to:

- ✅ Connect wallet (MetaMask)
- ✅ Register AI agent with simple form
- ✅ Upload avatar to IPFS
- ✅ Display agent dashboard
- ✅ View agent details and transaction history

---

## 🎯 OBJECTIVES

Create web application with features:

1. ✅ Beautiful landing page
2. ✅ Wallet connection (1 click)
3. ✅ Agent creation form
4. ✅ Agent gallery/marketplace
5. ✅ Agent detail page
6. ✅ Responsive design (mobile + desktop)
7. ✅ Dark mode

---

## 📦 PREREQUISITES

### Required knowledge:

- [ ] Basic React/Next.js
- [ ] Basic TypeScript
- [ ] HTML/CSS/Tailwind
- [ ] **NOT REQUIRED** deep Solidity knowledge (just copy-paste)

### Tools to install:

```bash
# Node.js v18+
node --version

# npm or pnpm
npm --version

# MetaMask extension
```

### Required accounts:

- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] MetaMask wallet
- [ ] Arc testnet USDC (from faucet)
- [ ] (Optional) Pinata API key

---

## 🏗️ PROJECT STRUCTURE

```
method-1-easy/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── agents/
│   │   ├── page.tsx              # Agent gallery
│   │   ├── create/
│   │   │   └── page.tsx          # Create agent form
│   │   └── [id]/
│   │       └── page.tsx          # Agent detail page
│   └── api/
│       └── ipfs/
│           └── route.ts          # IPFS upload endpoint
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── dialog.tsx
│   ├── ConnectButton.tsx         # Wallet connect button
│   ├── AgentCard.tsx             # Agent card component
│   ├── CreateAgentForm.tsx       # Agent creation form
│   ├── AgentGallery.tsx          # Agent list view
│   └── AgentDetails.tsx          # Agent detail view
│
├── lib/                          # Utilities
│   ├── wagmi.ts                  # Wagmi configuration
│   ├── contracts.ts              # Contract ABIs & addresses
│   └── utils.ts                  # Helper functions
│
├── hooks/                        # Custom React hooks
│   ├── useAgentRegistry.ts       # Contract interactions
│   ├── useIPFS.ts                # IPFS upload hook
│   └── useAgents.ts              # Agent data fetching
│
├── contracts/                    # Smart contract (minimal)
│   └── SimpleAgentRegistry.sol   # 1 file, ~100 lines
│
├── public/                       # Static assets
│   ├── logo.svg
│   └── placeholder-agent.png
│
├── .env.local                    # Environment variables
├── hardhat.config.js             # For contract deployment only
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
└── package.json
```

---

## 📝 STEP-BY-STEP IMPLEMENTATION

### **PHASE 1: PROJECT SETUP** (15 minutes)

#### Step 1.1: Create Next.js Project

```bash
npx create-next-app@latest method-1-easy --typescript --tailwind --app
cd method-1-easy
```

Select options:

- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ `src/` directory: **No** (use app router directly)
- ✅ App Router
- ❌ import alias

#### Step 1.2: Install Dependencies

```bash
# Web3 dependencies
npm install wagmi viem @tanstack/react-query

# Wallet connection
npm install @rainbow-me/rainbowkit

# UI components (shadcn/ui)
npx shadcn-ui@latest init

# IPFS client (browser-compatible)
npm install ipfs-http-client

# Utils
npm install date-fns
```

#### Step 1.3: Install shadcn/ui Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
```

#### Step 1.4: Setup Environment Variables

Create `.env.local`:

```bash
# Contract (will be filled after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Arc Network
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# IPFS (optional)
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
PINATA_API_KEY=
PINATA_SECRET_KEY=

# App info
NEXT_PUBLIC_APP_NAME=Arc AI Agents
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### **PHASE 2: MINIMAL SMART CONTRACT** (20 minutes)

#### Step 2.1: Install Hardhat (for deployment only)

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# Select: Create an empty hardhat.config.js
```

#### Step 2.2: Simple Contract

File: `contracts/SimpleAgentRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleAgentRegistry
 * @notice Minimal agent registry for educational purposes
 * @dev Keep it simple for beginners to understand
 */
contract SimpleAgentRegistry {
    // Agent data structure
    struct Agent {
        string name;
        string description;
        string avatarURI;        // IPFS URI
        address owner;
        uint256 createdAt;
        bool active;
    }

    // Storage
    Agent[] public agents;
    mapping(address => uint256[]) public ownerToAgents;

    // Events
    event AgentCreated(
        uint256 indexed agentId,
        address indexed owner,
        string name
    );

    /**
     * @notice Create a new agent
     * @param name Agent name
     * @param description Agent description
     * @param avatarURI IPFS URI for avatar
     */
    function createAgent(
        string calldata name,
        string calldata description,
        string calldata avatarURI
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");

        uint256 agentId = agents.length;

        agents.push(Agent({
            name: name,
            description: description,
            avatarURI: avatarURI,
            owner: msg.sender,
            createdAt: block.timestamp,
            active: true
        }));

        ownerToAgents[msg.sender].push(agentId);

        emit AgentCreated(agentId, msg.sender, name);
        return agentId;
    }

    /**
     * @notice Get agent by ID
     */
    function getAgent(uint256 agentId)
        external
        view
        returns (Agent memory)
    {
        require(agentId < agents.length, "Invalid ID");
        return agents[agentId];
    }

    /**
     * @notice Get total number of agents
     */
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }

    /**
     * @notice Get agents by owner
     */
    function getAgentsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return ownerToAgents[owner];
    }

    /**
     * @notice Deactivate an agent
     */
    function deactivateAgent(uint256 agentId) external {
        require(agentId < agents.length, "Invalid ID");
        require(agents[agentId].owner == msg.sender, "Not owner");

        agents[agentId].active = false;
    }
}
```

**As simple as possible! Only 90 lines, easy to understand.**

#### Step 2.3: Hardhat Config

File: `hardhat.config.js`

```javascript
require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({ path: '.env.local' })

module.exports = {
  solidity: '0.8.20',
  networks: {
    arcTestnet: {
      url: 'https://rpc.testnet.arc.network',
      chainId: 5042002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
}
```

#### Step 2.4: Deploy Script

File: `scripts/deploy.js`

```javascript
const hre = require('hardhat')

async function main() {
  console.log('🚀 Deploying SimpleAgentRegistry...\n')

  const AgentRegistry = await hre.ethers.getContractFactory('SimpleAgentRegistry')
  const registry = await AgentRegistry.deploy()

  await registry.waitForDeployment()
  const address = await registry.getAddress()

  console.log('✅ Deployed to:', address)
  console.log('\n📝 Add this to .env.local:')
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)
  console.log('\n🔍 View on explorer:')
  console.log(`https://testnet.arcscan.app/address/${address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

#### Step 2.5: Deploy to Arc Testnet

```bash
# Add PRIVATE_KEY to .env.local first
npx hardhat run scripts/deploy.js --network arcTestnet

# Copy contract address to NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
```

---

### **PHASE 3: WAGMI SETUP** (20 minutes)

#### Step 3.1: Wagmi Configuration

File: `lib/wagmi.ts`

```typescript
import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

// Define Arc Testnet
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

// Wagmi config
export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  connectors: [injected({ target: 'metaMask' })],
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
```

#### Step 3.2: RainbowKit Configuration

File: `lib/rainbow.ts`

```typescript
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arcTestnet } from './wagmi'

export const rainbowConfig = getDefaultConfig({
  appName: 'Arc AI Agents',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from cloud.walletconnect.com
  chains: [arcTestnet],
  ssr: true, // For Next.js
})
```

#### Step 3.3: Contract ABI & Address

File: `lib/contracts.ts`

```typescript
export const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

export const AGENT_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'avatarURI', type: 'string' },
    ],
    name: 'createAgent',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'avatarURI', type: 'string' },
          { name: 'owner', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAgentCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getAgentsByOwner',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
    ],
    name: 'AgentCreated',
    type: 'event',
  },
] as const
```

---

### **PHASE 4: ROOT LAYOUT & PROVIDERS** (15 minutes)

#### Step 4.1: Root Layout

File: `app/layout.tsx`

```tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Arc AI Agents',
  description: 'Create and manage AI agents on Arc Network',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

#### Step 4.2: Providers Component

File: `app/providers.tsx`

```tsx
'use client'

import * as React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { rainbowConfig } from '@/lib/rainbow'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={rainbowConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

---

### **PHASE 5: CUSTOM HOOKS** (25 minutes)

#### Step 5.1: Agent Registry Hook

File: `hooks/useAgentRegistry.ts`

```typescript
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI } from '@/lib/contracts'

export function useAgentRegistry() {
  // Write operations
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Create agent
  const createAgent = async (name: string, description: string, avatarURI: string) => {
    return writeContract({
      address: AGENT_REGISTRY_ADDRESS,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'createAgent',
      args: [name, description, avatarURI],
    })
  }

  return {
    createAgent,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

// Get agent count
export function useAgentCount() {
  const { data, isLoading } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgentCount',
  })

  return {
    count: data ? Number(data) : 0,
    isLoading,
  }
}

// Get single agent
export function useAgent(agentId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgent',
    args: [BigInt(agentId)],
  })

  return {
    agent: data
      ? {
          name: data[0],
          description: data[1],
          avatarURI: data[2],
          owner: data[3],
          createdAt: data[4],
          active: data[5],
        }
      : null,
    isLoading,
    refetch,
  }
}

// Get agents by owner
export function useAgentsByOwner(ownerAddress?: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgentsByOwner',
    args: ownerAddress ? [ownerAddress] : undefined,
  })

  return {
    agentIds: data ? data.map((id) => Number(id)) : [],
    isLoading,
  }
}
```

#### Step 5.2: IPFS Upload Hook

File: `hooks/useIPFS.ts`

```typescript
import { useState } from 'react'

export function useIPFS() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ipfs', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { ipfsHash } = await response.json()
      return `ipfs://${ipfsHash}`
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadFile,
    isUploading,
    error,
  }
}
```

---

### **PHASE 6: UI COMPONENTS** (30 minutes)

#### Step 6.1: Navbar with Connect Button

File: `components/Navbar.tsx`

```tsx
'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Navbar() {
  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <Link href='/' className='text-2xl font-bold'>
          🤖 Arc Agents
        </Link>

        <div className='flex items-center gap-6'>
          <Link href='/agents' className='hover:text-blue-600'>
            Gallery
          </Link>
          <Link href='/agents/create' className='hover:text-blue-600'>
            Create Agent
          </Link>
          <ConnectButton />
        </div>
      </div>
    </nav>
  )
}
```

#### Step 6.2: Agent Card Component

File: `components/AgentCard.tsx`

```tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface AgentCardProps {
  agentId: number
  name: string
  description: string
  avatarURI: string
  owner: string
  createdAt: bigint
  active: boolean
}

export function AgentCard({
  agentId,
  name,
  description,
  avatarURI,
  owner,
  createdAt,
  active,
}: AgentCardProps) {
  const ipfsGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://ipfs.io/ipfs'
  const avatarUrl = avatarURI.replace('ipfs://', `${ipfsGateway}/`)

  return (
    <Link href={`/agents/${agentId}`}>
      <Card className='hover:shadow-lg transition-shadow cursor-pointer'>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <CardTitle className='flex items-center gap-2'>
                {name}
                {active && <Badge variant='default'>Active</Badge>}
              </CardTitle>
              <p className='text-sm text-muted-foreground'>#{agentId}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-sm mb-4 line-clamp-2'>{description}</p>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>
              By {owner.slice(0, 6)}...{owner.slice(-4)}
            </span>
            <span>
              {formatDistanceToNow(new Date(Number(createdAt) * 1000), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

#### Step 6.3: Create Agent Form

File: `components/CreateAgentForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAgentRegistry } from '@/hooks/useAgentRegistry'
import { useIPFS } from '@/hooks/useIPFS'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function CreateAgentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { createAgent, isPending, isSuccess } = useAgentRegistry()
  const { uploadFile, isUploading } = useIPFS()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Step 1: Upload avatar to IPFS
      let avatarURI = ''
      if (formData.avatar) {
        toast({ title: '📤 Uploading avatar to IPFS...' })
        avatarURI = await uploadFile(formData.avatar)
      }

      // Step 2: Create agent onchain
      toast({ title: '⏳ Creating agent onchain...' })
      await createAgent(formData.name, formData.description, avatarURI || 'ipfs://QmDefault')

      toast({
        title: '✅ Agent created successfully!',
        description: 'Redirecting to gallery...',
      })

      setTimeout(() => router.push('/agents'), 2000)
    } catch (error) {
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Failed to create agent',
        variant: 'destructive',
      })
    }
  }

  const isLoading = isPending || isUploading

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <Label htmlFor='name'>Agent Name *</Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder='e.g., Trading Bot Alpha'
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor='description'>Description *</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder='Describe what your agent does...'
          rows={4}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor='avatar'>Avatar Image (optional)</Label>
        <Input
          id='avatar'
          type='file'
          accept='image/*'
          onChange={(e) =>
            setFormData({
              ...formData,
              avatar: e.target.files?.[0] || null,
            })
          }
          disabled={isLoading}
        />
        <p className='text-sm text-muted-foreground mt-1'>PNG, JPG, GIF up to 5MB</p>
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Agent'}
      </Button>
    </form>
  )
}
```

---

### **PHASE 7: PAGES** (30 minutes)

#### Step 7.1: Landing Page

File: `app/page.tsx`

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className='container mx-auto px-4 py-16'>
        <div className='max-w-3xl mx-auto text-center space-y-8'>
          <h1 className='text-6xl font-bold'>
            Build AI Agents on <span className='text-blue-600'>Arc</span>
          </h1>

          <p className='text-xl text-muted-foreground'>
            Create, manage, and monetize autonomous AI agents on the Arc blockchain. Fast finality,
            USDC-native payments, and EVM compatibility.
          </p>

          <div className='flex gap-4 justify-center'>
            <Link href='/agents/create'>
              <Button size='lg'>Create Your Agent</Button>
            </Link>
            <Link href='/agents'>
              <Button size='lg' variant='outline'>
                Browse Gallery
              </Button>
            </Link>
          </div>

          <div className='grid grid-cols-3 gap-8 pt-12'>
            <div>
              <div className='text-4xl mb-2'>⚡</div>
              <h3 className='font-semibold mb-1'>Sub-second Finality</h3>
              <p className='text-sm text-muted-foreground'>Transactions confirm in milliseconds</p>
            </div>
            <div>
              <div className='text-4xl mb-2'>💵</div>
              <h3 className='font-semibold mb-1'>USDC Native</h3>
              <p className='text-sm text-muted-foreground'>Gas fees paid in stablecoins</p>
            </div>
            <div>
              <div className='text-4xl mb-2'>🔗</div>
              <h3 className='font-semibold mb-1'>EVM Compatible</h3>
              <p className='text-sm text-muted-foreground'>Use familiar tools and libraries</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
```

#### Step 7.2: Agent Gallery

File: `app/agents/page.tsx`

```tsx
'use client'

import { Navbar } from '@/components/Navbar'
import { AgentCard } from '@/components/AgentCard'
import { useAgentCount, useAgent } from '@/hooks/useAgentRegistry'
import { Skeleton } from '@/components/ui/skeleton'

export default function AgentsPage() {
  const { count, isLoading } = useAgentCount()

  return (
    <>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>Agent Gallery</h1>
          <p className='text-muted-foreground'>Browse {count} AI agents on Arc Network</p>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className='h-64' />
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: count }, (_, i) => (
              <AgentCardWrapper key={i} agentId={i} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function AgentCardWrapper({ agentId }: { agentId: number }) {
  const { agent, isLoading } = useAgent(agentId)

  if (isLoading || !agent) {
    return <Skeleton className='h-64' />
  }

  return <AgentCard agentId={agentId} {...agent} />
}
```

#### Step 7.3: Create Agent Page

File: `app/agents/create/page.tsx`

```tsx
'use client'

import { Navbar } from '@/components/Navbar'
import { CreateAgentForm } from '@/components/CreateAgentForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function CreateAgentPage() {
  const { isConnected } = useAccount()

  return (
    <>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>Create New Agent</CardTitle>
              <CardDescription>Deploy your AI agent on Arc blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <CreateAgentForm />
              ) : (
                <div className='text-center py-8'>
                  <p className='mb-4'>Connect your wallet to create an agent</p>
                  <ConnectButton />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
```

#### Step 7.4: Agent Detail Page

File: `app/agents/[id]/page.tsx`

```tsx
'use client'

import { use } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useAgent } from '@/hooks/useAgentRegistry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const agentId = parseInt(id)
  const { agent, isLoading } = useAgent(agentId)

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className='container mx-auto px-4 py-8'>
          <Skeleton className='h-96' />
        </main>
      </>
    )
  }

  if (!agent) {
    return (
      <>
        <Navbar />
        <main className='container mx-auto px-4 py-8'>
          <Card>
            <CardContent className='py-8 text-center'>
              <p>Agent not found</p>
              <Link href='/agents'>
                <Button className='mt-4'>Back to Gallery</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    )
  }

  const ipfsGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://ipfs.io/ipfs'
  const avatarUrl = agent.avatarURI.replace('ipfs://', `${ipfsGateway}/`)

  return (
    <>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <Link href='/agents'>
          <Button variant='ghost' className='mb-4'>
            ← Back to Gallery
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className='flex items-start gap-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={avatarUrl} alt={agent.name} />
                <AvatarFallback className='text-2xl'>{agent.name[0]}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <CardTitle className='text-3xl'>{agent.name}</CardTitle>
                  {agent.active && <Badge>Active</Badge>}
                </div>
                <p className='text-muted-foreground mb-4'>Agent #{agentId}</p>
                <p className='text-lg'>{agent.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Owner</p>
                <p className='font-mono'>{agent.owner}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Created</p>
                <p>{format(new Date(Number(agent.createdAt) * 1000), 'PPP')}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Metadata</p>
                <a
                  href={avatarUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:underline text-sm'
                >
                  View on IPFS
                </a>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Status</p>
                <p>{agent.active ? '✅ Active' : '❌ Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
```

---

### **PHASE 8: IPFS API ROUTE** (15 minutes)

File: `app/api/ipfs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { create } from 'ipfs-http-client'

// Initialize IPFS client (Pinata or Infura)
const projectId = process.env.PINATA_API_KEY
const projectSecret = process.env.PINATA_SECRET_KEY

const auth =
  projectId && projectSecret
    ? 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
    : undefined

const client = create({
  host: 'api.pinata.cloud',
  port: 5001,
  protocol: 'https',
  headers: auth ? { authorization: auth } : undefined,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to IPFS
    const result = await client.add(buffer)

    return NextResponse.json({
      ipfsHash: result.path,
      url: `ipfs://${result.path}`,
    })
  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

---

## ✅ TESTING & LAUNCH

### Step 1: Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Step 2: Test Flow

1. ✅ Connect MetaMask wallet
2. ✅ Switch to Arc Testnet
3. ✅ Navigate to "Create Agent"
4. ✅ Fill form and upload avatar
5. ✅ Submit transaction
6. ✅ View agent in gallery
7. ✅ Click on agent to view details

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

---

## 📚 DOCUMENTATION

### README.md

````markdown
# Arc AI Agents - Easy Method (Frontend-First)

Beautiful web app to create and manage AI agents on Arc Network.

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd method-1-easy
   npm install
   ```
````

2. **Deploy Contract**

   ```bash
   # Add PRIVATE_KEY to .env.local
   npx hardhat run scripts/deploy.js --network arcTestnet
   # Copy contract address to NEXT_PUBLIC_CONTRACT_ADDRESS
   ```

3. **Run Development**

   ```bash
   npm run dev
   ```

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## ✨ Features

- 🎨 Beautiful UI with Tailwind CSS & shadcn/ui
- 💼 One-click wallet connection (RainbowKit)
- 🤖 Simple agent creation form
- 🖼️ IPFS avatar upload
- 📊 Agent gallery with filters
- 📱 Fully responsive design
- 🌙 Dark mode support

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- wagmi + viem
- RainbowKit
- shadcn/ui
- IPFS (Pinata)

## 📖 Learn More

- [Arc Docs](https://docs.arc.network)
- [wagmi Docs](https://wagmi.sh)
- [RainbowKit](https://rainbowkit.com)

```

---

## 🎯 SUCCESS CRITERIA

### Checklist
- [ ] Contract deployed to Arc testnet
- [ ] Web app running locally
- [ ] Wallet connection working
- [ ] Agent creation successful
- [ ] Gallery displaying agents
- [ ] IPFS upload working
- [ ] App deployed to Vercel

### Expected Results
1. ✅ Working web application
2. ✅ Agent registration in < 2 seconds
3. ✅ Beautiful UI/UX
4. ✅ Mobile responsive
5. ✅ Production-ready deployment

---

## 📊 TIMELINE

| Phase | Time | Status |
|-------|------|--------|
| Setup | 15min | □ |
| Contract | 20min | □ |
| Wagmi | 20min | □ |
| Layout | 15min | □ |
| Hooks | 25min | □ |
| Components | 30min | □ |
| Pages | 30min | □ |
| API | 15min | □ |
| **TOTAL** | **~3h** | |

---

## 🐛 TROUBLESHOOTING

**Issue**: MetaMask not detecting Arc Testnet
**Fix**: Manually add network with chain ID 5042002

**Issue**: Transaction failed
**Fix**: Ensure you have USDC from faucet

**Issue**: IPFS upload slow
**Fix**: Use Pinata account for faster upload

**Issue**: Build error
**Fix**: Clear `.next` folder and rebuild

---

## 🔗 RESOURCES

- [Arc Faucet](https://faucet.circle.com)
- [Arc Explorer](https://testnet.arcscan.app)
- [Pinata](https://pinata.cloud)
- [shadcn/ui](https://ui.shadcn.com)

---

**Perfect for**: Beginners, hackathons, quick MVPs
**Last Updated**: April 2026
**Status**: ✅ Beginner-friendly & production-ready
```
