# NanoPay Hub

> **Marketplace demo cho Circle Gateway Nanopayments trên Arc Testnet**

Multi-user web app cho phép connect ví và thực hiện gasless USDC micropayments thông qua Circle Gateway x402 protocol.

## Tech Stack

- **Next.js 15** — App Router, API Routes
- **wagmi + RainbowKit** — Wallet connection (MetaMask, WalletConnect)
- **@circle-fin/x402-batching** — Circle Gateway SDK
- **Tailwind CSS v4** — Glassmorphism dark UI
- **viem** — EVM interaction

## Features

| Feature              | Mô tả                                    |
| -------------------- | ---------------------------------------- |
| Wallet Connect       | MetaMask, WalletConnect trên Arc Testnet |
| Gateway Balance      | Xem USDC balance trong Circle Gateway    |
| Deposit              | Nạp USDC vào Gateway (1 lần, có gas)     |
| Pay & Use            | Thanh toán gasless qua x402 protocol     |
| Services Marketplace | 6 paid API services demo                 |
| Activity Feed        | Lịch sử thanh toán                       |

## Cài đặt & Chạy

```bash
cd paid-agent
pnpm install
cp .env.example .env.local
# Sửa .env.local với private key của bạn
pnpm dev
```

## Biến môi trường

| Biến                        | Mô tả                                 | Bắt buộc                    |
| --------------------------- | ------------------------------------- | --------------------------- |
| `GATEWAY_PRIVATE_KEY`       | Private key EOA wallet để ký payments | Không (demo mode nếu thiếu) |
| `SELLER_ADDRESS`            | Địa chỉ ví nhận USDC từ payments      | Không                       |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Project ID              | Không                       |

## Demo Services (x402-protected)

| Endpoint                | Price    | Mô tả                 |
| ----------------------- | -------- | --------------------- |
| `/api/demo/ai-text`     | $0.001   | AI Text Generation    |
| `/api/demo/market-data` | $0.0001  | Real-time Market Data |
| `/api/demo/translate`   | $0.0005  | Language Translation  |
| `/api/demo/code-review` | $0.01    | AI Code Review        |
| `/api/demo/sentiment`   | $0.0002  | Sentiment Analysis    |
| `/api/demo/weather`     | $0.00005 | Weather Intelligence  |

## Luồng thanh toán

```
1. User deposit USDC → Circle Gateway (on-chain, 1 lần)
2. User click "Pay & Use" → POST /api/pay
3. Server GatewayClient.pay(serviceUrl)
4. GatewayClient: GET /api/demo/ai-text → 402 response
5. GatewayClient: sign EIP-3009 authorization (offchain, 0 gas)
6. GatewayClient: retry với PAYMENT-SIGNATURE header
7. Service endpoint: verify + return data
8. Circle Gateway batch settle trên Arc Testnet
```

## Links

- [Circle Gateway Nanopayments Docs](https://developers.circle.com/gateway/nanopayments)
- [Buyer Quickstart](https://developers.circle.com/gateway/nanopayments/quickstarts/buyer)
- [Seller Quickstart](https://developers.circle.com/gateway/nanopayments/quickstarts/seller)
- [USDC Testnet Faucet](https://faucet.circle.com)
- [Arc Testnet Explorer](https://testnet.arcscan.app)

---

## Phase 2: AI Agent Layer (Hackathon Track 4)

> **Stablecoins Commerce Stack Challenge — Track 4: Best Agentic Economy Experience on Arc**

### Problem

Current app is a **manual marketplace** — user clicks each API call individually.
Track 4 requires an **AI agent that autonomously decides and pays** without user confirmation per step.

### What to Add

#### Critical: Server-side payment signing

Currently `useGatewayPay.ts` uses wagmi's `useSignTypedData` — MetaMask signs in the browser.
An agent cannot popup MetaMask. Need a server-side signer:

- `lib/agent-wallet.ts` — viem walletClient with `AGENT_PRIVATE_KEY`, signs EIP-3009 server-side
- `lib/agent-pay.ts` — server-side equivalent of `useGatewayPay`, no browser required

#### AI Agent API route

- `app/api/agent/route.ts` — `POST`, receives `{ task, budget }`, uses Vercel AI SDK `streamText()`
- 6 tools defined (one per paid API), each `tool.execute()` calls x402 endpoint + signs autonomously
- Budget enforcement: agent tracks total spent, stops when limit reached

#### Chat UI

- `app/agent/page.tsx` — `useChat()` from AI SDK UI
- User types natural language task: _"Analyze BTC market sentiment"_
- Streams agent thinking + each payment step in realtime
- Shows budget remaining, payment receipt per tool call

### Autonomous Flow

```
User: "Give me a full BTC market analysis"
        │
        ▼
POST /api/agent  (Vercel AI SDK streamText)
        │
        ├── LLM decides: need marketData + sentiment + aiText
        │
        ├── tool: callMarketData  → agent-wallet signs EIP-3009 (server-side, no MetaMask)
        │                          → POST /api/demo/market-data with payment header
        │                          → Circle Gateway settles → returns price data
        │
        ├── tool: callSentiment   → same flow, -$1 USDC
        │
        ├── tool: callAIText      → same flow, -$1 USDC, synthesizes final report
        │
        └── LLM streams final report to user
            Total: $3 USDC spent autonomously, zero MetaMask popups
```

### Files to Create / Modify

| File                           | Action | Description                                         |
| ------------------------------ | ------ | --------------------------------------------------- |
| `lib/agent-wallet.ts`          | NEW    | viem walletClient, server-side EIP-3009 signing     |
| `lib/agent-pay.ts`             | NEW    | server-side payment flow (no browser/wagmi)         |
| `app/api/agent/route.ts`       | NEW    | streamText + 6 tools + budget enforcement           |
| `app/agent/page.tsx`           | NEW    | Chat UI with useChat(), payment log, budget tracker |
| `components/agent-chat.tsx`    | NEW    | Chat component with tool call visualization         |
| `components/payment-steps.tsx` | NEW    | Realtime display of agent payment steps             |
| `.env.local`                   | UPDATE | Add `AGENT_PRIVATE_KEY`, `GEMINI_API_KEY`           |

### New Dependencies

```bash
pnpm add ai @ai-sdk/google   # Gemini free tier (1M tokens/day)
# OR
pnpm add ai @ai-sdk/openai   # OpenAI (paid, ~$0.002/1K tokens)
```

**Recommended: Google Gemini** — free tier sufficient for demo, key at [aistudio.google.com](https://aistudio.google.com).

### New Environment Variables

| Variable            | Description                                             | Required |
| ------------------- | ------------------------------------------------------- | -------- |
| `AGENT_PRIVATE_KEY` | EOA private key for agent-initiated payments            | Yes      |
| `AGENT_ADDRESS`     | Corresponding address (pre-funded with USDC in Gateway) | Yes      |
| `GEMINI_API_KEY`    | Google AI Studio API key (free)                         | Yes      |

### Demo Scenario (for submission video)

1. User sets budget: **$10 USDC max**
2. User types: _"Research and summarize BTC outlook"_
3. Agent calls Market Data API → pays $1 → receives price data
4. Agent calls Sentiment Analysis API → pays $1 → receives sentiment score
5. Agent calls AI Text Generation API → pays $1 → synthesizes report
6. User sees: full report + payment receipt showing 3× $1 charges + $7 remaining budget
7. Gateway balance decreases $3 in realtime on the dashboard
