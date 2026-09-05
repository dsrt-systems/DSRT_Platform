// ============================================================
// components/coco/CocoComposer.tsx
// Composer with functional voice input + TTS toggle.
// ============================================================

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp, AudioLines, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCocoVoice } from '@/lib/coco/sdk/useCocoVoice'
import { CocoVoiceOverlay } from './CocoVoiceOverlay'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export function CocoComposer({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    supported: voiceSupported,
    micState,
    ttsEnabled,
    level,
    error: voiceError,
    startListening,
    stopListening,
    cancel: cancelVoice,
    toggleTTS,
    stopSpeaking,
  } = useCocoVoice()

  const isRecording =
    micState === 'requesting' || micState === 'recording' || micState === 'stopping'

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  const handleMicClick = async () => {
    if (disabled) return
    // Stop any TTS before we listen
    stopSpeaking()
    await startListening()
  }

  const handleStopAndSend = async () => {
    const transcript = await stopListening()
    if (transcript) onSend(transcript)
  }

  const hasText = text.trim().length > 0

  return (
    <>
      {isRecording && (
        <CocoVoiceOverlay
          level={level}
          state={micState as any}
          onCancel={cancelVoice}
          onStop={handleStopAndSend}
        />
      )}

      <div className="px-3 pb-3 pt-2 bg-transparent">
        <div
          className={cn(
            'flex items-end gap-2 px-3 py-2.5 rounded-3xl',
            'bg-[#141922] border border-white/[0.06]',
            'focus-within:border-white/[0.14] focus-within:bg-[#171C26]',
            'transition-colors'
          )}
        >
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white/95 hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Attach"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              handleInput()
            }}
            onKeyDown={handleKey}
            placeholder="Ask COCO"
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 outline-none resize-none py-1.5 leading-relaxed max-h-[140px] scrollbar-hide"
          />

          {hasText ? (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-black hover:bg-white/90 disabled:opacity-40 transition-colors shrink-0"
              aria-label="Send"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          ) : (
            <>
              <button
                onClick={handleMicClick}
                disabled={disabled || !voiceSupported}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0',
                  voiceSupported
                    ? 'text-white/60 hover:text-white/95 hover:bg-white/[0.06]'
                    : 'text-white/25 cursor-not-allowed'
                )}
                aria-label="Voice input"
                title={voiceSupported ? 'Voice input' : 'Voice not supported on this browser'}
              >
                <Mic className="w-4.5 h-4.5" strokeWidth={2} />
              </button>

              <button
                onClick={toggleTTS}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0',
                  ttsEnabled
                    ? 'text-white/60 hover:text-white/95 hover:bg-white/[0.06]'
                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'
                )}
                aria-label={ttsEnabled ? 'Mute voice replies' : 'Enable voice replies'}
                title={ttsEnabled ? 'Voice replies on' : 'Voice replies off'}
              >
                {ttsEnabled ? (
                  <AudioLines className="w-4.5 h-4.5" strokeWidth={2} />
                ) : (
                  <VolumeX className="w-4.5 h-4.5" strokeWidth={2} />
                )}
              </button>
            </>
          )}
        </div>

        {voiceError && (
          <p className="text-[11px] text-red-300/80 mt-1.5 px-3 font-mono">
            {voiceError}
          </p>
        )}
      </div>
    </>
  )
}