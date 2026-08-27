'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  leading?: ReactNode
  trailing?: ReactNode
  error?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, leading, trailing, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wider pl-0.5">{label}</label>
        <div className="relative">
          {leading && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {leading}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={cn(
              "w-full h-10 rounded-md bg-[#0F1420] border border-white/10 text-white text-[13px]",
              "placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]/30",
              "transition-all",
              leading ? "pl-9" : "pl-3",
              trailing ? "pr-9" : "pr-3",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/30",
              className
            )}
          />
          {trailing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {trailing}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-red-400 pl-0.5">{error}</p>}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'