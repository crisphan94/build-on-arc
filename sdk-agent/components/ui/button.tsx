import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700',
      outline:
        'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:border-slate-600',
    }

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-9 px-3 text-sm',
      lg: 'h-12 px-6 text-base',
    }

    if (asChild && React.isValidElement(props.children)) {
      // cast to any when cloning arbitrary child element so we can add className/ref
      return React.cloneElement(
        props.children as React.ReactElement<any>,
        {
          className: `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`,
          ref,
        } as any,
      )
    }

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
