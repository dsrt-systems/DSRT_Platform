'use client'

import { ReactNode, useState } from 'react'
import { ShieldWarning } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TrustGuardProps {
  children: ReactNode
  actionName: string
  trustScore: number
  isVerified: boolean
  minScore?: number
  requireVerification?: boolean
  className?: string
}

export function TrustGuard({ 
  children, 
  actionName, 
  trustScore, 
  isVerified, 
  minScore = 30, 
  requireVerification = false,
  className 
}: TrustGuardProps) {
  const router = useRouter()
  const [showPrompt, setShowPrompt] = useState(false)

  const meetsScore = trustScore >= minScore
  const meetsVerif = requireVerification ? isVerified : true
  const isAllowed = meetsScore && meetsVerif

  if (isAllowed) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <div 
        onClickCapture={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowPrompt(true)
        }}
        className="cursor-not-allowed opacity-80"
      >
        <div className="pointer-events-none">
          {children}
        </div>
      </div>

      {showPrompt && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <ShieldWarning className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="text-[13px] font-semibold text-white mb-1">Action Restricted</p>
              <p className="text-[12px] text-white/60 leading-relaxed mb-3">
                To {actionName.toLowerCase()}, you need to build more trust on DSRT. 
                {!meetsVerif && !isVerified && " Verifying your email is the fastest way to unlock this."}
              </p>
              
              <div className="flex gap-2">
                {!isVerified && (
                  <button 
                    onClick={() => router.push('/settings/security')}
                    className="h-7 px-3 bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[11px] font-bold rounded-md transition-colors"
                  >
                    Verify Email
                  </button>
                )}
                <button 
                  onClick={() => setShowPrompt(false)}
                  className="h-7 px-3 bg-white/5 hover:bg-white/10 text-white/70 text-[11px] font-semibold rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}