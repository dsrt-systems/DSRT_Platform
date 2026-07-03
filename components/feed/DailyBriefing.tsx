'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DailyBriefing() {
  const [briefing, setBriefing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const check = localStorage.getItem('briefing_dismissed')
    const today = new Date().toISOString().split('T')[0]
    if (check === today) {
      setDismissed(true)
    }

    fetch('/api/mentor/briefing')
      .then((r) => r.json())
      .then((d) => {
        setBriefing(d.briefing)
        setLoading(false)
      })
  }, [])

  const generateNow = async () => {
    setGenerating(true)
    const res = await fetch('/api/mentor/briefing?manual=true', {
      method: 'POST',
    })
    await res.json()

    // Refetch
    const fetchRes = await fetch('/api/mentor/briefing')
    const data = await fetchRes.json()
    setBriefing(data.briefing)
    setGenerating(false)
  }

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('briefing_dismissed', today)
    setDismissed(true)
  }

  if (dismissed || loading) return null

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent p-4 space-y-3 relative">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded hover:bg-muted/40 text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-purple-500 font-bold">
            DSRT Mentor · Morning Briefing
          </p>
          <p className="text-[10px] text-muted-foreground">
            {new Date().toLocaleDateString('en', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {briefing ? (
        <>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {briefing.briefing}
          </div>
          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Want more? Ask me anything.
            </p>
            <Link
              href="/messages"
              className="text-xs text-primary hover:underline font-medium"
            >
              Open Mentor →
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            No briefing yet for today.
          </p>
          <Button size="sm" onClick={generateNow} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate today's briefing
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}