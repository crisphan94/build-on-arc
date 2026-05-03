import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className='sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center gap-2 font-poppins text-xl font-bold transition-colors duration-200 hover:text-indigo-400'
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30'>
            <Sparkles className='h-5 w-5' />
          </div>
          <span className='hidden sm:inline'>Arc Agents</span>
        </Link>

        {/* Navigation */}
        <nav className='flex items-center gap-4'>
          <Link
            href='https://docs.arc.network'
            target='_blank'
            className='hidden cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-slate-800 sm:inline-flex'
          >
            Docs
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  )
}
