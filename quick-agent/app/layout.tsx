import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arc AI Agents - Build On-Chain AI Agents',
  description: 'Deploy autonomous AI agents with verifiable on-chain identity on Arc Network',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className='min-h-full flex flex-col bg-slate-950 text-slate-50 font-inter antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
