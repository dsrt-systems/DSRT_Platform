'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AutoRefresh() {
  const router = useRouter()
  const supabase = createClient()
  const lastCheckRef = useRef<number>(Date.now())
  const isTriggeringRef = useRef(false)

  useEffect(() => {
    // Function to check if news is stale and trigger fresh fetch
    const checkAndRefreshNews = async () => {
      if (isTriggeringRef.current) return

      try {
        // Check timestamp of latest news
        const { data: latest } = await supabase
          .from('editorial_posts')
          .select('published_at')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!latest) {
          triggerFetch()
          return
        }

        const latestTime = new Date(latest.published_at).getTime()
        const now = Date.now()
        const minutesSinceLatest = (now - latestTime) / (1000 * 60)

        // If latest news is older than 30 min, trigger new fetch
        if (minutesSinceLatest > 30) {
          triggerFetch()
        }
      } catch (err) {
        console.error('Check news error:', err)
      }
    }

    const triggerFetch = async () => {
      if (isTriggeringRef.current) return
      isTriggeringRef.current = true

      try {
        await fetch('/api/editorial/generate?manual=true')
        // Refresh page to show new posts
        router.refresh()
      } catch {}

      setTimeout(() => {
        isTriggeringRef.current = false
      }, 60000) // Don't retrigger for 1 minute
    }

    // Subscribe to new editorial posts — auto-refresh when they arrive
    const channel = supabase
      .channel('editorial-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'editorial_posts',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Initial check
    checkAndRefreshNews()

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshNews, 5 * 60 * 1000)

    // Also check when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastCheck = Date.now() - lastCheckRef.current
        if (timeSinceLastCheck > 2 * 60 * 1000) {
          checkAndRefreshNews()
          lastCheckRef.current = Date.now()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [router])

  return null // Renders nothing, just runs in background
}