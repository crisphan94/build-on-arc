'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Zap, ExternalLink } from 'lucide-react'

export function Header() {
  return (
    <header className='sticky top-0 z-50 border-b border-white/[0.07] bg-[#080c18]/80 backdrop-blur-xl'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2.5 group'>
          <div className='relative flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500'>
            <Zap className='h-4.5 w-4.5 text-white' fill='currentColor' />
            <img
              src='/logo1.png'
              alt='NanoPay'
              className='absolute inset-0 h-full w-full object-cover rounded-xl'
            />
          </div>
          <div className='hidden sm:block'>
            <span className='font-space text-base font-bold text-slate-100 leading-tight block'>
              NanoPay
            </span>
          </div>
        </Link>

        {/* Nav + Wallet */}
        <nav className='flex items-center gap-3'>
          <Link
            href='/'
            className='hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer'
          >
            Agent
          </Link>
          <Link
            href='/gateway'
            className='hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer'
          >
            Gateway
          </Link>
          <Link
            href='/bridge'
            className='hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer'
          >
            Bridge
          </Link>
          <Link
            href='/architecture'
            className='hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer'
          >
            Architecture
          </Link>
          <Link
            href='https://faucet.circle.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer'
          >
            Faucet
            <ExternalLink className='h-3 w-3' />
          </Link>
          <ConnectButton
            chainStatus='icon'
            showBalance={false}
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
          />
        </nav>
      </div>
    </header>
  )
}
