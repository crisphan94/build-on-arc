# ⚡ Quick Deploy - 5 Phút Deploy Contract

> **TL;DR**: Hướng dẫn siêu nhanh cho người đã biết cơ bản

---

## 🚀 **5 Lệnh Deploy (Copy & Paste)**

```bash
# 1. Thêm Arc Testnet vào MetaMask
# Visit: https://chainlist.org → Search "Arc Testnet" → Add

# 2. Lấy testnet USDC
# Visit: https://faucet.arc.network (hoặc Discord #testnet-faucet)

# 3. Export private key từ MetaMask
# MetaMask → Account Details → Show Private Key → Copy

# 4. Thêm private key vào .env.local
echo "DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere" >> .env.local

# 5. Deploy contract
npx hardhat run scripts/deploy.js --network arcTestnet

# 6. Copy contract address từ output và thêm vào .env.local
# Sau đó restart dev server
pnpm dev
```

---

## 📋 **Checklist Nhanh**

```
☐ MetaMask installed
☐ Arc Testnet added (Chain ID: 5042002)
☐ Wallet has testnet USDC (> 0.1 USDC)
☐ Private key exported
☐ .env.local configured:
  ├─ DEPLOYER_PRIVATE_KEY=0x...
  └─ NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x... (after deploy)
```

---

## 🎯 **Cấu Hình .env.local**

```bash
# Arc Network
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# WalletConnect (optional)
NEXT_PUBLIC_WC_PROJECT_ID=b7eeb3d9cfdb0a68a068962307d202e5

# Pinata IPFS
NEXT_PUBLIC_PINATA_API_KEY=f93bf5a30fce526d0296
PINATA_SECRET_KEY=649bb64672878b2652e4ecb74acda18458ac7244cdaa85d0bf5732c00520426f

# Deploy Keys (ĐIỀN VÀO ĐÂY)
DEPLOYER_PRIVATE_KEY=                        # Paste private key
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=          # Paste sau khi deploy
```

---

## 🌐 **Arc Testnet Info**

| Property     | Value                           |
| ------------ | ------------------------------- |
| **RPC**      | https://rpc.testnet.arc.network |
| **Chain ID** | 5042002 (0x4CE6D2 hex)          |
| **Symbol**   | USDC (6 decimals)               |
| **Explorer** | https://testnet.arcscan.app     |
| **Faucet**   | https://faucet.arc.network      |

---

## ⚠️ **Common Errors**

| Error                   | Fix                                        |
| ----------------------- | ------------------------------------------ |
| `insufficient funds`    | Get testnet USDC from faucet               |
| `invalid private key`   | Must start with `0x`, 66 chars total       |
| `network not found`     | Check `hardhat.config.js` has `arcTestnet` |
| `contract not deployed` | Run deploy script first                    |

---

## 🔗 **Useful Links**

- **Full Guide**: [HUONG_DAN_DEPLOY.md](./HUONG_DAN_DEPLOY.md)
- **Environment Setup**: [ENV.md](./ENV.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Arc Docs**: https://docs.arc.network
- **Arc Discord**: https://discord.com/invite/buildonarc

---

## 🎉 **Verify Deployment**

```bash
# Check contract on explorer
https://testnet.arcscan.app/address/0xYourContractAddress

# Test create agent
curl http://localhost:3000
# → Connect wallet → Fill form → Deploy Agent → Success! ✅
```

---

**Done! 🚀 Contract deployed và app sẵn sàng!**
