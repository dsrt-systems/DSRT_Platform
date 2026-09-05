// ============================================================
// components/coco/CocoVoiceOverlay.tsx
// Fullscreen overlay while user is speaking.
// Shows waveform bars, transcript-in-progress, and cancel.
// ============================================================

'use client'

import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  level: number // 0–1
  onCancel: () => void
  onStop: () => void
  state: 'requesting' | 'recording' | 'stopping'
}

export function CocoVoiceOverlay({ level, onCancel, onStop, state }: Props) {
  // Build 24 bars, each responding to level with a bit of natural variance
  const bars = Array.from({ length: 24 }, (_, i) => {
    const centerDist = Math.abs(i - 11.5) / 12
    const wobble = Math.sin(Date.now() / 220 + i) * 0.08 + 0.92
    const base = Math.max(0.08, level * (1 - centerDist * 0.4) * wobble)
    return Math.min(1, base)
  })

  const statusText =
    state === 'requesting'
      ? 'Preparing...'
      : state === 'stopping'
      ? 'Processing...'
      : 'Listening'

  return (
    <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-[#0B0F17]/95 backdrop-blur-md rounded-inherit">
      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full">
        {/* Waveform */}
        <div className="flex items-end justify-center gap-[3px] h-24 mb-8">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-white/90 transition-[height] duration-75"
              style={{
                height: `${Math.max(6, h * 96)}px`,
                opacity: 0.35 + h * 0.65,
              }}
            />
          ))}
        </div>

        <p className="text-[15px] font-semibold text-white tracking-tight">
          {statusText}
        </p>
        <p className="text-[12px] text-white/50 mt-1.5">Speak naturally — I'll transcribe when you pause.</p>
      </div>

      {/* Bottom controls */}
      <div className="pb-8 flex items-center justify-center gap-6 w-full">
        <button
          onClick={onCancel}
          disabled={state === 'stopping'}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'bg-white/[0.06] border border-white/[0.08] text-white/70',
            'hover:bg-white/[0.10] hover:text-white/95 transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          aria-label="Cancel"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <button
          onClick={onStop}
          disabled={state === 'stopping'}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            'bg-white text-black shadow-[0_8px_28px_rgba(255,255,255,0.15)]',
            'hover:bg-white/90 transition-colors',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
          aria-label="Send"
        >
          <Check className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}