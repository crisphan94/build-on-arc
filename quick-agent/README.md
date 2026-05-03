# 🤖 Quick Agent - AI Agent Deployment on Arc Network

> Deploy autonomous AI agents with verifiable on-chain identity on Arc Network Testnet

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![wagmi](https://img.shields.io/badge/wagmi-2.19.5-purple)](https://wagmi.sh/)
[![RainbowKit](https://img.shields.io/badge/RainbowKit-2.2.10-orange)](https://www.rainbowkit.com/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.4.2-yellow)](https://hardhat.org/)

## 🌟 Features

- **🚀 Quick Deployment**: Deploy AI agents in under 1 minute
- **🔗 On-Chain Identity**: Verifiable agent registry on Arc Network
- **📦 IPFS Storage**: Metadata and avatars stored on IPFS via Pinata
- **💰 Low Cost**: ~0.01 USDC gas cost per deployment
- **🎨 Modern UI**: Built with Tailwind CSS 4 + UI/UX Pro Max principles
- **🔐 Wallet Connect**: Easy wallet integration with RainbowKit

---

## 📁 Project Structure

```
quick-agent/
├── app/
│   ├── api/
│   │   ├── upload/          # IPFS avatar upload API
│   │   └── upload-metadata/ # IPFS metadata upload API
│   ├── globals.css          # Global styles + design system
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx             # Main landing page + agent creation
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── header.tsx           # Navigation + wallet connect
│   └── providers.tsx        # Web3 providers wrapper
├── contracts/
│   └── SimpleAgentRegistry.sol  # Smart contract
├── lib/
│   ├── contracts.ts         # Contract ABI + address
│   ├── utils.ts             # Utility functions
│   └── wagmi.ts             # Web3 configuration
├── scripts/
│   └── deploy.js            # Contract deployment script
├── hardhat.config.js        # Hardhat configuration
└── .env.local               # Environment variables
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- pnpm package manager
- MetaMask wallet with Arc Testnet configured
- Arc Testnet USDC for gas fees

### 1️⃣ Install Dependencies

```bash
pnpm install
```

### 2️⃣ Configure Environment Variables

Create `.env.local` file (see [ENV.md](./ENV.md) for details):

```bash
# Arc Network (Pre-configured)
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# WalletConnect (Optional)
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id

# Pinata IPFS (Required - Get from https://pinata.cloud)
NEXT_PUBLIC_PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key

# Contract Address (Fill after deployment)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
```

### 3️⃣ Deploy Smart Contract

**Step 1: Get Arc Testnet USDC**

Follow the [DEPLOYMENT.md](./DEPLOYMENT.md) guide to:

- Add Arc Testnet to MetaMask
- Get testnet USDC from faucet
- Export your private key

**Step 2: Add Private Key to `.env.local`**

```bash
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

**Step 3: Deploy Contract**

```bash
npx hardhat run scripts/deploy.js --network arcTestnet
```

**Step 4: Copy Contract Address**

After successful deployment, copy the contract address and add to `.env.local`:

```bash
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x1234...abcd
```

### 4️⃣ Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Documentation

| Document                                     | Description                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| [HUONG_DAN_DEPLOY.md](./HUONG_DAN_DEPLOY.md) | 🇻🇳 **Hướng dẫn deploy chi tiết bằng Tiếng Việt** (8 bước) |
| [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)         | ⚡ **Quick reference 5 phút** (cho người đã biết)         |
| [DEPLOYMENT.md](./DEPLOYMENT.md)             | Complete deployment guide (30+ steps, English)            |
| [ENV.md](./ENV.md)                           | Environment variables setup guide                         |
| [AVATAR_UPLOAD.md](./AVATAR_UPLOAD.md)       | Avatar upload feature documentation                       |

---

## 🔧 Tech Stack

### Frontend

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.2.4
- **UI Components**: Radix UI + shadcn/ui
- **Fonts**: Inter (body) + Poppins (headings)

### Web3

- **Wallet**: wagmi 2.19.5 + RainbowKit 2.2.10
- **Blockchain**: viem 2.48.4
- **Network**: Arc Testnet (Chain ID: 5042002)
- **Gas Token**: USDC (6 decimals)

### Smart Contracts

- **Framework**: Hardhat 3.4.2
- **Language**: Solidity 0.8.20
- **Network**: Arc Network Testnet

### Storage

- **IPFS**: Pinata Cloud
- **Metadata**: JSON on IPFS
- **Assets**: Images on IPFS

---

## 🎨 Design System

Built with **UI/UX Pro Max** principles:

- **Colors**: Dark theme (slate-950) with indigo accents
- **Typography**: Inter + Poppins from Google Fonts
- **Animations**: 200ms transitions with reduced motion support
- **Effects**: Glassmorphism, gradient backgrounds, backdrop blur
- **Interactions**: Focus-visible states, hover effects, active scaling

---

## 🧪 How It Works

### Frontend Flow

1. **User connects wallet** via RainbowKit
2. **Fills agent form** (name, description, avatar)
3. **Avatar upload** to Pinata IPFS (if provided)
4. **Metadata creation** (JSON with agent data)
5. **Metadata upload** to Pinata IPFS
6. **Smart contract call** (`createAgent`)
7. **Transaction confirmation** on Arc Network
8. **Success modal** with transaction hash

### Smart Contract

The `SimpleAgentRegistry` contract provides:

```solidity
// Create a new agent
function createAgent(
    string calldata name,
    string calldata description,
    string calldata avatarURI
) external returns (uint256)

// Get agent by ID
function getAgent(uint256 agentId)
    external view returns (Agent memory)

// Get agent count
function getAgentCount()
    external view returns (uint256)

// Get agents by owner
function getAgentsByOwner(address owner)
    external view returns (uint256[] memory)

// Deactivate agent (owner only)
function deactivateAgent(uint256 agentId) external
```

---

## 🧑‍💻 Development

### Build for Production

```bash
pnpm build
```

### Run Production Server

```bash
pnpm start
```

### Lint Code

```bash
pnpm lint
```

### Compile Contracts

```bash
npx hardhat compile
```

### Test Contracts (Coming Soon)

```bash
npx hardhat test
```

---

## 🌐 Network Configuration

### Arc Network Testnet

| Property              | Value                           |
| --------------------- | ------------------------------- |
| **Network Name**      | Arc Network Testnet             |
| **RPC URL**           | https://rpc.testnet.arc.network |
| **Chain ID**          | 5042002                         |
| **Currency Symbol**   | USDC                            |
| **Currency Decimals** | 6                               |
| **Block Explorer**    | https://testnet.arcscan.app     |

### Add to MetaMask

```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [
    {
      chainId: '0x4CE6D2', // 5042002 in hex
      chainName: 'Arc Network Testnet',
      nativeCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
      rpcUrls: ['https://rpc.testnet.arc.network'],
      blockExplorerUrls: ['https://testnet.arcscan.app'],
    },
  ],
})
```

---

## 🎯 API Endpoints

### POST `/api/upload`

Upload avatar image to IPFS via Pinata.

**Request**: `multipart/form-data` with `file` field

**Response**:

```json
{
  "success": true,
  "ipfsHash": "Qm...",
  "ipfsUrl": "ipfs://Qm...",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm..."
}
```

### POST `/api/upload-metadata`

Upload metadata JSON to IPFS via Pinata.

**Request**: `application/json`

```json
{
  "name": "Trading Bot Alpha",
  "description": "AI agent for trading",
  "image": "ipfs://Qm...",
  "createdAt": "2026-04-28T..."
}
```

**Response**:

```json
{
  "success": true,
  "ipfsHash": "Qm...",
  "ipfsUrl": "ipfs://Qm...",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm..."
}
```

---

## 🐛 Troubleshooting

### Contract Not Deployed

**Error**: `Contract not deployed yet. Please deploy the SimpleAgentRegistry contract first`

**Solution**: Deploy contract using `npx hardhat run scripts/deploy.js --network arcTestnet`

### Insufficient Funds

**Error**: `Insufficient funds for gas`

**Solution**: Get Arc Testnet USDC from faucet (see [DEPLOYMENT.md](./DEPLOYMENT.md))

### IPFS Upload Failed

**Error**: `Failed to upload to IPFS`

**Solution**: Check Pinata API keys in `.env.local` (see [ENV.md](./ENV.md))

### Wallet Not Connected

**Error**: `Please connect your wallet first`

**Solution**: Click "Connect Wallet" button in header and select MetaMask

---

## 📞 Support

- **Arc Network Docs**: https://docs.arc.network
- **Discord**: https://discord.com/invite/buildonarc
- **Twitter**: [@BuildOnArc](https://twitter.com/BuildOnArc)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 Roadmap

- [ ] Agent dashboard with list view
- [ ] Agent update functionality
- [ ] Agent transfer/ownership management
- [ ] Multiple network support
- [ ] Agent analytics
- [ ] IPFS metadata viewer
- [ ] Contract verification on Arc Explorer
- [ ] Unit tests for contracts
- [ ] E2E tests for frontend

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ on Arc Network**
