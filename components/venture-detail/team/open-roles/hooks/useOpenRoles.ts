'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface OpenRole {
  id: string
  slug: string
  title: string
  subtitle?: string
  opportunity_type?: string
  status: string
  work_mode?: string
  location?: string
  compensation_type?: string
  compensation_min?: number
  compensation_max?: number
  compensation_currency?: string
  experience_level?: string
  time_commitment?: string
  positions_open?: number
  application_count?: number
  view_count?: number
  save_count?: number
  required_skills?: string[]
  preferred_skills?: string[]
  urgency?: string
  linked_position_id?: string | null
  published_at?: string | null
  created_at: string
  updated_at?: string
  poster?: any
  application_stats?: {
    total: number
    new: number
    shortlisted: number
    interview: number
    hired: number
  }
}

export interface OpenRolesData {
  roles: OpenRole[]
  totalActive: number
  totalDrafts: number
  totalClosed: number
  totalApplications: number
  totalNewApplications: number
}

export function useOpenRoles(slug: string, ventureId: string, isOwner: boolean) {
  const supabase = createClient()
  const [data, setData] = useState<OpenRolesData>({
    roles: [],
    totalActive: 0,
    totalDrafts: 0,
    totalClosed: 0,
    totalApplications: 0,
    totalNewApplications: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Ref to prevent double-fetching on mount
  const hasLoaded = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/ventures/${slug}/open-roles`)
      if (!res.ok) throw new Error('Failed to load open roles')
      const json = await res.json()

      const roles: OpenRole[] = json.roles || []
      const totalActive = roles.filter(r => ['active', 'closing-soon'].includes(r.status)).length
      const totalDrafts = roles.filter(r => r.status === 'draft').length
      const totalClosed = roles.filter(r =>
        ['closed', 'filled', 'archived', 'expired'].includes(r.status)
      ).length
      const totalApplications = roles.reduce((sum, r) => sum + (r.application_stats?.total || 0), 0)
      const totalNewApplications = roles.reduce((sum, r) => sum + (r.application_stats?.new || 0), 0)

      setData({ roles, totalActive, totalDrafts, totalClosed, totalApplications, totalNewApplications })
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [slug]) // Only depend on slug (which is a primitive string)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      load()
    }
  }, [load])

  // Real-time sync on opportunities (Optional, safe)
  useEffect(() => {
    if (!ventureId) return

    const channel = supabase
      .channel(`open-roles-sync:${ventureId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'opportunities', filter: `venture_id=eq.${ventureId}` },
        () => {
          console.log("Opportunity changed, reloading...")
          load()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ventureId, supabase, load])

  return { data, loading, error, reload: load }
}