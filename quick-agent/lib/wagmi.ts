import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Arc Testnet Chain Configuration
export const arcTestnetChain = {
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

// Wagmi Configuration
export const config = createConfig({
  chains: [arcTestnetChain],
  transports: {
    [arcTestnetChain.id]: http(),
  },
  connectors: [injected({ target: 'metaMask' })],
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
