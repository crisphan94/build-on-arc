import { Bot, Database, CreditCard, ArrowRight, Zap, Globe, Shield } from 'lucide-react'

export const metadata = {
  title: 'Architecture — AgentPay',
  description:
    'System architecture diagram for AgentPay: AI agent + Circle Gateway Nanopayments on Arc Testnet',
}

export default function ArchitecturePage() {
  return (
    <div className='min-h-screen bg-dots'>
      <div className='container mx-auto px-4 py-12 max-w-5xl'>
        <div className='text-center mb-10'>
          <h1 className='text-3xl font-bold text-slate-100 mb-2'>System Architecture</h1>
          <p className='text-slate-400 text-sm'>
            AgentPay — AI Agentic Economy on Arc Testnet · Circle Gateway Nanopayments + x402
          </p>
        </div>

        {/* Architecture diagram */}
        <div className='glass rounded-2xl p-8 mb-8 overflow-x-auto'>
          <svg viewBox='0 0 900 520' className='w-full' xmlns='http://www.w3.org/2000/svg'>
            <defs>
              <linearGradient id='indigo' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#4f46e5' stopOpacity='0.8' />
                <stop offset='100%' stopColor='#7c3aed' stopOpacity='0.8' />
              </linearGradient>
              <linearGradient id='emerald' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#059669' stopOpacity='0.8' />
                <stop offset='100%' stopColor='#0d9488' stopOpacity='0.8' />
              </linearGradient>
              <linearGradient id='blue' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#2563eb' stopOpacity='0.8' />
                <stop offset='100%' stopColor='#0ea5e9' stopOpacity='0.8' />
              </linearGradient>
              <linearGradient id='violet' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#7c3aed' stopOpacity='0.8' />
                <stop offset='100%' stopColor='#db2777' stopOpacity='0.8' />
              </linearGradient>
              <marker id='arrow' markerWidth='8' markerHeight='8' refX='6' refY='3' orient='auto'>
                <path d='M0,0 L0,6 L8,3 z' fill='#475569' />
              </marker>
              <marker
                id='arrow-green'
                markerWidth='8'
                markerHeight='8'
                refX='6'
                refY='3'
                orient='auto'
              >
                <path d='M0,0 L0,6 L8,3 z' fill='#10b981' />
              </marker>
              <marker
                id='arrow-blue'
                markerWidth='8'
                markerHeight='8'
                refX='6'
                refY='3'
                orient='auto'
              >
                <path d='M0,0 L0,6 L8,3 z' fill='#60a5fa' />
              </marker>
            </defs>

            {/* ── USER ── */}
            <rect
              x='20'
              y='180'
              width='130'
              height='70'
              rx='12'
              fill='url(#indigo)'
              opacity='0.9'
            />
            <text x='85' y='208' textAnchor='middle' fill='white' fontSize='11' fontWeight='bold'>
              USER
            </text>
            <text x='85' y='224' textAnchor='middle' fill='#c7d2fe' fontSize='9'>
              Natural language task
            </text>
            <text x='85' y='238' textAnchor='middle' fill='#c7d2fe' fontSize='9'>
              + budget cap ($N USDC)
            </text>

            {/* ── NEXT.JS APP ── */}
            <rect
              x='200'
              y='160'
              width='150'
              height='110'
              rx='12'
              fill='#1e293b'
              stroke='#334155'
              strokeWidth='1.5'
            />
            <text
              x='275'
              y='185'
              textAnchor='middle'
              fill='#94a3b8'
              fontSize='10'
              fontWeight='bold'
            >
              NEXT.JS APP
            </text>
            <rect x='215' y='195' width='120' height='24' rx='6' fill='#0f172a' />
            <text x='275' y='211' textAnchor='middle' fill='#818cf8' fontSize='9'>
              / (Agent Chat UI)
            </text>
            <rect x='215' y='225' width='120' height='24' rx='6' fill='#0f172a' />
            <text x='275' y='241' textAnchor='middle' fill='#818cf8' fontSize='9'>
              /api/agent (streamText)
            </text>

            {/* ── GROQ LLM ── */}
            <rect
              x='400'
              y='60'
              width='140'
              height='70'
              rx='12'
              fill='url(#violet)'
              opacity='0.9'
            />
            <text x='470' y='88' textAnchor='middle' fill='white' fontSize='11' fontWeight='bold'>
              GROQ LLM
            </text>
            <text x='470' y='104' textAnchor='middle' fill='#e9d5ff' fontSize='9'>
              llama-3.3-70b
            </text>
            <text x='470' y='118' textAnchor='middle' fill='#e9d5ff' fontSize='9'>
              Tool calling · stepCountIs(10)
            </text>

            {/* ── CIRCLE WALLETS ── */}
            <rect x='400' y='160' width='140' height='70' rx='12' fill='url(#blue)' opacity='0.9' />
            <text x='470' y='188' textAnchor='middle' fill='white' fontSize='11' fontWeight='bold'>
              CIRCLE WALLETS
            </text>
            <text x='470' y='204' textAnchor='middle' fill='#bae6fd' fontSize='9'>
              Developer-Controlled
            </text>
            <text x='470' y='218' textAnchor='middle' fill='#bae6fd' fontSize='9'>
              EIP-3009 signing (HSM)
            </text>

            {/* ── x402 DEMO APIs ── */}
            <rect
              x='400'
              y='260'
              width='140'
              height='120'
              rx='12'
              fill='#1e293b'
              stroke='#334155'
              strokeWidth='1.5'
            />
            <text
              x='470'
              y='283'
              textAnchor='middle'
              fill='#94a3b8'
              fontSize='10'
              fontWeight='bold'
            >
              x402 PAID APIs
            </text>
            {['Market Data', 'Weather', 'AI Text', 'Translate', 'Code Review', 'Sentiment'].map(
              (name, i) => (
                <text
                  key={name}
                  x='470'
                  y={298 + i * 13}
                  textAnchor='middle'
                  fill='#64748b'
                  fontSize='8'
                >
                  {name} · $1 USDC
                </text>
              ),
            )}

            {/* ── CIRCLE GATEWAY ── */}
            <rect
              x='600'
              y='160'
              width='150'
              height='130'
              rx='12'
              fill='url(#emerald)'
              opacity='0.9'
            />
            <text x='675' y='188' textAnchor='middle' fill='white' fontSize='11' fontWeight='bold'>
              CIRCLE GATEWAY
            </text>
            <text x='675' y='205' textAnchor='middle' fill='#a7f3d0' fontSize='9'>
              Nanopayments
            </text>
            <line
              x1='615'
              y1='215'
              x2='735'
              y2='215'
              stroke='rgba(255,255,255,0.2)'
              strokeWidth='1'
            />
            <text x='675' y='230' textAnchor='middle' fill='#6ee7b7' fontSize='8'>
              ① Verify EIP-3009 sig
            </text>
            <text x='675' y='244' textAnchor='middle' fill='#6ee7b7' fontSize='8'>
              ② Queue in batch
            </text>
            <text x='675' y='258' textAnchor='middle' fill='#6ee7b7' fontSize='8'>
              ③ Settle on-chain
            </text>
            <text x='675' y='272' textAnchor='middle' fill='#a7f3d0' fontSize='8'>
              Chain 5042002 · USDC
            </text>

            {/* ── ARC TESTNET ── */}
            <rect
              x='600'
              y='320'
              width='150'
              height='70'
              rx='12'
              fill='#1e293b'
              stroke='#2563eb'
              strokeWidth='1.5'
            />
            <text
              x='675'
              y='348'
              textAnchor='middle'
              fill='#93c5fd'
              fontSize='11'
              fontWeight='bold'
            >
              ARC TESTNET
            </text>
            <text x='675' y='364' textAnchor='middle' fill='#64748b' fontSize='8'>
              Chain ID: 5042002
            </text>
            <text x='675' y='377' textAnchor='middle' fill='#64748b' fontSize='8'>
              GatewayWallet · USDC settle
            </text>

            {/* ── CCTP BRIDGE ── */}
            <rect
              x='600'
              y='60'
              width='150'
              height='70'
              rx='12'
              fill='#1e293b'
              stroke='#7c3aed'
              strokeWidth='1.5'
            />
            <text x='675' y='88' textAnchor='middle' fill='#c4b5fd' fontSize='11' fontWeight='bold'>
              CCTP BRIDGE
            </text>
            <text x='675' y='104' textAnchor='middle' fill='#64748b' fontSize='8'>
              Cross-chain USDC
            </text>
            <text x='675' y='117' textAnchor='middle' fill='#64748b' fontSize='8'>
              ETH / AVAX / Base → Arc
            </text>

            {/* ── ARROWS ── */}
            {/* User → App */}
            <line
              x1='150'
              y1='215'
              x2='196'
              y2='215'
              stroke='#475569'
              strokeWidth='1.5'
              markerEnd='url(#arrow)'
            />
            <text x='173' y='210' textAnchor='middle' fill='#475569' fontSize='8'>
              task
            </text>

            {/* App → LLM */}
            <line
              x1='350'
              y1='185'
              x2='396'
              y2='105'
              stroke='#818cf8'
              strokeWidth='1.5'
              markerEnd='url(#arrow-blue)'
              strokeDasharray='4,2'
            />
            <text x='380' y='145' fill='#818cf8' fontSize='8'>
              messages
            </text>

            {/* LLM → App (tool calls) */}
            <line
              x1='400'
              y1='110'
              x2='354'
              y2='200'
              stroke='#818cf8'
              strokeWidth='1.5'
              markerEnd='url(#arrow-blue)'
              strokeDasharray='4,2'
            />
            <text x='335' y='160' fill='#818cf8' fontSize='8'>
              tool_call
            </text>

            {/* App → Circle Wallets */}
            <line
              x1='350'
              y1='225'
              x2='396'
              y2='210'
              stroke='#60a5fa'
              strokeWidth='1.5'
              markerEnd='url(#arrow-blue)'
            />
            <text x='370' y='222' fill='#60a5fa' fontSize='8'>
              sign
            </text>

            {/* App → x402 APIs */}
            <line
              x1='350'
              y1='245'
              x2='396'
              y2='295'
              stroke='#475569'
              strokeWidth='1.5'
              markerEnd='url(#arrow)'
            />
            <text x='360' y='278' fill='#475569' fontSize='8'>
              HTTP+sig
            </text>

            {/* x402 → Gateway */}
            <line
              x1='540'
              y1='300'
              x2='596'
              y2='245'
              stroke='#10b981'
              strokeWidth='1.5'
              markerEnd='url(#arrow-green)'
            />
            <text x='565' y='278' fill='#10b981' fontSize='8'>
              settle
            </text>

            {/* Gateway → Arc */}
            <line
              x1='675'
              y1='290'
              x2='675'
              y2='316'
              stroke='#10b981'
              strokeWidth='1.5'
              markerEnd='url(#arrow-green)'
            />
            <text x='680' y='308' fill='#10b981' fontSize='8'>
              batch tx
            </text>

            {/* CCTP → Arc */}
            <line
              x1='675'
              y1='130'
              x2='675'
              y2='156'
              stroke='#7c3aed'
              strokeWidth='1.5'
              markerEnd='url(#arrow)'
              strokeDasharray='4,2'
            />
            <text x='680' y='148' fill='#7c3aed' fontSize='8'>
              mint
            </text>

            {/* ── LABELS ── */}
            <text x='450' y='420' textAnchor='middle' fill='#334155' fontSize='9'>
              ① User sets budget → ② LLM decides tools → ③ Agent signs EIP-3009 → ④ Circle Gateway
              settles on Arc
            </text>

            {/* Legend */}
            <line
              x1='80'
              y1='460'
              x2='110'
              y2='460'
              stroke='#818cf8'
              strokeWidth='1.5'
              strokeDasharray='4,2'
            />
            <text x='115' y='464' fill='#818cf8' fontSize='8'>
              AI SDK stream
            </text>
            <line x1='200' y1='460' x2='230' y2='460' stroke='#10b981' strokeWidth='1.5' />
            <text x='235' y='464' fill='#10b981' fontSize='8'>
              Payment flow
            </text>
            <line
              x1='330'
              y1='460'
              x2='360'
              y2='460'
              stroke='#7c3aed'
              strokeWidth='1.5'
              strokeDasharray='4,2'
            />
            <text x='365' y='464' fill='#7c3aed' fontSize='8'>
              CCTP bridge
            </text>
          </svg>
        </div>

        {/* Flow steps */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {[
            {
              step: '01',
              icon: Bot,
              color: 'text-indigo-400',
              bg: 'bg-indigo-600/10 border-indigo-500/20',
              title: 'User Intent',
              desc: 'User types natural language task + sets USDC budget cap for the session',
            },
            {
              step: '02',
              icon: Zap,
              color: 'text-violet-400',
              bg: 'bg-violet-600/10 border-violet-500/20',
              title: 'LLM Reasoning',
              desc: 'Groq LLM (llama-3.3-70b) decides which paid APIs to call to fulfill the task',
            },
            {
              step: '03',
              icon: CreditCard,
              color: 'text-blue-400',
              bg: 'bg-blue-600/10 border-blue-500/20',
              title: 'Autonomous Payment',
              desc: 'Agent signs EIP-3009 via Circle Wallets API — no user confirmation needed',
            },
            {
              step: '04',
              icon: Database,
              color: 'text-emerald-400',
              bg: 'bg-emerald-600/10 border-emerald-500/20',
              title: 'Batch Settlement',
              desc: 'Circle Gateway aggregates authorizations, settles on Arc Testnet in one tx',
            },
          ].map(({ step, icon: Icon, color, bg, title, desc }) => (
            <div key={step} className='glass rounded-2xl p-5'>
              <div
                className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${bg} mb-3`}
              >
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className='text-[10px] text-slate-600 font-mono mb-1'>STEP {step}</p>
              <h3 className='text-sm font-semibold text-slate-100 mb-2'>{title}</h3>
              <p className='text-xs text-slate-400 leading-relaxed'>{desc}</p>
            </div>
          ))}
        </div>

        {/* Circle products */}
        <div className='glass rounded-2xl p-6'>
          <h3 className='text-sm font-semibold text-slate-200 mb-4'>Circle Products Used</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {[
              {
                name: 'USDC',
                role: 'Settlement rail — all payments in USDC',
                docs: 'https://developers.circle.com/stablecoins/what-is-usdc',
              },
              {
                name: 'Circle Gateway · Nanopayments',
                role: 'High-frequency $1 payments, batched settlement',
                docs: 'https://developers.circle.com/gateway/nanopayments',
              },
              {
                name: 'Circle Wallets',
                role: 'Secure agent key management (HSM, no raw key exposure)',
                docs: 'https://developers.circle.com/wallets',
              },
              {
                name: 'CCTP + Bridge Kit',
                role: 'Cross-chain USDC deposit from ETH/AVAX/Base → Arc',
                docs: 'https://developers.circle.com/cctp',
              },
              {
                name: 'x402 Protocol',
                role: 'HTTP 402 payment negotiation for each API call',
                docs: 'https://developers.circle.com/gateway/nanopayments',
              },
              {
                name: 'Arc Testnet',
                role: 'L1 blockchain · Chain 5042002 · gasless settlement',
                docs: 'https://docs.arc.network',
              },
            ].map(({ name, role, docs }) => (
              <a
                key={name}
                href={docs}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-start gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/[0.07] border border-white/8 hover:border-white/20 transition-all cursor-pointer group'
              >
                <Shield className='h-4 w-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform' />
                <div>
                  <p className='text-xs font-medium text-slate-200'>{name}</p>
                  <p className='text-[10px] text-slate-500 mt-0.5'>{role}</p>
                </div>
                <ArrowRight className='h-3 w-3 text-slate-600 ml-auto shrink-0 mt-1 group-hover:text-slate-400' />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
