'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  trailing?: ReactNode
  leading?: ReactNode
}

export const AuthInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, trailing, leading, className, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="space-y-1.5">
        <label 
          htmlFor={inputId} 
          className="text-[12px] font-semibold text-white/70 flex items-center justify-between"
        >
          <span>{label}</span>
          {trailing}
        </label>
        <div className="relative">
          {leading && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {leading}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 rounded-lg bg-[#0a0e17] border text-white text-[14px] font-medium",
              "placeholder:text-white/25 focus:outline-none transition-all duration-200",
              leading ? "pl-10 pr-3.5" : "px-3.5",
              error 
                ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30" 
                : "border-white/[0.08] focus:border-[#4F7CFF]/60 focus:ring-1 focus:ring-[#4F7CFF]/30 focus:bg-[#0d121e]",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11.5px] text-red-400 font-medium pl-1">{error}</p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'