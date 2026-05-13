import { http, createConfig } from 'wagmi'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
} as const

export const config = createConfig({
  ssr: true,
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  connectors: [
    metaMask(),
    injected(),
    ...(process.env.NEXT_PUBLIC_WC_PROJECT_ID
      ? [walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID })]
      : []),
  ],
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
