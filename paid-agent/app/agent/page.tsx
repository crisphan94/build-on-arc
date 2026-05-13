'use client'

import { Header } from '@/components/header'
import { AgentChat } from '@/components/agent-chat'
import { Bot, Zap, Shield, BarChart3 } from 'lucide-react'

const FEATURES = [
  {
    icon: Bot,
    title: 'Autonomous decisions',
    description: 'Agent picks which APIs to call based on your request — no manual selection.',
  },
  {
    icon: Zap,
    title: 'Zero gas payments',
    description: 'Agent signs EIP-3009 server-side. No MetaMask popups per payment.',
  },
  {
    icon: Shield,
    title: 'Budget control',
    description: 'Set a max USDC budget. Agent stops automatically when limit is reached.',
  },
  {
    icon: BarChart3,
    title: 'Full transparency',
    description: 'See every API call, payment amount, and result streamed in real time.',
  },
]

export default function AgentPage() {
  return (
    <div className='min-h-dvh bg-[#020617] bg-dots'>
      <Header />

      <main className='container mx-auto px-4 sm:px-6 py-10 max-w-4xl'>
        {/* Page header */}
        <div className='mb-10'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center'>
              <Bot className='h-5 w-5 text-indigo-400' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-slate-100'>AgentPay</h1>
              <p className='text-sm text-slate-500'>Autonomous AI agent with USDC nanopayments</p>
            </div>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
            {FEATURES.map((f) => (
              <div key={f.title} className='glass rounded-xl p-3'>
                <f.icon className='h-4 w-4 text-indigo-400 mb-2' />
                <p className='text-xs font-medium text-slate-300'>{f.title}</p>
                <p className='text-xs text-slate-600 mt-0.5 leading-relaxed'>{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat interface */}
        <AgentChat />
      </main>
    </div>
  )
}
