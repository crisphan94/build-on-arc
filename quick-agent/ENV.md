# Environment Variables Setup Guide

This guide will help you configure all the necessary environment variables for the Quick Agent application.

## 📋 Required Variables

### 1. Arc Network Configuration

These are already configured and ready to use:

```bash
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
```

**No action needed** - Arc Testnet configuration is included.

---

### 2. WalletConnect Project ID (Optional)

WalletConnect provides better wallet connection experience. To get your Project ID:

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or login
3. Create a new project
4. Copy your Project ID
5. Add to `.env.local`:

```bash
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id_here
```

**Note:** The app works without this, but you'll see warnings in the console.

---

### 3. Pinata API Keys (Required for IPFS)

Pinata is used to store agent metadata on IPFS. To get API keys:

1. Go to [Pinata Cloud](https://pinata.cloud/)
2. Sign up for a free account
3. Navigate to **API Keys** in the dashboard
4. Click **New Key**
5. Select the following permissions:
   - ✅ pinFileToIPFS
   - ✅ pinJSONToIPFS
6. Name it (e.g., "Arc Agents")
7. Copy both the **API Key** and **API Secret**
8. Add to `.env.local`:

```bash
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

---

### 4. Agent Registry Contract Address (Required after deployment)

This will be filled after you deploy the smart contract:

```bash
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x...
```

**Steps:**

1. Deploy the `SimpleAgentRegistry.sol` contract to Arc Testnet
2. Copy the deployed contract address
3. Paste it in `.env.local`

---

## 🛠️ Complete `.env.local` Template

Your final `.env.local` file should look like this:

```bash
# Arc Network (Pre-configured)
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# WalletConnect (Optional - Get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WC_PROJECT_ID=paste_your_project_id_here

# Pinata IPFS (Required - Get from https://pinata.cloud/)
NEXT_PUBLIC_PINATA_API_KEY=paste_your_api_key_here
PINATA_SECRET_KEY=paste_your_secret_here

# Contract Address (Fill after deployment)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x...
```

---

## ✅ Verification Checklist

After setting up all variables:

- [ ] Arc Network RPC is configured (default: ✅)
- [ ] WalletConnect Project ID added (optional but recommended)
- [ ] Pinata API Key obtained and added
- [ ] Pinata Secret Key obtained and added
- [ ] Smart contract deployed to Arc Testnet
- [ ] Contract address added to `.env.local`
- [ ] Restart Next.js dev server (`pnpm dev`)

---

## 🔒 Security Notes

⚠️ **IMPORTANT:**

- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Never share your Pinata Secret Key publicly
- Keep your WalletConnect Project ID private
- Contract addresses are public (safe to share)

---

## 🚀 Next Steps

Once all environment variables are configured:

1. Restart your development server:

   ```bash
   pnpm dev
   ```

2. Test the application:
   - Connect your wallet (MetaMask with Arc Testnet)
   - Ensure you have USDC on Arc Testnet
   - Try creating an agent

3. Check console for any missing variable warnings

---

## 📞 Need Help?

- **Arc Network Docs:** https://docs.arc.network
- **WalletConnect Docs:** https://docs.walletconnect.com
- **Pinata Docs:** https://docs.pinata.cloud
- **Discord:** https://discord.com/invite/buildonarc

---

## 🎯 Quick Reference

| Variable                             | Required | Where to Get                                               |
| ------------------------------------ | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_CHAIN_ID`               | ✅       | Pre-configured                                             |
| `NEXT_PUBLIC_RPC_URL`                | ✅       | Pre-configured                                             |
| `NEXT_PUBLIC_WC_PROJECT_ID`          | Optional | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_PINATA_API_KEY`         | ✅       | [pinata.cloud](https://pinata.cloud)                       |
| `PINATA_SECRET_KEY`                  | ✅       | [pinata.cloud](https://pinata.cloud)                       |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | ✅       | After contract deployment                                  |

---

**Happy Building! 🚀**
