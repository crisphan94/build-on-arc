'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { Bot } from 'lucide-react'

export function Header() {
  return (
    <header className='sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
        <Link href='/' className='flex items-center gap-2 transition-opacity hover:opacity-80'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400'>
            <Bot className='h-6 w-6' />
          </div>
          <span className='font-poppins text-xl font-bold'>Arc AI Agents</span>
        </Link>

        <ConnectButton />
      </div>
    </header>
  )
}
