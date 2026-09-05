// ============================================================
// components/coco/CocoLauncher.tsx
// The floating pill launcher — bottom-right of every (main) page.
// Design: DSRT dark formal — no neon, no gradients.
// ============================================================

'use client'

import { Plus, Mic } from 'lucide-react'
import { useCocoUi } from '@/lib/coco/sdk/CocoProvider'
import { cn } from '@/lib/utils'

export function CocoLauncher() {
  const { isOpen, toggle } = useCocoUi()

  if (isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-[60] pointer-events-none">
      <button
        onClick={toggle}
        className={cn(
          "pointer-events-auto group flex items-center gap-3 pl-3.5 pr-2 h-12",
          "bg-[#0B0F17] border border-white/[0.08] rounded-full",
          "shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]",
          "hover:border-white/[0.14] hover:bg-[#0F1420]",
          "transition-all duration-200"
        )}
        aria-label="Open COCO"
      >
        <Plus
          className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors"
          strokeWidth={2}
        />

        <span className="text-[13px] font-medium text-white/70 group-hover:text-white tracking-tight">
          Ask COCO
        </span>

        <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.10] transition-colors">
          <Mic className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90" strokeWidth={2} />
        </div>
      </button>
    </div>
  )
}