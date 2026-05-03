# 🚀 Quick Deploy Guide (TL;DR)

**Mục tiêu:** Deploy smart contract `SimpleAgentRegistry.sol` lên Arc Testnet trong 5 phút.

---

## ⚡ Quick Steps

```bash
# 1. Export private key từ MetaMask
#    Account Details → Show Private Key → Copy

# 2. Thêm vào .env.local
DEPLOYER_PRIVATE_KEY=0x_your_private_key_here

# 3. Compile contract
npx hardhat compile

# 4. Deploy to Arc Testnet
npx hardhat run scripts/deploy.js --network arcTestnet

# 5. Copy contract address từ output
# 6. Paste vào .env.local
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xYourContractAddress

# 7. Restart dev server
pnpm dev
```

---

## 📋 Checklist trước khi deploy:

- [ ] Có Arc Testnet USDC trong wallet (get from faucet)
- [ ] Đã add Arc Testnet vào MetaMask
- [ ] Đã export private key từ MetaMask
- [ ] Đã thêm `DEPLOYER_PRIVATE_KEY` vào `.env.local`

---

## 🎯 Output khi thành công:

```
✅ Contract deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Contract Address: 0x123...abc
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Copy address `0x123...abc` và paste vào `.env.local`

---

## 📚 Chi tiết đầy đủ:

Xem [DEPLOYMENT.md](./DEPLOYMENT.md) để có hướng dẫn từng bước với screenshots và troubleshooting.

---

## ⚠️ Lỗi thường gặp:

**"Insufficient funds"**
→ Get more USDC from Arc Testnet faucet

**"Invalid private key"**
→ Đảm bảo có `0x` ở đầu và không có space

**"Network error"**
→ Check internet, thử lại sau vài giây

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) or Discord: https://discord.com/invite/buildonarc
