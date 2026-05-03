# 🚀 Smart Contract Deployment Guide

Complete step-by-step guide to deploy SimpleAgentRegistry to Arc Testnet.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] MetaMask wallet installed
- [ ] Arc Testnet added to MetaMask
- [ ] Arc Testnet USDC (for gas fees)
- [ ] Private key exported from MetaMask
- [ ] Hardhat installed (already done via `pnpm add -D hardhat`)

---

## 🔧 STEP 1: Setup Arc Testnet in MetaMask

### Option A: Manual Setup

1. Open MetaMask
2. Click network dropdown → **Add Network** → **Add Network Manually**
3. Fill in details:

```
Network Name: Arc Testnet
RPC URL: https://rpc.testnet.arc.network
Chain ID: 5042002
Currency Symbol: USDC
Block Explorer: https://testnet.arcscan.app
```

4. Click **Save**

### Option B: Quick Add (Recommended)

Visit: https://chainlist.org/chain/5042002 and click "Add to MetaMask"

---

## 💰 STEP 2: Get Testnet USDC

1. Go to Arc Testnet Faucet (check Arc Discord for link)
2. Connect your wallet
3. Request testnet USDC (usually 1-10 USDC)
4. Wait for transaction to confirm (~30 seconds)

**Check balance:**

- Open MetaMask
- Switch to Arc Testnet
- You should see USDC balance

---

## 🔑 STEP 3: Export Private Key

⚠️ **SECURITY WARNING:**

- Never share your private key
- Never commit it to Git
- Only use testnet wallets for deployment
- Create a new wallet for deployment (recommended)

### Steps:

1. Open MetaMask
2. Click **⋮** (3 dots) → **Account Details**
3. Click **Show Private Key**
4. Enter your MetaMask password
5. Click to reveal → **Copy**

---

## 📝 STEP 4: Configure Environment Variables

Add your private key to `.env.local`:

```bash
# Arc Network (Already configured)
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# Deployer Private Key (ADD THIS)
DEPLOYER_PRIVATE_KEY=0x_your_private_key_here

# Pinata (Already configured)
NEXT_PUBLIC_PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Contract Address (Will be filled after deployment)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
```

⚠️ **Important:**

- Private key must start with `0x`
- Remove any spaces
- Keep `.env.local` in `.gitignore`

---

## 🛠️ STEP 5: Compile Contract

Before deploying, compile the smart contract:

```bash
npx hardhat compile
```

**Expected output:**

```
Compiled 1 Solidity file successfully
```

If you see errors, check:

- Solidity version matches (0.8.20)
- No syntax errors in `contracts/SimpleAgentRegistry.sol`

---

## 🚀 STEP 6: Deploy to Arc Testnet

Run the deployment script:

```bash
npx hardhat run scripts/deploy.js --network arcTestnet
```

**Expected output:**

```
🚀 Deploying SimpleAgentRegistry to Arc Testnet...

📝 Deployer address: 0x...
💰 Deployer balance: 10.0 ETH

⏳ Deploying contract...

✅ Contract deployed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Contract Address: 0xYourContractAddress...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Next steps:
1. Copy the contract address above
2. Add to .env.local:

   NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xYourContractAddress...

3. Restart your Next.js dev server:

   pnpm dev

🔍 View on Arc Explorer:
https://testnet.arcscan.app/address/0xYourContractAddress...

🔄 Verifying deployment...
✅ Contract is working! Agent count: 0
```

---

## ✅ STEP 7: Update Environment Variables

Copy the deployed contract address and add to `.env.local`:

```bash
# Arc Network
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# Deployer Private Key
DEPLOYER_PRIVATE_KEY=0x...

# Pinata
NEXT_PUBLIC_PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Contract Address (UPDATED)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xYourContractAddress...
```

---

## 🔄 STEP 8: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

---

## 🧪 STEP 9: Test Deployment

1. Go to http://localhost:3000
2. Connect your wallet (same wallet used for deployment)
3. Create a test agent:
   - Name: "Test Bot"
   - Description: "My first AI agent"
   - Upload an avatar (optional)
4. Click "Deploy Agent"
5. Confirm transaction in MetaMask
6. Wait for success modal
7. Click "View on Arc Explorer" to see transaction

---

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Contract address added to `.env.local`
- [ ] Dev server restarted
- [ ] Can connect wallet on frontend
- [ ] Can create agent successfully
- [ ] Transaction appears on Arc Explorer
- [ ] Success modal shows correct transaction hash
- [ ] No console errors in browser

---

## ❌ Troubleshooting

### Issue: "Insufficient funds"

**Solution:**

- Check Arc Testnet USDC balance in MetaMask
- Get more from faucet
- Ensure you're on Arc Testnet network

### Issue: "Invalid private key"

**Solution:**

- Ensure private key starts with `0x`
- No spaces or quotes
- Check if correct key from MetaMask

### Issue: "Network error"

**Solution:**

- Check internet connection
- Verify RPC URL: `https://rpc.testnet.arc.network`
- Try again (RPC might be temporarily down)

### Issue: "Contract not found"

**Solution:**

- Wait 30 seconds for deployment to propagate
- Refresh Arc Explorer
- Check if transaction succeeded

### Issue: Deployment succeeds but app doesn't work

**Solution:**

- Verify `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` is set correctly
- Restart Next.js dev server (`pnpm dev`)
- Clear browser cache
- Check browser console for errors

---

## 🔍 Verify Contract on Explorer

1. Go to https://testnet.arcscan.app
2. Paste your contract address in search
3. You should see:
   - Contract creation transaction
   - Contract code (after verification)
   - Transaction history

---

## 📊 Deployment Costs

Typical deployment costs on Arc Testnet:

- **Contract Deployment:** ~0.001-0.01 USDC
- **Creating Agent:** ~0.0001-0.001 USDC per agent
- **Total for Testing:** ~0.01-0.1 USDC

Get free testnet USDC from the faucet!

---

## 🎉 Success!

If you've reached this point, congratulations! You've successfully:

✅ Compiled a Solidity smart contract  
✅ Deployed to Arc Testnet  
✅ Verified deployment on explorer  
✅ Connected frontend to contract  
✅ Created your first on-chain AI agent

---

## 🚀 Next Steps

1. **Test creating multiple agents**
2. **Share contract address with friends** (they can use your deployed contract)
3. **Deploy to mainnet** (when Arc mainnet launches)
4. **Add more features** to the smart contract (transfer ownership, etc.)

---

## 📞 Need Help?

- **Arc Network Discord:** https://discord.com/invite/buildonarc
- **Hardhat Docs:** https://hardhat.org/docs
- **Arc Network Docs:** https://docs.arc.network

---

**Happy Deploying! 🚀**
