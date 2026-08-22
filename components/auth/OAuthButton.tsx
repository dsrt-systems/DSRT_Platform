'use client'

import { ReactNode } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Props {
  provider: 'google' | 'github'
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: ReactNode
  icon: ReactNode
}

export function OAuthButton({ provider, onClick, loading, disabled, children, icon }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "w-full h-11 flex items-center justify-center gap-3 rounded-lg",
        "border border-white/[0.1] bg-[#0d121e] hover:bg-[#141a28] hover:border-white/[0.15]",
        "text-[13.5px] font-semibold text-white transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {loading ? (
        <CircleNotch className="w-4 h-4 animate-spin text-white/70" weight="bold" />
      ) : (
        <span className="flex items-center gap-3">
          {icon}
          <span>{children}</span>
        </span>
      )}
    </button>
  )
}