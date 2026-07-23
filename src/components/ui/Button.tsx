import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    fullWidth?: boolean
  }
>

const variants = {
  primary: 'bg-emerald-950 text-white shadow-[0_10px_24px_rgba(17,63,54,0.18)] hover:bg-emerald-900',
  secondary: 'bg-[#e5eee8] text-emerald-950 hover:bg-[#d8e6dc]',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
}

export const Button = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) => (
  <button
    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${
      fullWidth ? 'w-full' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </button>
)
