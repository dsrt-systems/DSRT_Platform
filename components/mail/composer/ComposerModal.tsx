// filepath: components/mail/composer/ComposerModal.tsx
'use client'

import { useEffect } from 'react'
import { useComposer } from './ComposerContext'
import { ComposerCore } from './ComposerCore'
import { cn } from '@/lib/utils'

export function ComposerModal() {
  const { isOpen, isFullscreen, initialState, closeCompose } = useComposer()

  // Lock body scroll when compose is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCompose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeCompose])

  if (!isOpen) return null

  // ─── FULLSCREEN (Always on Mobile OR Toggled on Desktop) ───
  if (isFullscreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[150]',
          'bg-black/80 backdrop-blur-sm',
          'flex flex-col sm:items-center sm:justify-center p-0 sm:p-6'
        )}
      >
        <div 
          className="w-full h-full sm:w-[900px] sm:max-w-[95vw] sm:h-[85vh] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <ComposerCore mode="full" initialState={initialState} />
        </div>
      </div>
    )
  }

  // ─── DOCKED (Desktop) & NATIVE SHEET (Mobile Default) ───
  return (
    <>
      {/* MOBILE: Force into a full screen view even if not technically 'isFullscreen' */}
      <div 
        className="sm:hidden fixed inset-0 z-[150] bg-[#05070D] flex flex-col overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ComposerCore mode="full" initialState={initialState} />
      </div>

      {/* DESKTOP: Bottom Right Dock */}
      <div className="hidden sm:flex fixed bottom-0 right-6 z-[150] items-end pointer-events-none">
        <div
          className={cn(
            'w-[540px] max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col',
            'rounded-t-2xl border border-white/[0.08] border-b-0',
            'shadow-[0_-8px_40px_rgba(0,0,0,0.55)]',
            'bg-gradient-to-b from-[#0F1219] to-[#0A0D14]'
          )}
        >
          <ComposerCore mode="quick" initialState={initialState} />
        </div>
      </div>
    </>
  )
}