// ============================================================
// components/coco/CocoMessages.tsx
// Message list renderer.
// ============================================================

'use client'

import { useEffect, useRef } from 'react'
import type { CocoUiMessage } from '@/lib/coco/sdk/types'
import { CocoActionCard } from './CocoActionCard'
import { cn } from '@/lib/utils'

interface Props {
  messages: CocoUiMessage[]
  onConfirmAction: (id: string) => void
  onCancelAction: (id: string) => void
}

export function CocoMessages({ messages, onConfirmAction, onCancelAction }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
        <div className="text-center max-w-[280px]">
          <h3 className="text-[15px] font-semibold text-white/85 tracking-tight">
            Hey there.
          </h3>
          <p className="text-[12.5px] text-white/45 mt-1.5 leading-relaxed">
            I can see this page. Ask about anything on DSRT Connect or beyond.
          </p>
        </div>

        <div className="w-full mt-5 space-y-1.5">
          {['What am I looking at?', 'Summarize this page', 'Help me build'].map(s => (
            <button
              key={s}
              className="w-full text-left px-3 py-2 rounded-md bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[12px] text-white/60 hover:text-white/85 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-3">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
        >
          <div className={cn('max-w-[85%]', msg.role === 'user' ? '' : 'w-full')}>
            {msg.content.kind === 'text' && (
              <div
                className={cn(
                  'text-[13px] leading-relaxed tracking-tight whitespace-pre-wrap break-words',
                  msg.role === 'user'
                    ? 'px-3 py-2 rounded-lg bg-white/[0.06] text-white/90 border border-white/[0.04]'
                    : 'text-white/85'
                )}
              >
                {msg.content.text}
                {msg.streaming && (
                  <span className="inline-block w-[6px] h-[12px] bg-white/60 ml-0.5 align-middle animate-pulse" />
                )}
              </div>
            )}

            {msg.pendingAction && (
              <CocoActionCard
                action={msg.pendingAction}
                onConfirm={() => onConfirmAction(msg.pendingAction!.actionRunId)}
                onCancel={() => onCancelAction(msg.pendingAction!.actionRunId)}
              />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}