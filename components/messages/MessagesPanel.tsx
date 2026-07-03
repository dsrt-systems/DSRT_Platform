'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

interface MessagesPanelProps {
  user: any
}

export function MessagesPanel({ user }: MessagesPanelProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push('/messages?mentor=1')}
      className="fixed bottom-4 right-4 lg:right-[336px] z-40 group flex items-center gap-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:scale-105 transition-transform"
      title="Chat with DSRT Mentor"
    >
      <div className="relative">
        <Sparkles className="w-5 h-5" />
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-white animate-pulse" />
      </div>
      <span className="text-sm font-medium hidden group-hover:inline">
        Ask Mentor
      </span>
    </button>
  )
}