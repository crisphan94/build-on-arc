import { http, createConfig } from "wagmi";
import { arcTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Define Arc Testnet chain
export const arcTestnetChain = {
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
} as const;

// Wagmi config
export const config = createConfig({
  chains: [arcTestnetChain],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
    }),
  ],
  transports: {
    [arcTestnetChain.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
