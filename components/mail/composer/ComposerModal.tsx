'use client'

import { useComposer } from './ComposerContext'
import { ComposerCore } from './ComposerCore'

export function ComposerModal() {
  const { isOpen, isFullscreen, initialState } = useComposer()

  if (!isOpen) return null

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <ComposerCore mode="full" initialState={initialState} />
      </div>
    )
  }

  // Bottom-right like Gmail — no backdrop, allows working with mail while composing
  return (
    <div className="fixed bottom-0 right-6 z-[150]">
      <ComposerCore mode="quick" initialState={initialState} />
    </div>
  )
}