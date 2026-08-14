'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Notification {
  id: string
  user_id: string
  type: string
  from_user_id?: string | null
  entity_type?: string | null
  entity_id?: string | null
  title?: string | null
  message?: string | null
  action_url?: string | null
  read: boolean
  created_at: string
  icon?: string | null
  priority?: string
  grouped_count?: number
  venture_id?: string | null
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userIdRef = useRef<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      userIdRef.current = user.id

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    } catch (e) {
      console.error('Fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [supabase])

  const markAllAsRead = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const setup = async () => {
      await fetchNotifications()
      if (!mounted) return

      const uid = userIdRef.current
      if (!uid) return

      // Clean up any existing channel first
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      // Create channel — attach .on() BEFORE .subscribe()
      const channel = supabase
        .channel('notifications:' + uid)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: 'user_id=eq.' + uid,
          },
          (payload) => {
            const newNotif = payload.new as Notification
            setNotifications(prev => [newNotif, ...prev].slice(0, 50))
            if (!newNotif.read) setUnreadCount(prev => prev + 1)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: 'user_id=eq.' + uid,
          },
          (payload) => {
            const updated = payload.new as Notification
            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channelRef.current = channel
          }
        })
    }

    setup()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}