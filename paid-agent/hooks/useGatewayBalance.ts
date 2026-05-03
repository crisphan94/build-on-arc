'use client'

import { useCallback } from 'react'
import { useReadContract, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { arcTestnet } from '@/lib/wagmi'
import { USDC_ADDRESS, GATEWAY_WALLET_ADDRESS, GATEWAY_WALLET_ABI } from '@/lib/contracts'

export function useGatewayBalance(address: `0x${string}` | undefined) {
  const { data: walletBalance, refetch: refetchWallet } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId: arcTestnet.id,
    query: { enabled: !!address },
  })

  const { data: gatewayRaw, refetch: refetchGateway } = useReadContract({
    address: GATEWAY_WALLET_ADDRESS,
    abi: GATEWAY_WALLET_ABI,
    functionName: 'availableBalance',
    args: [USDC_ADDRESS, address!],
    chainId: arcTestnet.id,
    query: { enabled: !!address },
  })

  // Stable reference so BalanceCard's useEffect doesn't re-run every render
  const refetch = useCallback(() => {
    refetchWallet()
    refetchGateway()
  }, [refetchWallet, refetchGateway])

  return {
    walletBalance: walletBalance ? formatUnits(walletBalance.value, 6) : null,
    gatewayBalance: gatewayRaw !== undefined ? formatUnits(gatewayRaw, 6) : null,
    refetch,
  }
}
