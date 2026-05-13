# Changelog

## [Circle signTypedData Format Fix] — 2025-07-25

**What was done:** Fixed Circle Developer-Controlled Wallets `signTypedData` call to use pre-computed EIP-712 hash as `domainSeparator` string (hex hash) instead of domain object. Added `hashTypedData` from viem to pre-compute. Message field values serialized to strings before sending to Circle API.

**Key decisions:** Circle API expects `domainSeparator` as a `0x`-prefixed hex string (the EIP-712 hash), not a domain object. The typed data message values for `uint256`/`bytes32` must be plain strings, not BigInt.

**Files changed:** `lib/circle-wallet.ts`

---

## [README Overhaul for Hackathon Submission] — 2025-07-25

**What was done:** Rewrote `README.md` from scratch to reflect the actual built system: AI Agent, Circle Gateway + x402, Circle Developer-Controlled Wallets, CCTP Bridge UI. Added "Circle Product Feedback" section as required by hackathon Track 4 submission. Removed all outdated Phase 2 planning docs (those features are now fully implemented).

**Key decisions:** Kept feedback section honest — documented the `signTypedData` Arc Testnet chain issue and recommendations for Circle team. Added full env var table matching actual `.env.local` structure.

**Files changed:** `README.md`, `docs/CHANGELOG.md` (created)

---

## [Real Data for All 6 Demo Services] — 2025-07-25

**What was done:** All 6 x402-protected demo services now return real data. `market-data` uses CoinGecko API with dynamic symbol resolution (60+ hardcoded + search fallback for unknown symbols). `weather` uses Open-Meteo geocoding API for any city. Other 4 services use Groq `llama-3.1-8b-instant`.

**Key decisions:** Dynamic CoinGecko symbol→ID mapping with `/search?query=` fallback for unknown coins. Open-Meteo free tier (no API key required) for weather.

**Files changed:** `app/api/demo/[service]/route.ts`

---

## [Circle Developer-Controlled Wallets Integration] — 2025-07-25

**What was done:** Created new Circle Developer-Controlled Wallet on ARC-TESTNET (`806c37ea-40c9-51b5-8743-67eafc391d00`, address `0xfe66497fbcbcf9170f80345a111a873219d2e1e0`). Integrated `@circle-fin/developer-controlled-wallets` SDK for HSM-backed agent signing. Added fallback to `AGENT_PRIVATE_KEY` when Circle signing fails.

**Key decisions:** Fallback ensures app works even if Circle HSM signing has issues (e.g., Arc Testnet chain support). `isCircleWalletConfigured()` utility checks env vars.

**Files changed:** `lib/circle-wallet.ts` (created), `.env.local`

---

## [CCTP Bridge UI Component] — 2025-07-25

**What was done:** Added `CctpBridgeCard` component showing cross-chain USDC deposit flow from ETH Sepolia, AVAX Fuji, Base Sepolia, Polygon Amoy to Arc Testnet. Simulated UI demonstrating CCTP bridge concept.

**Key decisions:** Simulated flow for demo — real CCTP bridge requires additional contract setup and Wormhole/CCTP SDK integration beyond hackathon scope.

**Files changed:** `components/cctp-bridge-card.tsx`, `app/page.tsx`

---

## [Architecture Diagram Page] — 2025-07-25

**What was done:** Created `/architecture` page with SVG system diagram, flow steps table, and Circle products used table. Added "Architecture" link to header navigation.

**Key decisions:** Static SVG diagram for performance. Shows all major components: User Browser → Next.js → Circle Gateway → Arc Testnet.

**Files changed:** `app/architecture/page.tsx`, `components/header.tsx`

---

## [AI Agent Core Implementation] — 2025-07-25

**What was done:** Built server-side AI agent (`app/api/agent/route.ts`) using AI SDK v6 `streamText` + Groq `llama-3.3-70b-versatile`. 6 paid tool calls (market_data, weather, translate, sentiment, code_review, ai_text). Budget enforcement tracking total USDC spent. `temperature: 0` + `stopWhen: stepCountIs(10)` for consistent behavior.

**Key decisions:** Renamed `coins` param to `symbol` to help LLM pass it correctly. Added guard for undefined/empty symbol. Concise 8-line system prompt for faster token processing.

**Files changed:** `app/api/agent/route.ts`, `lib/agent-pay.ts`, `lib/agent-wallet.ts`
