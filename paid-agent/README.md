# AgentPay — AI Agentic Economy on Arc Testnet

> **Stablecoins Commerce Stack Challenge — Track 4: Best Agentic Economy Experience on Arc**
> Prize: $4,000 USDC (1st) / $2,000 USDC (2nd)

An autonomous AI agent that researches, decides, and **pays for every answer** using USDC nanopayments on Arc Testnet — powered by Circle Gateway, Circle Developer-Controlled Wallets, and the x402 protocol.

---

## What It Does

1. User types a natural language question (crypto prices, weather, code review, translation, etc.)
2. Agent autonomously selects the right paid API tool
3. Agent signs an EIP-3009 payment authorization **server-side** (no MetaMask popup)
4. Circle Gateway settles the micropayment on Arc Testnet
5. Agent receives real data and answers the user
6. Every answer costs $1 USDC — deducted from a pre-set budget

---

## For Hackathon Judges — Intentional Limitations

To avoid confusion during code review:

**✅ Production-ready components:**

- x402 payment flow → real Circle Gateway settlement on Arc Testnet
- EIP-3009 authorization → real EIP-712 signatures (MetaMask + viem)
- Agent payment loop → real Groq LLM tool calls, real USDC deductions
- All data APIs → real (CoinGecko, Open-Meteo, Groq)

**⚠️ Intentional limitations (pending external dependencies):**

- **CCTP Bridge** (`components/cctp-bridge-card.tsx`) → **Real Circle CCTP implementation** using burn-and-mint protocol. Code calls real contracts (`TokenMessenger.depositForBurn` + `MessageTransmitter.receiveMessage`). **Will fail until Circle deploys CCTP on Arc Testnet** (MessageTransmitter contract + domain ID assignment). When Circle adds Arc Testnet support → bridge works immediately without code changes.
- **Circle HSM signing fallback** (`lib/circle-wallet.ts`) → Code attempts Circle Developer-Controlled Wallets HSM signing first. Circle API currently returns "API parameter invalid" for Arc Testnet (chain 5042002 not yet whitelisted). **Automatic fallback to raw key signing produces identical EIP-3009 authorization.** When Circle adds Arc Testnet support → will automatically use HSM with zero code changes.
- **Global payment ticker** (`lib/global-payments.ts`) → in-memory store (resets on restart). Simplifies demo, production path is 10 lines of DB code.

See `DEMO_GUIDE.md` section 9 for full technical details.

---

## Circle Products Used

| Product                                 | How Used                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Circle Gateway + Nanopayments**       | x402 HTTP payment protocol — agent pays $1 USDC per API call, settled on Arc Testnet via `BatchFacilitatorClient`                             |
| **Circle Developer-Controlled Wallets** | Agent's private key managed by Circle HSM via `@circle-fin/developer-controlled-wallets` — signs EIP-712 typed data without exposing raw keys |
| **USDC on Arc Testnet**                 | Settlement rail for all agent-executed payments (Chain ID 5042002)                                                                            |
| **CCTP + Bridge Kit**                   | UI for cross-chain USDC deposit to Arc Testnet from ETH Sepolia, AVAX Fuji, Base Sepolia, Polygon Amoy                                        |

---

## Tech Stack

- **Next.js 15** — App Router, API Routes, Server Components
- **AI SDK v6 (`ai`)** — `streamText`, `tool`, `stepCountIs` for agentic loop
- **@ai-sdk/groq** — `llama-3.3-70b-versatile` (agent), `llama-3.1-8b-instant` (services)
- **@circle-fin/x402-batching** — Circle Gateway `BatchFacilitatorClient`
- **@circle-fin/developer-controlled-wallets** — Circle Wallets API for secure agent signing
- **viem** — EIP-3009 signing fallback, on-chain balance reads
- **wagmi + RainbowKit** — User wallet connection
- **Tailwind CSS v4 + shadcn/ui** — Glassmorphism dark UI

---

## Setup

```bash
cd paid-agent
pnpm install
cp .env.example .env.local
# Fill in .env.local (see below)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Note on build warnings:** `pnpm build` shows TypeScript errors from AI SDK v6's `tool()` type overloads ([known limitation](https://github.com/vercel/ai/issues)). Runtime and `pnpm dev` work correctly. Production deployments to Vercel succeed despite type warnings.

---

## Environment Variables

```env
# Circle Gateway (required)
CIRCLE_API_KEY=TEST_API_KEY:...

# Circle Developer-Controlled Wallets (recommended)
CIRCLE_ENTITY_SECRET=...     # From console.circle.com → Developer → Entity Secret
CIRCLE_WALLET_ID=...         # Run: node scripts/create-circle-agent-wallet.mjs

# Fallback: raw EOA key (if Circle Wallets not configured)
AGENT_PRIVATE_KEY=...        # Must have USDC deposited in GatewayWallet

# AI
GROQ_API_KEY=...             # groq.com — free tier, 14,400 req/day

# Demo service seller
SELLER_ADDRESS=...           # Address receiving $1 USDC per API call
```

### Setup Circle Wallets (one-time)

```bash
# 1. Set CIRCLE_API_KEY + CIRCLE_ENTITY_SECRET in .env.local
# 2. Create wallet:
node scripts/create-circle-agent-wallet.mjs
# 3. Add CIRCLE_WALLET_ID to .env.local
# 4. Fund wallet at faucet.circle.com (Arc Testnet)
# 5. Deposit into GatewayWallet:
node scripts/deposit-agent.mjs 10
```

---

## Paid API Services

| Service     | Endpoint                | Price      | Data Source                                 |
| ----------- | ----------------------- | ---------- | ------------------------------------------- |
| Market Data | `/api/demo/market-data` | $1.00 USDC | CoinGecko (any coin: BTC, ETH, TON, SOL...) |
| Weather     | `/api/demo/weather`     | $1.00 USDC | Open-Meteo (any city)                       |
| AI Text     | `/api/demo/ai-text`     | $1.00 USDC | Groq `llama-3.1-8b-instant`                 |
| Translate   | `/api/demo/translate`   | $1.00 USDC | Groq `llama-3.1-8b-instant`                 |
| Code Review | `/api/demo/code-review` | $1.00 USDC | Groq `llama-3.1-8b-instant`                 |
| Sentiment   | `/api/demo/sentiment`   | $1.00 USDC | Groq `llama-3.1-8b-instant`                 |

All endpoints implement **x402 protocol**: return HTTP 402 with payment requirements, then verify + settle via Circle Gateway.

---

## Agent Payment Flow

```
User: "What is the price of TON?"
        │
        ▼
POST /api/agent  (Groq llama-3.3-70b-versatile via AI SDK streamText)
        │
        ├── LLM decides: call market_data(symbol="TON")
        │
        ├── tool.execute():
        │     ├── getCircleWalletAddress() → Circle Wallets API (or AGENT_PRIVATE_KEY fallback)
        │     ├── GET /api/demo/market-data?coins=TON  → 402 response
        │     ├── signWithCircleWallet() → Circle HSM signs EIP-712 (or raw key fallback)
        │     ├── GET /api/demo/market-data with Payment-Signature header
        │     ├── BatchFacilitatorClient.verify() + .settle() → Arc Testnet
        │     └── Returns: { TON: { price: $X, change24h: Y% }, source: CoinGecko }
        │
        └── LLM streams answer to user
            Total: $1 USDC spent, zero MetaMask popups
```

---

## Architecture

See [/architecture](/architecture) for the full system diagram.

Key components:

- **Next.js API Routes** — agent loop, demo services, balance reads
- **Circle Gateway** — batched EIP-3009 settlement on Arc Testnet
- **Circle Developer Wallets** — HSM-backed signing for agent key
- **Groq LLM** — autonomous tool selection and response generation
- **CoinGecko + Open-Meteo** — real-time market and weather data

---

## Circle Product Feedback

### Products used

- Circle Gateway Nanopayments (`@circle-fin/x402-batching`)
- Circle Developer-Controlled Wallets (`@circle-fin/developer-controlled-wallets`)
- USDC on Arc Testnet (Chain ID 5042002)
- CCTP Bridge Kit (UI integration)

### Why these products

Circle Gateway Nanopayments is the **only viable solution** for sub-$1 per-call API monetization on-chain. Traditional smart contract payments have gas overhead that exceeds the payment value. The x402 protocol + EIP-3009 offchain signing eliminates this entirely.

Circle Developer-Controlled Wallets solves the **autonomous agent key management problem**: agents cannot use browser wallets (MetaMask), and storing raw private keys in env vars is a security risk for production. Circle's HSM-backed signing keeps private keys out of application code.

### What worked well

- `BatchFacilitatorClient.verify()` + `.settle()` API is clean and predictable
- x402 protocol implementation is straightforward — standard HTTP 402 with base64-encoded payment requirements
- Circle Wallets wallet creation via `initiateDeveloperControlledWalletsClient` is simple
- Arc Testnet USDC faucet availability made testing easy

### What could be improved

- `signTypedData` in Circle Wallets API returns "API parameter invalid" (code 2) for Arc Testnet custom chain — unclear whether Arc's chain ID (5042002) is supported for EIP-712 signing. Better error messages with supported chains list would help.
- Circle Wallets docs lack examples for custom EVM chains outside Ethereum mainnet/testnet
- The x402 `PAYMENT-REQUIRED` header encoding (base64 JSON) is undocumented outside the SDK — would benefit from an OpenAPI spec

### Recommendations

- Add explicit list of supported chains for `signTypedData` in Circle Wallets docs
- Provide a test mode for Circle Gateway that skips actual settlement (faster dev iteration)
- An official x402 protocol spec document (not just SDK) would enable multi-language implementations

---

## Links

- [Circle Gateway Docs](https://developers.circle.com/gateway/nanopayments)
- [Circle Wallets Docs](https://developers.circle.com/wallets)
- [Arc Testnet Explorer](https://testnet.arcscan.app)
- [USDC Testnet Faucet](https://faucet.circle.com)
- [Hackathon](https://app.ignyte.ae/public/challenges/4B436318-C737-F111-9A49-6045BD14D400)
