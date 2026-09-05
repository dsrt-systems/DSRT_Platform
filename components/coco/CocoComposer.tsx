// ============================================================
// components/coco/CocoComposer.tsx
// Input area at bottom of panel.
// ============================================================

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export function CocoComposer({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="border-t border-white/[0.05] px-3 py-2.5 bg-[#05070D]">
      <div
        className={cn(
          'flex items-end gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]',
          'focus-within:border-white/[0.12] focus-within:bg-white/[0.04] transition-colors'
        )}
      >
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors shrink-0"
          aria-label="Attach"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); handleInput() }}
          onKeyDown={handleKey}
          placeholder="Ask COCO..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/35 outline-none resize-none py-1.5 leading-relaxed max-h-[120px] scrollbar-hide"
        />

        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="w-7 h-7 rounded-md flex items-center justify-center bg-white text-black hover:bg-white/90 disabled:opacity-40 transition-colors shrink-0"
            aria-label="Send"
          >
            <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Voice"
          >
            <Mic className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}