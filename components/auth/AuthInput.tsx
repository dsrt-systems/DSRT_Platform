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
      <div className="space-y-1.5 flex w-full flex-col">
        <label className="text-[13px] font-medium text-white/90">{label}</label>
        <div className="relative flex items-center">
          {leading && (
            <div className="absolute left-3 text-white/40 flex items-center justify-center">
              {leading}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={cn(
              "w-full h-9 rounded-md bg-transparent border border-white/15 text-white text-[14px]",
              "placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]",
              "transition-all duration-200",
              leading ? "pl-9" : "pl-3",
              trailing ? "pr-9" : "pr-3",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/50",
              className
            )}
          />
          {trailing && (
            <div className="absolute right-3 text-white/40 flex items-center justify-center">
              {trailing}
            </div>
          )}
        </div>
        {error && <p className="text-[12px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'