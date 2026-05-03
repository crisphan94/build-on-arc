const hre = require('hardhat')

async function main() {
  console.log('🚀 Deploying SimpleAgentRegistry to Arc Testnet...\n')

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners()
  console.log('📝 Deployer address:', deployer.address)

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('💰 Deployer balance:', hre.ethers.formatEther(balance), 'ETH\n')

  // Deploy contract
  console.log('⏳ Deploying contract...')
  const AgentRegistry = await hre.ethers.getContractFactory('SimpleAgentRegistry')
  const registry = await AgentRegistry.deploy()

  await registry.waitForDeployment()
  const address = await registry.getAddress()

  console.log('\n✅ Contract deployed successfully!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📄 Contract Address:', address)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📝 Next steps:')
  console.log('1. Copy the contract address above')
  console.log('2. Add to .env.local:\n')
  console.log(`   NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${address}\n`)
  console.log('3. Restart your Next.js dev server:\n')
  console.log('   pnpm dev\n')

  console.log('🔍 View on Arc Explorer:')
  console.log(`https://testnet.arcscan.app/address/${address}\n`)

  // Verify deployment
  console.log('🔄 Verifying deployment...')
  const agentCount = await registry.getAgentCount()
  console.log('✅ Contract is working! Agent count:', agentCount.toString())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  })
