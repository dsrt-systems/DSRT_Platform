'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperPlaneRight, CaretDown, Clock, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Props {
  onSend: () => void
  onSchedule?: (date: Date) => void
  disabled?: boolean
  sending?: boolean
}

export function SendButton({ onSend, onSchedule, disabled, sending }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative flex items-stretch">
      <button
        onClick={onSend}
        disabled={disabled || sending}
        className={cn(
          "flex items-center gap-1.5 h-8 px-3.5 rounded-l-md font-bold text-[12px] transition-all",
          "bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {sending ? (
          <>
            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Sending
          </>
        ) : (
          <>
            <PaperPlaneRight className="w-3.5 h-3.5" weight="fill" />
            Send
          </>
        )}
      </button>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled || sending}
        className={cn(
          "w-7 h-8 rounded-r-md border-l border-black/10 transition-all",
          "bg-white text-black hover:bg-zinc-200 flex items-center justify-center disabled:opacity-40"
        )}
      >
        <CaretDown className="w-3 h-3" weight="bold" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 w-[220px] z-50 rounded-lg bg-[#121218] border border-white/[0.1] shadow-xl overflow-hidden p-1">
          <button onClick={() => { onSend(); setOpen(false) }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/[0.06] text-left text-[12px] font-medium text-white">
            <PaperPlaneRight className="w-3.5 h-3.5 text-white/60" weight="fill" />
            Send now
          </button>
        </div>
      )}
    </div>
  )
}