# 🤖 Two Ways to Create AI Agent on Arc Testnet

This project demonstrates **TWO DIFFERENT APPROACHES** for registering AI Agents on Arc Network using the official AgentIdentity contract at `0x8004A818BFB912233c491871b3d84c89A494BD9e`.

---

## 🔵 Method 1: Circle Developer-Controlled Wallets

### Overview

Backend creates Smart Contract Wallets via Circle SDK. Circle manages private keys. Best for platforms/services creating agents on behalf of users.

### Use Cases

- ✅ Enterprise creating agents for customers
- ✅ Automated agent creation service
- ✅ Users without crypto wallets
- ❌ NFT stored in backend-managed Smart Contract Wallet

### How It Works

```
User Input → Backend API → Circle SDK → Smart Contract Wallet → register() → NFT minted to SCW
```

### Technical Flow

1. Backend calls Circle API to create Smart Contract Wallet (SCW)
2. Circle returns wallet address (e.g., `0x8d0f...cc8b`)
3. Backend calls `createContractExecutionTransaction()` to execute `register(metadataURI)`
4. Circle signs and broadcasts transaction
5. NFT is minted to the Smart Contract Wallet
6. **Important:** User does NOT own the NFT directly - it's in a Circle-managed wallet

### Pros

- ✅ Gasless for users (Circle pays gas)
- ✅ No crypto knowledge required
- ✅ Full backend control
- ✅ Batch operations possible

### Cons

- ❌ NFT not in user's personal wallet
- ❌ Limited ownership control (NFT in backend-managed wallet)
- ❌ User cannot transfer/sell NFT easily
- ❌ Dependent on Circle's service

### Code Example

```typescript
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'

// Create wallet
const wallet = await circleClient.createWallets({
  blockchains: ['ARC-TESTNET'],
  count: 1,
  walletSetId: process.env.CIRCLE_WALLET_SET_ID,
  accountType: 'SCA',
})

// Register agent
const tx = await circleClient.createContractExecutionTransaction({
  walletAddress: wallet.data.wallets[0].address,
  blockchain: 'ARC-TESTNET',
  contractAddress: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  abiFunctionSignature: 'register(string)',
  abiParameters: [metadataURI],
  fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
})
```

### API Endpoint

- `POST /api/mint-agent-official`
- Body: `{ "metadataURI": "ipfs://..." }`

### Example Transaction

https://testnet.arcscan.app/tx/0x0bc4ba39a78f79986762d4b876427c36fc5404e31c24e73a4f52b48685663b17

---

## 🟢 Method 2: User Direct Mint (Personal Wallet)

### Overview

User connects their personal wallet (MetaMask/RainbowKit), signs transaction directly. NFT goes to user's wallet. **Full ownership and control.**

### Use Cases

- ✅ **Full ownership** (NFT in personal wallet)
- ✅ Personal agent identity
- ✅ NFT trading/transfer capability
- ✅ Complete control over asset

### How It Works

```
User connects wallet → Upload metadata (backend) → User signs register() → NFT in user's wallet
```

### Technical Flow

1. User connects wallet via RainbowKit/Wagmi
2. Frontend uploads avatar + metadata to IPFS via backend API
3. Frontend calls `useWriteContract` with Arc's AgentIdentity contract
4. **User signs transaction** with their private key
5. Transaction broadcast to Arc Testnet
6. NFT minted to **user's personal wallet address**
7. User can view NFT in MetaMask with full ownership rights

### Pros

- ✅ NFT in user's personal wallet
- ✅ **Full ownership and control**
- ✅ User directly owns the agent identity
- ✅ Can trade/transfer NFT
- ✅ No dependency on Circle

### Cons

- ❌ User must pay gas (USDC on Arc)
- ❌ Requires crypto knowledge
- ❌ User must have USDC in wallet
- ❌ No batch operations

### Code Example

```typescript
import { useWriteContract } from 'wagmi'

const { writeContract } = useWriteContract()

// User signs and mints
writeContract({
  address: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  abi: ARC_OFFICIAL_ABI,
  functionName: 'register',
  args: [metadataURI],
})
```

### Frontend Component

- Component: `<UserMintForm />`
- User clicks "Create Agent"
- Wallet popup for signature
- NFT appears in user's wallet

### Example Transaction

Coming soon...

---

## 📊 Comparison Table

| Feature              | Method 1: Circle Developer | Method 2: User Direct  |
| -------------------- | -------------------------- | ---------------------- |
| **NFT Location**     | Smart Contract Wallet      | User's Personal Wallet |
| **Gas Payment**      | Circle pays                | User pays (USDC)       |
| **Ownership**        | ❌ Backend-managed         | ✅ Direct user control |
| **User Control**     | ❌ Limited                 | ✅ Full ownership      |
| **Crypto Knowledge** | Not required               | Required               |
| **Best For**         | Platforms/Services         | Personal ownership     |

---

## 🎯 Which Method Should You Use?

### Choose Method 1 (Circle Developer) if:

- You're building a platform creating agents for users
- Users don't have crypto wallets
- You want to cover gas costs
- NFT ownership not critical

### Choose Method 2 (User Direct) if:

- **Users need full ownership** 🔑
- Users should directly control their agent identity
- Users are crypto-native
- NFT trading/transfer needed

---

## 🚀 Getting Started

### Method 1 Setup

1. Create Circle account: https://console.circle.com
2. Get API key and entity secret
3. Create wallet set
4. Configure `.env.local`:
   ```bash
   CIRCLE_API_KEY=your_api_key
   CIRCLE_ENTITY_SECRET=your_secret
   CIRCLE_WALLET_SET_ID=your_wallet_set_id
   ```
5. Test: `curl -X POST http://localhost:3000/api/mint-agent-official`

### Method 2 Setup

1. Configure Arc Testnet in app
2. Get USDC from faucet
3. Connect wallet via RainbowKit
4. Fill form and sign transaction
5. NFT appears in your wallet

---

## 📝 Notes

- Both methods use the **same official contract**: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Both methods call the same function: `register(string uri)`
- Difference is **WHO signs the transaction** and **WHERE the NFT goes**

---

## 🔗 Resources

- Arc Network Docs: https://docs.arc.network
- Circle SDK Docs: https://developers.circle.com
- AgentIdentity Contract: https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e
