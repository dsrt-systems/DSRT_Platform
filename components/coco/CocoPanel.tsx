// ============================================================
// components/coco/CocoPanel.tsx
// Floating COCO panel — composer always pinned to bottom.
// ============================================================

'use client'

import { X, Minus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useCocoUi } from '@/lib/coco/sdk/CocoProvider'
import { useCocoStream } from '@/lib/coco/sdk/useCocoStream'
import { CocoContextBadge } from './CocoContextBadge'
import { CocoMessages } from './CocoMessages'
import { CocoComposer } from './CocoComposer'
import { cn } from '@/lib/utils'
import { speakText, stopTTS } from '@/lib/coco/voice/tts'

function cleanDisplayError(rawError: string): string {
  if (!rawError) return 'Something went wrong.'
  if (rawError.includes('404') || rawError.includes('model_not_found'))
    return 'AI updating, one moment...'
  try {
    const parsed = JSON.parse(rawError.substring(rawError.indexOf('{')))
    if (parsed?.error?.message) return parsed.error.message
  } catch {}
  return rawError.length > 120 ? rawError.slice(0, 120) + '...' : rawError
}

export function CocoPanel() {
  const { isOpen, close } = useCocoUi()
  const {
    messages,
    state,
    error,
    sendMessage,
    confirmAction,
    cancelAction,
    reset,
    rateMessage,
  } = useCocoStream()

  const spokenRef = useRef<Set<string>>(new Set())
  const userCountRef = useRef(0)

  useEffect(() => {
    const userCount = messages.filter((m) => m.role === 'user').length
    if (userCount > userCountRef.current) stopTTS()
    userCountRef.current = userCount
  }, [messages])

  useEffect(() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!last || last.streaming || last.content.kind !== 'text') return
    if (spokenRef.current.has(last.id)) return
    if (!last.content.text?.trim()) return
    spokenRef.current.add(last.id)
    speakText(last.content.text)
  }, [messages])

  useEffect(() => {
    if (!isOpen) {
      stopTTS()
      spokenRef.current.clear()
    }
  }, [isOpen])

  if (!isOpen) return null

  const isBusy = state === 'sending' || state === 'streaming' || state === 'executing'

  return (
    <>
      {/* Mobile subtle backdrop */}
      <div
        onClick={close}
        className="md:hidden fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px] transition-opacity"
        aria-hidden
      />

      <div
        className={cn(
          'fixed z-[60] pointer-events-none',
          'bottom-4 left-4 right-4',
          'md:bottom-6 md:right-6 md:left-auto'
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className={cn(
            'pointer-events-auto relative flex flex-col overflow-hidden',
            'w-full h-[60vh] max-h-[560px] rounded-[24px]',
            'md:w-[400px] md:h-[620px] md:rounded-[24px]',
            'border border-white/[0.09]',
            'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_10px_30px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]'
          )}
          style={{
            background: `
              radial-gradient(circle at 15% 0%, rgba(60, 80, 120, 0.14) 0%, transparent 45%),
              radial-gradient(circle at 90% 100%, rgba(100, 60, 120, 0.10) 0%, transparent 40%),
              linear-gradient(180deg, #0D1119 0%, #080B12 60%, #06080E 100%)
            `,
          }}
        >
          {/* Top gradient sheen */}
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-70"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 100%)',
            }}
            aria-hidden
          />

          {/* HEADER (fixed height) */}
          <div className="relative flex items-center justify-between px-4 h-12 border-b border-white/[0.05] shrink-0 z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center border border-white/[0.10]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
                }}
              >
                <span className="text-[10px] font-bold text-white/95 tracking-tight">
                  C
                </span>
              </div>
              <span className="text-[14px] font-semibold text-white/95 tracking-tight">
                COCO
              </span>
              <CocoContextBadge />
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={reset}
                className="w-8 h-8 rounded-md flex items-center justify-center text-white/50 hover:text-white/95 hover:bg-white/[0.06] transition-colors"
                aria-label="New chat"
                title="New chat"
              >
                <Minus className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                onClick={close}
                className="w-8 h-8 rounded-md flex items-center justify-center text-white/50 hover:text-white/95 hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* MESSAGES (flex-1, scrollable) */}
          <div className="flex-1 min-h-0 relative">
            <CocoMessages
              messages={messages}
              onConfirmAction={confirmAction}
              onCancelAction={cancelAction}
              onRateMessage={rateMessage}
            />
          </div>

          {/* ERROR (fixed above composer) */}
          {error && (
            <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/[0.05] shrink-0 relative z-10">
              <p className="text-[11.5px] text-red-300/85 font-mono truncate">
                {cleanDisplayError(error)}
              </p>
            </div>
          )}

          {/* COMPOSER (always pinned at bottom, shrink-0) */}
          <div className="shrink-0 relative z-10">
            <CocoComposer onSend={sendMessage} disabled={isBusy} />
          </div>
        </div>
      </div>
    </>
  )
}