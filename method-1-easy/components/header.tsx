'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className='sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <Link href='/' className='flex items-center gap-2 transition-opacity hover:opacity-80'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg'>
            <Sparkles className='h-6 w-6 text-white' />
          </div>
          <div className='flex flex-col'>
            <span className='text-lg font-bold font-poppins'>AI Agent</span>
            <span className='text-xs text-slate-400'>Arc Network</span>
          </div>
        </Link>

        <nav className='flex items-center gap-6'>
          <Link
            href='/#agents'
            className='text-sm font-medium text-slate-300 transition-colors hover:text-white'
          >
            Agents
          </Link>
          <Link
            href='/#create'
            className='text-sm font-medium text-slate-300 transition-colors hover:text-white'
          >
            Create
          </Link>
          <Link
            href='/#about'
            className='text-sm font-medium text-slate-300 transition-colors hover:text-white'
          >
            About
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  )
}
