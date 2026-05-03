import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'usdc' | 'indigo' | 'outline'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-white/[0.08] text-slate-300 border border-white/[0.1]',
        variant === 'success' && 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        variant === 'warning' && 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
        variant === 'error' && 'bg-red-500/15 text-red-400 border border-red-500/20',
        variant === 'usdc' && 'bg-[#2775ca]/15 text-[#5b9fd6] border border-[#2775ca]/20',
        variant === 'indigo' && 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
        variant === 'outline' && 'border border-slate-600 text-slate-400',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
