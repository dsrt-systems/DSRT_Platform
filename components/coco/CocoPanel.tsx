// ============================================================
// components/coco/CocoPanel.tsx
// The COCO chat panel — opens from launcher.
// Dark, formal, DSRT-native.
// ============================================================

'use client'

import { X, MoreHorizontal } from 'lucide-react'
import { useCocoUi } from '@/lib/coco/sdk/CocoProvider'
import { useCocoStream } from '@/lib/coco/sdk/useCocoStream'
import { CocoContextBadge } from './CocoContextBadge'
import { CocoMessages } from './CocoMessages'
import { CocoComposer } from './CocoComposer'
import { cn } from '@/lib/utils'

function cleanDisplayError(rawError: string): string {
  if (!rawError) return 'An error occurred'
  if (rawError.includes('404') || rawError.includes('model_not_found')) {
    return 'AI model updating. Re-connecting...'
  }
  try {
    const parsed = JSON.parse(rawError.substring(rawError.indexOf('{')))
    if (parsed?.error?.message) return parsed.error.message
  } catch {
    // Not JSON, return sanitized raw text
  }
  return rawError.length > 120 ? rawError.slice(0, 120) + '...' : rawError
}

export function CocoPanel() {
  const { isOpen, close } = useCocoUi()
  const { messages, state, error, sendMessage, confirmAction, cancelAction, reset } = useCocoStream()

  if (!isOpen) return null

  const isBusy = state === 'sending' || state === 'streaming' || state === 'executing'

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div
        className={cn(
          'w-[380px] h-[560px] flex flex-col overflow-hidden',
          'bg-[#05070D] border border-white/[0.08] rounded-xl',
          'shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]'
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-white/[0.08] border border-white/[0.08] flex items-center justify-center">
              <span className="text-[9px] font-bold text-white/80 tracking-tight">C</span>
            </div>
            <span className="text-[13px] font-semibold text-white/90 tracking-tight">COCO</span>
            <CocoContextBadge />
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={reset}
              className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/85 hover:bg-white/[0.05] transition-colors"
              aria-label="More"
            >
              <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={close}
              className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/85 hover:bg-white/[0.05] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <CocoMessages
          messages={messages}
          onConfirmAction={confirmAction}
          onCancelAction={cancelAction}
        />

        {/* ERROR */}
        {error && (
          <div className="px-3 py-2 border-t border-red-500/20 bg-red-500/[0.04]">
            <p className="text-[11.5px] text-red-300/80 font-mono">
              {cleanDisplayError(error)}
            </p>
          </div>
        )}

        {/* COMPOSER */}
        <CocoComposer onSend={sendMessage} disabled={isBusy} />
      </div>
    </div>
  )
}