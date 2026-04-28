# Quick Agent: Frontend-First Approach 🎨

> **Difficulty:** ⭐⭐ Easy  
> **Time:** 2-3 hours  
> **Best For:** Beginners, quick prototypes, learning basics

A simple, beginner-friendly way to build AI Agents on Arc Network focusing on beautiful UI first, minimal smart contract logic.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- [pnpm](https://pnpm.io/) package manager
- MetaMask or compatible wallet
- Arc testnet USDC for gas ([Get from faucet](https://discord.com/invite/buildonarc))

### Installation

\`\`\`bash

# 1. Install dependencies

pnpm install

# 2. Copy environment variables

cp .env.example .env

# 3. Get WalletConnect Project ID (free)

# Visit: https://cloud.walletconnect.com

# Add to .env: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id

# 4. Start development server

pnpm dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your app! 🎉

## 📦 What's Included

### Frontend Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **RainbowKit** - Beautiful wallet connection UI
- **wagmi** - React hooks for Ethereum
- **lucide-react** - Modern icon library

### Smart Contract

- **SimpleAgentRegistry.sol** - Minimal registry contract (~130 lines)
  - Register agents with IPFS metadata
  - Update agent information
  - Query agents by owner
  - Deactivate agents

### Design System (UI/UX Pro Max)

- **Dark theme** - Professional slate color palette
- **Glassmorphism** - Modern frosted glass effects
- **Smooth animations** - 200ms transitions throughout
- **Typography** - Inter + Poppins font pairing
- **Accent colors** - Indigo (#6366f1) primary
- **Responsive** - Mobile-first design

## 🛠️ Development Workflow

### 1. Deploy Smart Contract

\`\`\`bash

# Add your private key to .env

echo "PRIVATE_KEY=your_private_key_here" >> .env

# Compile contract

npx hardhat compile

# Deploy to Arc Testnet

npx hardhat run scripts/deploy.ts --network arcTestnet

# Copy contract address to .env

echo "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x..." >> .env
\`\`\`

### 2. Setup IPFS (Pinata)

\`\`\`bash

# Get free API keys at: https://app.pinata.cloud

# Add to .env:

echo "NEXT_PUBLIC_PINATA_API_KEY=your_key" >> .env
echo "NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret" >> .env
\`\`\`

### 3. Implement Agent Creation

The basic structure is already set up in \`app/page.tsx\`. Next steps:

1. **Add IPFS upload** - Install \`@pinata/sdk\` for metadata storage
2. **Connect contract** - Use wagmi hooks to interact with registry
3. **Handle transactions** - Show loading states and transaction feedback
4. **Display agents** - Fetch and display registered agents

## 📁 Project Structure

\`\`\`
quick-agent/
├── app/
│ ├── layout.tsx # Root layout with providers & fonts
│ ├── page.tsx # Main landing page with agent form
│ └── globals.css # Global styles & design tokens
├── components/
│ ├── header.tsx # Navigation with wallet button
│ ├── providers.tsx # Web3 providers (Wagmi + RainbowKit)
│ └── ui/ # Reusable UI components
│ ├── button.tsx # Button with variants
│ ├── card.tsx # Card with glassmorphism
│ └── input.tsx # Form input component
├── contracts/
│ └── SimpleAgentRegistry.sol # Agent registry contract
├── lib/
│ ├── utils.ts # Utility functions (cn helper)
│ └── wagmi.ts # Arc Network configuration
└── scripts/
└── deploy.ts # Deployment script
\`\`\`

## 🎨 UI Components

### Button

\`\`\`tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="lg">Large Button</Button>
\`\`\`

### Card

\`\`\`tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Agent Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Agent details here...</p>
  </CardContent>
</Card>
\`\`\`

### Input

\`\`\`tsx
import { Input } from "@/components/ui/input";

<Input
placeholder="Enter agent name"
value={name}
onChange={(e) => setName(e.target.value)}
/>
\`\`\`

## 🔗 Arc Network Configuration

\`\`\`typescript
// lib/wagmi.ts
export const arcTestnetChain = {
id: 5042002,
name: "Arc Testnet",
nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
rpcUrls: {
default: { http: ["https://rpc.testnet.arc.network"] },
public: { http: ["https://rpc.testnet.arc.network"] },
},
blockExplorers: {
default: { name: "Arc Explorer", url: "https://testnet.arcscan.app" },
},
testnet: true,
};
\`\`\`

## 📝 Smart Contract ABI

After deploying, the contract ABI is available at:
\`\`\`
artifacts/contracts/SimpleAgentRegistry.sol/SimpleAgentRegistry.json
\`\`\`

Key functions:

- \`registerAgent(metadataURI)\` - Create new agent
- \`getAgent(agentId)\` - Get agent details
- \`getAgentsByOwner(address)\` - Get all agents by owner
- \`updateAgent(agentId, newMetadataURI)\` - Update metadata
- \`totalAgents()\` - Get total agent count

## 🧪 Testing

\`\`\`bash

# Run Hardhat tests

npx hardhat test

# Start local Hardhat node

npx hardhat node

# Deploy to local network (for testing)

npx hardhat run scripts/deploy.ts --network localhost
\`\`\`

## 🚀 Deployment

### Deploy to Production

\`\`\`bash

# Build Next.js app

pnpm build

# Deploy to Vercel (recommended)

vercel deploy

# Or deploy to any Node.js hosting

pnpm start
\`\`\`

### Environment Variables for Production

Make sure to set these in your hosting platform:

- \`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\`
- \`NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS\`
- \`NEXT_PUBLIC_PINATA_API_KEY\`
- \`NEXT_PUBLIC_PINATA_SECRET_KEY\`

## 📚 Learn More

- [Arc Network Docs](https://docs.arc.network)
- [Next.js Documentation](https://nextjs.org/docs)
- [RainbowKit Docs](https://rainbowkit.com)
- [wagmi Docs](https://wagmi.sh)
- [Hardhat Docs](https://hardhat.org)

## 🎯 Next Steps

1. **Complete IPFS integration** - Upload agent metadata to IPFS
2. **Add image upload** - Allow users to upload agent avatars
3. **Implement agent list** - Display all registered agents
4. **Add filtering** - Filter agents by owner/status
5. **Improve UX** - Add loading states, error handling, success toasts

## ⚡ Pro Tips

- Arc Network uses **USDC as gas token** (6 decimals, not 18!)
- Use **Pinata** for free IPFS hosting (100GB free tier)
- Test with **small amounts** first (~0.01 USDC per transaction)
- Join [Arc Discord](https://discord.com/invite/buildonarc) for support

## 🤝 Contributing

This is a teaching project! Feel free to:

- Open issues for bugs
- Submit PRs for improvements
- Share your deployed agents
- Help others in discussions

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details

---

**Happy Building! 🎉**

Need help? Join the [Arc Network Discord](https://discord.com/invite/buildonarc)
