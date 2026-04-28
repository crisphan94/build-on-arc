import { ethers } from 'hardhat'

/**
 * Deploy SimpleAgentRegistry contract to Arc Network Testnet
 *
 * Before deploying:
 * 1. Make sure you have Arc testnet USDC for gas
 * 2. Add PRIVATE_KEY to your .env file
 * 3. Run: npx hardhat run scripts/deploy.ts --network arcTestnet
 */
async function main() {
  console.log('🚀 Deploying SimpleAgentRegistry to Arc Network Testnet...\n')

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log('📝 Deploying from address:', deployer.address)

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('💰 Account balance:', ethers.formatUnits(balance, 6), 'USDC\n')

  // Deploy contract
  console.log('⏳ Deploying contract...')
  const SimpleAgentRegistry = await ethers.getContractFactory('SimpleAgentRegistry')
  const registry = await SimpleAgentRegistry.deploy()

  await registry.waitForDeployment()

  const contractAddress = await registry.getAddress()
  console.log('✅ SimpleAgentRegistry deployed to:', contractAddress)
  console.log('\n📋 Next steps:')
  console.log('1. Add this address to your .env file:')
  console.log(`   NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${contractAddress}`)
  console.log('\n2. Verify contract on Arc Explorer:')
  console.log(`   https://testnet.arcscan.app/address/${contractAddress}`)
  console.log('\n3. Restart your Next.js dev server to pick up the new env variable\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  })
