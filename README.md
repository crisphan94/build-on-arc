# Build on Arc — AI Agent Economy Demos

> **Circle Stablecoins Commerce Stack Challenge**  
> Track 4: Best Agentic Economy Experience on Arc

Production-ready implementations of autonomous AI agents that execute real economic transactions using Circle's infrastructure on Arc Testnet.

---

## Featured Project: AgentPay

**Autonomous AI agent that pays for every answer using USDC micropayments**

[`paid-agent/`](./paid-agent) — The first AI agent that autonomously selects paid APIs, signs payments server-side via Circle Developer-Controlled Wallets, and settles instantly using Circle Gateway on Arc Testnet. Every answer costs $1 USDC — a true pay-per-query AI economy.

**Key Features:**

- Zero-click payments (no MetaMask popups)
- Autonomous decision-making with Groq LLM
- Real-time streaming responses
- Budget control & fail-fast error handling
- Auto-deposit flow for gateway funding

**Tech Stack:** Next.js 15, Groq SDK, Circle Gateway, Circle Developer Wallets, viem, wagmi, Arc Testnet

**[→ Full Documentation](./paid-agent/README.md)**

---

## Demo Projects

### 1. **AgentPay** — Autonomous Payment Agent

**Directory:** [`paid-agent/`](./paid-agent)

The flagship demo showcasing a production-ready implementation of an AI agent that:

- Researches user questions autonomously
- Pays $1 USDC per API call via Circle Gateway
- Uses Circle Developer-Controlled Wallets for secure signing
- Implements x402 HTTP payment protocol
- Settles on Arc Testnet with EIP-3009 authorizations

**Status:** Production-ready, 50+ successful payments validated

### 2. **QuickAgent** — Frontend-First Registry

**Directory:** [`quick-agent/`](./quick-agent)

Simple AI agent registry contract deployment with Next.js frontend:

- Deploy SimpleAgentRegistry contract to Arc Testnet
- Register agents with metadata (name, description, avatar)
- Upload to IPFS via Pinata
- MetaMask wallet integration

**Status:** Basic registry implementation for rapid prototyping

### 3. **SDK Agent** — Circle Wallets Integration

**Directory:** [`sdk-agent/`](./sdk-agent)

Demonstrates Circle Developer-Controlled Wallets SDK integration:

- Smart Contract Account (SCA) wallet creation on Arc Testnet
- Agent identity registration to on-chain registry
- Circle HSM-backed signing
- ERC-4337 account abstraction

**Status:** SDK integration reference

---

## Quick Start

### AgentPay (Main Demo)

```bash
cd paid-agent
pnpm install
cp .env.example .env.local
# Fill in Circle API keys + Groq API key
pnpm dev
```

Visit http://localhost:3000 and ask: _"What are the top 3 coins by market cap?"_

### Environment Setup

Required for AgentPay:

```env
CIRCLE_API_KEY=TEST_API_KEY:...
AGENT_PRIVATE_KEY=0x...
GROQ_API_KEY=gsk_...
SELLER_ADDRESS=0x...
```

Optional (for Circle Wallets HSM signing):

```env
CIRCLE_ENTITY_SECRET=...
CIRCLE_WALLET_ID=...
```

**[→ Detailed Setup Guide](./paid-agent/README.md#setup)**

---

## Circle Products Used

| Product                           | Implementation                             | Purpose                                          |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| **Circle Gateway + Nanopayments** | `@circle-fin/x402-batching`                | Sub-dollar API micropayments, batched settlement |
| **Circle Developer Wallets**      | `@circle-fin/developer-controlled-wallets` | HSM-backed agent key management                  |
| **USDC on Arc Testnet**           | Chain ID 5042002                           | Settlement rail for all payments                 |
| **CCTP Bridge Kit**               | UI integration (pending Arc deployment)    | Cross-chain USDC deposits                        |

---

## Architecture

```
User → Next.js App → Groq LLM (tool calling)
                       ↓
                   Agent selects paid API
                       ↓
                   Circle Wallets (EIP-712 signing)
                       ↓
                   x402 payment protocol
                       ↓
                   Circle Gateway (verify + settle)
                       ↓
                   Arc Testnet (EIP-3009 USDC transfer)
```

**[→ Full Architecture Diagram](./paid-agent/app/architecture/page.tsx)**

---

## Hackathon Requirements Compliance

**Track 4: Best Agentic Economy Experience on Arc**

| Requirement        | Implementation                     | Status |
| ------------------ | ---------------------------------- | ------ |
| Autonomous agent   | Groq LLM with function calling     | ✅     |
| Pays for answers   | $1 USDC per API call via x402      | ✅     |
| Circle Gateway     | BatchFacilitatorClient settlement  | ✅     |
| Arc Testnet        | Chain ID 5042002, USDC 0x3600...   | ✅     |
| USDC settlement    | EIP-3009 TransferWithAuthorization | ✅     |
| Real-time UX       | SSE streaming with tool feedback   | ✅     |
| Circle Wallets     | HSM signing with fallback          | ✅     |
| Production quality | TypeScript strict, error handling  | ✅     |

---

## Testing & Validation

**AgentPay Metrics:**

- 50+ successful $1 USDC payments on Arc Testnet
- Circle Gateway settlement verified on-chain
- EIP-3009 authorization signatures validated
- Rate limit handling tested (Groq 100k token/day)
- Auto-deposit flow verified with low balances

**Test Queries:**

```
"What's the BTC price?"
"Top 3 coins by market cap"
"Weather in Tokyo"
"Translate 'Hello' to Vietnamese"
"Review this code: function add(a,b){return a+b}"
```

---

## Key Innovations

1. **First Autonomous AI Payment Agent on Arc** — Makes payment decisions without user signatures
2. **Fail-Fast Agent Loop** — Stops on first error to prevent wasted LLM iterations
3. **Auto-Deposit UX** — Transparently handles gateway funding without manual flows
4. **Zero-Click Payments** — Server-side signing eliminates all wallet popups
5. **Manual Tool Calling** — Direct Groq SDK integration for predictable reliability

---

## Project Structure

```
build-on-arc/
├── paid-agent/          # Main demo: AgentPay (production-ready)
│   ├── app/             # Next.js App Router
│   ├── components/      # React components (chat, wallet, bridge)
│   ├── lib/             # Core logic (agent-pay, circle-wallet, gateway)
│   ├── hooks/           # Custom React hooks
│   └── scripts/         # Setup & deployment scripts
├── quick-agent/         # Simple registry demo
│   ├── contracts/       # Solidity contracts
│   └── app/             # Frontend
├── sdk-agent/           # Circle Wallets SDK demo
│   ├── lib/             # SDK integration
│   └── scripts/         # Wallet creation scripts
└── README.md            # This file
```

---

## Circle Product Feedback

### What Worked Well

- BatchFacilitatorClient API is clean and predictable
- x402 protocol is straightforward (standard HTTP 402)
- Circle Wallets creation is simple via `initiateDeveloperControlledWalletsClient`
- Arc Testnet USDC faucet makes testing easy

### Areas for Improvement

- Circle Wallets `signTypedData` returns "API parameter invalid" for Arc Testnet (chain 5042002 not whitelisted yet)
- CCTP Bridge pending MessageTransmitter contract deployment on Arc Testnet
- x402 Payment-Signature header format undocumented outside SDK (OpenAPI spec would help)

### Recommendations

1. Add explicit supported chains list to Circle Wallets documentation
2. Provide test mode for Circle Gateway (skip settlement for faster iteration)
3. Publish OpenAPI spec for x402 protocol
4. Create hackathon-specific quick-start templates

---

## Tech Stack

**Frontend:**

- Next.js 15 (App Router, React 19, TypeScript strict)
- wagmi 2.19.5 + RainbowKit (wallet connection)
- Tailwind CSS v4 + shadcn/ui (glassmorphism dark UI)
- Custom SSE streaming for real-time agent responses

**Backend:**

- Groq SDK 1.2.0 (`llama-3.3-70b-versatile` for agent, `llama-3.1-8b-instant` for services)
- Circle Gateway (`@circle-fin/x402-batching`)
- Circle Developer Wallets (`@circle-fin/developer-controlled-wallets`)
- viem 2.48.4 (EIP-3009 signing, contract reads)

**Blockchain:**

- Arc Testnet (Chain ID 5042002)
- USDC (0x3600000000000000000000000000000000000000)
- Circle Gateway (0x0077777d7EBA4688BDeF3E311b846F25870A19B9)

---

## Deployment

**Recommended:** Vercel (zero-config)

**Requirements:**

- Node.js 18+
- Environment variables (Circle API keys, Groq API key)
- Arc Testnet RPC access

**Setup time:** 5 minutes (after obtaining API keys)

**[→ Deployment Guide](./paid-agent/README.md#deployment)**

---

## Links

- **AgentPay Demo:** [View Architecture](./paid-agent/app/architecture/page.tsx)
- **Hackathon:** [Circle Stablecoins Commerce Stack Challenge](https://app.ignyte.ae/public/challenges/4B436318-C737-F111-9A49-6045BD14D400)
- **Arc Testnet Explorer:** https://testnet.arcscan.app
- **Circle Developer Docs:** https://developers.circle.com
- **Groq Console:** https://console.groq.com
- **USDC Testnet Faucet:** https://faucet.circle.com

---

## Team

**Developer:** crisphan94  
**GitHub:** https://github.com/crisphan94/build-on-arc  
**Track:** Circle Stablecoins Commerce Stack Challenge — Track 4

---

## License

MIT License — See [LICENSE](./LICENSE) file for details

---

**Welcome to the Agentic Economy on Arc Testnet** 🤖💰
