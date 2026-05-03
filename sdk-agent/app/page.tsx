'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { UserDirectMint } from '@/components/user-direct-mint'
import { CircleDeveloperMint } from '@/components/circle-developer-mint'
import { Sparkles, Info, Wallet } from 'lucide-react'
import { ARC_OFFICIAL_CONTRACT, ARC_OFFICIAL_ABI } from '@/lib/contracts'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'user' | 'circle'>('circle')

  // Read user's agent balance from Arc's official contract
  const { data: userBalance } = useReadContract({
    address: ARC_OFFICIAL_CONTRACT,
    abi: ARC_OFFICIAL_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  return (
    <div className='flex min-h-screen flex-col bg-slate-950 text-slate-50'>
      <Header />

      {/* Hero Section */}
      <section className='relative overflow-hidden bg-slate-950'>
        {/* Animated Gradient Background */}
        <div className='absolute inset-0 bg-linear-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-3xl' />

        <div className='container relative mx-auto px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-20'>
          <div className='mx-auto max-w-4xl text-center'>
            {/* Badge */}
            <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 backdrop-blur-sm transition-all duration-200 hover:border-indigo-400/50 hover:bg-indigo-500/20'>
              <Sparkles className='h-4 w-4' />
              <span>Powered by Arc Network Testnet</span>
            </div>

            {/* Main Heading */}
            <h1 className='mb-6 font-poppins text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl'>
              Register{' '}
              <span className='bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                AI Agent Identity
              </span>
              <br />
              On-Chain
            </h1>

            {/* Description */}
            <p className='mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl'>
              Create and register your AI Agent with verifiable on-chain identity on Arc Network
              Testnet.
            </p>

            {/* Stats Grid */}
            {/* <div className='mt-16 grid grid-cols-2 gap-8 sm:gap-12 lg:gap-16 max-w-xl mx-auto'>
              <div className='flex flex-col items-center'>
                <div className='mb-2 font-poppins text-3xl font-bold text-green-400 sm:text-4xl'>
                  {isConnected ? (userBalance ? userBalance.toString() : '0') : '-'}
                </div>
                <div className='text-xs text-slate-400 sm:text-sm'>Your Agents</div>
              </div>
              <div className='flex flex-col items-center'>
                <div className='mb-2 font-poppins text-3xl font-bold text-pink-400 sm:text-4xl'>
                  FREE
                </div>
                <div className='text-xs text-slate-400 sm:text-sm'>Gas Cost</div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Create Agent Section */}
      <section className='bg-slate-950 pb-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Method Comparison */}
          <Card className='max-w-4xl mx-auto mb-8 bg-blue-500/5 border-blue-500/20'>
            <CardContent className='p-6'>
              <div className='flex items-start gap-3 mt-6'>
                <Info className='h-5 w-5 text-blue-400 shrink-0' />
                <div className='space-y-3 text-sm'>
                  <p className='text-slate-200'>
                    <strong className='text-blue-400'>Two methods available:</strong>
                  </p>
                  <div className='grid sm:grid-cols-2 gap-8'>
                    <div className='space-y-1'>
                      <p className='font-medium text-indigo-300'>
                        <Sparkles className='inline h-4 w-4 mr-1' />
                        Circle Developer (Gasless)
                      </p>
                      <ul className='text-slate-400 space-y-0.5 text-xs'>
                        <li>• Agent registered via Smart Contract Wallet</li>
                        <li>• No gas fees (Circle pays)</li>
                      </ul>
                    </div>
                    <div className='space-y-1'>
                      <p className='font-medium text-green-300'>
                        <Wallet className='inline h-4 w-4 mr-1' />
                        Personal Wallet
                      </p>
                      <ul className='text-slate-400 space-y-0.5 text-xs'>
                        <li>• Agent in your personal wallet</li>
                        <li>• You pay gas (USDC)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className='max-w-2xl mx-auto mb-8'>
            <div className='flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800'>
              <button
                onClick={() => setActiveTab('circle')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'circle'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className='inline h-4 w-4 mr-2' />
                Circle Developer
                <span className='ml-2 text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full'>
                  Gasless
                </span>
              </button>
              <button
                onClick={() => setActiveTab('user')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'user'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Wallet className='inline h-4 w-4 mr-2' />
                Personal Wallet
                <span className='ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full'>
                  USDC Fee
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className='pb-16'>
            {activeTab === 'circle' && <CircleDeveloperMint />}
            {activeTab === 'user' && <UserDirectMint />}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='mt-auto border-t border-slate-800 bg-slate-950 py-8'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <p className='text-sm text-slate-400'>
              Built with ❤️ by{' '}
              <a
                href='https://x.com/crisphan94'
                target='_blank'
                rel='noopener noreferrer'
                className='cursor-pointer font-medium text-indigo-400 transition-colors duration-200 hover:text-indigo-300'
              >
                crisphan
              </a>{' '}
              for Arc Network
            </p>
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
