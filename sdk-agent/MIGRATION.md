# 🎯 Official Pattern Migration Guide

## Architecture: ERC-4337 Account Abstraction + Circle SDK

### **Flow Overview**

```
User (EOA) → Frontend → Backend API → Circle SDK → Smart Contract Wallet (SCW) → Arc AgentIdentity Contract
```

---

## 🔧 **Setup Requirements**

### **1. Circle Developer Account**

Sign up at: https://console.circle.com/

Get your credentials:

- `CIRCLE_API_KEY`
- `CIRCLE_ENTITY_SECRET`
- `CIRCLE_WALLET_SET_ID`

Update `.env.local`:

```env
CIRCLE_API_KEY=your_real_api_key
CIRCLE_ENTITY_SECRET=your_real_entity_secret
CIRCLE_WALLET_SET_ID=your_real_wallet_set_id
```

### **2. Arc Network Configuration**

Ensure Circle SDK supports Arc Testnet:

- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Contract: `0x8004A818BFB912233c491871b3d84c89A494BD9e`

---

## 📊 **Pattern Comparison**

### **Previous (Custom Contract)**

```typescript
User EOA → Backend Wallet → Custom Contract (0xd02f...) → NFT to EOA
```

- ❌ Not official pattern
- ❌ Simple safeMint
- ❌ EOA directly owns NFT

### **Official (Account Abstraction)**

```typescript
User EOA → Circle SDK → Smart Contract Wallet → Arc Contract (0x8004...) → NFT to SCW
```

- ✅ Official ERC-4337 pattern
- ✅ Smart Contract Wallet
- ✅ True gasless via bundler
- ✅ NFT owned by SCW (user controls via EOA)

---

## 🚀 **API Endpoints**

### **New: `/api/mint-agent-aa`**

Creates Smart Contract Wallet + Mints to Arc's official contract

```typescript
POST /api/mint-agent-aa
{
  "userAddress": "0x123...", // User's EOA
  "tokenURI": "ipfs://..."
}

Response:
{
  "success": true,
  "txHash": "0xabc...",
  "smartWalletAddress": "0xdef...", // SCW address
  "message": "Agent NFT minted to Smart Contract Wallet"
}
```

### **Old: `/api/mint-agent`** (deprecated)

Direct mint to EOA using custom contract

---

## ⚠️ **Important Notes**

### **Arc's Official Contract Restrictions**

The official contract `0x8004A818BFB912233c491871b3d84c89A494BD9e` may be:

- **Restricted to authorized minters only**
- Requires whitelisting
- Or Circle's sponsored transactions

### **Solutions:**

**Option A: Request Minter Role**
Contact Arc team to whitelist your backend wallet as authorized minter.

**Option B: Use Circle Sponsored Transactions**
Use Circle's paymaster to sponsor gas and submit via bundler:

```typescript
// Using Circle's transaction sponsorship
const userOp = await circleClient.createTransaction({
  userId,
  walletId,
  transaction: {
    to: ARC_OFFICIAL_CONTRACT,
    data: encodeFunctionData({
      abi: AGENT_IDENTITY_ABI,
      functionName: 'safeMint',
      args: [scwAddress, tokenURI],
    }),
  },
})
```

**Option C: Hybrid Approach**

- Use custom contract for minting (proven working)
- But create Smart Contract Wallet for user
- User owns NFT via SCW (AA benefits)
- Update contract address in frontend

---

## 🧪 **Testing**

### **Test Circle SDK Connection**

```bash
curl -X POST http://localhost:3000/api/test-circle \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x489522a4a8ecc94E3421A8605fBB57CfDED6A52f"}'
```

### **Test AA Mint**

```bash
curl -X POST http://localhost:3000/api/mint-agent-aa \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x489522a4a8ecc94E3421A8605fBB57CfDED6A52f",
    "tokenURI": "ipfs://test"
  }'
```

---

## 📝 **Migration Checklist**

- [x] Install Circle SDK packages
- [x] Create Smart Contract Wallet service
- [x] Create new AA mint endpoint
- [ ] Get Circle API credentials (user action required)
- [ ] Test wallet creation
- [ ] Request minter role from Arc team OR
- [ ] Implement Circle sponsored transactions
- [ ] Update frontend to use new endpoint
- [ ] Test end-to-end flow

---

## 🔗 **Resources**

- Circle Docs: https://developers.circle.com/w3s/docs/
- ERC-4337: https://eips.ethereum.org/EIPS/eip-4337
- Arc Network: https://docs.arc.network
- Permissionless.js: https://docs.pimlico.io/permissionless

---

## 🎯 **Current Status**

✅ Architecture implemented
✅ Smart Contract Wallet service ready
✅ AA mint endpoint created
⏳ Requires Circle API keys (user signup)
⏳ May require Arc minter role authorization
