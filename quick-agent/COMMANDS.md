# 📝 Command Cheatsheet - Quick Reference

> **Copy/paste commands để deploy nhanh**

---

## 🎯 **Setup Commands**

### **Thêm Arc Testnet vào MetaMask (JavaScript)**

Paste vào browser console (F12):

```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [
    {
      chainId: '0x4CE6D2',
      chainName: 'Arc Network Testnet',
      nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
      rpcUrls: ['https://rpc.testnet.arc.network'],
      blockExplorerUrls: ['https://testnet.arcscan.app'],
    },
  ],
})
```

---

## 🔧 **Project Setup**

```bash
# Navigate to project
cd /Users/phan.van.tanb/Desktop/build-on-arc/quick-agent

# Install dependencies
pnpm install

# Create .env.local
touch .env.local
```

---

## 📝 **Configure .env.local**

```bash
# Open in VS Code
code .env.local

# Or with nano
nano .env.local
```

Paste this content:

```bash
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_WC_PROJECT_ID=b7eeb3d9cfdb0a68a068962307d202e5
NEXT_PUBLIC_PINATA_API_KEY=f93bf5a30fce526d0296
PINATA_SECRET_KEY=649bb64672878b2652e4ecb74acda18458ac7244cdaa85d0bf5732c00520426f
DEPLOYER_PRIVATE_KEY=
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
```

---

## 🔑 **Add Private Key**

```bash
# Replace YOUR_PRIVATE_KEY with actual key from MetaMask
echo "DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY" >> .env.local
```

---

## 🚀 **Deploy Contract**

```bash
# Clean build artifacts (if needed)
rm -rf cache artifacts

# Compile contracts
npx hardhat compile

# Deploy to Arc Testnet
npx hardhat run scripts/deploy.js --network arcTestnet
```

**Expected output:**

```
🚀 Deploying SimpleAgentRegistry to Arc Testnet...
📝 Deployer address: 0x...
💰 Deployer balance: 10.0 USDC
⏳ Deploying contract...
✅ Contract deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Contract Address: 0xYOUR_CONTRACT_ADDRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📋 **Add Contract Address**

```bash
# Replace YOUR_CONTRACT_ADDRESS with deployed address
echo "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xYOUR_CONTRACT_ADDRESS" >> .env.local

# Or edit manually
code .env.local
```

---

## 🎯 **Start Application**

```bash
# Development mode
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

---

## 🔍 **Verify Deployment**

### **Check Contract on Explorer**

```bash
# Open in browser
open "https://testnet.arcscan.app/address/0xYOUR_CONTRACT_ADDRESS"
```

### **Read Contract Data (Hardhat Console)**

```bash
# Start Hardhat console
npx hardhat console --network arcTestnet
```

In console:

```javascript
// Get contract instance
const Registry = await ethers.getContractFactory('SimpleAgentRegistry')
const contract = await Registry.attach('0xYOUR_CONTRACT_ADDRESS')

// Get agent count
const count = await contract.getAgentCount()
console.log('Total agents:', count.toString())

// Get agent #0
const agent = await contract.getAgent(0)
console.log('Agent #0:', agent)

// Get my agents
const myAgents = await contract.getAgentsByOwner('0xYOUR_WALLET')
// Exit
console.log('My agents:', myAgents).exit
```

---

## 🧹 **Cleanup & Reset**

```bash
# Remove build artifacts
rm -rf cache artifacts .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Reset .env.local
rm .env.local
touch .env.local
```

---

## 📊 **Check Status**

```bash
# Check Node.js version
node --version  # Should be 20+

# Check pnpm version
pnpm --version  # Should be 10+

# Check Hardhat version
npx hardhat --version

# Check file exists
ls -la .env.local contracts/ scripts/

# View env variables (hide secrets)
cat .env.local | grep -v "PRIVATE_KEY\|SECRET"

# Count lines in contract
wc -l contracts/SimpleAgentRegistry.sol
```

---

## 🐛 **Debug Commands**

```bash
# View full Hardhat config
npx hardhat vars setup

# Test network connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc.testnet.arc.network

# Check gas price
npx hardhat run --network arcTestnet scripts/check-gas.js

# View logs
tail -f .next/trace
```

---

## 📦 **Package Scripts**

```bash
# From package.json
pnpm dev          # Start dev server (with Turbopack)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

---

## 🔐 **Security Commands**

```bash
# Check .gitignore includes .env.local
grep "\.env\.local" .gitignore

# View git status (ensure .env.local not tracked)
git status

# Remove .env.local from git if accidentally committed
git rm --cached .env.local
git commit -m "Remove .env.local from git"
```

---

## 🌐 **Open URLs**

```bash
# Local app
open http://localhost:3000

# Arc Testnet Explorer
open https://testnet.arcscan.app

# Arc Faucet
open https://faucet.arc.network

# Chainlist (add network)
open "https://chainlist.org/?search=arc&testnets=true"

# Arc Discord
open https://discord.com/invite/buildonarc

# Pinata Dashboard
open https://app.pinata.cloud
```

---

## 🎨 **Development Helpers**

```bash
# Format code
npx prettier --write "**/*.{js,ts,tsx,json,md}"

# Check TypeScript
npx tsc --noEmit

# Analyze bundle
pnpm build && npx @next/bundle-analyzer

# Clear Next.js cache
rm -rf .next

# Update dependencies
pnpm update --latest
```

---

## 📱 **One-Line Deploy**

```bash
# Complete deploy in one command (after .env.local configured)
cd quick-agent && \
  rm -rf cache artifacts && \
  npx hardhat compile && \
  npx hardhat run scripts/deploy.js --network arcTestnet && \
  echo "✅ Done! Copy contract address to .env.local"
```

---

## 🎯 **Quick Test Flow**

```bash
# 1. Start dev server
pnpm dev

# 2. Open browser
open http://localhost:3000

# 3. In browser console (F12):
console.log('Contract:', process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS)
console.log('Network:', process.env.NEXT_PUBLIC_CHAIN_ID)

# 4. Connect wallet and test create agent
```

---

## 📞 **Help Commands**

```bash
# Hardhat help
npx hardhat help
npx hardhat help run

# Next.js help
pnpm next --help

# View package.json scripts
cat package.json | jq '.scripts'

# List all files
tree -L 3 -I 'node_modules|.next|cache|artifacts'
```

---

## ✅ **Verification Checklist**

```bash
# Run all checks
echo "1. Checking Node.js..." && node --version && \
echo "2. Checking pnpm..." && pnpm --version && \
echo "3. Checking .env.local..." && test -f .env.local && echo "✅ Exists" || echo "❌ Missing" && \
echo "4. Checking contract..." && test -f contracts/SimpleAgentRegistry.sol && echo "✅ Exists" || echo "❌ Missing" && \
echo "5. Checking dependencies..." && test -d node_modules && echo "✅ Installed" || echo "❌ Not installed" && \
echo "6. All checks complete!"
```

---

**🚀 Copy/paste any command above để deploy nhanh!**
