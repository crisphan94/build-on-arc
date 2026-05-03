# NanoPay

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
