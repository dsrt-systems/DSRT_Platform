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

export function OAuthButton({ onClick, loading, disabled, children, icon }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "w-full h-10 flex items-center justify-center gap-2.5 rounded-md",
        "border border-white/10 bg-[#0F1420] hover:bg-[#141a28] hover:border-white/15",
        "text-[13px] font-medium text-white/90 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {loading ? (
        <CircleNotch className="w-4 h-4 animate-spin text-white/60" weight="bold" />
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}