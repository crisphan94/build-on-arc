import { ArrowDownToLine, Signature, CheckCircle2, Zap } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    icon: ArrowDownToLine,
    title: 'Deposit USDC once',
    description:
      'Fund your Circle Gateway wallet with a single on-chain transaction. This is the only time you pay gas.',
    color: 'text-[#5b9fd6]',
    bgColor: 'bg-[#2775ca]/10 border-[#2775ca]/20',
  },
  {
    step: '02',
    icon: Signature,
    title: 'Sign offchain authorizations',
    description:
      'Each API call triggers an EIP-3009 payment authorization. You sign it with your wallet — no gas, no on-chain transaction.',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Gateway settles in batches',
    description:
      'Circle Gateway aggregates thousands of signed authorizations and settles them on-chain in bulk. Sellers receive USDC instantly.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
]

export function HowItWorks() {
  return (
    <section className='py-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-slate-100 font-space'>How Nanopayments Work</h2>
        <p className='text-slate-400 mt-2 max-w-xl mx-auto text-sm'>
          x402 protocol + Circle Gateway batched settlement = gas-free micro-payments at scale
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 relative'>
        {/* Connector line */}
        <div className='hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#2775ca]/30 via-indigo-500/30 to-emerald-500/30' />

        {STEPS.map(({ step, icon: Icon, title, description, color, bgColor }) => (
          <div
            key={step}
            className='glass rounded-2xl p-6 flex flex-col items-start gap-4 hover:bg-white/[0.04]'
          >
            <div className='flex items-center gap-3 w-full'>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${bgColor}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className='text-xs font-bold text-slate-600 ml-auto font-space'>{step}</span>
            </div>
            <div>
              <h3 className='font-semibold text-slate-100 font-space mb-2'>{title}</h3>
              <p className='text-sm text-slate-400 leading-relaxed'>{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stack diagram */}
      <div className='mt-8 glass rounded-2xl p-5'>
        <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-3'>Technology Stack</p>
        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <div className='bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-slate-300 font-medium'>
            x402 Protocol
          </div>
          <span className='text-slate-600'>→</span>
          <div className='bg-[#2775ca]/10 border border-[#2775ca]/20 rounded-lg px-3 py-1.5 text-[#5b9fd6] font-medium'>
            Circle Gateway
          </div>
          <span className='text-slate-600'>→</span>
          <div className='bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-emerald-400 font-medium'>
            Batched Settlement
          </div>
          <span className='text-slate-600'>→</span>
          <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 text-indigo-400 font-medium'>
            Arc Testnet
          </div>
        </div>
      </div>
    </section>
  )
}
