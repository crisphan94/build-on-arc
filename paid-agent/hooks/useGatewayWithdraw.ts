'use client'

import { useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { parseUnits } from 'viem'
import { config } from '@/lib/wagmi'
import { USDC_ADDRESS, GATEWAY_WALLET_ADDRESS, GATEWAY_WALLET_ABI } from '@/lib/contracts'

export function useGatewayWithdraw() {
  const { writeContractAsync } = useWriteContract()

  /**
   * Trustless 2-step withdrawal:
   * Step 1 (this fn): initiateWithdrawal — locks amount, starts 7-day on-chain timer
   * Step 2 (after 7 days): withdraw — user calls separately to complete
   *
   * Returns the initiation tx hash.
   */
  const initiateWithdraw = async (amount: string): Promise<`0x${string}`> => {
    const amountInBaseUnits = parseUnits(amount, 6)

    const txHash = await writeContractAsync({
      address: GATEWAY_WALLET_ADDRESS,
      abi: GATEWAY_WALLET_ABI,
      functionName: 'initiateWithdrawal',
      args: [USDC_ADDRESS, amountInBaseUnits],
    })

    await waitForTransactionReceipt(config, { hash: txHash })
    return txHash
  }

  return { initiateWithdraw }
}
