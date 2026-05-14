'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount, useWriteContract } from 'wagmi'
import { Header } from '@/components/header'
import { AGENT_REGISTRY_ABI, getAgentRegistryAddress } from '@/lib/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Bot,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Info,
  ExternalLink,
  CheckCircle2,
  Upload,
  X,
} from 'lucide-react'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleCreateAgent = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    if (!agentName || !agentDescription) return

    setIsDeploying(true)
    try {
      // Step 1: Upload avatar to IPFS if provided
      let avatarUrl = ''
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload avatar')
        }

        const uploadData = await uploadResponse.json()
        avatarUrl = uploadData.ipfsUrl
        console.log('Avatar uploaded to IPFS:', avatarUrl)
      }

      // Step 2: Create metadata object
      const metadata = {
        name: agentName,
        description: agentDescription,
        image: avatarUrl,
        createdAt: new Date().toISOString(),
      }
      console.log('Agent metadata:', metadata)

      // Step 3: Upload metadata to IPFS
      const metadataResponse = await fetch('/api/upload-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json()
        throw new Error(errorData.error || 'Failed to upload metadata')
      }

      const metadataData = await metadataResponse.json()
      const metadataUri = metadataData.ipfsUrl
      console.log('Metadata uploaded to IPFS:', metadataUri)

      // Step 4: Get contract address
      let contractAddress: `0x${string}`
      try {
        contractAddress = getAgentRegistryAddress()
      } catch {
        throw new Error(
          'Contract not deployed yet. Please deploy the SimpleAgentRegistry contract first and add the address to .env.local',
        )
      }

      // Step 5: Create agent on-chain
      console.log('Deploying agent on-chain...')
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'createAgent',
        args: [agentName, agentDescription, avatarUrl || metadataUri],
      })

      console.log('Transaction submitted:', hash)
      setTxHash(hash)
      setShowSuccess(true)

      // Reset form
      setAgentName('')
      setAgentDescription('')
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error: unknown) {
      console.error('Error creating agent:', error)
      let errorMessage = 'Failed to create agent. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'shortMessage' in error) {
        errorMessage = (error as { shortMessage: string }).shortMessage
      }
      alert(errorMessage)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className='flex min-h-screen flex-col bg-slate-950 text-slate-50'>
      <Header />

      {/* Hero Section */}
      <section className='relative overflow-hidden bg-slate-950'>
        {/* Animated Gradient Background */}
        <div className='absolute inset-0 bg-linear-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-3xl' />

        <div className='container relative mx-auto px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32'>
          <div className='mx-auto max-w-4xl text-center'>
            {/* Badge */}
            <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 backdrop-blur-sm transition-all duration-200 hover:border-indigo-400/50 hover:bg-indigo-500/20'>
              <Sparkles className='h-4 w-4' />
              <span>Powered by Arc Network Testnet</span>
            </div>

            {/* Main Heading */}
            <h1 className='mb-6 font-poppins text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl'>
              Build{' '}
              <span className='bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                AI Agents
              </span>
              <br />
              On-Chain
            </h1>

            {/* Description */}
            <p className='mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl'>
              Deploy autonomous AI agents with verifiable on-chain identity. Simple, fast, and
              powerful.
            </p>

            {/* CTA Buttons */}
            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Button
                size='lg'
                className='group w-full cursor-pointer sm:w-auto'
                onClick={() =>
                  document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Create Your Agent
                <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='w-full cursor-pointer sm:w-auto'
                asChild
              >
                <Link href='https://docs.arc.network' target='_blank' rel='noopener noreferrer'>
                  View Documentation
                </Link>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className='mt-16 grid grid-cols-3 gap-6 sm:gap-8 lg:gap-12'>
              <div className='flex flex-col items-center'>
                <div className='mb-2 font-poppins text-3xl font-bold text-indigo-400 sm:text-4xl'>
                  0
                </div>
                <div className='text-xs text-slate-400 sm:text-sm'>Agents Created</div>
              </div>
              <div className='flex flex-col items-center'>
                <div className='mb-2 font-poppins text-3xl font-bold text-purple-400 sm:text-4xl'>
                  ~0.01
                </div>
                <div className='text-xs text-slate-400 sm:text-sm'>USDC Gas Cost</div>
              </div>
              <div className='flex flex-col items-center'>
                <div className='mb-2 font-poppins text-3xl font-bold text-pink-400 sm:text-4xl'>
                  &lt;1min
                </div>
                <div className='text-xs text-slate-400 sm:text-sm'>Deploy Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='bg-slate-950 py-16 sm:py-20 lg:py-24'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='mx-auto mb-12 max-w-3xl text-center'>
            <h2 className='mb-4 font-poppins text-3xl font-bold sm:text-4xl'>Why Build on Arc?</h2>
            <p className='text-lg leading-relaxed text-slate-400'>
              The easiest way to create AI agents with on-chain identity
            </p>
          </div>

          {/* Feature Cards */}
          <div className='mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {/* Card 1: Lightning Fast */}
            <Card className='group cursor-default transition-all duration-300 hover:-translate-y-1'>
              <CardHeader className='space-y-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors duration-200 group-hover:bg-indigo-500/20'>
                  <Zap className='h-6 w-6' />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Deploy your AI agent in under a minute with our streamlined process
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 2: Secure & Verified */}
            <Card className='group cursor-default transition-all duration-300 hover:-translate-y-1'>
              <CardHeader className='space-y-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 transition-colors duration-200 group-hover:bg-purple-500/20'>
                  <Shield className='h-6 w-6' />
                </div>
                <CardTitle>Secure & Verified</CardTitle>
                <CardDescription>
                  Every agent has a verifiable on-chain identity backed by smart contracts
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 3: Full Control */}
            <Card className='group cursor-default transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1'>
              <CardHeader className='space-y-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 transition-colors duration-200 group-hover:bg-pink-500/20'>
                  <Bot className='h-6 w-6' />
                </div>
                <CardTitle>Full Control</CardTitle>
                <CardDescription>
                  Manage, update, and transfer your agent ownership anytime
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Create Agent Section */}
      <section id='create' className='bg-slate-900/30 py-16 sm:py-20 lg:py-24'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl'>
            <Card className='border-slate-800'>
              <CardHeader className='space-y-2'>
                <CardTitle className='font-poppins text-2xl sm:text-3xl'>
                  Create Your AI Agent
                </CardTitle>
                <CardDescription className='text-base leading-relaxed'>
                  Deploy a new agent with on-chain identity in just a few clicks
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Agent Name */}
                <div className='space-y-2'>
                  <label htmlFor='name' className='block text-sm font-medium text-slate-200'>
                    Agent Name
                  </label>
                  <Input
                    id='name'
                    placeholder='e.g. Trading Bot Alpha'
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>

                {/* Agent Avatar */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-200'>
                    Agent Avatar <span className='text-slate-500'>(Optional)</span>
                  </label>

                  {!avatarPreview ? (
                    <label className='group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 p-6 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-900/50'>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleAvatarChange}
                        className='hidden'
                      />
                      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 transition-colors duration-200 group-hover:bg-indigo-500/20'>
                        <Upload className='h-8 w-8 text-indigo-400' />
                      </div>
                      <p className='mt-3 text-sm font-medium text-slate-300'>
                        Click to upload avatar
                      </p>
                      <p className='mt-1 text-xs text-slate-500'>PNG, JPG, GIF up to 5MB</p>
                    </label>
                  ) : (
                    <div className='relative overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-900/50 p-4'>
                      <div className='flex items-center gap-4'>
                        <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-indigo-500/30'>
                          {' '}
                          {/* eslint-disable-next-line @next/next/no-img-element */}{' '}
                          <img
                            src={avatarPreview}
                            alt='Avatar preview'
                            className='h-full w-full object-cover'
                          />
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-slate-200'>{avatarFile?.name}</p>
                          <p className='mt-1 text-xs text-slate-400'>
                            {avatarFile && (avatarFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={removeAvatar}
                          className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition-colors duration-200 hover:bg-red-500/20'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  )}

                  <p className='text-xs text-slate-500'>
                    Avatar will be stored on IPFS and linked to your agent
                  </p>
                </div>

                {/* Agent Description */}
                <div className='space-y-2'>
                  <label htmlFor='description' className='block text-sm font-medium text-slate-200'>
                    Description
                  </label>
                  <Input
                    id='description'
                    placeholder='What does your agent do?'
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                  />
                </div>

                {/* Deployment Info Card */}
                <div className='rounded-xl border border-slate-700 bg-slate-900/50 p-4'>
                  <div className='flex items-start gap-3'>
                    <Info className='mt-1 h-5 w-5 shrink-0 text-indigo-400' />
                    <div className='space-y-2 text-sm'>
                      <p className='font-medium text-slate-200'>Deployment Details</p>
                      <ul className='space-y-1 text-slate-400'>
                        <li>• Network: Arc Testnet (Chain ID: 5042002)</li>
                        <li>• Gas Token: USDC (~0.01 USDC estimated)</li>
                        <li>• Storage: Avatar & metadata on IPFS (Pinata)</li>
                        <li>• Deploy Time: ~30-60 seconds</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Deploy Button */}
                <Button
                  size='lg'
                  className='w-full cursor-pointer'
                  onClick={handleCreateAgent}
                  disabled={!isConnected || !agentName || !agentDescription || isDeploying}
                >
                  <Bot className='mr-2 h-5 w-5' />
                  {isDeploying
                    ? 'Deploying...'
                    : !isConnected
                      ? 'Connect Wallet First'
                      : 'Deploy Agent'}
                </Button>

                {/* Helper Text */}
                {!isConnected ? (
                  <p className='text-center text-sm text-amber-400'>
                    Please connect your wallet using the button in the header
                  </p>
                ) : (
                  <p className='text-center text-sm text-slate-400'>
                    Make sure you have Arc testnet USDC in your wallet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccess && txHash && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'>
          <Card className='w-full max-w-md border-slate-700'>
            <CardHeader className='space-y-3 text-center'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10'>
                <CheckCircle2 className='h-10 w-10 text-green-500' />
              </div>
              <CardTitle className='font-poppins text-2xl'>Agent Deployed!</CardTitle>
              <CardDescription>
                Your AI agent has been successfully deployed to Arc Network
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-lg border border-slate-700 bg-slate-900/50 p-4'>
                <p className='mb-2 text-sm font-medium text-slate-300'>Transaction Hash:</p>
                <div className='flex items-center gap-2'>
                  <code className='flex-1 overflow-hidden text-ellipsis text-xs text-slate-400'>
                    {txHash}
                  </code>
                </div>
              </div>

              <a
                href={`https://testnet.arcscan.app/tx/${txHash}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-indigo-500'
              >
                View on Arc Explorer
                <ExternalLink className='h-4 w-4' />
              </a>

              <Button
                variant='outline'
                className='w-full cursor-pointer'
                onClick={() => setShowSuccess(false)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className='mt-auto border-t border-slate-800 bg-slate-950 py-8'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <p className='text-sm text-slate-400'>Built with ❤️ by crisphan for Arc Network</p>
            <div className='flex gap-6'>
              <a
                href='https://docs.arc.network'
                target='_blank'
                rel='noopener noreferrer'
                className='cursor-pointer text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200'
              >
                Docs
              </a>
              <a
                href='https://discord.com/invite/buildonarc'
                target='_blank'
                rel='noopener noreferrer'
                className='cursor-pointer text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200'
              >
                Discord
              </a>
              <a
                href='https://github.com/crisphan94/build-on-arc'
                target='_blank'
                rel='noopener noreferrer'
                className='cursor-pointer text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200'
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
