import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border-2 border-slate-700 bg-slate-900/50 px-4 py-2 text-base text-slate-100 placeholder:text-slate-500 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'hover:border-slate-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-100',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
