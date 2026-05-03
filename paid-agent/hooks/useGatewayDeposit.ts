'use client'

import { useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { parseUnits, erc20Abi } from 'viem'
import { config } from '@/lib/wagmi'
import { USDC_ADDRESS, GATEWAY_WALLET_ADDRESS, GATEWAY_WALLET_ABI } from '@/lib/contracts'

export function useGatewayDeposit() {
  const { writeContractAsync } = useWriteContract()

  const deposit = async (
    amount: string,
  ): Promise<{ approvalTxHash: `0x${string}`; depositTxHash: `0x${string}` }> => {
    const amountInBaseUnits = parseUnits(amount, 6)

    // Step 1: Approve Gateway Wallet to spend USDC
    const approvalTxHash = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [GATEWAY_WALLET_ADDRESS, amountInBaseUnits],
    })

    await waitForTransactionReceipt(config, { hash: approvalTxHash })

    // Step 2: Deposit USDC into Gateway Wallet
    const depositTxHash = await writeContractAsync({
      address: GATEWAY_WALLET_ADDRESS,
      abi: GATEWAY_WALLET_ABI,
      functionName: 'deposit',
      args: [USDC_ADDRESS, amountInBaseUnits],
    })

    await waitForTransactionReceipt(config, { hash: depositTxHash })

    return { approvalTxHash, depositTxHash }
  }

  return { deposit }
}
