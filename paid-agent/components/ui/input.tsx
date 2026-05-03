import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
}

export function Input({ className, label, error, prefix, suffix, id, ...props }: InputProps) {
  return (
    <div className='w-full'>
      {label && (
        <label htmlFor={id} className='block text-sm font-medium text-slate-300 mb-1.5'>
          {label}
        </label>
      )}
      <div className='relative flex items-center'>
        {prefix && (
          <span className='absolute left-3 text-sm text-slate-400 select-none'>{prefix}</span>
        )}
        <input
          id={id}
          className={cn(
            'w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-100 placeholder-slate-500',
            'px-4 py-3 text-sm outline-none',
            'hover:border-white/[0.2] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
            prefix && 'pl-8',
            suffix && 'pr-12',
            error && 'border-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className='absolute right-3 text-sm text-slate-400 select-none font-medium'>{suffix}</span>
        )}
      </div>
      {error && <p className='mt-1.5 text-xs text-red-400'>{error}</p>}
    </div>
  )
}
