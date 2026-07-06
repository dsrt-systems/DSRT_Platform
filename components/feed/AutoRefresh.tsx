'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AutoRefresh() {
  const router = useRouter()
  const supabase = createClient()
  const isTriggeringRef = useRef(false)
  const lastTriggerRef = useRef(0)

  useEffect(() => {
    const checkAndRefreshNews = async () => {
      if (isTriggeringRef.current) return

      // Don't trigger more than once every 15 minutes
      const timeSinceLastTrigger = Date.now() - lastTriggerRef.current
      if (timeSinceLastTrigger < 15 * 60 * 1000 && lastTriggerRef.current > 0) return

      try {
        const { data: latest } = await supabase
          .from('editorial_posts')
          .select('published_at')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!latest) {
          await triggerFetch()
          return
        }

        const latestTime = new Date(latest.published_at).getTime()
        const minutesSinceLatest = (Date.now() - latestTime) / (1000 * 60)

        // Only trigger if latest news is > 45 min old
        if (minutesSinceLatest > 45) {
          await triggerFetch()
        }
      } catch (err) {
        console.error('Check news error:', err)
      }
    }

    const triggerFetch = async () => {
      if (isTriggeringRef.current) return
      isTriggeringRef.current = true
      lastTriggerRef.current = Date.now()

      try {
        await fetch('/api/editorial/generate?manual=true')
        router.refresh()
      } catch {}

      setTimeout(() => {
        isTriggeringRef.current = false
      }, 5 * 60 * 1000) // Don't retrigger for 5 min
    }

    // Subscribe to new editorial posts
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

    // Initial check after 5 seconds (give page time to load first)
    const initialTimeout = setTimeout(checkAndRefreshNews, 5000)

    // Check every 15 minutes
    const interval = setInterval(checkAndRefreshNews, 15 * 60 * 1000)

    return () => {
      channel.unsubscribe()
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [router])

  return null
}